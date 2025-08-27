const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const connectDB = require('./config/connectDB');
const passport = require("./config/passport");
const expressLayouts = require("express-ejs-layouts");
const { PORT, SESSION_SECRET } = require('./config/env');

// Connect DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

app.use(passport.initialize());
app.use(passport.session());

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

//Express EJS Layouts
app.use(expressLayouts);
app.set("layout", false); // Disable global layout (important)

// Routes
app.use("/", require("./routes/userRoute"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/vendor", require("./routes/vendorRoute"));

//pagenot found
app.use((req, res) => {
    const url = req.originalUrl;

    if (url.startsWith("/vendor")) {
        return res.status(404).render("errors/vendor404");
    } else if (url.startsWith("/user")) {
        return res.status(404).render("errors/user404");
    } else if (url.startsWith("/admin")) {
        return res.status(404).render("errors/admin404");
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
