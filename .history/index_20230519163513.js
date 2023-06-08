const express = require("express");
const app = express();
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

mongoose.connect("mongodb://localhost:27017/DVS_backend")
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

const routers = require('./routes/userRoute');
app.use(express.static('public'));
app.use('/api',routers);

app.listen(3000, function(){
    console.log("Server is Ready");
});
