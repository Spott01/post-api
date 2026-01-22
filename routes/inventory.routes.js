const express = require('express');
const InventoryController = require('../controllers/inventory.controller');


const router = express.Router();

router.get('/station', InventoryController.getAllStations);
router.get('/fare', InventoryController.getAllFare);
router.get('/equipment', InventoryController.getAllEquipment);
router.get('/users', InventoryController.getAllUsers);
router.get('/login-sessions', InventoryController.getAllLoginSessions);
router.post('/login-sessions/day',InventoryController.getLoginSessionsByDay);
router.post('/login-sessions/sync',InventoryController.syncLoginSessions);
router.post('/transactions/day',InventoryController.syncTransactions);
router.post('/transactions/time', InventoryController.Transactions);
router.post('/qr/sync', InventoryController.syncQr);



module.exports = router;
