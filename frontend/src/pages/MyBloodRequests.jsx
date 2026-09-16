import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../myBloodRequests.css";

function MyBloodRequests() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [requests, setRequests] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newResponseAlert, setNewResponseAlert] = useState(false);

  const previousResponseIds = useRef([]);

  // =====================================================
  // FETCH MY BLOOD REQUESTS
  // =====================================================

  const fetchMyRequests = async () => {
    try {
      const response = await API.get("/blood-requests");

      const allRequests = response.data.requests || [];

      const myRequests = allRequests.filter(
        (request) =>
          request.requesterId?._id === user?.id
      );

      setRequests(myRequests);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to load your blood requests."
      );
    }
  };


  // =====================================================
  // FETCH DONOR RESPONSES
  // =====================================================

  const fetchDonorResponses = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const response = await API.get(
        `/donation-responses/requester/${user.id}`
      );

      const newResponses =
        response.data.responses || [];

      const currentResponseIds = newResponses.map(
        (item) => item._id
      );

      // Check for new donor response
      if (previousResponseIds.current.length > 0) {
        const newlyAddedResponses =
          newResponses.filter(
            (item) =>
              !previousResponseIds.current.includes(
                item._id
              )
          );

        if (newlyAddedResponses.length > 0) {
          setNewResponseAlert(true);

          // Browser notification
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            newlyAddedResponses.forEach(
              (item) => {
                const donorName =
                  item.donorId?.name ||
                  "A donor";

                const bloodGroup =
                  item.requestId?.bloodGroup ||
                  "";

                new Notification(
                  "🤝 Donor Response Received",
                  {
                    body: `${donorName} accepted your ${bloodGroup} blood request.`,
                    icon: "/vite.svg",
                  }
                );
              }
            );
          }
        }
      }

      previousResponseIds.current =
        currentResponseIds;

      setResponses(newResponses);

    } catch (error) {
      console.log(
        "Failed to load donor responses:",
        error
      );
    }
  };


  // =====================================================
  // INITIAL LOAD + POLLING
  // =====================================================

  useEffect(() => {
    if (!user?.id) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

    // Ask notification permission
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    const loadData = async () => {
      setLoading(true);

      await fetchMyRequests();
      await fetchDonorResponses();

      setLoading(false);
    };

    loadData();

    // Check every 10 seconds
    const interval = setInterval(() => {
      fetchMyRequests();
      fetchDonorResponses();
    }, 10000);

    return () => clearInterval(interval);
  }, []);


  // =====================================================
  // FIND RESPONSES FOR PARTICULAR REQUEST
  // =====================================================

  const getResponsesForRequest = (requestId) => {
    return responses.filter(
      (response) =>
        response.requestId?._id === requestId
    );
  };


  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    return `status-badge ${status}`;
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="my-requests-page">

      {/* HEADER */}

      <header className="my-requests-header">

        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <div>
          <h1>My Blood Requests</h1>

          <p>
            Track your blood requests and donor responses
          </p>
        </div>

        <button
          className="new-request-btn"
          onClick={() => navigate("/blood-request")}
        >
          + New Request
        </button>

      </header>


      {/* NEW RESPONSE ALERT */}

      {newResponseAlert && (
        <div
          style={{
            background: "#e8f7ee",
            color: "#166534",
            padding: "15px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
          }}
        >

          <strong>
            🤝 A donor has responded to your blood request!
          </strong>

          <button
            onClick={() =>
              setNewResponseAlert(false)
            }
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ✕
          </button>

        </div>
      )}


      {/* MESSAGE */}

      {message && (
        <div className="request-message">
          {message}
        </div>
      )}


      {/* LOADING */}

      {loading && (
        <div className="empty-state">

          <div className="loading-icon">
            ⏳
          </div>

          <h2>
            Loading Requests...
          </h2>

          <p>
            Please wait while we fetch your blood requests.
          </p>

        </div>
      )}


      {/* SUMMARY */}

      {!loading && requests.length > 0 && (
        <div className="request-summary">

          <div>
            <span>Total Requests</span>

            <strong>
              {requests.length}
            </strong>
          </div>

          <div>
            <span>Pending</span>

            <strong>
              {
                requests.filter(
                  (request) =>
                    request.status === "pending"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Matched</span>

            <strong>
              {
                requests.filter(
                  (request) =>
                    request.status === "matched"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Fulfilled</span>

            <strong>
              {
                requests.filter(
                  (request) =>
                    request.status === "fulfilled"
                ).length
              }
            </strong>
          </div>

        </div>
      )}


      {/* REQUEST CARDS */}

      {!loading && requests.length > 0 && (
        <div className="my-request-grid">

          {requests.map((request) => {

            const requestResponses =
              getResponsesForRequest(
                request._id
              );

            const acceptedResponses =
              requestResponses.filter(
                (response) =>
                  response.status === "accepted"
              );

            return (
              <div
                className="my-request-card"
                key={request._id}
              >

                {/* TOP */}

                <div className="card-top">

                  <div className="blood-group-box">
                    🩸

                    <strong>
                      {request.bloodGroup}
                    </strong>
                  </div>

                  <span
                    className={getStatusClass(
                      request.status
                    )}
                  >
                    {request.status}
                  </span>

                </div>


                {/* HOSPITAL */}

                <div className="hospital-section">

                  <h2>
                    {request.hospitalName}
                  </h2>

                  <p>
                    📍 {request.hospitalAddress}
                  </p>

                </div>


                {/* DETAILS */}

                <div className="request-info-grid">

                  <div className="info-box">

                    <span>
                      Required Units
                    </span>

                    <strong>
                      {request.units}
                    </strong>

                  </div>

                  <div className="info-box">

                    <span>
                      Urgency
                    </span>

                    <strong>
                      {request.urgency}
                    </strong>

                  </div>

                </div>


                {/* REASON */}

                <div className="reason-section">

                  <span>
                    Reason
                  </span>

                  <p>
                    {request.reason}
                  </p>

                </div>


                {/* DATE */}

                <div className="request-date">

                  Created on:{" "}
                  {new Date(
                    request.createdAt
                  ).toLocaleString()}

                </div>


                {/* DONOR RESPONSE */}

                {acceptedResponses.length > 0 ? (

                  <div
                    style={{
                      marginTop: "20px",
                      padding: "18px",
                      borderRadius: "12px",
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                    }}
                  >

                    <h3
                      style={{
                        marginBottom: "12px",
                        color: "#166534",
                      }}
                    >
                      🤝 Donor Accepted Your Request
                    </h3>

                    {acceptedResponses.map(
                      (response) => (

                        <div
                          key={response._id}
                          style={{
                            background: "white",
                            padding: "14px",
                            borderRadius: "9px",
                            marginTop: "10px",
                          }}
                        >

                          <p>
                            <strong>
                              Donor:
                            </strong>{" "}
                            {response.donorId?.name ||
                              "Unknown"}
                          </p>

                          <p>
                            <strong>
                              Blood Group:
                            </strong>{" "}
                            {response.donorId
                              ?.bloodGroup ||
                              request.bloodGroup}
                          </p>

                          <p>
                            <strong>
                              Phone:
                            </strong>{" "}
                            {response.donorId?.phone ||
                              "Not available"}
                          </p>

                          <p>
                            <strong>
                              Email:
                            </strong>{" "}
                            {response.donorId?.email ||
                              "Not available"}
                          </p>

                          <p
                            style={{
                              marginTop: "8px",
                              color: "#166534",
                              fontWeight: "600",
                            }}
                          >
                            ✓ Donor is willing to help
                          </p>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <div className="status-message">

                    {request.status ===
                      "pending" && (
                      <>
                        <span>⏳</span>
                        Waiting for a matching
                        donor response.
                      </>
                    )}

                    {request.status ===
                      "matched" && (
                      <>
                        <span>🤝</span>
                        A donor has responded
                        to this request.
                      </>
                    )}

                    {request.status ===
                      "fulfilled" && (
                      <>
                        <span>✓</span>
                        This blood request has
                        been fulfilled.
                      </>
                    )}

                    {request.status ===
                      "cancelled" && (
                      <>
                        <span>✕</span>
                        This blood request has
                        been cancelled.
                      </>
                    )}

                  </div>

                )}

              </div>
            );
          })}

        </div>
      )}


      {/* NO REQUESTS */}

      {!loading && requests.length === 0 && (

        <div className="empty-state">

          <div className="empty-icon">
            🩸
          </div>

          <h2>
            No Blood Requests Yet
          </h2>

          <p>
            You haven't created any blood requests yet.
          </p>

          <button
            className="create-btn"
            onClick={() =>
              navigate("/blood-request")
            }
          >
            Create Blood Request
          </button>

        </div>

      )}

    </div>
  );
}

export default MyBloodRequests;