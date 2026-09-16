const mongoose = require("mongoose");

const donationResponseSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BloodRequest",
            required: true
        },

        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["accepted", "declined"],
            required: true
        },

        message: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Same donor should not respond multiple times
donationResponseSchema.index(
    {
        requestId: 1,
        donorId: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "DonationResponse",
    donationResponseSchema
);