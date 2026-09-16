const express = require("express");
const mongoose = require("mongoose");

const BloodRequest = require("../models/BloodRequest");
const User = require("../models/User");
const DonationResponse = require("../models/DonationResponse");

const router = express.Router();


// =====================================================
// CREATE BLOOD REQUEST
// =====================================================
router.post("/create", async (req, res) => {
    try {
        const {
            requesterId,
            bloodGroup,
            units,
            hospitalName,
            hospitalAddress,
            urgency,
            reason,
            latitude,
            longitude
        } = req.body;

        if (
            !requesterId ||
            !bloodGroup ||
            !units ||
            !hospitalName ||
            !hospitalAddress ||
            !reason ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                message: "All required fields must be provided"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(requesterId)) {
            return res.status(400).json({
                message: "Invalid requesterId"
            });
        }

        const bloodRequest = new BloodRequest({
            requesterId,
            bloodGroup,
            units: Number(units),
            hospitalName,
            hospitalAddress,
            urgency: urgency || "Medium",
            reason,

            location: {
                type: "Point",
                coordinates: [
                    Number(longitude),
                    Number(latitude)
                ]
            }
        });

        await bloodRequest.save();

        res.status(201).json({
            message: "Blood request created successfully",
            request: bloodRequest
        });

    } catch (error) {
        console.error(
            "CREATE BLOOD REQUEST ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to create blood request",
            error: error.message
        });
    }
});


// =====================================================
// GET ALL BLOOD REQUESTS
// =====================================================
router.get("/", async (req, res) => {
    try {
        const requests = await BloodRequest
            .find()
            .populate(
                "requesterId",
                "name email phone"
            )
            .sort({
                createdAt: -1
            });

        res.json({
            message:
                "Blood requests fetched successfully",
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error(
            "GET BLOOD REQUESTS ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to fetch blood requests",
            error: error.message
        });
    }
});


// =====================================================
// GET MATCHING BLOOD REQUESTS FOR DONOR
// =====================================================
router.get(
    "/for-donor/:donorId",
    async (req, res) => {

        try {
            const { donorId } = req.params;

            // -------------------------------------------------
            // CHECK DONOR ID
            // -------------------------------------------------
            if (
                !mongoose.Types.ObjectId.isValid(
                    donorId
                )
            ) {
                return res.status(400).json({
                    message: "Invalid donor ID"
                });
            }


            // -------------------------------------------------
            // FIND DONOR
            // -------------------------------------------------
            const donor = await User
                .findById(donorId)
                .select("-password");

            if (!donor) {
                return res.status(404).json({
                    message: "Donor not found"
                });
            }


            // -------------------------------------------------
            // ONLY DONOR CAN SEE DONATION REQUESTS
            // -------------------------------------------------
            if (donor.role !== "donor") {
                return res.status(403).json({
                    message:
                        "Only registered donors can view donation requests"
                });
            }


            // -------------------------------------------------
            // BLOOD GROUP REQUIRED
            // -------------------------------------------------
            if (!donor.bloodGroup) {
                return res.status(400).json({
                    message:
                        "Donor blood group is not registered"
                });
            }


            // -------------------------------------------------
            // DONOR MUST BE AVAILABLE
            // -------------------------------------------------
            if (!donor.isAvailable) {
                return res.json({
                    message:
                        "Donor is currently unavailable",
                    count: 0,
                    requests: []
                });
            }


            // -------------------------------------------------
            // DONOR LOCATION REQUIRED
            // -------------------------------------------------
            if (
                !donor.location ||
                !donor.location.coordinates ||
                donor.location.coordinates.length !== 2
            ) {
                return res.status(400).json({
                    message:
                        "Donor location is not available"
                });
            }


            const donorCoordinates =
                donor.location.coordinates;


            console.log(
                "================================="
            );

            console.log(
                "DONOR MATCHING"
            );

            console.log(
                "Donor ID:",
                donor._id
            );

            console.log(
                "Donor Name:",
                donor.name
            );

            console.log(
                "Donor Blood Group:",
                donor.bloodGroup
            );

            console.log(
                "Donor Available:",
                donor.isAvailable
            );

            console.log(
                "Donor Coordinates:",
                donorCoordinates
            );

            console.log(
                "================================="
            );


            // -------------------------------------------------
            // FIND REQUESTS ALREADY ANSWERED BY THIS DONOR
            // -------------------------------------------------
            const previousResponses =
                await DonationResponse.find({
                    donorId: donor._id
                }).select("requestId");

            const respondedRequestIds =
                previousResponses.map(
                    (response) =>
                        response.requestId
                );


            // -------------------------------------------------
            // FIND MATCHING REQUESTS
            // -------------------------------------------------
            const requests =
                await BloodRequest.find({

                    // SAME BLOOD GROUP
                    bloodGroup:
                        donor.bloodGroup,

                    // ONLY PENDING
                    status: "pending",

                    // REQUESTER CANNOT RECEIVE
                    // HIS OWN REQUEST
                    requesterId: {
                        $ne: donor._id
                    },

                    // DON'T SHOW REQUESTS
                    // THIS DONOR ALREADY ANSWERED
                    _id: {
                        $nin: respondedRequestIds
                    },

                    // WITHIN 10 KM
                    location: {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates:
                                    donorCoordinates
                            },

                            $maxDistance: 10000
                        }
                    }
                })
                    .populate(
                        "requesterId",
                        "name email phone"
                    )
                    .sort({
                        createdAt: -1
                    });


            console.log(
                "Matching Requests Found:",
                requests.length
            );


            res.json({
                message:
                    "Matching blood requests fetched successfully",

                count:
                    requests.length,

                requests
            });

        } catch (error) {

            console.error(
                "DONOR REQUEST ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch donor requests",

                error:
                    error.message
            });
        }
    }
);


// =====================================================
// MATCH NEARBY DONORS FOR A BLOOD REQUEST
// =====================================================
router.get(
    "/:requestId/match-donors",
    async (req, res) => {

        try {
            const { requestId } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    requestId
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid blood request ID"
                });
            }


            const bloodRequest =
                await BloodRequest.findById(
                    requestId
                );


            if (!bloodRequest) {
                return res.status(404).json({
                    message:
                        "Blood request not found"
                });
            }


            if (
                !bloodRequest.location ||
                !bloodRequest.location.coordinates ||
                bloodRequest.location.coordinates.length !== 2
            ) {
                return res.status(400).json({
                    message:
                        "Blood request location is not available"
                });
            }


            const [
                longitude,
                latitude
            ] =
                bloodRequest.location.coordinates;


            const donors =
                await User.find({

                    role: "donor",

                    isAvailable: true,

                    bloodGroup:
                        bloodRequest.bloodGroup,

                    location: {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: [
                                    Number(longitude),
                                    Number(latitude)
                                ]
                            },

                            $maxDistance: 10000
                        }
                    }

                }).select("-password");


            res.json({
                message:
                    "Matching donors found",

                requestId:
                    bloodRequest._id,

                bloodGroup:
                    bloodRequest.bloodGroup,

                count:
                    donors.length,

                donors
            });

        } catch (error) {

            console.error(
                "MATCH DONORS ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to match donors",

                error:
                    error.message
            });
        }
    }
);


// =====================================================
// UPDATE BLOOD REQUEST STATUS
// =====================================================
router.put(
    "/:requestId/status",
    async (req, res) => {

        try {
            const { requestId } =
                req.params;

            const { status } =
                req.body;


            if (
                !mongoose.Types.ObjectId.isValid(
                    requestId
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid request ID"
                });
            }


            const allowedStatuses = [
                "pending",
                "matched",
                "fulfilled",
                "cancelled"
            ];


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid status"
                });
            }


            const bloodRequest =
                await BloodRequest.findById(
                    requestId
                );


            if (!bloodRequest) {
                return res.status(404).json({
                    message:
                        "Blood request not found"
                });
            }


            bloodRequest.status =
                status;


            await bloodRequest.save();


            res.json({
                message:
                    "Blood request status updated successfully",

                request: {
                    id:
                        bloodRequest._id,

                    bloodGroup:
                        bloodRequest.bloodGroup,

                    units:
                        bloodRequest.units,

                    status:
                        bloodRequest.status
                }
            });

        } catch (error) {

            console.error(
                "UPDATE STATUS ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to update blood request status",

                error:
                    error.message
            });
        }
    }
);


module.exports = router;