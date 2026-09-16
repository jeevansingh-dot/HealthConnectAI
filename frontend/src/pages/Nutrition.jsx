import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import "../nutrition.css";

const nutritionDatabase = {
  roti: { calories: 297, protein: 11, carbs: 56, fat: 7 },
  chapati: { calories: 297, protein: 11, carbs: 56, fat: 7 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  dal: { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  lentils: { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  paneer: { calories: 265, protein: 18, carbs: 6, fat: 20 },
  chicken: { calories: 239, protein: 27, carbs: 0, fat: 14 },
  egg: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  cucumber: { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  milk: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  curd: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  yogurt: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  salad: { calories: 20, protein: 1, carbs: 4, fat: 0.2 },
  vegetables: { calories: 65, protein: 2.5, carbs: 12, fat: 1 },
  vegetable: { calories: 65, protein: 2.5, carbs: 12, fat: 1 },
  paratha: { calories: 320, protein: 8, carbs: 45, fat: 13 },
  naan: { calories: 310, protein: 9, carbs: 52, fat: 8 },
  idli: { calories: 130, protein: 4, carbs: 28, fat: 0.5 },
  poha: { calories: 180, protein: 3, carbs: 30, fat: 6 },
  upma: { calories: 190, protein: 5, carbs: 30, fat: 6 },
};

const getStoredUser = () => {
  const possibleKeys = ["user", "currentUser", "loggedInUser"];

  for (const key of possibleKeys) {
    try {
      const stored = localStorage.getItem(key);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (parsed) {
          return parsed;
        }
      }
    } catch (error) {
      console.log(`Unable to read ${key}`);
    }
  }

  return null;
};

const getUserId = () => {
  const user = getStoredUser();

  if (user?._id) return user._id;
  if (user?.id) return user.id;
  if (user?.userId) return user.userId;
  if (user?.user_id) return user.user_id;

  return (
    localStorage.getItem("userId") ||
    localStorage.getItem("user_id") ||
    null
  );
};

const getNutritionData = (foodName) => {
  const name = String(foodName || "").toLowerCase().trim();

  const exactMatch = nutritionDatabase[name];

  if (exactMatch) {
    return exactMatch;
  }

  const key = Object.keys(nutritionDatabase).find(
    (item) => name.includes(item) || item.includes(name)
  );

  return key
    ? nutritionDatabase[key]
    : {
        calories: 120,
        protein: 4,
        carbs: 18,
        fat: 4,
      };
};

const isCountableFood = (food) => {
  const name = String(
    food?.name || food?.foodName || food?.label || ""
  ).toLowerCase();

  const countableWords = [
    "roti",
    "chapati",
    "paratha",
    "naan",
    "puri",
    "idli",
    "egg",
  ];

  if (food?.type === "countable") {
    return true;
  }

  return countableWords.some((word) => name.includes(word));
};

const createDefaultPortion = (food) => {
  const countable = isCountableFood(food);

  return {
    quantity: 1,
    unit: countable ? "piece" : "katori",
    grams: countable ? 30 : 150,
  };
};

const formatNumber = (value) => {
  const number = Number(value || 0);

  if (Number.isInteger(number)) {
    return number;
  }

  return number.toFixed(1);
};

const getMealIcon = (type) => {
  switch (type) {
    case "Breakfast":
      return "🌅";
    case "Lunch":
      return "🍛";
    case "Dinner":
      return "🌙";
    case "Snack":
      return "🍎";
    default:
      return "🍽️";
  }
};

function Nutrition() {
  const navigate = useNavigate();

  /* =====================================================
     FILE INPUT REFS
     ===================================================== */

  const galleryInputRef = useRef(null);

  /* =====================================================
     CAMERA REFS
     ===================================================== */

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  /* =====================================================
     IMAGE STATES
     ===================================================== */

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  /* =====================================================
     CAMERA STATES
     ===================================================== */

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  /* =====================================================
     NUTRITION STATES
     ===================================================== */

  const [detectedFoods, setDetectedFoods] = useState([]);
  const [selectedPortions, setSelectedPortions] = useState([]);

  const [nutritionResult, setNutritionResult] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [savingMeal, setSavingMeal] = useState(false);

  const [message, setMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("Breakfast");

  /* =====================================================
     HISTORY
     ===================================================== */

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingMealId, setDeletingMealId] = useState(null);

  /* =====================================================
     LOAD HISTORY
     ===================================================== */

  useEffect(() => {
    loadNutritionHistory();
  }, []);

  /* =====================================================
     CLEANUP PREVIEW
     ===================================================== */

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =====================================================
     STOP CAMERA WHEN COMPONENT UNMOUNTS
     ===================================================== */

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  /* =====================================================
     LOAD NUTRITION HISTORY
     ===================================================== */

  const loadNutritionHistory = async () => {
    const userId = getUserId();

    if (!userId) {
      setLoadingHistory(false);
      return;
    }

    try {
      setLoadingHistory(true);

      const response = await API.get(`/nutrition/user/${userId}`);

      const data = response.data;

      if (Array.isArray(data)) {
        setHistory(data);
      } else if (Array.isArray(data?.meals)) {
        setHistory(data.meals);
      } else if (Array.isArray(data?.history)) {
        setHistory(data.history);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.log(
        "Nutrition history error:",
        error?.response?.data || error.message
      );

      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  /* =====================================================
     HANDLE GALLERY IMAGE
     ===================================================== */

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    prepareImage(file);

    event.target.value = "";
  };

  /* =====================================================
     PREPARE IMAGE
     ===================================================== */

  const prepareImage = (file) => {
    setMessage("");
    setSaveMessage("");
    setNutritionResult(null);
    setDetectedFoods([]);
    setSelectedPortions([]);

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size should be less than 5 MB.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);

    const newPreview = URL.createObjectURL(file);
    setPreview(newPreview);
  };

  /* =====================================================
     OPEN GALLERY
     ===================================================== */

  const openGallery = () => {
    galleryInputRef.current?.click();
  };

  /* =====================================================
     OPEN CAMERA
     ===================================================== */

  const openCamera = async () => {
    setCameraError("");
    setMessage("");
    setCameraLoading(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera access is not supported by this browser."
        );
        setCameraLoading(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.log("Camera error:", error);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError(
          "No camera was found on this device."
        );
      } else if (error.name === "NotReadableError") {
        setCameraError(
          "Camera is already being used by another application."
        );
      } else {
        setCameraError(
          "Unable to open camera. Please check your camera permission."
        );
      }
    } finally {
      setCameraLoading(false);
    }
  };

  /* =====================================================
     STOP CAMERA
     ===================================================== */

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraLoading(false);
  };

  /* =====================================================
     CAPTURE PHOTO
     ===================================================== */

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setCameraError("Camera is not ready yet.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError(
        "Camera is still loading. Please try again."
      );
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      width,
      height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError(
            "Unable to capture photo. Please try again."
          );
          return;
        }

        const file = new File(
          [blob],
          `meal-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        stopCamera();

        prepareImage(file);
      },
      "image/jpeg",
      0.9
    );
  };

  /* =====================================================
     ANALYZE PHOTO
     ===================================================== */

  const analyzePhoto = async () => {
    if (!image) {
      setMessage(
        "Please select or capture a food image first."
      );
      return;
    }

    try {
      setAnalyzing(true);
      setMessage("");
      setNutritionResult(null);

      const formData = new FormData();

      formData.append("mealImage", image);

      const response = await API.post(
        "/nutrition/analyze-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const foods =
        response.data?.detectedFoods || [];

      if (!foods.length) {
        setMessage(
          "No food items were clearly detected. Please try another photo."
        );

        setDetectedFoods([]);
        setSelectedPortions([]);

        return;
      }

      setDetectedFoods(foods);

      const portions = foods.map((food) => {
        const backendPortion =
          food?.portions?.[0];

        if (backendPortion) {
          return {
            quantity: 1,
            unit:
              backendPortion.unit ||
              "katori",
            grams:
              Number(
                backendPortion.grams
              ) || 150,
          };
        }

        return createDefaultPortion(food);
      });

      setSelectedPortions(portions);

      setMessage(
        `${foods.length} food item${
          foods.length > 1 ? "s" : ""
        } detected successfully.`
      );
    } catch (error) {
      console.log(
        "Analyze photo error:",
        error?.response?.data ||
          error.message
      );

      const errorMessage =
        error?.response?.data?.message ||
        "Unable to analyze the image. Please try again.";

      setMessage(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  /* =====================================================
     UPDATE QUANTITY
     ===================================================== */

  const updateQuantity = (
    index,
    change
  ) => {
    setSelectedPortions((previous) => {
      const updated = [...previous];

      if (!updated[index]) {
        return previous;
      }

      const food =
        detectedFoods[index];

      const countable =
        isCountableFood(food);

      const currentQuantity =
        Number(
          updated[index].quantity || 1
        );

      const newQuantity = Math.min(
        10,
        Math.max(
          1,
          currentQuantity + change
        )
      );

      updated[index] = {
        ...updated[index],

        quantity: newQuantity,

        unit: countable
          ? "piece"
          : "katori",

        grams: countable
          ? newQuantity * 30
          : newQuantity * 150,
      };

      return updated;
    });
  };

  /* =====================================================
     CALCULATE NUTRITION
     ===================================================== */

  const calculateNutrition = () => {
    if (
      !detectedFoods.length ||
      !selectedPortions.length
    ) {
      setMessage(
        "Please analyze a food image first."
      );
      return;
    }

    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    detectedFoods.forEach(
      (food, index) => {
        const portion =
          selectedPortions[index];

        if (!portion) return;

        const foodName =
          food?.name ||
          food?.foodName ||
          food?.label ||
          "Food";

        const nutrition =
          getNutritionData(foodName);

        const grams =
          Number(
            portion.grams || 0
          );

        const multiplier =
          grams / 100;

        calories +=
          nutrition.calories *
          multiplier;

        protein +=
          nutrition.protein *
          multiplier;

        carbs +=
          nutrition.carbs *
          multiplier;

        fat +=
          nutrition.fat *
          multiplier;
      }
    );

    setNutritionResult({
      calories: Math.round(
        calories
      ),
      protein: Number(
        protein.toFixed(1)
      ),
      carbs: Number(
        carbs.toFixed(1)
      ),
      fat: Number(
        fat.toFixed(1)
      ),
    });

    setSaveMessage("");
  };

  /* =====================================================
     SAVE MEAL
     ===================================================== */

  const saveMeal = async () => {
    const userId = getUserId();

    if (!userId) {
      setSaveMessage(
        "Please login before saving your meal."
      );
      return;
    }

    if (!nutritionResult) {
      setSaveMessage(
        "Calculate nutrition before saving the meal."
      );
      return;
    }

    const finalName =
      mealName.trim() ||
      detectedFoods
        .map(
          (food) =>
            food?.name ||
            food?.foodName ||
            food?.label
        )
        .join(", ") ||
      "My Meal";

    try {
      setSavingMeal(true);
      setSaveMessage("");

      await API.post(
        "/nutrition/create",
        {
          userId,
          name: finalName,
          type: mealType,
          calories:
            nutritionResult.calories,
          protein:
            nutritionResult.protein,
          carbs:
            nutritionResult.carbs,
          fat:
            nutritionResult.fat,
        }
      );

      setSaveMessage(
        "Meal saved successfully! 🎉"
      );

      setMealName("");

      await loadNutritionHistory();
    } catch (error) {
      console.log(
        "Save meal error:",
        error?.response?.data ||
          error.message
      );

      setSaveMessage(
        error?.response?.data?.message ||
          "Unable to save meal. Please try again."
      );
    } finally {
      setSavingMeal(false);
    }
  };

  /* =====================================================
     DELETE MEAL
     ===================================================== */

  const deleteMeal = async (
    mealId
  ) => {
    if (!mealId) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this meal?"
      );

    if (!confirmed) return;

    try {
      setDeletingMealId(mealId);

      await API.delete(
        `/nutrition/${mealId}`
      );

      setHistory((previous) =>
        previous.filter(
          (meal) =>
            (meal._id || meal.id) !==
            mealId
        )
      );
    } catch (error) {
      console.log(
        "Delete meal error:",
        error?.response?.data ||
          error.message
      );
    } finally {
      setDeletingMealId(null);
    }
  };

  /* =====================================================
     RESET NUTRITION
     ===================================================== */

  const resetNutrition = () => {
    stopCamera();

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");

    setDetectedFoods([]);
    setSelectedPortions([]);

    setNutritionResult(null);

    setMessage("");
    setSaveMessage("");

    setMealName("");
    setMealType("Breakfast");

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  /* =====================================================
     FORMAT DATE
     ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "Recently";
    }

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="nutrition-page">

      {/* =================================================
          GALLERY INPUT
          ================================================= */}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{
          display: "none",
        }}
      />

      {/* =================================================
          CAMERA MODAL
          ================================================= */}

      {cameraOpen && (
        <div className="camera-modal-overlay">

          <div className="camera-modal">

            <div className="camera-modal-header">

              <div>
                <span className="camera-live-badge">
                  <span className="camera-live-dot"></span>
                  CAMERA
                </span>

                <h2>
                  Take Meal Photo
                </h2>
              </div>

              <button
                type="button"
                className="camera-close-btn"
                onClick={stopCamera}
              >
                ✕
              </button>

            </div>

            <div className="camera-view">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />

              <div className="camera-frame">
                <span className="corner top-left"></span>
                <span className="corner top-right"></span>
                <span className="corner bottom-left"></span>
                <span className="corner bottom-right"></span>
              </div>

              <div className="camera-tip">
                Keep your food clearly visible
              </div>

            </div>

            {cameraError && (
              <div className="camera-error">
                ⚠️ {cameraError}
              </div>
            )}

            <div className="camera-controls">

              <button
                type="button"
                className="camera-cancel-btn"
                onClick={stopCamera}
              >
                Cancel
              </button>

              <button
                type="button"
                className="capture-btn"
                onClick={capturePhoto}
                disabled={cameraLoading}
              >
                <span className="capture-outer">
                  <span className="capture-inner"></span>
                </span>
                Capture
              </button>

              <div className="camera-control-space"></div>

            </div>

            <canvas
              ref={canvasRef}
              style={{
                display: "none",
              }}
            />

          </div>

        </div>
      )}

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="nutrition-header">

        <div className="nutrition-header-left">

          <button
            className="back-btn"
            onClick={() =>
              navigate("/dashboard")
            }
            type="button"
          >
            ←
          </button>

          <div>

            <div className="page-mini-title">
              HealthConnect AI
            </div>

            <h1>
              Smart Nutrition Tracker
            </h1>

            <p>
              Analyze your meal and keep a
              simple nutrition record.
            </p>

          </div>

        </div>

        <div className="ai-status">

          <span className="ai-status-dot"></span>

          AI Nutrition

        </div>

      </header>

      <main className="nutrition-container">

        {/* =================================================
            HERO
            ================================================= */}

        <section className="nutrition-hero">

          <div className="hero-content">

            <span className="hero-badge">
              ✨ AI Powered
            </span>

            <h2>
              Understand what's on your plate
            </h2>

            <p>
              Upload a meal photo, let AI identify
              visible food items, choose approximate
              portions, and view an estimated
              nutrition summary.
            </p>

            <div className="hero-points">

              <span>
                📸 Photo Analysis
              </span>

              <span>
                🍽️ Portion Selection
              </span>

              <span>
                📊 Nutrition Estimate
              </span>

            </div>

          </div>

          <div className="hero-icon">
            🥗
          </div>

        </section>

        {/* =================================================
            UPLOAD CARD
            ================================================= */}

        <section className="nutrition-card upload-card">

          <div className="section-heading">

            <div className="section-icon upload-icon">
              📷
            </div>

            <div>
              <h2>
                Analyze Your Meal
              </h2>

              <p>
                Capture a fresh photo or choose
                one from your gallery.
              </p>
            </div>

          </div>

          {!preview ? (

            <div className="upload-area">

              <div className="upload-big-icon">
                📸
              </div>

              <h3>
                Take a photo of your meal
              </h3>

              <p>
                For better results, keep the food
                clearly visible and use good lighting.
              </p>

              <div className="upload-buttons">

                <button
                  type="button"
                  className="camera-btn"
                  onClick={openCamera}
                  disabled={cameraLoading}
                >
                  <span>📷</span>

                  {cameraLoading
                    ? "Opening Camera..."
                    : "Open Camera"}
                </button>

                <button
                  type="button"
                  className="gallery-btn"
                  onClick={openGallery}
                >
                  <span>🖼️</span>
                  Choose Gallery
                </button>

              </div>

              <small>
                JPG, PNG or WEBP • Maximum 5 MB
              </small>

            </div>

          ) : (

            <div className="preview-section">

              <div className="preview-wrapper">

                <img
                  src={preview}
                  alt="Selected meal"
                  className="meal-preview"
                />

                <div className="preview-badge">
                  ✓ Image Ready
                </div>

              </div>

              <div className="preview-actions">

                <button
                  type="button"
                  className="change-image-btn"
                  onClick={openGallery}
                >
                  🖼️ Change Image
                </button>

                <button
                  type="button"
                  className="analyze-btn"
                  onClick={analyzePhoto}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <span className="button-spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      ✨ Analyze Meal
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="reset-btn"
                  onClick={resetNutrition}
                >
                  ↻ Reset
                </button>

              </div>

            </div>

          )}

          {message && (
            <div
              className={`nutrition-message ${
                message
                  .toLowerCase()
                  .includes("success")
                  ? "success"
                  : "info"
              }`}
            >
              <span>ℹ️</span>
              {message}
            </div>
          )}

        </section>

        {/* =================================================
            DETECTED FOODS
            ================================================= */}

        {detectedFoods.length > 0 && (

          <section className="nutrition-card detected-card">

            <div className="section-heading">

              <div className="section-icon food-icon">
                🍽️
              </div>

              <div>
                <h2>
                  Detected Food Items
                </h2>

                <p>
                  Adjust the approximate quantity
                  before calculating.
                </p>
              </div>

              <div className="detected-count">
                {detectedFoods.length}{" "}
                {detectedFoods.length === 1
                  ? "Item"
                  : "Items"}
              </div>

            </div>

            <div className="food-grid">

              {detectedFoods.map(
                (food, index) => {

                  const foodName =
                    food?.name ||
                    food?.foodName ||
                    food?.label ||
                    "Food Item";

                  const portion =
                    selectedPortions[index] ||
                    createDefaultPortion(
                      food
                    );

                  const countable =
                    isCountableFood(food);

                  return (
                    <div
                      className="food-item-card"
                      key={`${foodName}-${index}`}
                    >

                      <div className="food-item-top">

                        <div className="food-number">
                          {index + 1}
                        </div>

                        <div className="food-name-area">

                          <h3>
                            {foodName}
                          </h3>

                          <span className="food-type">
                            {countable
                              ? "Countable item"
                              : "Serving based"}
                          </span>

                        </div>

                        <span className="food-check">
                          ✓
                        </span>

                      </div>

                      <div className="quantity-row">

                        <span className="quantity-label">
                          Approx. portion
                        </span>

                        <div className="quantity-selector">

                          <button
                            type="button"
                            className="quantity-btn"
                            onClick={() =>
                              updateQuantity(
                                index,
                                -1
                              )
                            }
                            disabled={
                              Number(
                                portion.quantity ||
                                  1
                              ) <= 1
                            }
                          >
                            −
                          </button>

                          <div className="quantity-value">

                            <strong>
                              {portion.quantity}
                            </strong>

                            <small>
                              {countable
                                ? "piece"
                                : "katori"}
                            </small>

                          </div>

                          <button
                            type="button"
                            className="quantity-btn"
                            onClick={() =>
                              updateQuantity(
                                index,
                                1
                              )
                            }
                            disabled={
                              Number(
                                portion.quantity ||
                                  1
                              ) >= 10
                            }
                          >
                            +
                          </button>

                        </div>

                      </div>

                      <div className="grams-info">
                        ≈ {portion.grams} g
                      </div>

                    </div>
                  );
                }
              )}

            </div>

            <div className="calculate-area">

              <button
                type="button"
                className="calculate-btn"
                onClick={
                  calculateNutrition
                }
              >
                <span>📊</span>
                Calculate Nutrition
              </button>

            </div>

          </section>

        )}

        {/* =================================================
            NUTRITION RESULT
            ================================================= */}

        {nutritionResult && (

          <section className="nutrition-card result-card">

            <div className="result-heading">

              <div>

                <span className="result-badge">
                  ✨ AI Estimate
                </span>

                <h2>
                  Nutrition Summary
                </h2>

                <p>
                  Approximate values based on
                  the selected portions.
                </p>

              </div>

              <div className="total-calories">

                <span>
                  Calories
                </span>

                <strong>
                  {formatNumber(
                    nutritionResult.calories
                  )}
                </strong>

                <small>
                  kcal
                </small>

              </div>

            </div>

            <div className="macro-grid">

              <div className="macro-card protein-card">

                <div className="macro-icon">
                  💪
                </div>

                <div>

                  <span>
                    Protein
                  </span>

                  <strong>
                    {formatNumber(
                      nutritionResult.protein
                    )}{" "}
                    g
                  </strong>

                </div>

              </div>

              <div className="macro-card carbs-card">

                <div className="macro-icon">
                  🌾
                </div>

                <div>

                  <span>
                    Carbohydrates
                  </span>

                  <strong>
                    {formatNumber(
                      nutritionResult.carbs
                    )}{" "}
                    g
                  </strong>

                </div>

              </div>

              <div className="macro-card fat-card">

                <div className="macro-icon">
                  🥑
                </div>

                <div>

                  <span>
                    Fat
                  </span>

                  <strong>
                    {formatNumber(
                      nutritionResult.fat
                    )}{" "}
                    g
                  </strong>

                </div>

              </div>

            </div>

          </section>

        )}

        {/* =================================================
            SAVE MEAL
            ================================================= */}

        {nutritionResult && (

          <section className="nutrition-card save-meal-section">

            <div className="section-heading">

              <div className="section-icon save-icon">
                💾
              </div>

              <div>

                <h2>
                  Save This Meal
                </h2>

                <p>
                  Add it to your nutrition history
                  for future reference.
                </p>

              </div>

            </div>

            <div className="meal-save-form">

              <div className="form-group">

                <label htmlFor="mealName">
                  Meal Name
                </label>

                <input
                  id="mealName"
                  type="text"
                  value={mealName}
                  onChange={(event) =>
                    setMealName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Lunch, Paneer Rice"
                />

              </div>

              <div className="form-group">

                <label htmlFor="mealType">
                  Meal Type
                </label>

                <select
                  id="mealType"
                  value={mealType}
                  onChange={(event) =>
                    setMealType(
                      event.target.value
                    )
                  }
                >

                  <option value="Breakfast">
                    🌅 Breakfast
                  </option>

                  <option value="Lunch">
                    🍛 Lunch
                  </option>

                  <option value="Dinner">
                    🌙 Dinner
                  </option>

                  <option value="Snack">
                    🍎 Snack
                  </option>

                </select>

              </div>

              <button
                type="button"
                className="save-meal-btn"
                onClick={saveMeal}
                disabled={savingMeal}
              >

                {savingMeal ? (
                  <>
                    <span className="button-spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Meal
                  </>
                )}

              </button>

            </div>

            {saveMessage && (
              <div
                className={`save-meal-message ${
                  saveMessage
                    .toLowerCase()
                    .includes("success")
                    ? "success"
                    : "error"
                }`}
              >
                {saveMessage}
              </div>
            )}

          </section>

        )}

        {/* =================================================
            HISTORY
            ================================================= */}

        <section className="nutrition-card history-section">

          <div className="history-heading">

            <div className="section-heading no-margin">

              <div className="section-icon history-icon">
                📚
              </div>

              <div>

                <h2>
                  Nutrition History
                </h2>

                <p>
                  Your saved meals in one place.
                </p>

              </div>

            </div>

            <div className="history-actions">

              <span className="history-count">
                {history.length}{" "}
                {history.length === 1
                  ? "Meal"
                  : "Meals"}
              </span>

              <button
                type="button"
                className="refresh-history-btn"
                onClick={
                  loadNutritionHistory
                }
                disabled={
                  loadingHistory
                }
              >
                ↻ Refresh
              </button>

            </div>

          </div>

          {loadingHistory ? (

            <div className="history-loader">

              <span className="large-spinner"></span>

              <p>
                Loading your nutrition history...
              </p>

            </div>

          ) : history.length === 0 ? (

            <div className="history-empty">

              <div className="history-empty-icon">
                🍽️
              </div>

              <h3>
                No saved meals yet
              </h3>

              <p>
                Analyze a meal and save it to
                start building your nutrition history.
              </p>

            </div>

          ) : (

            <div className="history-list">

              {history.map((meal) => {

                const mealId =
                  meal?._id || meal?.id;

                return (
                  <div
                    className="history-item"
                    key={mealId}
                  >

                    <div className="history-main">

                      <div className="history-meal-icon">
                        {getMealIcon(
                          meal?.type
                        )}
                      </div>

                      <div className="history-info">

                        <div className="history-title-row">

                          <h3>
                            {meal?.name ||
                              "Saved Meal"}
                          </h3>

                          <span className="meal-type-badge">
                            {meal?.type ||
                              "Meal"}
                          </span>

                        </div>

                        <span className="history-date">
                          📅{" "}
                          {formatDate(
                            meal?.createdAt ||
                              meal?.date
                          )}
                        </span>

                        <div className="history-macros">

                          <span className="history-calories">
                            🔥{" "}
                            {formatNumber(
                              meal?.calories
                            )}{" "}
                            kcal
                          </span>

                          <span>
                            💪{" "}
                            {formatNumber(
                              meal?.protein
                            )}
                            g protein
                          </span>

                          <span>
                            🌾{" "}
                            {formatNumber(
                              meal?.carbs
                            )}
                            g carbs
                          </span>

                          <span>
                            🥑{" "}
                            {formatNumber(
                              meal?.fat
                            )}
                            g fat
                          </span>

                        </div>

                      </div>

                    </div>

                    <button
                      type="button"
                      className="delete-meal-btn"
                      onClick={() =>
                        deleteMeal(
                          mealId
                        )
                      }
                      disabled={
                        deletingMealId ===
                        mealId
                      }
                      title="Delete meal"
                    >
                      {deletingMealId ===
                      mealId
                        ? "..."
                        : "🗑️"}
                    </button>

                  </div>
                );
              })}

            </div>

          )}

        </section>

        {/* =================================================
            HOW IT WORKS
            ================================================= */}

        <section className="how-it-works">

          <div className="how-heading">

            <span>💡</span>

            <div>

              <h2>
                How it works
              </h2>

              <p>
                Three simple steps
              </p>

            </div>

          </div>

          <div className="steps-grid">

            <div className="step-card">

              <div className="step-number">
                01
              </div>

              <div className="step-icon">
                📸
              </div>

              <h3>
                Capture
              </h3>

              <p>
                Take a clear photo of your meal
                or select one from your gallery.
              </p>

            </div>

            <div className="step-card">

              <div className="step-number">
                02
              </div>

              <div className="step-icon">
                🤖
              </div>

              <h3>
                Analyze
              </h3>

              <p>
                AI identifies clearly visible
                food items in the uploaded image.
              </p>

            </div>

            <div className="step-card">

              <div className="step-number">
                03
              </div>

              <div className="step-icon">
                📊
              </div>

              <h3>
                Track
              </h3>

              <p>
                Select approximate portions and
                save the nutrition estimate.
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            DISCLAIMER
            ================================================= */}

        <div className="nutrition-disclaimer">

          <span>ℹ️</span>

          Nutrition values are approximate estimates
          and may vary depending on ingredients,
          preparation method, and portion size.

        </div>

      </main>
    </div>
  );
}

export default Nutrition;