import argparse
import json
from pathlib import Path

from sqlalchemy import insert

from app import models  # noqa: F401
from app.db import Base, SessionLocal


parser = argparse.ArgumentParser(description="Import a local seed JSON into the configured database.")
parser.add_argument("--file", default="seed/local_seed.json")
args = parser.parse_args()

seed_path = Path(args.file)
if not seed_path.exists():
    raise SystemExit(f"Seed file not found: {seed_path}")

data = json.loads(seed_path.read_text(encoding="utf-8"))
with SessionLocal() as db:
    for table in Base.metadata.sorted_tables:
        rows = data.get(table.name, [])
        if not rows:
            continue
        for row in rows:
            if "id" in table.c and row.get("id"):
                existing = db.execute(table.select().where(table.c.id == row["id"])).first()
                if existing is not None:
                    continue
            db.execute(insert(table).values(row))
    db.commit()
print(f"Seed imported from {seed_path}")
