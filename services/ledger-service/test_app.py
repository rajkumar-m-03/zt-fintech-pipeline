import pytest
from app import app, accounts


@pytest.fixture
def client():
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def reset_accounts():
    accounts["alice"] = 10000.0
    accounts["bob"] = 5000.0


def test_healthz(client):
    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json["status"] == "ok"


def test_get_account(client):
    response = client.get("/accounts/alice")

    assert response.status_code == 200
    assert response.json["balance"] == 10000.0


def test_transfer(client):
    response = client.post(
        "/transfer",
        json={
            "from_account": "alice",
            "to_account": "bob",
            "amount": 1000
        }
    )

    assert response.status_code == 200
    assert response.json["from_balance"] == 9000.0
    assert response.json["to_balance"] == 6000.0


def test_insufficient_balance(client):
    response = client.post(
        "/transfer",
        json={
            "from_account": "alice",
            "to_account": "bob",
            "amount": 20000
        }
    )

    assert response.status_code == 400
    assert response.json["error"] == "Insufficient balance"