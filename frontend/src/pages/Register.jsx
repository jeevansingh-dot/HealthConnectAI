import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../auth.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bloodGroup: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await API.post("/users/register", {
        ...formData,
        role: "user",
      });

      setMessage(
        response.data.message || "Registration successful!"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Registration failed"
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
            Your Smart Platform for Emergency
            Blood & Nutrition Management
          </p>

          <div className="feature-list">
            <div>🩸 Find Compatible Blood Donors</div>
            <div>📍 Locate Nearby Donors</div>
            <div>🍎 Track Your Meals & Nutrition</div>
            <div>🤖 AI Health Assistance</div>
          </div>

        </div>
      </div>

      <div className="auth-right">

        <div className="auth-card register-card">

          <div className="auth-heading">
            <h2>Create Account</h2>
            <p>
              Join HealthConnect AI today
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Full Name</label>

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-row">

              <div className="input-group">
                <label>Phone Number</label>

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Blood Group</label>

                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">
                    Select
                  </option>

                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>

              </div>

            </div>

            <div className="input-group">
              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {message && (
              <div
                className={`auth-message ${
                  message.toLowerCase().includes("success")
                    ? "success"
                    : "error"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;