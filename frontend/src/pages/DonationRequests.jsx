import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../donationRequests.css";

function DonationRequests() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [requests, setRequests] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newRequestAlert, setNewRequestAlert] =
    useState(false);

  const declinedRequestIds = useRef([]);

  const previousRequestIds = useRef([]);


  // =====================================================
  // ROLE CHECK
  // =====================================================
  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (user.role !== "donor") {
      navigate("/dashboard");
    }
  }, []);


  // =====================================================
  // NOTIFICATION PERMISSION
  // =====================================================
  useEffect(() => {
    if (
      user?.role === "donor" &&
      "Notification" in window
    ) {
      if (
        Notification.permission === "default"
      ) {
        Notification.requestPermission();
      }
    }
  }, []);


  // =====================================================
  // BROWSER NOTIFICATION
  // =====================================================
  const showBrowserNotification = (
    request
  ) => {

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {

      const notification =
        new Notification(
          "🩸 New Blood Request",
          {
            body:
              `${request.bloodGroup} blood is required at ${request.hospitalName}.`,
            icon: "/vite.svg",
          }
        );


      notification.onclick = () => {

        window.focus();

        navigate(
          "/donation-requests"
        );

        notification.close();
      };
    }
  };


  // =====================================================
  // FETCH DONOR RESPONSES
  // =====================================================
  const fetchMyResponses = async () => {

    if (
      !user?.id ||
      user.role !== "donor"
    ) {
      return;
    }


    try {

      const response =
        await API.get(
          `/donation-responses/donor/${user.id}`
        );


      const donorResponses =
        response.data.responses || [];


      setResponses(
        donorResponses
      );


      // Store declined request IDs
      const declinedIds =
        donorResponses
          .filter(
            (response) =>
              response.status ===
              "declined"
          )
          .map((response) => {

            if (
              typeof response.requestId ===
              "object"
            ) {
              return response.requestId?._id;
            }

            return response.requestId;
          })
          .filter(Boolean);


      declinedRequestIds.current =
        declinedIds;

    } catch (error) {

      console.error(
        "Failed to load donor responses:",
        error
      );
    }
  };


  // =====================================================
  // FETCH MATCHING REQUESTS
  // =====================================================
  const fetchRequests = async (
    showLoader = false
  ) => {

    if (
      !user?.id ||
      user.role !== "donor"
    ) {
      return;
    }


    try {

      if (showLoader) {
        setLoading(true);
      }


      const response =
        await API.get(
          `/blood-requests/for-donor/${user.id}`
        );


      const allRequests =
        response.data.requests || [];


      // Safety filter:
      // Remove requests already declined
      const filteredRequests =
        allRequests.filter(
          (request) =>
            !declinedRequestIds.current.includes(
              request._id
            )
        );


      const currentIds =
        filteredRequests.map(
          (request) =>
            request._id
        );


      // =================================================
      // NEW REQUEST DETECTION
      // =================================================
      if (
        previousRequestIds.current.length > 0
      ) {

        const newlyAddedRequests =
          filteredRequests.filter(
            (request) =>
              !previousRequestIds.current.includes(
                request._id
              )
          );


        if (
          newlyAddedRequests.length > 0
        ) {

          setNewRequestAlert(true);


          newlyAddedRequests.forEach(
            (request) => {
              showBrowserNotification(
                request
              );
            }
          );
        }
      }


      previousRequestIds.current =
        currentIds;


      setRequests(
        filteredRequests
      );

    } catch (error) {

      console.error(
        "Failed to load donation requests:",
        error
      );


      setMessage(
        error.response?.data?.message ||
          "Failed to load donation requests."
      );

    } finally {

      setLoading(false);
    }
  };


  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================
  useEffect(() => {

    if (
      !user?.id ||
      user.role !== "donor"
    ) {
      return;
    }


    const loadData =
      async () => {

        setLoading(true);


        // First load previous responses
        await fetchMyResponses();


        // Then load matching requests
        await fetchRequests(true);


        setLoading(false);
      };


    loadData();


    // Refresh every 10 seconds
    const interval =
      setInterval(() => {

        fetchMyResponses();

        fetchRequests(false);

      }, 10000);


    return () =>
      clearInterval(interval);

  }, []);


  // =====================================================
  // FIND MY RESPONSE
  // =====================================================
  const getMyResponse = (
    requestId
  ) => {

    return responses.find(
      (response) => {

        const responseRequestId =
          typeof response.requestId ===
          "object"
            ? response.requestId?._id
            : response.requestId;


        return (
          responseRequestId ===
          requestId
        );
      }
    );
  };


  // =====================================================
  // ACCEPT / DECLINE
  // =====================================================
  const respondToRequest = async (
    requestId,
    status
  ) => {

    if (
      !user?.id ||
      user.role !== "donor"
    ) {
      setMessage(
        "Only registered donors can respond."
      );

      return;
    }


    const existingResponse =
      getMyResponse(requestId);


    if (existingResponse) {

      setMessage(
        `You have already ${existingResponse.status} this request.`
      );


      setRequests((prev) =>
        prev.filter(
          (request) =>
            request._id !==
            requestId
        )
      );


      return;
    }


    try {

      setMessage("");


      const response =
        await API.post(
          "/donation-responses/respond",
          {
            requestId,

            donorId:
              user.id,

            status,

            message:
              status === "accepted"
                ? "I can respond to this blood request."
                : "I am currently unable to respond.",
          }
        );


      // Save response
      if (
        response.data.response
      ) {

        setResponses((prev) => [
          ...prev,

          response.data.response
        ]);
      }


      // =================================================
      // DECLINED REQUEST
      // =================================================
      if (
        status === "declined"
      ) {

        if (
          !declinedRequestIds.current.includes(
            requestId
          )
        ) {

          declinedRequestIds.current =
            [
              ...declinedRequestIds.current,
              requestId
            ];
        }
      }


      // =================================================
      // REMOVE FROM SCREEN
      // =================================================
      setRequests((prev) =>
        prev.filter(
          (request) =>
            request._id !==
            requestId
        )
      );


      // =================================================
      // MESSAGE
      // =================================================
      if (
        status === "accepted"
      ) {

        setMessage(
          "✓ Blood request accepted successfully."
        );

      } else {

        setMessage(
          "✓ Blood request declined successfully."
        );
      }


      // Refresh responses
      await fetchMyResponses();


      // Refresh requests
      await fetchRequests(false);

    } catch (error) {

      console.error(
        "Response error:",
        error
      );


      if (
        error.response?.status ===
        409
      ) {

        setMessage(
          "You have already responded to this request."
        );


        await fetchMyResponses();

        await fetchRequests(false);

        return;
      }


      setMessage(
        error.response?.data?.message ||
          "Failed to submit response."
      );
    }
  };


  // =====================================================
  // NON-DONOR SCREEN
  // =====================================================
  if (
    !user?.id ||
    user.role !== "donor"
  ) {
    return null;
  }


  return (
    <div className="donation-page">

      {/* =================================================
          HEADER
      ================================================= */}
      <div className="donation-header">

        <button
          className="back-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Dashboard
        </button>


        <div>

          <h1>
            Donation Requests
          </h1>

          <p>
            Matching blood requests near you
          </p>

        </div>

      </div>


      {/* =================================================
          NEW REQUEST ALERT
      ================================================= */}
      {newRequestAlert && (

        <div
          style={{
            background: "#fff4d6",
            color: "#8a5a00",
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
            🔔 New matching blood request available!
          </strong>


          <button
            onClick={() =>
              setNewRequestAlert(false)
            }
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "18px",
              color: "#8a5a00",
              padding: "2px 6px",
            }}
          >
            ✕
          </button>

        </div>
      )}


      {/* =================================================
          MESSAGE
      ================================================= */}
      {message && (

        <div className="donation-message">
          {message}
        </div>

      )}


      {/* =================================================
          LOADING
      ================================================= */}
      {loading && (

        <div className="empty-state">

          <div className="empty-icon">
            ⏳
          </div>

          <h2>
            Loading Requests...
          </h2>

          <p>
            Searching for matching blood requests
            near you.
          </p>

        </div>

      )}


      {/* =================================================
          REQUEST CARDS
      ================================================= */}
      {!loading &&
        requests.length > 0 && (

          <div className="request-grid">

            {requests.map(
              (request) => {

                const myResponse =
                  getMyResponse(
                    request._id
                  );


                return (

                  <div
                    className="request-card"
                    key={request._id}
                  >

                    {/* TOP */}
                    <div className="request-top">

                      <div className="blood-badge">
                        {request.bloodGroup}
                      </div>


                      <span
                        className={`urgency ${
                          request.urgency
                            ?.toLowerCase()
                            .replace(
                              " ",
                              "-"
                            )
                        }`}
                      >
                        {request.urgency}
                      </span>

                    </div>


                    {/* HOSPITAL */}
                    <h2>
                      {request.hospitalName}
                    </h2>


                    <p className="hospital-address">
                      📍{" "}
                      {request.hospitalAddress}
                    </p>


                    {/* DETAILS */}
                    <div className="request-details">

                      <div>

                        <span>
                          Required Units
                        </span>

                        <strong>
                          {request.units}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Blood Group
                        </span>

                        <strong className="status">
                          {request.bloodGroup}
                        </strong>

                      </div>

                    </div>


                    {/* REASON */}
                    <div className="reason-box">

                      <span>
                        Reason
                      </span>

                      <p>
                        {request.reason}
                      </p>

                    </div>


                    {/* REQUESTER */}
                    {request.requesterId && (

                      <div className="requester">

                        <div className="requester-avatar">

                          {request.requesterId.name
                            ?.charAt(0)
                            .toUpperCase()}

                        </div>


                        <div>

                          <strong>
                            {request.requesterId.name}
                          </strong>

                          <small>
                            Blood Requester
                          </small>

                        </div>

                      </div>

                    )}


                    {/* RESPONSE */}
                    {myResponse ? (

                      <div
                        style={{
                          marginTop: "18px",
                          padding: "14px",
                          borderRadius: "10px",

                          background:
                            myResponse.status ===
                            "accepted"
                              ? "#ecfdf5"
                              : "#fef2f2",

                          color:
                            myResponse.status ===
                            "accepted"
                              ? "#166534"
                              : "#991b1b",

                          fontWeight: "600",
                          textAlign: "center",
                        }}
                      >

                        {myResponse.status ===
                        "accepted"
                          ? "✓ You Accepted This Request"
                          : "✕ You Declined This Request"}

                      </div>

                    ) : (

                      <div className="response-actions">

                        <button
                          className="accept-btn"
                          onClick={() =>
                            respondToRequest(
                              request._id,
                              "accepted"
                            )
                          }
                        >
                          ✓ Accept
                        </button>


                        <button
                          className="decline-btn"
                          onClick={() =>
                            respondToRequest(
                              request._id,
                              "declined"
                            )
                          }
                        >
                          ✕ Decline
                        </button>

                      </div>

                    )}

                  </div>

                );
              }
            )}

          </div>

        )}


      {/* =================================================
          EMPTY STATE
      ================================================= */}
      {!loading &&
        requests.length === 0 && (

          <div className="empty-state">

            <div className="empty-icon">
              🩸
            </div>

            <h2>
              No Matching Blood Requests
            </h2>

            <p>
              No pending requests matching
              your blood group were found
              nearby.
            </p>

          </div>

        )}

    </div>
  );
}

export default DonationRequests;