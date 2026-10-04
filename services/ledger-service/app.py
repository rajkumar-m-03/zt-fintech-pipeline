import os
from flask import Flask, jsonify, request

app = Flask(__name__)
API_TOKEN = os.getenv("LEDGER_API_TOKEN")
accounts = {
    "alice": 10000.0,
    "bob": 5000.0
}

@app.before_request
def require_api_token():
    if request.path in ["/healthz", "/readyz"]:
        return None

    expected_token = API_TOKEN

    if not expected_token:
        return jsonify({"error": "API token is not configured"}), 500

    auth_header = request.headers.get("Authorization", "")

    if auth_header != f"Bearer {expected_token}":
        return jsonify({"error": "Unauthorized"}), 401

    return None

@app.get("/healthz")
def healthz():
    return jsonify({"status": "ok"})


@app.get("/readyz")
def readyz():
    return jsonify({"status": "ready"})


@app.get("/accounts/<account_id>")
def get_account(account_id):
    if account_id not in accounts:
        return jsonify({"error": "Account not found"}), 404

    return jsonify({
        "account_id": account_id,
        "balance": accounts[account_id]
    })


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

    if from_account not in accounts or to_account not in accounts:
        return jsonify({"error": "Invalid account"}), 404

    if from_account == to_account:
        return jsonify({"error": "Cannot transfer to the same account"}), 400

    if not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    if accounts[from_account] < amount:
        return jsonify({"error": "Insufficient balance"}), 400

    accounts[from_account] -= amount
    accounts[to_account] += amount

    return jsonify({
        "message": "Transfer successful",
        "from_account": from_account,
        "to_account": to_account,
        "amount": amount,
        "from_balance": accounts[from_account],
        "to_balance": accounts[to_account]
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)