import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../becomeDonor.css";

function BecomeDonor() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    bloodGroup: "",
    phone: user?.phone || "",
    isAvailable: true,
    latitude: "",
    longitude: "",
    lastDonationDate: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
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
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));

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

    if (!formData.latitude || !formData.longitude) {
      setMessage("Please detect your location first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await API.put(
        `/users/become-donor/${user.id}`,
        {
          bloodGroup: formData.bloodGroup,
          phone: formData.phone,
          isAvailable: formData.isAvailable,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          lastDonationDate:
            formData.lastDonationDate || null,
        }
      );

      // Update localStorage with latest user information
      const updatedUser = {
        ...user,
        phone: response.data.user.phone,
        bloodGroup: response.data.user.bloodGroup,
        role: response.data.user.role,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setMessage(response.data.message);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to register as donor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donor-page">

      {/* HEADER */}
      <div className="donor-header">

        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <h1>Become a Donor</h1>

        <p>
          Register as a donor and help people during emergencies
        </p>

      </div>


      {/* MAIN CARD */}
      <div className="donor-card">

        <div className="donor-card-heading">

          <div className="donor-main-icon">
            ❤️
          </div>

          <div>
            <h2>Donor Registration</h2>
            <p>
              Provide your details to become an available donor
            </p>
          </div>

        </div>


        <form onSubmit={handleSubmit}>

          {/* BLOOD GROUP + PHONE */}
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

              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* AVAILABILITY */}
          <div className="availability-box">

            <div>

              <h3>Donor Availability</h3>

              <p>
                Enable this if you are currently available
                for blood donation requests.
              </p>

            </div>

            <label className="switch">

              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isAvailable: e.target.checked,
                  })
                }
              />

              <span className="slider"></span>

            </label>

          </div>


          <div className="availability-status">

            Status:

            <strong>
              {formData.isAvailable
                ? " Available"
                : " Not Available"}
            </strong>

          </div>


          {/* LAST DONATION */}
          <div className="form-group">

            <label>
              Last Donation Date
              <span className="optional">
                (Optional)
              </span>
            </label>

            <input
              type="date"
              name="lastDonationDate"
              value={formData.lastDonationDate}
              onChange={handleChange}
            />

          </div>


          {/* LOCATION */}
          <div className="location-box">

            <div>

              <h3>📍 Donor Location</h3>

              <p>
                Your location helps the system find nearby
                matching donors.
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


          {/* COORDINATES */}
          {formData.latitude &&
            formData.longitude && (
              <div className="coordinates">

                <span>
                  Latitude:{" "}
                  {Number(formData.latitude).toFixed(5)}
                </span>

                <span>
                  Longitude:{" "}
                  {Number(formData.longitude).toFixed(5)}
                </span>

              </div>
            )}


          {/* MESSAGE */}
          {message && (
            <div className="donor-message">
              {message}
            </div>
          )}


          {/* SUBMIT */}
          <button
            type="submit"
            className="register-donor-btn"
            disabled={loading}
          >
            {loading
              ? "Registering..."
              : "Register as Donor"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default BecomeDonor;