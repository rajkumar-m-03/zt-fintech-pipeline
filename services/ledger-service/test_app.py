import os

import pytest

from app import app


AUTH_HEADERS = {
    "Authorization": f"Bearer {os.getenv('LEDGER_API_TOKEN', 'test-token')}"
}


@pytest.fixture
def client():
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


def test_health(client):
    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_ready(client):
    response = client.get("/readyz")

    assert response.status_code == 200
    assert response.get_json()["status"] == "ready"


def test_get_account(client):
    response = client.get(
        "/accounts/alice",
        headers=AUTH_HEADERS
    )

    assert response.status_code == 200
    data = response.get_json()

    assert data["account_id"] == "alice"
    assert data["balance"] == 10000.0


def test_transfer(client):
    response = client.post(
        "/transfer",
        json={
            "from_account": "alice",
            "to_account": "bob",
            "amount": 1000
        },
        headers=AUTH_HEADERS
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["from_balance"] == 9000.0
    assert data["to_balance"] == 6000.0


def test_insufficient_balance(client):
    response = client.post(
        "/transfer",
        json={
            "from_account": "alice",
            "to_account": "bob",
            "amount": 999999
        },
        headers=AUTH_HEADERS
    )

    assert response.status_code == 400