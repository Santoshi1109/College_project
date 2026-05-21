const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const User = require("./models/User");
const Ticket = require("./models/Ticket");
const Event = require("./models/Event");
const Animal = require("./models/Animal");
const Feedback = require("./models/Feedback");

const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(express.json({ limit: "10mb" }));

const feedbackRoutes = require("./routes/feedback");
app.use("/api/feedback", feedbackRoutes);

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/users", userRoutes);

/* ================== CONNECT TO MONGODB ================== */
mongoose.connect("mongodb://127.0.0.1:27017/zoosphere")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================== CREATE ADMIN ================== */
app.get("/create-admin", async (req, res) => {
  try {
    const existing = await User.findOne({ email: "admin@gmail.com" });
    if (existing) {
      return res.json({ message: "Admin already exists!" });
    }

    const admin = new User({ 
      name: "Admin",
      email: "admin@gmail.com",
      password: await bcrypt.hash("admin123", 10), // ✅ FIXED
      role: "admin"
    });

    await admin.save();

    res.json({
      message: "Admin created successfully (admin@gmail.com / admin123)"
    });

  } catch (err) {
    res.status(500).json({ message: "Error creating admin" });
  }
});

/* ================== SIGNUP ================== */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "All fields required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user"
    });

    await newUser.save();

    res.json({ success: true, message: "Signup successful" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Signup failed" });
  }
});

// ================== LOGIN ==================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔴 Check empty
    if (!email || !password) {
      return res.json({ success: false, message: "Email & password required" });
    }

    // 🔴 Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    // 🔴 Compare password (FIXED)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    // 🔴 Create token
    const token = jwt.sign(
      { email: user.email, role: user.role },
      "zoosphereSecret",
      { expiresIn: "1h" }
    );

    // 🔴 Send response
    res.json({
      success: true,
      message: "Login Successful",
      token,
      role: user.role,
      redirect: user.role === "admin"
        ? "admin_dashboard.html"
        : "index.html"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// ================== CREATE ADMIN (IMPORTANT) ==================
app.post("/create-admin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    res.json({ success: true, message: "Admin created" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Error creating admin" });
  }
});
/* ================== BOOK TICKET ================== */
app.post("/book", async (req, res) => {
  try {
    const {
      name,
      email,
      date,
      regularTickets,
      studentTickets,
      childTickets,
      total
    } = req.body;

    const totalQuantity =
      (Number(regularTickets) || 0) +
      (Number(studentTickets) || 0) +
      (Number(childTickets) || 0);

    const newTicket = new Ticket({
      name: name || "Guest",
      email: email || "Not Provided",
      date: date || new Date(),
      quantity: totalQuantity,
      price: Number(total) || 0
    });

    await newTicket.save();

    res.json({ success: true, message: "Ticket booked successfully!" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Booking failed" });
  }
});

/* ================== TICKETS ================== */
app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tickets" });
  }
});

app.delete("/api/tickets/:id", async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: "Ticket deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting ticket" });
  }
});

/* ================== ANIMALS ================== */
app.get("/api/animals", async (req, res) => {
  try {
    const animals = await Animal.find();
    res.json(animals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/animals", async (req, res) => {
  try {
    const newAnimal = new Animal(req.body);
    await newAnimal.save();
    res.json({ message: "Animal added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding animal" });
  }
});

app.put("/api/animals/:id", async (req, res) => {
  try {
    await Animal.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Animal updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating animal" });
  }
});

app.delete("/api/animals/:id", async (req, res) => {
  try {
    await Animal.findByIdAndDelete(req.params.id);
    res.json({ message: "Animal deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting animal" });
  }
});

/* ================== DASHBOARD ================== */
app.get("/api/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAnimals = await Animal.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalTickets = await Ticket.countDocuments();

    const unreviewedFeedback = await Feedback.countDocuments({ reviewed: false });
    const reviewedFeedback = await Feedback.countDocuments({ reviewed: true });

    const tickets = await Ticket.find();
    const totalRevenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);

    res.json({
      totalUsers,
      totalAnimals,
      totalEvents,
      totalTickets,
      unreviewedFeedback,
      reviewedFeedback,
      totalRevenue
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================== ADMIN DASHBOARD ================== */
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAnimals = await Animal.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalTickets = await Ticket.countDocuments();

    const tickets = await Ticket.find();
    const totalRevenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);

    res.json({
      totalUsers,
      totalAnimals,
      totalEvents,
      totalTickets,
      totalRevenue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================== EVENTS CRUD ================== */

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: "Error fetching event" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: "Error adding event" });
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedEvent)
      return res.status(404).json({ message: "Event not found" });
    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: "Error updating event" });
  }
});

app.delete("/api/events/:id", async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent)
      return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting event" });
  }
});

/* ================== START SERVER ================== */
app.listen(5000, () => console.log("Server running on port 5000"));