import sys
from uuid import uuid4

import psycopg
from fastapi.testclient import TestClient

from backend.src.app.main import app
from backend.src.shared.db import database_url


def check_records(idea_id: str, delete_query: str) -> None:
    title = f"API test {uuid4()}"
    endpoint = f"/api/ideas/{idea_id}/records"
    try:
        with TestClient(app) as client:
            initial = client.get(endpoint)
            assert initial.status_code == 200
            assert isinstance(initial.json(), list)
            assert client.post(endpoint, json={"title": " "}).status_code == 400
            created = client.post(endpoint, json={"title": f" {title} "})
            assert created.status_code == 201
            item = created.json()
            assert item["title"] == title
            assert item in client.get(endpoint).json()
    finally:
        delete_record(delete_query, title)


def delete_record(query: str, title: str) -> None:
    with psycopg.connect(database_url()) as connection:
        connection.execute(query, (title,))


if __name__ == "__main__":
    delete_record("DELETE FROM idea_a_records WHERE title = %s", sys.argv[1])
