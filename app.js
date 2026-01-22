require('dotenv').config();
const express = require('express');
const inventoryRoutes = require('./routes/inventory.routes');

const app = express();

app.use(express.json());

app.use('/inventory/data', inventoryRoutes);

module.exports = app;
