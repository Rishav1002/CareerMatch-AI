#!/usr/bin/env python3
"""
Script to permanently purge unowned legacy demo/guest records from Neon / SQLite database.
Usage:
  python scripts/purge_legacy_guest_data.py          # Dry-run count
  python scripts/purge_legacy_guest_data.py --confirm  # Execute permanent deletion
"""

import sys
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.database import get_connection

TABLES = [
    "resumes",
    "analyses",
    "resume_analyses",
    "roadmap_progress",
    "job_matches",
    "interview_sessions",
    "github_profiles",
    "learning_roadmaps",
    "assessment_sessions",
    "assessment_results",
    "career_comparisons",
    "placement_readiness_reports",
]


def main():
    confirm = "--confirm" in sys.argv
    conn = get_connection()
    cursor = conn.cursor()

    counts = {}
    total = 0
    for tbl in TABLES:
        try:
            cursor.execute(f"SELECT COUNT(*) AS cnt FROM {tbl} WHERE owner_id = 'legacy_unowned'")
            row = cursor.fetchone()
            cnt = row["cnt"] if isinstance(row, dict) else row[0]
            counts[tbl] = cnt
            total += cnt
        except Exception as exc:
            counts[tbl] = f"Error: {exc}"

    print("=== CareerMatch AI: Legacy Unowned Data Summary ===")
    for tbl, cnt in counts.items():
        print(f"  - {tbl:30}: {cnt}")
    print(f"\nTotal legacy unowned records: {total}")

    if not confirm:
        print("\n[DRY RUN] No records were deleted.")
        print("To permanently purge all legacy unowned rows, re-run with --confirm:")
        print("  python scripts/purge_legacy_guest_data.py --confirm\n")
        conn.close()
        return

    print("\n[ACTION] Purging legacy unowned records across all tables...")
    deleted = 0
    for tbl in TABLES:
        try:
            cursor.execute(f"DELETE FROM {tbl} WHERE owner_id = 'legacy_unowned'")
            deleted += cursor.rowcount
        except Exception as exc:
            print(f"  Error purging {tbl}: {exc}")
    conn.commit()
    conn.close()
    print(f"Successfully purged {deleted} legacy unowned records.\n")


if __name__ == "__main__":
    main()
