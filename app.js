const express = require("express");
const app = express();
const keys = require('./config/keys');

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");

mongoose
  .connect(keys.mongoURI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    console.log("DB connected");
  })
  .catch((error) => {
    console.log(error);
  });

const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
const categoryRoutes = require("./routes/category");
const ordersRoutes = require("./routes/orders");
const positionRoutes = require("./routes/position");

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/position", positionRoutes);

module.exports = app;
