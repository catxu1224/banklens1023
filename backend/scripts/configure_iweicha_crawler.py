"""Register the supplied Iweicha penalty directory idempotently."""

from pathlib import Path
import sys

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import models  # noqa: E402,F401
from app.db import Base, SessionLocal, engine  # noqa: E402


SOURCES = [
    ("Iweicha 监管处罚案例库", "http://iweicha.com/smp/smp10.aspx?sys_code=MS599&def=bpc.xml&version=0&fun_type=7", "监管处罚信息发布平台"),
    ("人民银行监管处罚案例库", "http://iweicha.com/smp/smp10.aspx?sys_code=MS599&def=ppc.xml&fun_type=1-002&version=0", "中国人民银行"),
    ("国家外汇管理局监管处罚案例库", "http://iweicha.com/smp/smp10.aspx?sys_code=MS599&def=fpc.xml&fun_type=1-002&version=0", "国家外汇管理局"),
]


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        for name, url, agency in SOURCES:
            source = db.scalar(select(models.CrawlerSource).where(models.CrawlerSource.url == url))
            if source is None:
                source = models.CrawlerSource(
                    name=name,
                    url=url,
                    content_type="监管处罚",
                    agency=agency,
                    region="全国",
                    schedule="daily 02:00 Asia/Shanghai",
                    enabled=True,
                )
                db.add(source)
                db.commit()
                print(f"created crawler source {source.id} {name}")
            else:
                source.name = name
                source.agency = agency
                source.enabled = True
                source.schedule = "daily 02:00 Asia/Shanghai"
                db.commit()
                print(f"updated crawler source {source.id} {name}")


if __name__ == "__main__":
    main()
