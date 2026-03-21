const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/users");
const bookingRoutes = require("./routes/bookings");
dotenv.config();

const { initSocket } = require("./socket");
const pool = require("./db/pool");

const adminCourtRoutes = require("./routes/adminCourts");
const courtRoutes = require("./routes/courts");
const authRoutes = require("./routes/auth"); // ✅ add this

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes); // ✅ added this line
app.use("/api/admin/court", adminCourtRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);


app.get("/", (req, res) => res.send("Basketball App Backend Running"));

// Start server
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

// Initialize Socket.io
initSocket(server);
