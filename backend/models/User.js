const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // Basic User Information
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        // Blood Information
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            default: null
        },

        // User Role
        role: {
            type: String,
            enum: ["user", "donor", "hospital", "admin"],
            default: "user"
        },

        // Donor Availability
        isAvailable: {
            type: Boolean,
            default: false
        },

        // Last Blood Donation
        lastDonationDate: {
            type: Date,
            default: null
        },

        // Location for Nearby Donor Search
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },

            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },

    {
        timestamps: true
    }
);


// Geospatial Index
userSchema.index({
    location: "2dsphere"
});


module.exports = mongoose.model("User", userSchema);