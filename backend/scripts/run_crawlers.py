"""Run all enabled crawler sources once.

This script is suitable for Windows Task Scheduler, cron, or a container job.
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.crawler import run_enabled_sources  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app import models  # noqa: F401,E402


def main() -> None:
    with SessionLocal() as db:
        for run in run_enabled_sources(db):
            print(
                f"crawler_run={run.id} status={run.status} discovered={run.discovered_count} "
                f"created={run.created_count} updated={run.updated_count} failed={run.failed_count}"
            )


if __name__ == "__main__":
    main()
