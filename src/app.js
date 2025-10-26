const express = require("express");
const app = express();
const path = require("path");
const connectDB = require("./config/connectDB");
const passport = require("./config/passport");
const expressLayouts = require("express-ejs-layouts");
const { PORT } = require("./config/env");
const errorHandler = require("./middleware/errorHandler");
const session = require("./middleware/session");
const logger = require("./middleware/logger");


// Logger
app.use(logger);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

session(app)

app.use(passport.initialize());
app.use(passport.session());

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

//EJS Layouts
app.use(expressLayouts);
app.set("layout", false);

// Routes
app.use("/admin", require("./routes/adminRoutes"));
app.use("/vendor", require("./routes/vendorRoute"));
app.use("/", require("./routes/userRoute"));

// error handling
app.use(errorHandler);

// Connect DB
connectDB().then(()=>{
  // Start Server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})

