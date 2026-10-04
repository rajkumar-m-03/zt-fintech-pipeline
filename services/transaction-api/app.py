from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
CORS(app)

LEDGER_URL = os.getenv("LEDGER_URL", "http://localhost:5002")
LEDGER_API_TOKEN = os.getenv("LEDGER_API_TOKEN")


@app.get("/healthz")
def healthz():
    return jsonify({"status": "ok"})


@app.get("/readyz")
def readyz():
    try:
        response = requests.get(f"{LEDGER_URL}/readyz", timeout=2)

        if response.status_code == 200:
            return jsonify({"status": "ready"})

        return jsonify({"status": "not ready"}), 503

    except requests.RequestException:
        return jsonify({"status": "not ready"}), 503

@app.get("/accounts/<account_id>")
def get_account(account_id):
    try:
        response = requests.get(
    f"{LEDGER_URL}/accounts/{account_id}",
    headers={
        "Authorization": f"Bearer {LEDGER_API_TOKEN}"
    },
    timeout=3
)

        return jsonify(response.json()), response.status_code

    except requests.RequestException:
        return jsonify({
            "error": "Ledger service unavailable"
        }), 502
    

@app.post("/transfer")
def transfer():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    from_account = data.get("from_account")
    to_account = data.get("to_account")
    amount = data.get("amount")

    if not from_account or not to_account or amount is None:
        return jsonify({
            "error": "from_account, to_account and amount are required"
        }), 400

    try:
        response = requests.post(
    f"{LEDGER_URL}/transfer",
    headers={
        "Authorization": f"Bearer {LEDGER_API_TOKEN}"
    },
    json={
        "from_account": from_account,
        "to_account": to_account,
        "amount": amount
    },
    timeout=5
)

        return jsonify(response.json()), response.status_code

    except requests.RequestException:
        return jsonify({
            "error": "Ledger service unavailable"
        }), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)