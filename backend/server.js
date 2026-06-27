require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const cors    = require("cors");
const session = require("express-session");
const path    = require("path");
const { connectDB } = require("./config/database");

const app  = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5500";

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,           // allow session cookies cross-origin
}));

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "change_this_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,             // set true when using HTTPS in production
    httpOnly: true,
    sameSite: "lax",
  },
}));

// ── Serve uploaded files (profile photos etc.) ───────────────
app.use("/uploads", express.static(path.join(__dirname, "../frontend/public/uploads")));
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ── API Routes ────────────────────────────────────────────────
app.use("/",                  require("./routes/auth"));
app.use("/api",               require("./routes/users"));
app.use("/api/mentors",       require("./routes/mentors"));
app.use("/api/sessions",      require("./routes/sessions"));
app.use("/api/chats",         require("./routes/chat"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/payments",      require("./routes/payments"));

// ── Serve HTML views directly for clean URLs ──────────────────
app.get("/login",             (req, res) => res.sendFile(path.join(__dirname, "../frontend/public/login.html")));
app.get("/register",          (req, res) => res.sendFile(path.join(__dirname, "../frontend/public/register.html")));
app.get("/student-dashboard", (req, res) => res.sendFile(path.join(__dirname, "../frontend/public/student-dashboard.html")));
app.get("/mentor-dashboard",  (req, res) => res.sendFile(path.join(__dirname, "../frontend/public/mentor-dashboard.html")));
app.get("/mentors",           (req, res) => res.sendFile(path.join(__dirname, "../frontend/public/mentors.html")));

// ── Legacy URL aliases (backward compat with frontend) ───────
const mentorsRouter  = require("./routes/mentors");
const sessionsRouter = require("./routes/sessions");
const paymentsRouter = require("./routes/payments");

app.post("/api/mentor-requests",      (req, res, next) => { req.url = "/request";                       mentorsRouter(req, res, next); });
app.put( "/api/mentor-requests/:id",  (req, res, next) => { req.url = `/requests/${req.params.id}`;     mentorsRouter(req, res, next); });
app.get( "/api/mentor/requests",      (req, res, next) => { req.url = "/requests/list";                 mentorsRouter(req, res, next); });
app.get( "/api/mentor/students",      (req, res, next) => { req.url = "/students/list";                 mentorsRouter(req, res, next); });
app.get( "/api/student/requests",     (req, res, next) => { req.url = "/student/requests";              mentorsRouter(req, res, next); });
app.get( "/api/student/mentors",      (req, res, next) => { req.url = "/student/accepted";              mentorsRouter(req, res, next); });
app.put( "/api/mentor/pricing",       (req, res, next) => { req.url = "/pricing";                       mentorsRouter(req, res, next); });
app.get( "/api/mentoring-history",          (req, res, next) => { req.url = "/history";                 sessionsRouter(req, res, next); });
app.get( "/api/mentoring-history/stats",    (req, res, next) => { req.url = "/history/stats";           sessionsRouter(req, res, next); });
app.put( "/api/mentoring-history/:id/end",  (req, res, next) => { req.url = `/history/${req.params.id}/end`; sessionsRouter(req, res, next); });
app.get( "/api/payment/config",       (req, res, next) => { req.url = "/config";                        paymentsRouter(req, res, next); });
app.get( "/api/payment/history",      (req, res, next) => { req.url = "/history";                       paymentsRouter(req, res, next); });

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// ── Start ─────────────────────────────────────────────────────
(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
})();
