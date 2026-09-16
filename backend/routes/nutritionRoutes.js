const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");
const NutritionMeal = require("../models/NutritionMeal");

const router = express.Router();

/*
  GEMINI AI
*/
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";


/*
  MULTER CONFIGURATION
  Image memory mein temporarily rahegi.
*/
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});


/*
  PORTION OPTIONS
*/
function getPortions(foodName, foodType) {

  const name = foodName.toLowerCase();


  /*
    COUNTABLE FOODS
  */

  if (
    foodType === "countable" ||
    name.includes("roti") ||
    name.includes("chapati") ||
    name.includes("paratha") ||
    name.includes("naan") ||
    name.includes("puri") ||
    name.includes("idli") ||
    name.includes("egg")
  ) {

    let itemName = "Item";

    if (
      name.includes("roti") ||
      name.includes("chapati")
    ) {
      itemName = "Roti";
    }

    if (name.includes("paratha")) {
      itemName = "Paratha";
    }

    if (name.includes("naan")) {
      itemName = "Naan";
    }

    if (name.includes("puri")) {
      itemName = "Puri";
    }

    if (name.includes("idli")) {
      itemName = "Idli";
    }

    if (name.includes("egg")) {
      itemName = "Egg";
    }


    return [
      {
        label: `1 ${itemName}`,
        grams: 30
      },
      {
        label: `2 ${itemName}`,
        grams: 60
      },
      {
        label: `3 ${itemName}`,
        grams: 90
      },
      {
        label: `4 ${itemName}`,
        grams: 120
      }
    ];
  }


  /*
    KATORI FOODS
  */

  return [
    {
      label: "½ Katori",
      grams: 75
    },
    {
      label: "1 Katori",
      grams: 150
    },
    {
      label: "1.5 Katori",
      grams: 225
    },
    {
      label: "2 Katori",
      grams: 300
    }
  ];
}


/*
  ADD MEAL
  POST /api/nutrition/create
*/
router.post("/create", async (req, res) => {

  try {

    const {
      userId,
      name,
      type,
      calories,
      protein,
      carbs,
      fat
    } = req.body;


    if (
      !userId ||
      !name ||
      !type ||
      calories === undefined
    ) {

      return res.status(400).json({
        message: "Please provide all required meal details"
      });
    }


    if (!mongoose.Types.ObjectId.isValid(userId)) {

      return res.status(400).json({
        message: "Invalid user ID"
      });
    }


    const meal = new NutritionMeal({

      userId,

      name,

      type,

      calories,

      protein: protein || 0,

      carbs: carbs || 0,

      fat: fat || 0

    });


    await meal.save();


    res.status(201).json({

      message: "Meal added successfully",

      meal

    });


  } catch (error) {

    console.log("Add meal error:", error);

    res.status(500).json({

      message: "Failed to add meal",

      error: error.message

    });

  }

});


/*
  REAL GEMINI PHOTO ANALYSIS

  POST /api/nutrition/analyze-photo
*/
router.post(
  "/analyze-photo",
  upload.single("mealImage"),

  async (req, res) => {

    try {

      /*
        Check image
      */

      if (!req.file) {

        return res.status(400).json({

          message: "Please upload a meal photo"

        });

      }


      /*
        Check Gemini API key
      */

      if (!process.env.GEMINI_API_KEY) {

        return res.status(500).json({

          message:
            "Gemini API key is not configured in backend .env"

        });

      }


      console.log(
        "Analyzing meal image with Gemini..."
      );

      console.log(
        "File:",
        req.file.originalname
      );

      console.log(
        "Type:",
        req.file.mimetype
      );

      console.log(
        "Size:",
        req.file.size
      );


      /*
        Convert image to Base64
      */

      const base64Image =
        req.file.buffer.toString("base64");


      /*
        AI PROMPT

        Important:
        AI identifies foods only.
        It does NOT guess calories here.

        Portion will be selected by the user
        using familiar units.
      */

      const prompt = `
You are a food identification assistant for an Indian nutrition tracking application.

Analyze the uploaded meal photo carefully.

Identify ALL clearly visible food items in the image.

Examples include:
- Roti
- Chapati
- Dal
- Rice
- Sabzi
- Paneer
- Salad
- Curd
- Idli
- Dosa
- Paratha
- Egg
- Fruits
- Other clearly visible foods

IMPORTANT RULES:

1. Only return foods that are actually visible.
2. Do NOT automatically add roti, dal or rice if they are not visible.
3. If vegetables/sabzi are visible, identify them.
4. If multiple vegetables are mixed together, use a reasonable common name such as "Mixed Vegetable Sabzi".
5. Do not estimate calories.
6. Do not estimate protein.
7. Do not estimate grams.
8. Do not invent hidden ingredients.
9. Avoid duplicate food names.
10. If a food cannot be identified confidently, use a simple generic name such as "Vegetable Dish" instead of inventing a specific recipe.

For each food return:

name:
The food name.

type:
Use "countable" for foods normally counted individually, such as roti, chapati, egg, idli, dosa, etc.
Use "katori" for foods normally measured by bowl/katori, such as dal, rice, sabzi, curry, salad, curd, etc.

Return ONLY valid JSON.
`;


      /*
        SEND IMAGE + PROMPT TO GEMINI
      */

            /*
        SEND IMAGE + PROMPT TO GEMINI
        Retry + fallback model support
      */

      const geminiModels = [
        GEMINI_MODEL,
        "gemini-3.7-flash",
        "gemini-3.6-flash"
      ];

      let response = null;
      let lastError = null;

      for (const model of geminiModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(
              `Trying Gemini model: ${model} | Attempt: ${attempt}`
            );

            response = await ai.models.generateContent({
              model,

              contents: [
                {
                  inlineData: {
                    mimeType: req.file.mimetype,
                    data: base64Image
                  }
                },

                {
                  text: prompt
                }
              ],

              config: {
                responseMimeType: "application/json",

                responseSchema: {
                  type: "object",

                  properties: {
                    foods: {
                      type: "array",

                      items: {
                        type: "object",

                        properties: {
                          name: {
                            type: "string"
                          },

                          type: {
                            type: "string",

                            enum: [
                              "countable",
                              "katori"
                            ]
                          }
                        },

                        required: [
                          "name",
                          "type"
                        ]
                      }
                    }
                  },

                  required: [
                    "foods"
                  ]
                }
              }
            });

            console.log(
              `Gemini success using model: ${model}`
            );

            break;
          } catch (error) {
            lastError = error;

            console.log(
              `Gemini failed: ${model} | Attempt: ${attempt}`
            );

            console.log(
              "Status:",
              error.status
            );

            console.log(
              "Message:",
              error.message
            );

            /*
              503 = temporary overload
              Wait before retrying.
            */

            if (error.status === 503) {
              const waitTime = attempt * 2000;

              console.log(
                `Waiting ${waitTime}ms before retry...`
              );

              await new Promise((resolve) =>
                setTimeout(resolve, waitTime)
              );

              continue;
            }

            /*
              For non-503 errors, don't repeatedly
              retry the same request.
            */

            break;
          }
        }

        if (response) {
          break;
        }
      }

      /*
        If all Gemini models failed
      */

      if (!response) {
        console.log(
          "All Gemini models failed."
        );

        return res.status(503).json({
          message:
            "AI service is temporarily unavailable. Please try again in a moment.",
          error:
            lastError?.message || "Gemini unavailable"
        });
      }


      /*
        GEMINI RESPONSE
      */

      const responseText =
        response.text;


      console.log(
        "Gemini response:",
        responseText
      );


      /*
        Parse JSON
      */

      let aiResult;

      try {

        aiResult =
          JSON.parse(responseText);

      } catch (parseError) {

        console.log(
          "Gemini JSON parse error:",
          parseError
        );

        return res.status(500).json({

          message:
            "AI returned an invalid response"

        });

      }


      /*
        Validate foods
      */

      if (
        !aiResult ||
        !Array.isArray(aiResult.foods)
      ) {

        return res.status(500).json({

          message:
            "AI could not identify foods correctly"

        });

      }


      /*
        REMOVE DUPLICATES
      */

      const uniqueFoods = [];

      const seenFoods =
        new Set();


      for (
        const food of aiResult.foods
      ) {

        if (
          !food.name ||
          !food.type
        ) {
          continue;
        }


        const cleanName =
          food.name
            .trim();


        const key =
          cleanName
            .toLowerCase();


        if (
          seenFoods.has(key)
        ) {
          continue;
        }


        seenFoods.add(key);


        /*
          Add familiar portion options
        */

        uniqueFoods.push({

          name: cleanName,

          type: food.type,

          portions:
            getPortions(
              cleanName,
              food.type
            )

        });

      }


      /*
        No foods detected
      */

      if (
        uniqueFoods.length === 0
      ) {

        return res.json({

          message:
            "No food items could be identified from this image",

          detectedFoods: []

        });

      }


      /*
        FINAL RESPONSE
      */

      res.json({

        message:
          "Meal photo analyzed successfully",

        model:
          GEMINI_MODEL,

        detectedFoods:
          uniqueFoods

      });


    } catch (error) {

      console.log(
        "Gemini photo analysis error:",
        error
      );


      /*
        Gemini/API errors
      */

      res.status(500).json({

        message:
          "Failed to analyze meal photo",

        error:
          error.message

      });

    }

  }
);


/*
  GET USER MEALS

  GET /api/nutrition/user/:userId
*/
router.get(
  "/user/:userId",

  async (req, res) => {

    try {

      const {
        userId
      } = req.params;


      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {

        return res.status(400).json({

          message:
            "Invalid user ID"

        });

      }


      const meals =
        await NutritionMeal.find({

          userId

        }).sort({

          createdAt: -1

        });


      res.json(meals);


    } catch (error) {

      console.log(
        "Get meals error:",
        error
      );


      res.status(500).json({

        message:
          "Failed to fetch meals",

        error:
          error.message

      });

    }

  }
);


/*
  DELETE MEAL

  DELETE /api/nutrition/:mealId
*/
router.delete(
  "/:mealId",

  async (req, res) => {

    try {

      const {
        mealId
      } = req.params;


      if (
        !mongoose.Types.ObjectId.isValid(
          mealId
        )
      ) {

        return res.status(400).json({

          message:
            "Invalid meal ID"

        });

      }


      const meal =
        await NutritionMeal.findByIdAndDelete(
          mealId
        );


      if (!meal) {

        return res.status(404).json({

          message:
            "Meal not found"

        });

      }


      res.json({

        message:
          "Meal deleted successfully"

      });


    } catch (error) {

      console.log(
        "Delete meal error:",
        error
      );


      res.status(500).json({

        message:
          "Failed to delete meal",

        error:
          error.message

      });

    }

  }
);


/*
  MULTER ERROR HANDLER
*/
router.use(
  (error, req, res, next) => {

    if (
      error instanceof
      multer.MulterError
    ) {

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({

          message:
            "Image size must be less than 5 MB"

        });

      }


      return res.status(400).json({

        message:
          error.message

      });

    }


    if (error) {

      return res.status(400).json({

        message:
          error.message

      });

    }


    next();

  }
);


module.exports = router;