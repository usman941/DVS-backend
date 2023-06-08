const express = require("express");
const app = express();
const path=require("path");
const mongoose = require("mongoose");
const cors=require("cors");
mongoose.set('strictQuery', true);
app.use(cors());
mongoose.connect("mongodb://localhost:27017/DVS_backend")
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));
app.use("/images",express.static(path.join(__dirname,'/public/degreeImages'))
const routers = require('./routes/userRoute');
app.use(express.static('public'));
app.use('/api',routers);

app.listen(3000, function(){
    console.log("Server is Ready");
});
