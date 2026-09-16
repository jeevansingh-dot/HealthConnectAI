const express = require("express");
const User = require("../models/User");

const router = express.Router();

// ================= REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            bloodGroup,
            role
        } = req.body;

        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const user = new User({
            name,
            email,
            password,
            phone,
            bloodGroup: bloodGroup || null,
            role: role || "user"
        });

        await user.save();

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});


// ================= BECOME DONOR =================
router.put("/become-donor/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            bloodGroup,
            phone,
            isAvailable,
            latitude,
            longitude,
            lastDonationDate
        } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.bloodGroup = bloodGroup;
        user.phone = phone;
        user.role = "donor";
        user.isAvailable = isAvailable;

        if (latitude !== undefined && longitude !== undefined) {
            user.location = {
                type: "Point",
                coordinates: [
                    longitude,
                    latitude
                ]
            };
        }

        if (lastDonationDate) {
            user.lastDonationDate = lastDonationDate;
        }

        await user.save();

        res.json({
            message: "User registered as donor successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                role: user.role,
                isAvailable: user.isAvailable,
                location: user.location
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to become donor",
            error: error.message
        });
    }
});

// ================= FIND NEARBY DONORS =================
router.get("/nearby-donors", async (req, res) => {
    try {
        const {
            bloodGroup,
            longitude,
            latitude,
            maxDistance = 10000
        } = req.query;

        if (!bloodGroup || !longitude || !latitude) {
            return res.status(400).json({
                message: "bloodGroup, longitude and latitude are required"
            });
        }

        const donors = await User.find({
            role: "donor",
            bloodGroup: bloodGroup,
            isAvailable: true,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [
                            Number(longitude),
                            Number(latitude)
                        ]
                    },
                    $maxDistance: Number(maxDistance)
                }
            }
        }).select("-password");

        res.json({
            message: "Nearby donors found",
            count: donors.length,
            donors
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to find nearby donors",
            error: error.message
        });
    }
});

module.exports = router;