from unittest.mock import patch

from app import app


def test_health():
    client = app.test_client()

    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_readiness():
    client = app.test_client()

    with patch("app.requests.get") as mock_get:
        mock_get.return_value.status_code = 200

        response = client.get("/readyz")

    assert response.status_code == 200
    assert response.get_json()["status"] == "ready"


def test_get_account():
    client = app.test_client()

    with patch("app.requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "account_id": "alice",
            "balance": 10000.0,
        }

        response = client.get("/accounts/alice")

    assert response.status_code == 200
    assert response.get_json()["account_id"] == "alice"
    assert response.get_json()["balance"] == 10000.0


def test_transfer():
    client = app.test_client()

    with patch("app.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "amount": 1000,
            "from_account": "alice",
            "from_balance": 9000.0,
            "message": "Transfer successful",
            "to_account": "bob",
            "to_balance": 6000.0,
        }

        response = client.post(
            "/transfer",
            json={
                "from_account": "alice",
                "to_account": "bob",
                "amount": 1000,
            },
        )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Transfer successful"
    assert response.get_json()["from_balance"] == 9000.0
    assert response.get_json()["to_balance"] == 6000.0