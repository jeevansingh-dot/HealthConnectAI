const express = require("express");
const mongoose = require("mongoose");

const DonationResponse = require("../models/DonationResponse");
const BloodRequest = require("../models/BloodRequest");
const User = require("../models/User");

const router = express.Router();


// =====================================================
// DONOR RESPOND TO BLOOD REQUEST
// =====================================================
router.post("/respond", async (req, res) => {
    try {
        const {
            requestId,
            donorId,
            status,
            message
        } = req.body;

        if (!requestId || !donorId || !status) {
            return res.status(400).json({
                message: "requestId, donorId and status are required"
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(requestId) ||
            !mongoose.Types.ObjectId.isValid(donorId)
        ) {
            return res.status(400).json({
                message: "Invalid requestId or donorId"
            });
        }

        if (!["accepted", "declined"].includes(status)) {
            return res.status(400).json({
                message: "Status must be accepted or declined"
            });
        }

        // Find blood request
        const bloodRequest =
            await BloodRequest.findById(requestId);

        if (!bloodRequest) {
            return res.status(404).json({
                message: "Blood request not found"
            });
        }

        // Find donor
        const donor =
            await User.findById(donorId);

        if (!donor) {
            return res.status(404).json({
                message: "Donor not found"
            });
        }

        if (donor.role !== "donor") {
            return res.status(400).json({
                message: "Only registered donors can respond"
            });
        }

        // Check previous response
        const existingResponse =
            await DonationResponse.findOne({
                requestId,
                donorId
            });

        if (existingResponse) {
            return res.status(409).json({
                message: "You have already responded to this request",
                response: existingResponse
            });
        }

        // Create response
        const response =
            new DonationResponse({
                requestId,
                donorId,
                status,
                message: message || ""
            });

        await response.save();

        // If donor accepts request
        if (status === "accepted") {
            bloodRequest.status = "matched";
            await bloodRequest.save();
        }

        res.status(201).json({
            message:
                status === "accepted"
                    ? "Blood request accepted successfully"
                    : "Blood request declined successfully",

            response
        });

    } catch (error) {
        console.error(
            "DONATION RESPONSE ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to respond to blood request",
            error: error.message
        });
    }
});


// =====================================================
// GET RESPONSES FOR A BLOOD REQUEST
// =====================================================
router.get("/request/:requestId", async (req, res) => {
    try {
        const { requestId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(requestId)
        ) {
            return res.status(400).json({
                message: "Invalid request ID"
            });
        }

        const responses =
            await DonationResponse
                .find({ requestId })
                .populate(
                    "donorId",
                    "name email phone bloodGroup"
                )
                .sort({ createdAt: -1 });

        res.json({
            message:
                "Donation responses fetched successfully",
            count: responses.length,
            responses
        });

    } catch (error) {
        res.status(500).json({
            message:
                "Failed to fetch donation responses",
            error: error.message
        });
    }
});


// =====================================================
// GET RESPONSES MADE BY A DONOR
// =====================================================
router.get("/donor/:donorId", async (req, res) => {
    try {
        const { donorId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(donorId)
        ) {
            return res.status(400).json({
                message: "Invalid donor ID"
            });
        }

        const responses =
            await DonationResponse
                .find({ donorId })
                .sort({ createdAt: -1 });

        res.json({
            message:
                "Donor responses fetched successfully",
            count: responses.length,
            responses
        });

    } catch (error) {
        console.error(
            "GET DONOR RESPONSES ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to fetch donor responses",
            error: error.message
        });
    }
});


// =====================================================
// GET RESPONSES FOR REQUESTER
// =====================================================
router.get(
    "/requester/:requesterId",
    async (req, res) => {
        try {
            const { requesterId } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(
                    requesterId
                )
            ) {
                return res.status(400).json({
                    message: "Invalid requester ID"
                });
            }

            // Find requests created by requester
            const requests =
                await BloodRequest.find({
                    requesterId
                }).select("_id");

            const requestIds =
                requests.map(
                    (request) => request._id
                );

            // Find responses for those requests
            const responses =
                await DonationResponse
                    .find({
                        requestId: {
                            $in: requestIds
                        }
                    })
                    .populate(
                        "donorId",
                        "name email phone bloodGroup"
                    )
                    .populate(
                        "requestId",
                        "bloodGroup hospitalName status"
                    )
                    .sort({ createdAt: -1 });

            res.json({
                message:
                    "Requester responses fetched successfully",
                count: responses.length,
                responses
            });

        } catch (error) {
            console.error(
                "GET REQUESTER RESPONSES ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch requester responses",
                error: error.message
            });
        }
    }
);


module.exports = router;