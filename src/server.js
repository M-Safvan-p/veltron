const express = require("express");
const app = express();
const path = require("path");

const { PORT } = require('./config/env');

const connectDB = require('./config/connectDB');
connectDB();


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Set EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.get("/",(req,res)=>{
    res.send("welcome")
})

app.listen(PORT, ()=>{
    console.log(`🚀 Server running on http://localhost:${PORT}`)
})