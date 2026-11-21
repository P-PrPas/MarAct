import json
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from uuid import uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from backend.src.app.main import app
from backend.src.modules.idea_c.router import today
from backend.src.shared.db import database_url

ROOT = "/api/ideas/idea-c"


@pytest.fixture
def shop(monkeypatch):
    unique = str(uuid4())
    headers = {"X-Market-Key": "fixture-key"}
    monkeypatch.setenv(
        "IDEA_C_PARTNER_KEYS",
        json.dumps({unique: "fixture-key", "__admin__": "admin-key"}),
    )
    with TestClient(app) as client:
        try:
            data = {
                "farm": unique,
                "name": unique,
                "uses": "smoothie",
                "grade": None,
                "unit": "crate",
                "kg": 6,
                "price": 240,
                "minimum": 1,
                "stock": 5,
                "starts": str(today()),
                "ends": str(today() + timedelta(days=10)),
                "transit": 1,
                "postcodes": ["10"],
                "freight": 100,
            }
            assert client.put(
                ROOT + "/lots/" + unique, json=data, headers=headers
            ).is_success
            assert client.post(
                ROOT + "/session",
                json={"name": unique, "password": unique, "register": True},
            ).is_success
            yield client, unique, headers
        finally:
            cleanup(unique)


def browser_lot(unique):
    with psycopg.connect(database_url()) as db:
        db.execute(
            """INSERT INTO idea_c_lots
            (id,farm,name,uses,unit,kg,price,minimum,stock,starts,ends,transit,postcodes,freight)
            VALUES (%s,'สวนริมคลอง',%s,'smoothie','kg',1,48,1,30,current_date,
                    current_date+14,1,ARRAY['10'],0)""",
            (unique, unique),
        )


def cleanup(unique):
    with psycopg.connect(database_url()) as db:
        db.execute("DELETE FROM idea_c_orders WHERE buyer=%s", (unique,))
        db.execute("DELETE FROM idea_c_sessions WHERE buyer=%s", (unique,))
        db.execute("DELETE FROM idea_c_buyers WHERE name=%s", (unique,))
        db.execute("DELETE FROM idea_c_lots WHERE id=%s", (unique,))


def basket(client, key):
    body = {
        "lines": [{"id": key, "units": 4}],
        "arrival": str(today() + timedelta(days=2)),
        "postcode": "10100",
    }
    offer = client.post(ROOT + "/quote", json=body).json()
    assert offer["total"] == 1060
    return dict(**body, address="Cafe 123", expected=offer, id=str(uuid4()))


def test_catalog_order_and_stock_race(shop):
    client, key, headers = shop
    row = client.get(
        ROOT + "/lots", params={"q": key, "kg": 20, "postcode": "50100"}
    ).json()[0]
    assert row["units"] == 4 and row["misses"]
    body = basket(client, key)
    stale = dict(body, expected=dict(body["expected"], freight=0))
    assert client.post(ROOT + "/orders", json=stale).status_code == 409
    with ThreadPoolExecutor(2) as workers:
        responses = list(
            workers.map(
                lambda b: client.post(ROOT + "/orders", json=b),
                [body, dict(body, id=str(uuid4()))],
            )
        )
    assert sorted(r.status_code for r in responses) == [200, 409]
    order = next(r.json() for r in responses if r.is_success)
    assert client.post(ROOT + "/orders", json=dict(body, id=order["id"])).is_success
    endpoint = f"{ROOT}/orders/{order['id']}/events"
    assert (
        client.post(endpoint, json={"action": "accept", "note": "transfer"}).status_code
        == 403
    )
    for action in [
        "accept",
        "ask_cancel",
        "deny_cancel",
        "ship",
        "receive",
        "report",
        "reply",
        "escalate",
        "resolve",
        "refund",
    ]:
        h = {"X-Market-Key": "admin-key"} if action == "resolve" else headers
        response = client.post(
            endpoint, json={"action": action, "note": "details"}, headers=h
        )
        assert response.is_success, response.text
    assert response.json()["refund"] == "details"


@pytest.mark.parametrize("end", ["cancel", "expire", "approve_cancel", "reject"])
def test_restores_stock_once(shop, end):
    client, key, headers = shop
    body = basket(client, key)
    assert client.post(ROOT + "/orders", json=body).is_success
    endpoint = f"{ROOT}/orders/{body['id']}/events"
    if end == "expire":
        with psycopg.connect(database_url()) as db:
            db.execute(
                "UPDATE idea_c_orders SET expires=now() WHERE id=%s", (body["id"],)
            )
    else:
        if end == "approve_cancel":
            assert client.post(
                endpoint, json={"action": "accept", "note": "pay"}, headers=headers
            ).is_success
            assert client.post(endpoint, json={"action": "ask_cancel"}).is_success
        assert client.post(
            endpoint, json={"action": end, "note": "reason"}, headers=headers
        ).is_success
    assert client.get(ROOT + "/lots", params={"q": key}).json()[0]["stock"] == 5
    assert (
        client.post(
            endpoint, json={"action": "reject", "note": "retry"}, headers=headers
        ).status_code
        == 409
    )
    assert client.get(ROOT + "/lots", params={"q": key}).json()[0]["stock"] == 5
