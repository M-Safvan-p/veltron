const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const connectDB = require('./config/connectDB');
const passport = require("./config/passport");
const { PORT, SESSION_SECRET } = require('./config/env');

// Connect DB
connectDB();

// Import Routes
const userRoutes = require("./routes/userRoute");
const adminRoutes = require("./routes/adminRoutes");
const vendorRoutes = require("./routes/vendorRoute");


// Middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Session Middleware
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,   
    cookie: {
        secure: false,        
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000 
    }
}));
app.use((req, res, next) => {
    res.set("cache-control", "no-store");
    next();
});
//passport
app.use(passport.initialize());
app.use(passport.session());

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

//  Routes
app.use("/", userRoutes);
app.use("/admin",adminRoutes);
// app.use("/vendor", vendorRoutes);






//  Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
