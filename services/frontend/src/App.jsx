import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:30001";

const initialAccounts = {
  alice: {
    name: "Alice",
    type: "Primary Account",
    number: "2841",
  },
  bob: {
    name: "Bob",
    type: "Savings Account",
    number: "7194",
  },
};

const starterTransactions = [
  {
    id: "starter-1",
    type: "credit",
    title: "Money received",
    subtitle: "Account credit",
    amount: 25000,
    timestamp: "Yesterday · 09:15 AM",
    status: "Completed",
  },
  {
    id: "starter-2",
    type: "debit",
    title: "Utility payment",
    subtitle: "Monthly payment",
    amount: 2450,
    timestamp: "Yesterday · 06:30 PM",
    status: "Completed",
  },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime() {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function App() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [fromAccount, setFromAccount] = useState("alice");
  const [toAccount, setToAccount] = useState("bob");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("securepay-transactions");

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return starterTransactions;
      }
    }

    return starterTransactions;
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const totalBalance = useMemo(
    () => Object.values(accounts).reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );

  useEffect(() => {
    localStorage.setItem(
      "securepay-transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const [aliceResponse, bobResponse] = await Promise.all([
          fetch(`${API_URL}/accounts/alice`),
          fetch(`${API_URL}/accounts/bob`),
        ]);

        const alice = await aliceResponse.json();
        const bob = await bobResponse.json();

        setAccounts({
          alice: {
            ...initialAccounts.alice,
            balance: alice.balance,
          },
          bob: {
            ...initialAccounts.bob,
            balance: bob.balance,
          },
        });
      } catch {
        setMessage("Unable to connect to the transaction service.");
        setMessageType("error");
      }
    }

    loadAccounts();
  }, []);

  async function handleTransfer(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setMessage("Enter a valid transfer amount.");
      setMessageType("error");
      return;
    }

    if (fromAccount === toAccount) {
      setMessage("Please choose two different accounts.");
      setMessageType("error");
      return;
    }

    if (numericAmount > accounts[fromAccount].balance) {
      setMessage("Insufficient balance for this transfer.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_account: fromAccount,
          to_account: toAccount,
          amount: numericAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Transfer failed.");
        setMessageType("error");
        return;
      }

      setAccounts((current) => ({
        ...current,
        [fromAccount]: {
          ...current[fromAccount],
          balance: data.from_balance,
        },
        [toAccount]: {
          ...current[toAccount],
          balance: data.to_balance,
        },
      }));

      const newTransaction = {
        id: `transfer-${Date.now()}`,
        type: "transfer",
        title: "Account transfer",
        subtitle: `${accounts[fromAccount].name} → ${accounts[toAccount].name}`,
        amount: numericAmount,
        timestamp: `Today · ${formatTime()}`,
        status: "Completed",
        from: accounts[fromAccount].name,
        to: accounts[toAccount].name,
      };

      setTransactions((current) => [newTransaction, ...current]);

      setMessage(
        `${formatCurrency(numericAmount)} transferred successfully from ${accounts[fromAccount].name} to ${accounts[toAccount].name}.`
      );
      setMessageType("success");
      setAmount("");
    } catch {
      setMessage("Transaction service is unavailable.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-emblem">
            <span className="brand-hat">⌒</span>
            <span className="brand-skull">☠</span>
          </div>

          <div>
            <strong>SecurePay</strong>
            <span>Financial Services</span>
          </div>
        </div>

        <div className="side-divider" />

        <nav className="side-nav">
          <button className="nav-item active">
            <span>◈</span>
            Overview
          </button>

          <button className="nav-item">
            <span>◎</span>
            Accounts
          </button>

          <button className="nav-item">
            <span>↗</span>
            Transfers
          </button>

          <button className="nav-item">
            <span>◇</span>
            Security
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="compass">
            <div className="compass-ring">
              <span>N</span>
              <span>E</span>
              <span>S</span>
              <span>W</span>
              <i />
            </div>
          </div>

          <p>Protected financial access</p>
          <small>Zero-trust security enabled</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">SECUREPAY / OVERVIEW</div>
            <h1>Good afternoon, Raj</h1>
            <p>Manage your accounts and make secure transfers.</p>
          </div>

          <div className="system-status">
            <span className="status-dot" />
            <span>All systems operational</span>
          </div>
        </header>

        <section className="balance-strip">
          <div>
            <span className="section-label">TOTAL AVAILABLE</span>
            <strong>{formatCurrency(totalBalance)}</strong>
            <small>Across 2 active accounts</small>
          </div>

          <div className="strip-emblem">
            <div className="crossed-line line-one" />
            <div className="crossed-line line-two" />
            <span>☠</span>
          </div>

          <div className="security-seal">
            <span>✓</span>
            <div>
              <strong>Protected</strong>
              <small>Zero-trust controls active</small>
            </div>
          </div>
        </section>

        <section className="accounts-section">
          <div className="section-heading">
            <div>
              <span className="section-label">YOUR ACCOUNTS</span>
              <h2>Accounts</h2>
            </div>

            <span className="account-count">02 ACTIVE</span>
          </div>

          <div className="account-grid">
            {Object.entries(accounts).map(([key, account]) => (
              <article className="account-card" key={key}>
                <div className="poster-edge" />

                <div className="account-card-top">
                  <div className="account-mark">
                    {account.name.charAt(0)}
                  </div>

                  <div>
                    <span className="account-type">{account.type}</span>
                    <h3>{account.name}</h3>
                  </div>

                  <span className="verified-stamp">ACTIVE</span>
                </div>

                <div className="account-balance">
                  <span>Available balance</span>
                  <strong>{formatCurrency(account.balance)}</strong>
                </div>

                <div className="account-card-bottom">
                  <span>•••• {account.number}</span>

                  <span className="card-mark">
                    <i />
                    <i />
                    <i />
                  </span>

                  <span>INR</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace-grid">
          <article className="transfer-card">
            <div className="card-heading">
              <div>
                <span className="section-label">TRANSFER</span>
                <h2>Send money</h2>
              </div>

              <div className="secure-badge">
                <span>✓</span>
                Secure
              </div>
            </div>

            <form onSubmit={handleTransfer}>
              <div className="field">
                <label>From</label>

                <select
                  value={fromAccount}
                  onChange={(event) => setFromAccount(event.target.value)}
                >
                  {Object.entries(accounts).map(([key, account]) => (
                    <option value={key} key={key}>
                      {account.name} · {account.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="transfer-arrow">↓</div>

              <div className="field">
                <label>To</label>

                <select
                  value={toAccount}
                  onChange={(event) => setToAccount(event.target.value)}
                >
                  {Object.entries(accounts).map(([key, account]) => (
                    <option value={key} key={key}>
                      {account.name} · {account.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field amount-field">
                <label>Amount</label>

                <div className="amount-input">
                  <span>₹</span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />

                  <span>INR</span>
                </div>
              </div>

              {message && (
                <div className={`form-message ${messageType}`}>
                  <span>{messageType === "success" ? "✓" : "!"}</span>
                  {message}
                </div>
              )}

              <button className="transfer-button" type="submit" disabled={loading}>
                {loading ? "Processing..." : "Review & Transfer"}
                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="transfer-note">
              <span>◇</span>
              Transfers are validated before processing.
            </div>
          </article>

          <article className="activity-card">
            <div className="card-heading">
              <div>
                <span className="section-label">ACCOUNT ACTIVITY</span>
                <h2>Recent transactions</h2>
              </div>

              <span className="transaction-count">
                {transactions.length.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="transaction-list">
              {transactions.slice(0, 6).map((transaction) => (
                <div className="transaction" key={transaction.id}>
                  <div className={`transaction-icon ${transaction.type}`}>
                    {transaction.type === "credit" && "↓"}
                    {transaction.type === "debit" && "↑"}
                    {transaction.type === "transfer" && "↗"}
                  </div>

                  <div className="transaction-info">
                    <strong>{transaction.title}</strong>
                    <span>
                      {transaction.subtitle} · {transaction.timestamp}
                    </span>
                  </div>

                  <div className="transaction-amount">
                    <strong
                      className={
                        transaction.type === "credit" ? "positive" : ""
                      }
                    >
                      {transaction.type === "credit" ? "+" : "−"}{" "}
                      {formatCurrency(transaction.amount)}
                    </strong>

                    <span>{transaction.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="activity-footer">
              <span>Transaction records are updated after successful transfers.</span>
              <span className="tiny-mark">☠</span>
            </div>
          </article>
        </section>

        <section className="security-panel">
          <div className="security-intro">
            <div className="security-icon">✓</div>

            <div>
              <span className="section-label">SECURITY STATUS</span>
              <h2>Zero-trust controls</h2>
              <p>
                Every transfer is processed through validated service
                communication and access controls.
              </p>
            </div>
          </div>

          <div className="security-items">
            <div>
              <span>✓</span>
              <strong>Identity</strong>
              <small>Verified</small>
            </div>

            <div>
              <span>✓</span>
              <strong>Access</strong>
              <small>Least privilege</small>
            </div>

            <div>
              <span>✓</span>
              <strong>Network</strong>
              <small>Restricted</small>
            </div>

            <div>
              <span>✓</span>
              <strong>Services</strong>
              <small>Healthy</small>
            </div>
          </div>
        </section>

        <footer>
          <span>SECUREPAY · FINANCIAL SERVICES</span>

          <div className="footer-symbols">
            <span>⚓</span>
            <span>✦</span>
            <span>☠</span>
            <span>✦</span>
            <span>⚓</span>
          </div>

          <span>Protected by continuous verification</span>
        </footer>
      </main>
    </div>
  );
}

export default App;