"""
formula_parser.py
-----------------
Translates feature-file formula notation into executable Python/pandas
expressions that operate on a dict-of-Series.

Formula language -> Python mapping
  [tag_name]          -> ctx["tag_name"]
  if(cond, t, f)      -> _if(cond, t, f)
  abs/sqrt/log        -> np.abs/np.sqrt/np.log10
  ln(x)               -> np.log(x)
  ceil(x)             -> np.ceil(x)
  round(x,n)          -> np.round(x, n)
  max/min/avg/sum     -> _max/_min/_avg/_sum
  lag(x,n)            -> x.shift(n)
  rolling_avg(x,n)    -> x.rolling(n).mean()
  delta(x)            -> x.diff()
  missing(x)          -> x.isna().astype(float)
  || / &&             -> _lor/_land  [safe on float arrays, via AST transform]
  ^                   -> **          [power, via AST transform]
"""
from __future__ import annotations
import ast
import re


# -- Step 1: text-level pre-processing ----------------------------------------

def _preprocess(expr: str) -> str:
    expr = expr.strip()
    expr = expr.replace("&&", " & ").replace("||", " | ")
    expr = re.sub(r'\[([^\]]+)\]', r'ctx["\1"]', expr)
    renames = [
        (r'\brolling_avg\b', '_rolling_avg'),
        (r'\brow_number\b',  '_row_number'),
        (r'\bmissing\b',     '_missing'),
        (r'\bdelta\b',       '_delta'),
        (r'\blag\b',         '_lag'),
        (r'\bavg\b',         '_avg'),
        (r'\bsqrt\b',        'np.sqrt'),
        (r'\bceil\b',        'np.ceil'),
        (r'\babs\b',         'np.abs'),
        (r'\bround\b',       'np.round'),
        (r'\bln\b',          'np.log'),
        (r'\blog\b',         'np.log10'),
        (r'\bmax\b',         '_max'),
        (r'\bmin\b',         '_min'),
        (r'\bsum\b',         '_sum'),
        (r'\bif\b',          '_if'),
    ]
    for pattern, replacement in renames:
        expr = re.sub(pattern, replacement, expr)
    return expr


# -- Step 2: AST transformer --------------------------------------------------

class _OpFixer(ast.NodeTransformer):
    """
    Rewrites unsafe operators:
      BitOr  (|) -> _lor(a, b)   logical OR safe on float arrays
      BitAnd (&) -> _land(a, b)  logical AND safe on float arrays
      BitXor (^) -> a ** b        power in the formula language
    """
    def visit_BinOp(self, node):
        self.generic_visit(node)
        if isinstance(node.op, ast.BitOr):
            return ast.Call(
                func=ast.Name(id="_lor", ctx=ast.Load()),
                args=[node.left, node.right],
                keywords=[],
            )
        if isinstance(node.op, ast.BitAnd):
            return ast.Call(
                func=ast.Name(id="_land", ctx=ast.Load()),
                args=[node.left, node.right],
                keywords=[],
            )
        if isinstance(node.op, ast.BitXor):
            return ast.BinOp(left=node.left, op=ast.Pow(), right=node.right)
        return node


def _ast_fix(expr: str) -> str:
    try:
        tree = ast.parse(expr, mode="eval")
        tree = ast.fix_missing_locations(_OpFixer().visit(tree))
        return ast.unparse(tree)
    except SyntaxError:
        return expr


# -- Public API ---------------------------------------------------------------

def translate(formula: str) -> str:
    """Convert a feature-file formula into an eval()-able Python expression."""
    expr = _preprocess(formula)
    expr = _ast_fix(expr)
    return expr


# -- Eval globals factory -----------------------------------------------------

def _make_eval_globals() -> dict:
    """Return globals dict for eval()'ing translated formulas."""
    import numpy as np
    import pandas as pd

    def _if(cond, true_val, false_val):
        c = np.asarray(cond, dtype=bool)
        return np.where(c, true_val, false_val)

    def _lor(a, b):
        return np.logical_or(
            np.asarray(a, dtype=float) != 0,
            np.asarray(b, dtype=float) != 0
        ).astype(float)

    def _land(a, b):
        return np.logical_and(
            np.asarray(a, dtype=float) != 0,
            np.asarray(b, dtype=float) != 0
        ).astype(float)

    def _max(*args):
        if len(args) == 1:
            return args[0]
        result = args[0]
        for a in args[1:]:
            result = np.maximum(result, a)
        return result

    def _min(*args):
        if len(args) == 1:
            return args[0]
        result = args[0]
        for a in args[1:]:
            result = np.minimum(result, a)
        return result

    def _avg(*args):
        stacked = np.stack([np.asarray(a, dtype=float) for a in args], axis=0)
        return np.nanmean(stacked, axis=0)

    def _sum(*args):
        stacked = np.stack([np.asarray(a, dtype=float) for a in args], axis=0)
        return np.nansum(stacked, axis=0)

    def _lag(series, n=1):
        if hasattr(series, "shift"):
            return series.shift(int(n)).bfill()
        return series

    def _rolling_avg(series, n=4):
        if hasattr(series, "rolling"):
            return series.rolling(int(n), min_periods=1).mean()
        return series

    def _delta(series):
        if hasattr(series, "diff"):
            return series.diff().fillna(0)
        return series

    def _missing(series):
        if hasattr(series, "isna"):
            return series.isna().astype(float)
        return 0.0

    def _row_number():
        return 0

    return {
        "np":           np,
        "pd":           pd,
        "_if":          _if,
        "_lor":         _lor,
        "_land":        _land,
        "_max":         _max,
        "_min":         _min,
        "_avg":         _avg,
        "_sum":         _sum,
        "_lag":         _lag,
        "_rolling_avg": _rolling_avg,
        "_delta":       _delta,
        "_missing":     _missing,
        "_row_number":  _row_number,
    }
