"""
Load an Excel file of tenders into a SQLite database.

Usage:
    python excel_to_sqlite.py tenders.xlsx              # uses defaults
    python excel_to_sqlite.py tenders.xlsx --sheet 0    # first sheet
    python excel_to_sqlite.py tenders.xlsx --db tenders.db --table tenders
"""

import argparse
import sqlite3
import sys
from pathlib import Path

import pandas as pd

# The exact columns as they appear in the spreadsheet header row
EXPECTED_COLUMNS = [
    "tender_ref",
    "title",
    "Pe",
    "Procurement Method",
    "Procurement Category",
    "close_at",
    "published_at",
    "addendum_added",
]


def load_excel(path: Path, sheet=0) -> pd.DataFrame:
    """Read the sheet and normalise column names to the expected set."""
    df = pd.read_excel(path, sheet_name=sheet, dtype=str)

    # Strip whitespace / BOM from header names, case-insensitive match
    df.columns = [str(c).strip().lstrip("\ufeff") for c in df.columns]

    # Map real headers to expected ones case-insensitively
    lookup = {c.lower(): c for c in EXPECTED_COLUMNS}
    renamed = {}
    for col in df.columns:
        key = col.lower().replace("  ", " ").strip()
        if key in lookup:
            renamed[col] = lookup[key]

    df = df.rename(columns=renamed)

    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing:
        print(f"⚠  Missing columns in Excel: {missing}", file=sys.stderr)
        print(f"   Excel has: {list(df.columns)}", file=sys.stderr)
        # Add missing as NULL so the DB schema stays consistent
        for m in missing:
            df[m] = None

    # Keep only the expected columns, in order
    df = df[EXPECTED_COLUMNS]

    # Drop rows where everything is empty
    df = df.dropna(how="all")

    return df


def save_to_sqlite(
    df: pd.DataFrame,
    db_path: Path,
    table: str = "tenders",
    if_exists: str = "replace",
):
    """Write the DataFrame to SQLite with a proper schema + index."""
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as conn:
        # Create table with explicit types so future queries are typed
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {table} (
                tender_ref            TEXT PRIMARY KEY,
                title                 TEXT,
                Pe                    TEXT,
                "Procurement Method"  TEXT,
                "Procurement Category" TEXT,
                close_at              TEXT,
                published_at          TEXT,
                addendum_added        TEXT
            )
        """)

        # Use INSERT OR REPLACE so re-running the script is idempotent
        df.to_sql(
            table,
            conn,
            if_exists=if_exists,
            index=False,
            method="multi",
        )

        # Helpful index for lookups
        conn.execute(
            f'CREATE INDEX IF NOT EXISTS idx_{table}_published '
            f'ON {table}("published_at")'
        )
        conn.commit()

        count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]

    return count


def main():
    ap = argparse.ArgumentParser(description="Load tenders Excel into SQLite")
    ap.add_argument("excel", type=Path, help="Path to the .xlsx file")
    ap.add_argument("--db", type=Path, default=Path("tenders.db"))
    ap.add_argument("--table", default="tenders")
    ap.add_argument("--sheet", default=0, help="Sheet name or index (default 0)")
    ap.add_argument(
        "--append",
        action="store_true",
        help="Append instead of replacing the table",
    )
    args = ap.parse_args()

    if not args.excel.exists():
        sys.exit(f"✗ Excel file not found: {args.excel}")

    print(f"Reading {args.excel} (sheet={args.sheet!r}) ...")
    df = load_excel(args.excel, sheet=args.sheet)
    print(f"  rows: {len(df)}  cols: {len(df.columns)}")

    mode = "append" if args.append else "replace"
    n = save_to_sqlite(df, args.db, table=args.table, if_exists=mode)

    print(f"✓ Wrote {len(df)} rows → {args.db} (table '{args.table}', {n} total rows)")


if __name__ == "__main__":
    main()
