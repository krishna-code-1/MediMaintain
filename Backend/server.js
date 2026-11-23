
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");

require("dotenv").config();

const connectDB = require("./config/db");

// Existing routes
const equipmentRoutes = require("./routes/equipmentRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const alertsRoutes = require("./routes/alertsRoutes");
const reportRoutes = require("./routes/reportRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");

// New authentication routes
const authRoutes = require("./routes/authRoutes");

const app = express();


// Trust ngrok's HTTPS proxy so secure session cookies work behind the tunnel.
app.set("trust proxy", 1);


// Middleware
const allowedOrigins = new Set([
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://medimaintain.netlify.app",
    ...(process.env.FRONTEND_URL || "")
        .split(",")
        .map(origin => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean)
]);

app.use(cors((req, callback) => {
    const requestOrigin = req.get("Origin");
    const isSameOrigin = requestOrigin ===
        `${req.protocol}://${req.get("host")}`;

    callback(null, {
        origin(origin, originCallback) {
            if (!origin || isSameOrigin || allowedOrigins.has(origin)) {
                return originCallback(null, true);
            }

            return originCallback(
                new Error(`CORS origin is not allowed: ${origin}`)
            );
        },
        credentials: true
    });
}));

app.use(express.json());


// Session configuration
app.use(session({
    name: "medimaintain.sid",

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 8
    }
}));


// Keep a plain-text health endpoint while the root serves the app for ngrok.
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "Frontend", "index.html"));
});

app.get("/health", (req, res) => {
    res.status(200).send("MediMaintain Server is Running");
});


// Authentication API
app.use("/api/auth", authRoutes);


// Existing APIs
app.use("/api/equipment", equipmentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/hospitals", hospitalRoutes);

// A single ngrok tunnel to port 5000 serves the complete frontend and API.
app.use(express.static(path.join(__dirname, "..", "Frontend")));

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

app.use((error, req, res, next) => {
    if (error.message.startsWith("CORS origin is not allowed:")) {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }

    console.error("Request error:", error.message);
    res.status(500).json({
        success: false,
        message: "An unexpected server error occurred"
    });
});


// Server port
const PORT = process.env.PORT || 5000;


// Start server
const startServer = async () => {

    try {

        await connectDB();

        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {

        console.log("Server startup failed:", error.message);

        process.exit(1);

    }

};

startServer();
