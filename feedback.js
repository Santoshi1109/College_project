const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();

const Feedback = require("../models/Feedback");

/* ================= EMAIL CONFIG ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= SUBMIT FEEDBACK ================= */

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    // Save to MongoDB
    const newFeedback = new Feedback({
      firstName,
      lastName,
      email,
      subject,
      message,
      reviewed: false
    });

    await newFeedback.save();

    // Send Email to Admin
    await transporter.sendMail({
      from: `"ZooSphere Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Message: ${subject}`,
      html: `
        <h2>New Message Received</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    res.json({ success: true });

  } catch (error) {
    console.error("FEEDBACK ERROR:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* ================= GET ALL FEEDBACK (ADMIN) ================= */

router.get("/all", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching feedback" });
  }
});

/* ================= MARK AS REVIEWED ================= */

router.put("/:id/review", async (req, res) => {
  try {
    await Feedback.findByIdAndUpdate(req.params.id, { reviewed: true });
    res.json({ message: "Marked as reviewed" });
  } catch (error) {
    res.status(500).json({ message: "Error updating feedback" });
  }
});

/* ================= DELETE FEEDBACK ================= */

router.delete("/:id", async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting feedback" });
  }
});

module.exports = router;