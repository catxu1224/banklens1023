import json
from pathlib import Path

from sqlalchemy import select

from app import models  # noqa: F401
from app.db import Base, SessionLocal


def serializable(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


if __name__ == "__main__":
    output = Path("seed/local_seed.json")
    output.parent.mkdir(exist_ok=True)
    with SessionLocal() as db:
        data = {table.name: [] for table in Base.metadata.sorted_tables}
        for table in Base.metadata.sorted_tables:
            rows = db.execute(select(table)).mappings().all()
            data[table.name] = [{key: serializable(value) for key, value in row.items()} for row in rows]
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Seed exported to {output}")
