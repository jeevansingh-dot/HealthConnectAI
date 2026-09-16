import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../bloodRequest.css";

function BloodRequest() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    bloodGroup: "",
    units: 1,
    hospitalName: "",
    hospitalAddress: "",
    urgency: "Medium",
    reason: "",
  });

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    setMessage("Detecting location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);

        setMessage("Location detected successfully.");
      },
      () => {
        setMessage(
          "Unable to get location. Please allow location access."
        );
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      setMessage("Please login first.");
      return;
    }

    if (!latitude || !longitude) {
      setMessage("Please detect your location first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await API.post("/blood-requests/create", {
        requesterId: user.id,
        bloodGroup: formData.bloodGroup,
        units: Number(formData.units),
        hospitalName: formData.hospitalName,
        hospitalAddress: formData.hospitalAddress,
        urgency: formData.urgency,
        reason: formData.reason,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      setMessage(
        response.data.message ||
          "Blood request created successfully."
      );

      setFormData({
        bloodGroup: "",
        units: 1,
        hospitalName: "",
        hospitalAddress: "",
        urgency: "Medium",
        reason: "",
      });

      setLatitude("");
      setLongitude("");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to create blood request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="blood-request-page">

      <header className="blood-request-header">
        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <div>
          <h1>Request Blood</h1>
          <p>
            Create an emergency blood request and find matching donors
          </p>
        </div>
      </header>

      <div className="blood-request-container">

        <div className="request-card">

          <div className="card-heading">
            <div className="blood-icon">🩸</div>

            <div>
              <h2>Blood Request Details</h2>
              <p>
                Please provide the required information
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-row">

              <div className="form-group">
                <label>Blood Group</label>

                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Blood Group
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

              <div className="form-group">
                <label>Required Units</label>

                <input
                  type="number"
                  name="units"
                  min="1"
                  value={formData.units}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <div className="form-group">
              <label>Hospital Name</label>

              <input
                type="text"
                name="hospitalName"
                placeholder="Enter hospital name"
                value={formData.hospitalName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Hospital Address</label>

              <input
                type="text"
                name="hospitalAddress"
                placeholder="Enter hospital address"
                value={formData.hospitalAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">

              <div className="form-group">
                <label>Urgency</label>

                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">
                    Emergency
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Reason</label>

                <input
                  type="text"
                  name="reason"
                  placeholder="Reason for blood requirement"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <div className="location-box">

              <div>
                <h3>📍 Request Location</h3>

                <p>
                  Your location helps find nearby matching donors.
                </p>
              </div>

              <button
                type="button"
                className="location-btn"
                onClick={getLocation}
              >
                Detect My Location
              </button>

            </div>

            {latitude && longitude && (
              <div className="coordinates">
                <span>
                  Latitude: {Number(latitude).toFixed(5)}
                </span>

                <span>
                  Longitude: {Number(longitude).toFixed(5)}
                </span>
              </div>
            )}

            {message && (
              <div className="request-message">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="submit-request-btn"
              disabled={loading}
            >
              {loading
                ? "Creating Request..."
                : "Create Blood Request"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default BloodRequest;