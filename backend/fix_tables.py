"""
fix_tables.py
Scans all markdown files in ./storage and merges split table rows caused by PDF extraction.

The problem: PDF extractors split one logical table row across two physical rows when a
cell value was too long to fit. Example from NAAQS:

  BROKEN:
  | 4 | Particulate Matter (size less than 2.5  | Annual* | 40 | 40 | ... |
  | 4 | microns) or PM                          | 24 hrs  | 60 | 60 | ... |

  FIXED:
  | 4 | PM2.5 — Particulate Matter (size less than 2.5 microns) | Annual* | 40 | 40 | ... |
  | 4 | PM2.5 — Particulate Matter (size less than 2.5 microns) | 24 hrs  | 60 | 60 | ... |

Detection logic: a row is a continuation if
  - it is a table row (starts with |)
  - the row number cell matches the previous row's number (or is empty)
  - the "name" cell starts with a lowercase letter or looks like a sentence fragment
  - the "time/type" cell is empty or also looks like a fragment
"""

import os
import re

STORAGE_DIR = "./storage"


def parse_row(line):
    """Split a markdown table row into cells, stripping whitespace."""
    if not line.startswith("|"):
        return None
    cells = [c.strip() for c in line.split("|")]
    # Remove empty first/last elements from leading/trailing pipes
    if cells and cells[0] == "":
        cells = cells[1:]
    if cells and cells[-1] == "":
        cells = cells[:-1]
    return cells


def is_separator_row(line):
    """Detect markdown table separator rows like |---|---|"""
    return bool(re.match(r"^\|[\s\-|:]+\|$", line.strip()))


def is_continuation(prev_cells, curr_cells):
    """
    Returns True if curr_cells looks like a continuation of prev_cells.
    Heuristics:
    1. Same number of cells
    2. First cell (row number) is same as previous or empty
    3. Second cell (name/description) starts with lowercase, or is a short fragment
       without a capital letter start — indicating it's the tail of a split cell
    4. Third cell (time weighted average) is empty OR is a valid time value
       — if it's empty, the whole row is just a name continuation
    """
    if not prev_cells or not curr_cells:
        return False
    if len(prev_cells) != len(curr_cells):
        return False
    if len(curr_cells) < 3:
        return False

    row_num_match = (curr_cells[0] == prev_cells[0] or curr_cells[0] == "")
    if not row_num_match:
        return False

    name_cell = curr_cells[1]
    if not name_cell:
        return False

    # Name cell is a continuation if it starts lowercase or starts with a digit
    # but is clearly not a full pollutant name (no unit symbol, short)
    is_fragment = (
        name_cell[0].islower() or
        name_cell.startswith("microns") or
        name_cell.startswith("μm") or
        name_cell.startswith("or PM") or
        (len(name_cell) < 25 and not any(c.isupper() for c in name_cell[:5]))
    )

    return is_fragment


def merge_split_rows(lines):
    """
    Walk through lines and merge continuation table rows into their parent row.
    Returns a new list of lines with splits fixed.
    """
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Skip non-table lines and separator rows as-is
        if not line.startswith("|") or is_separator_row(line):
            result.append(line)
            i += 1
            continue

        prev_cells = parse_row(line)
        if prev_cells is None:
            result.append(line)
            i += 1
            continue

        # Look ahead: keep merging as long as next row is a continuation
        while i + 1 < len(lines):
            next_line = lines[i + 1]
            if not next_line.startswith("|") or is_separator_row(next_line):
                break
            next_cells = parse_row(next_line)
            if next_cells is None:
                break
            if not is_continuation(prev_cells, next_cells):
                break

            # Merge: append continuation name fragment to current name cell
            prev_cells[1] = (prev_cells[1] + " " + next_cells[1]).strip()

            # If the continuation row has a non-empty time cell, it's actually
            # a new data row for the same pollutant — emit current and start fresh
            if next_cells[2]:
                # Emit the merged name row first, then treat next as new row
                # with the merged name carried over
                result.append("| " + " | ".join(prev_cells) + " |")
                prev_cells = next_cells[:]
                prev_cells[1] = prev_cells[1]  # already has merged name from above
                i += 1
                break

            i += 1  # skip the continuation line

        result.append("| " + " | ".join(prev_cells) + " |")
        i += 1

    return result


def fix_markdown_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.split("\n")
    fixed_lines = merge_split_rows(lines)
    fixed_content = "\n".join(fixed_lines)

    if fixed_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(fixed_content)
        return True
    return False


if __name__ == "__main__":
    md_files = [f for f in os.listdir(STORAGE_DIR) if f.endswith(".md")]

    if not md_files:
        print(f"No markdown files found in {STORAGE_DIR}")
    else:
        print(f"Found {len(md_files)} markdown files. Fixing split tables...\n")
        fixed_count = 0
        for fname in sorted(md_files):
            path = os.path.join(STORAGE_DIR, fname)
            changed = fix_markdown_file(path)
            status = "✅ Fixed" if changed else "— No changes"
            print(f"  {status}: {fname}")
            if changed:
                fixed_count += 1

        print(f"\nDone. {fixed_count}/{len(md_files)} files updated.")
