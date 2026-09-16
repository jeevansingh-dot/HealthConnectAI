import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await API.post("/users/login", {
        email,
        password,
      });

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      navigate("/dashboard");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-left">
        <div className="brand-content">
          <div className="brand-icon">❤️</div>

          <h1>HealthConnect AI</h1>

          <p>
            Emergency Blood & Smart Nutrition
            Management System
          </p>

          <div className="feature-list">
            <div>🩸 Emergency Blood Connection</div>
            <div>🍎 Smart Nutrition Tracking</div>
            <div>🤖 AI-Powered Health Assistance</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">

          <div className="auth-heading">
            <h2>Welcome Back 👋</h2>
            <p>Login to continue to HealthConnect AI</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className="auth-message error">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <div className="auth-footer">
            <span>Don't have an account?</span>

            <button
              type="button"
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;