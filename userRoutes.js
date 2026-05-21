const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");


// ================= GET ALL FEEDBACK =================
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching feedback" });
  }
});


// ================= ADD FEEDBACK =================
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const newFeedback = new Feedback({
      firstName,
      lastName,
      email,
      subject,
      message
    });

    await newFeedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback saved successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;