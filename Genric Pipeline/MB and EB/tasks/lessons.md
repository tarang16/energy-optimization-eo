# Lessons learned during the build

## LP optimiser: don't mix deltas and absolutes
**Mistake:** First version of `optimize_vents` used `Δgen` (deviation from current) for
generators and letdowns but `vent` as an absolute flow. The baseline already included the
existing vent in the header's outflow, so the constraint right-hand-side double-counted it.
Result: HiGHS reported infeasible on any case with non-zero starting vent.

**Fix:** Use absolute setpoints for all decision variables. Build `const_in / const_out` per
header from a baseline solve where every gen/let/vent is zeroed; then the LP constraints are
clean: `Σ decision_in_to_h + const_in_h = Σ decision_out_from_h + const_out_h`.

**Rule:** When linearising a constraint that mixes contributions from "decision" and "non-decision"
elements, normalise *all* decision variables to the same convention (absolute, not delta) before
building `A_eq`.

## Headers without decision variables are LP-infeasible by default
A water-rail header (BFW) carries condensate return / DSH water but no generator, letdown, or
vent touches it. Demanding mass closure via the LP forces an impossible constraint
(`0 = nonzero`).

**Fix:** Detect rows in `A_eq` that have no nonzero coefficient and zero them out, while listing
the skipped headers in `result.message` for visibility.

**Rule:** Whenever you write an LP across heterogeneous nodes, audit each row for at least one
non-zero coefficient before handing it to the solver.

## Console encoding on Windows
`Δ` in a column header crashed `print()` on cp1252 default consoles. Use ASCII labels
("delta") in any text the engine emits, or invoke Python with `-X utf8`.

**Rule:** Avoid non-ASCII glyphs in user-facing string output unless the deployment
target is guaranteed UTF-8.
