import os

from dotenv import load_dotenv


def database_url() -> str:
    load_dotenv(".env")
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("Set DATABASE_URL before using the database.")
    return url
