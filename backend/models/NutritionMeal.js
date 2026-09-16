const mongoose = require("mongoose");

const nutritionMealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
      required: true
    },

    calories: {
      type: Number,
      required: true,
      min: 0
    },

    protein: {
      type: Number,
      default: 0,
      min: 0
    },

    carbs: {
      type: Number,
      default: 0,
      min: 0
    },

    fat: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "NutritionMeal",
  nutritionMealSchema
);