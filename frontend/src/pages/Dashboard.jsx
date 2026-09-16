import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../dashboard.css";

function Dashboard() {

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [bloodRequests, setBloodRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  // =====================================================
  // FETCH USER BLOOD REQUESTS
  // =====================================================
  useEffect(() => {

    const fetchDashboardData =
      async () => {

        if (!user?.id) {
          setLoading(false);
          return;
        }


        try {

          const response =
            await API.get(
              "/blood-requests"
            );


          const allRequests =
            response.data.requests || [];


          const myRequests =
            allRequests.filter(
              (request) =>
                request.requesterId?._id ===
                user.id
            );


          setBloodRequests(
            myRequests
          );

        } catch (error) {

          console.error(
            "Failed to load dashboard data:",
            error
          );

        } finally {

          setLoading(false);
        }
      };


    fetchDashboardData();

  }, [user?.id]);


  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };


  // =====================================================
  // COUNTS
  // =====================================================
  const pendingRequests =
    bloodRequests.filter(
      (request) =>
        request.status ===
        "pending"
    ).length;


  const matchedRequests =
    bloodRequests.filter(
      (request) =>
        request.status ===
        "matched"
    ).length;


  const fulfilledRequests =
    bloodRequests.filter(
      (request) =>
        request.status ===
        "fulfilled"
    ).length;


  return (

    <div className="dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}
      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ❤
          </div>

          <div>

            <h2>
              HealthConnect
            </h2>

            <span>
              AI
            </span>

          </div>

        </div>


        <nav className="sidebar-nav">

          <button
            className="nav-item active"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>


          <button
            className="nav-item"
            onClick={() =>
              navigate("/blood-request")
            }
          >
            <span>🩸</span>
            Request Blood
          </button>


          <button
            className="nav-item"
            onClick={() =>
              navigate("/my-blood-requests")
            }
          >
            <span>📋</span>
            My Blood Requests
          </button>


          <button
            className="nav-item"
            onClick={() =>
              navigate("/find-donors")
            }
          >
            <span>🔍</span>
            Find Donors
          </button>


          <button
            className="nav-item"
            onClick={() =>
              navigate("/become-donor")
            }
          >
            <span>❤</span>
            Become a Donor
          </button>


          <button
            className="nav-item"
            onClick={() =>
              navigate("/nutrition")
            }
          >
            <span>🍎</span>
            Nutrition Tracker
          </button>


          {/* =================================================
              DONATION REQUESTS ONLY FOR DONOR
          ================================================= */}
          {user?.role === "donor" && (

            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/donation-requests"
                )
              }
            >
              <span>🩸</span>
              Donation Requests
            </button>

          )}

        </nav>


        {/* LOGOUT */}
        <button
          className="logout-btn"
          onClick={
            handleLogout
          }
        >
          <span>
            ↪
          </span>

          Logout
        </button>

      </aside>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}
      <main className="main-content">

        {/* TOPBAR */}
        <header className="topbar">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Welcome back to HealthConnect AI
            </p>

          </div>


          <div className="user-info">

            <div className="user-avatar">

              {user?.name
                ?.charAt(0)
                .toUpperCase() || "U"}

            </div>


            <div>

              <strong>
                {user?.name || "User"}
              </strong>

              <small>
                {user?.email || ""}
              </small>

            </div>

          </div>

        </header>


        {/* =================================================
            WELCOME CARD
        ================================================= */}
        <section className="welcome-card">

          <div>

            <span className="welcome-label">
              HEALTHCONNECT AI
            </span>


            <h2>
              Welcome,{" "}
              {user?.name || "User"}! 👋
            </h2>


            <p>
              Manage emergency blood requests
              and track your nutrition from one
              place.
            </p>


            <button
              onClick={() =>
                navigate(
                  "/blood-request"
                )
              }
              className="primary-btn"
            >
              Request Blood
            </button>

          </div>


          <div className="welcome-icon">
            ❤
          </div>

        </section>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}
        <section className="section">

          <div className="section-heading">

            <h2>
              Quick Actions
            </h2>

            <p>
              Access important features quickly
            </p>

          </div>


          <div className="action-grid">

            {/* REQUEST BLOOD */}
            <div
              className="action-card"
              onClick={() =>
                navigate(
                  "/blood-request"
                )
              }
            >

              <div className="action-icon">
                🩸
              </div>

              <h3>
                Request Blood
              </h3>

              <p>
                Create an emergency blood
                request and find matching donors.
              </p>

              <span>
                Get Help →
              </span>

            </div>


            {/* MY REQUESTS */}
            <div
              className="action-card"
              onClick={() =>
                navigate(
                  "/my-blood-requests"
                )
              }
            >

              <div className="action-icon">
                📋
              </div>

              <h3>
                My Blood Requests
              </h3>

              <p>
                View and track the blood
                requests you have created.
              </p>

              <span>
                View Requests →
              </span>

            </div>


            {/* FIND DONORS */}
            <div
              className="action-card"
              onClick={() =>
                navigate(
                  "/find-donors"
                )
              }
            >

              <div className="action-icon">
                🔍
              </div>

              <h3>
                Find Donors
              </h3>

              <p>
                Find available blood donors
                near the required location.
              </p>

              <span>
                Find Donors →
              </span>

            </div>


            {/* BECOME DONOR */}
            <div
              className="action-card"
              onClick={() =>
                navigate(
                  "/become-donor"
                )
              }
            >

              <div className="action-icon">
                ❤
              </div>

              <h3>
                Become a Donor
              </h3>

              <p>
                Register as a donor and help
                someone in an emergency.
              </p>

              <span>
                Register →
              </span>

            </div>


            {/* NUTRITION */}
            <div
              className="action-card"
              onClick={() =>
                navigate(
                  "/nutrition"
                )
              }
            >

              <div className="action-icon">
                🍎
              </div>

              <h3>
                Nutrition Tracker
              </h3>

              <p>
                Track meals and get AI-powered
                nutrition information.
              </p>

              <span>
                Track Nutrition →
              </span>

            </div>


            {/* =================================================
                DONATION REQUESTS ONLY FOR DONORS
            ================================================= */}
            {user?.role === "donor" && (

              <div
                className="action-card"
                onClick={() =>
                  navigate(
                    "/donation-requests"
                  )
                }
              >

                <div className="action-icon">
                  🩸
                </div>

                <h3>
                  Donation Requests
                </h3>

                <p>
                  View matching blood requests
                  and respond when you can help.
                </p>

                <span>
                  View Requests →
                </span>

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            HEALTH OVERVIEW
        ================================================= */}
        <section className="section">

          <div className="section-heading">

            <h2>
              Health Overview
            </h2>

            <p>
              Your HealthConnect activity
            </p>

          </div>


          <div className="stats-grid">

            {/* BLOOD REQUESTS */}
            <div className="stat-card">

              <div className="stat-icon">
                🩸
              </div>

              <div>

                <span>
                  Blood Requests
                </span>

                <strong>
                  {loading
                    ? "..."
                    : bloodRequests.length}
                </strong>

              </div>

            </div>


            {/* DONOR STATUS */}
            <div className="stat-card">

              <div className="stat-icon">
                ❤
              </div>

              <div>

                <span>
                  Donor Status
                </span>

                <strong>
                  {user?.role === "donor"
                    ? "Active"
                    : "Not Registered"}
                </strong>

              </div>

            </div>


            {/* MEALS */}
            <div className="stat-card">

              <div className="stat-icon">
                🍎
              </div>

              <div>

                <span>
                  Meals Tracked
                </span>

                <strong>
                  0
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              REQUEST STATUS
          ================================================= */}
          {bloodRequests.length > 0 && (

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: "18px",
                marginTop: "20px",
              }}
            >

              <div
                style={{
                  background: "white",
                  padding: "18px",
                  borderRadius: "14px",
                  boxShadow:
                    "0 5px 18px rgba(0,0,0,0.06)",
                }}
              >

                <span
                  style={{
                    display: "block",
                    color: "#6b7280",
                    fontSize: "13px",
                    marginBottom: "7px",
                  }}
                >
                  Pending
                </span>


                <strong
                  style={{
                    fontSize: "24px",
                  }}
                >
                  {pendingRequests}
                </strong>

              </div>


              <div
                style={{
                  background: "white",
                  padding: "18px",
                  borderRadius: "14px",
                  boxShadow:
                    "0 5px 18px rgba(0,0,0,0.06)",
                }}
              >

                <span
                  style={{
                    display: "block",
                    color: "#6b7280",
                    fontSize: "13px",
                    marginBottom: "7px",
                  }}
                >
                  Matched
                </span>


                <strong
                  style={{
                    fontSize: "24px",
                  }}
                >
                  {matchedRequests}
                </strong>

              </div>


              <div
                style={{
                  background: "white",
                  padding: "18px",
                  borderRadius: "14px",
                  boxShadow:
                    "0 5px 18px rgba(0,0,0,0.06)",
                }}
              >

                <span
                  style={{
                    display: "block",
                    color: "#6b7280",
                    fontSize: "13px",
                    marginBottom: "7px",
                  }}
                >
                  Fulfilled
                </span>


                <strong
                  style={{
                    fontSize: "24px",
                  }}
                >
                  {fulfilledRequests}
                </strong>

              </div>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Dashboard;