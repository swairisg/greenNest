import { Link } from "react-router-dom";
import "../../styles/theme.css";
import "../../styles/app.css";

export default function Landing() {
  return (
    <div className="gn-container">
      <div className="gn-card">
        <h1 style={{ marginTop: 0 }}>Welcome to GreenNest</h1>
        <p className="text-muted">Farm-to-table strawberries, flowers, and veggies.</p>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Link className="gn-btn primary" to="/auth/signup">Create Account</Link>
          <Link className="gn-btn ghost" to="/auth/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}
