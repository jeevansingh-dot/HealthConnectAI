import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../findDonors.css";

function FindDonors() {
  const navigate = useNavigate();

  const [bloodGroup, setBloodGroup] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [maxDistance, setMaxDistance] = useState(10000);

  const [donors, setDonors] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Detect location
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

  // Find nearby donors
  const findDonors = async (e) => {
    e.preventDefault();

    if (!bloodGroup) {
      setMessage("Please select a blood group.");
      return;
    }

    if (!latitude || !longitude) {
      setMessage("Please detect your location first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setDonors([]);

      const response = await API.get("/users/nearby-donors", {
        params: {
          bloodGroup: bloodGroup,
          latitude: Number(latitude),
          longitude: Number(longitude),
          maxDistance: Number(maxDistance),
        },
      });

      setDonors(response.data.donors || []);

      if (response.data.count === 0) {
        setMessage("No matching donors found nearby.");
      } else {
        setMessage(
          `${response.data.count} matching donor(s) found.`
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to find donors."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="find-donors-page">

      {/* HEADER */}
      <div className="find-header">

        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <h1>Find Donors</h1>

        <p>
          Find available blood donors near your location
        </p>

      </div>


      {/* SEARCH CARD */}
      <div className="search-card">

        <div className="card-heading">
          <div className="search-icon">🔍</div>

          <div>
            <h2>Search Nearby Donors</h2>
            <p>
              Select the required blood group and your location
            </p>
          </div>
        </div>


        <form onSubmit={findDonors}>

          <div className="search-row">

            {/* Blood Group */}
            <div className="form-group">

              <label>Blood Group</label>

              <select
                value={bloodGroup}
                onChange={(e) =>
                  setBloodGroup(e.target.value)
                }
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


            {/* Distance */}
            <div className="form-group">

              <label>Search Radius</label>

              <select
                value={maxDistance}
                onChange={(e) =>
                  setMaxDistance(e.target.value)
                }
              >
                <option value="5000">
                  5 km
                </option>

                <option value="10000">
                  10 km
                </option>

                <option value="25000">
                  25 km
                </option>

                <option value="50000">
                  50 km
                </option>
              </select>

            </div>

          </div>


          {/* LOCATION */}
          <div className="location-section">

            <div>
              <h3>📍 Your Location</h3>

              <p>
                Your location is used only to search nearby
                available donors.
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


          {/* Coordinates */}
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


          <button
            type="submit"
            className="find-btn"
            disabled={loading}
          >
            {loading
              ? "Searching..."
              : "Find Nearby Donors"}
          </button>

        </form>

      </div>


      {/* MESSAGE */}
      {message && (
        <div className="result-message">
          {message}
        </div>
      )}


      {/* RESULTS */}
      {donors.length > 0 && (

        <div className="results-section">

          <div className="results-heading">

            <div>
              <h2>Available Donors</h2>

              <p>
                Matching donors found near your location
              </p>
            </div>

            <span className="donor-count">
              {donors.length} Donor
              {donors.length > 1 ? "s" : ""}
            </span>

          </div>


          <div className="donor-grid">

            {donors.map((donor) => (

              <div
                className="donor-card"
                key={donor._id}
              >

                <div className="donor-top">

                  <div className="donor-avatar">
                    {donor.name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <h3>{donor.name}</h3>

                    <span className="available">
                      ● Available
                    </span>

                  </div>

                </div>


                <div className="blood-badge">
                  {donor.bloodGroup}
                </div>


                <div className="donor-info">

                  <p>
                    <strong>📞 Phone:</strong>{" "}
                    {donor.phone}
                  </p>

                  <p>
                    <strong>✉ Email:</strong>{" "}
                    {donor.email}
                  </p>

                </div>


                <button
                  className="contact-btn"
                  onClick={() => {
                    window.location.href =
                      `tel:${donor.phone}`;
                  }}
                >
                  Contact Donor
                </button>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}

export default FindDonors;