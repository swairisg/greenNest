//oR0eXyqEOJiU4PT6

const express = require('express');
const mongoose = require('mongoose');

const app = express();

//middleware
app.use("/",(req, res, next) => {
    res.send("Hello from backend");
})

mongoose.connect("mongodb+srv://greennest_dev:oR0eXyqEOJiU4PT6@cluster0.jaiu73g.mongodb.net/")
.then(() => console.log("Connected to MongoDB"))
.then(() => {app.listen(5001);})

.catch((err) => console.log(err));