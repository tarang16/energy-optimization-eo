"""
formula_engine.py
A High-Performance Wide-Format Formula Engine using Polars.

This approach executes calculations on the original "Wide" sequence of data
by generating massive numbers of explicitly targeted pl.Expr objects dynamically.
It eliminates all Python execution loops and complex joins while maintaining
the original dimensional layout.
"""

import ast
import re
import json
import logging
from typing import Optional

import pandas as pd
import polars as pl
import operator

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# Helper Functions (Hierarchy traversal)
# ═══════════════════════════════════════════════════════════════════════════════

def _get_entities(level: str, sys_cfg: dict) -> list:
    level_order = sys_cfg["level_order"]
    hierarchy   = sys_cfg["hierarchy"]

    relevant = []
    for l in level_order[1:]:  # skip root level
        relevant.append(l)
        if l == level:
            break

    coords_list = [{}]
    for l in relevant:
        lc = hierarchy[l]
        new = []
        for c in coords_list:
            for ident in lc["identifiers"]:
                new.append({**c, lc["placeholder"]: ident})
        coords_list = new

    return coords_list


def _get_children(parent_level: str, child_level: str, parent_coords: dict, sys_cfg: dict) -> list:
    level_order = sys_cfg["level_order"]
    hierarchy   = sys_cfg["hierarchy"]

    p_idx = level_order.index(parent_level)
    c_idx = level_order.index(child_level)

    coords_list = [parent_coords.copy()]
    for l in level_order[p_idx + 1: c_idx + 1]:
        lc  = hierarchy[l]
        new = []
        for c in coords_list:
            for ident in lc["identifiers"]:
                new.append({**c, lc["placeholder"]: ident})
        coords_list = new

    return coords_list


def _naming(level: str, attr_name: str, coords: dict, sys_cfg: dict) -> str:
    pattern = sys_cfg["hierarchy"][level]["naming_pattern"]
    return pattern.format(**{**coords, "attribute_name": attr_name})


def _resolve_level_name(short: str, sys_cfg: dict) -> str:
    mapping = {l.lower().replace("_", ""): l for l in sys_cfg["hierarchy"]}
    key     = short.lower().replace("_", "")
    return mapping.get(key, short.capitalize())


# ═══════════════════════════════════════════════════════════════════════════════
# AST Parser
# ═══════════════════════════════════════════════════════════════════════════════

class WidePolarsCompiler(ast.NodeVisitor):
    def __init__(self, current_level: str, coords: dict, sys_cfg: dict):
        self.coords = coords
        self.level = current_level
        self.sys_cfg = sys_cfg
        self.macros = {}  # Store pre-compiled aggs & ts functions
        self.macro_counter = 0

    def next_macro(self, pl_expr: pl.Expr) -> str:
        """Saves a compiled pl.Expr and issues a string variable pointer."""
        name = f"__macro{self.macro_counter}"
        self.macros[name] = pl_expr
        self.macro_counter += 1
        return name

    def compile(self, expr_string: str) -> pl.Expr:
        cleaned = expr_string

        # ── 1. Aggregation Pre-processing: max(child.Attr) ─────────────────
        def replace_agg(m):
            func        = m.group(1).lower()
            raw_level   = m.group(2)
            attr        = m.group(3)
            child_level = _resolve_level_name(raw_level, self.sys_cfg)

            child_coords = _get_children(self.level, child_level, self.coords, self.sys_cfg)
            child_sns    = [_naming(child_level, attr, c, self.sys_cfg) for c in child_coords]
            
            exprs = [pl.col(sn) for sn in child_sns]
            
            if not exprs: pl_expr = pl.lit(None).cast(pl.Float64)
            elif func == "max": pl_expr = pl.max_horizontal(exprs)
            elif func == "min": pl_expr = pl.min_horizontal(exprs)
            elif func in ("avg", "mean"): pl_expr = pl.mean_horizontal(exprs)
            elif func == "sum": pl_expr = pl.sum_horizontal(exprs)
            elif func == "median": 
                pl_expr = pl.mean_horizontal(exprs) 
            else: pl_expr = pl.max_horizontal(exprs)
                
            return self.next_macro(pl_expr)

        cleaned = re.sub(r"\b(max|min|avg|mean|sum|count|std|median)\((\w+)\.(\w+)\)", replace_agg, cleaned)

        # ── 2. Time-series Functions ───────────────────────────────────────
        def replace_ts(m):
            func = m.group(1).lower()
            attr = m.group(2)
            arg  = m.group(3) if m.group(3) else None

            sn = _naming(self.level, attr, self.coords, self.sys_cfg)
            c = pl.col(sn)
            
            if func == "lag":
                periods = int(arg) if arg else 1
                pl_expr = c.shift(periods).fill_null(strategy="backward")
            elif func == "rolling_avg":
                window = int(arg) if arg else 4
                pl_expr = c.rolling_mean(window_size=window, min_periods=1)
            elif func == "delta":
                pl_expr = c.diff().fill_null(0)
            else:
                pl_expr = c

            return self.next_macro(pl_expr)

        cleaned = re.sub(r"\b(lag|rolling_avg|delta)\((\w+)(?:\s*,\s*(\d+))?\)", replace_ts, cleaned)

        # ── 3. Handle System Lookups (Regex) ───────────────────────────────
        def replace_fs(m):
            attr = m.group(1)
            root_level = self.sys_cfg["level_order"][0]
            sn = self.sys_cfg["hierarchy"][root_level]["naming_pattern"].format(attribute_name=attr)
            return self.next_macro(pl.col(sn))

        root_placeholder = self.sys_cfg["hierarchy"][self.sys_cfg["level_order"][0]]["placeholder"]
        cleaned = re.sub(r"\b" + re.escape(root_placeholder) + r"\.(\w+)", replace_fs, cleaned)

        # ── 4. Syntax Normalization ────────────────────────────────────────
        def _replace_ifs(m): return "ifs("
        cleaned = re.sub(r"\bif\(", _replace_ifs, cleaned)
        cleaned = re.sub(r"\bpass\.", "pass_node.", cleaned) 
        
        cleaned = re.sub(r"([A-Za-z_]\w*\s*==\s*[\w.]+)\s*\|\|\s*([A-Za-z_]\w*\s*==\s*[\w.]+)", r"(\1) | (\2)", cleaned)
        cleaned = cleaned.replace("||", "|").replace("&&", "&")

        # ── 5. Parse! ──────────────────────────────────────────────────────
        try:
            tree = ast.parse(cleaned, mode='eval')
        except SyntaxError as e:
            raise ValueError(f"Syntax error: {e} in {cleaned}") from e
            
        return self.visit(tree.body)

    # --- Node Visitors ---
    def visit_Name(self, node):
        name = node.id
        if name in ("True", "False"): return pl.lit(name == "True")
        if name == "np": return None
        if name.startswith("__macro"): return self.macros[name]
        
        # Bare identifier. Map to standard same-entity column name.
        sn = _naming(self.level, name, self.coords, self.sys_cfg)
        return pl.col(sn)

    def visit_Constant(self, node):
        return pl.lit(node.value)

    def visit_Attribute(self, node):
        ref = node.value.id
        if ref == "pass_node": ref = "pass"
        ref_level = _resolve_level_name(ref, self.sys_cfg)
        attr_name = node.attr
        
        level_order = self.sys_cfg["level_order"]
        if ref_level in level_order:
            t_idx = level_order.index(ref_level)
            parent_coords = {}
            for l in level_order[1:t_idx+1]:
                ph = self.sys_cfg["hierarchy"][l]["placeholder"]
                if ph in self.coords:
                    parent_coords[ph] = self.coords[ph]
            sn = _naming(ref_level, attr_name, parent_coords, self.sys_cfg)
            return pl.col(sn)
            
        return self.visit(node.value)

    def visit_BinOp(self, node):
        left = self.visit(node.left)
        right = self.visit(node.right)
        op = node.op
        if isinstance(op, ast.Add): return left + right
        if isinstance(op, ast.Sub): return left - right
        if isinstance(op, ast.Mult): return left * right
        if isinstance(op, ast.Div): return left / right
        if isinstance(op, ast.FloorDiv): return left // right
        if isinstance(op, ast.Pow): return left ** right
        if isinstance(op, ast.BitOr): return left | right
        if isinstance(op, ast.BitAnd): return left & right
        raise ValueError(f"Unknown BinOp {op}")

    def visit_UnaryOp(self, node):
        operand = self.visit(node.operand)
        if isinstance(node.op, ast.USub): return -operand
        return operand

    def visit_Compare(self, node):
        left = self.visit(node.left)
        result = None
        for op, comp in zip(node.ops, node.comparators):
            right = self.visit(comp)
            if isinstance(op, ast.Eq):    cmp = left.eq(right)
            elif isinstance(op, ast.NotEq): cmp = left.ne(right)
            elif isinstance(op, ast.Lt):  cmp = left.lt(right)
            elif isinstance(op, ast.LtE): cmp = left.le(right)
            elif isinstance(op, ast.Gt):  cmp = left.gt(right)
            elif isinstance(op, ast.GtE): cmp = left.ge(right)
            result = cmp if result is None else (result & cmp)
            left = right
        return result

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name): func_name = node.func.id.lower()
        else: func_name = node.func.attr.lower()
        
        args = [self.visit(a) for a in node.args]

        if func_name in ("if", "ifs"):
            return pl.when(args[0]).then(args[1]).otherwise(args[2])
        elif func_name == "max":
            if len(args) == 1: return args[0]
            return pl.max_horizontal(*args)
        elif func_name == "min":
            if len(args) == 1: return args[0]
            return pl.min_horizontal(*args)
            
        raise ValueError(f"Unknown call {func_name}")


# ═══════════════════════════════════════════════════════════════════════════════
# Execute Method (Main Pipeline Interface)
# ═══════════════════════════════════════════════════════════════════════════════

def evaluate(
    input_values: pd.DataFrame,
    calc_blueprint: dict,
    system_config: dict,
) -> pd.DataFrame:
    """
    Evaluates Wide Data directly by looping through topologies and compiling
    to precise Polars expressions.

    Args:
        input_values:   wide DataFrame (index=timestamps, columns=logical attr names)
        calc_blueprint: loaded calc_blueprint.json dict
        system_config:  loaded furnace_system_config.json dict
    """
    blueprint = calc_blueprint
    sys_cfg = system_config

    # Parse definitions
    all_attrs = list(blueprint["attributes"])
    ts_index = input_values.index
    input_sns = set(input_values.columns)

    ordered_levels = list(reversed(sys_cfg["level_order"][1:]))
    
    print("\n[WIDE ENGINE] Converting Pandas to Polars LazyFrame...")
    lf = pl.from_pandas(input_values).lazy()

    for level in ordered_levels:
        level_attrs = [a for a in all_attrs if a["hierarchy_level"] == level]
        if not level_attrs: continue
            
        # Re-sequence by Attribute to ensure that if Attribute B (Furnace level)
        # depends on Attribute A (Furnace level), they are executed sequentially.
        for attr in level_attrs:
            attr_expressions = []
            
            for coords in _get_entities(level, sys_cfg):
                compiler = WidePolarsCompiler(level, coords, sys_cfg)
                out_col_name = _naming(level, attr["attribute_name"], coords, sys_cfg)
                
                if out_col_name in input_sns:
                    continue
                    
                try:
                    expr = compiler.compile(attr["formula"]).alias(out_col_name)
                    attr_expressions.append(expr)
                except Exception as e:
                    logger.warning(f"Error compiling Wide Engine: {out_col_name} - {e}")
                    attr_expressions.append(pl.lit(None).cast(pl.Float64).alias(out_col_name))
            
            # Execute all equipment simultaneously for a single attribute
            if attr_expressions:
                lf = lf.with_columns(attr_expressions)

    print("[WIDE ENGINE] Executing Polars Graph Plan...")
    result_df = lf.collect()
    
    result_pd = result_df.to_pandas()
    result_pd.index = ts_index
    
    calc_cols = [c for c in result_pd.columns if c not in input_sns]
    return result_pd[calc_cols]
