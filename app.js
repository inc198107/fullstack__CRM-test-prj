const express = require("express");
const app = express();

const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const categoryRoutes = require('./routes/category');
const ordersRoutes = require('./routes/orders');
const positionRoutes = require('./routes/position');

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/position', positionRoutes);

module.exports = app;