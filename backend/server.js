const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// ================= ROUTES =================

const userRoutes = require("./routes/userRoutes");
const bloodRequestRoutes = require("./routes/bloodRequestRoutes");
const donationResponseRoutes = require("./routes/donationResponseRoutes");

const nutritionRoutes = require("./routes/nutritionRoutes");
// ================= APP =================

const app = express();


// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());


// ================= API ROUTES =================

// User APIs
app.use("/api/users", userRoutes);

// Blood Request APIs
app.use("/api/blood-requests", bloodRequestRoutes);

// Donation Response APIs
app.use("/api/donation-responses", donationResponseRoutes);

app.use("/api/nutrition", nutritionRoutes);
// ================= ROOT ROUTE =================

app.get("/", (req, res) => {
    res.send("HealthConnect AI Backend Running");
});


// ================= MONGODB CONNECTION =================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((error) => {
        console.log(
            "MongoDB Connection Error:",
            error.message
        );
    });


// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});