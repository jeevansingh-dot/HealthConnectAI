const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema(
    {
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            required: true
        },

        units: {
            type: Number,
            required: true,
            min: 1
        },

        hospitalName: {
            type: String,
            required: true,
            trim: true
        },

        hospitalAddress: {
            type: String,
            required: true,
            trim: true
        },

        urgency: {
            type: String,
            enum: ["Low", "Medium", "High", "Emergency"],
            default: "Medium"
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },

            coordinates: {
                type: [Number],
                required: true
            }
        },

        status: {
            type: String,
            enum: ["pending", "matched", "fulfilled", "cancelled"],
            default: "pending"
        }
    },

    {
        timestamps: true
    }
);

bloodRequestSchema.index({
    location: "2dsphere"
});

module.exports = mongoose.model(
    "BloodRequest",
    bloodRequestSchema
);