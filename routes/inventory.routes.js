const express = require('express');
const InventoryController = require('../controllers/inventory.controller');


const router = express.Router();

router.post('/sync/fare', InventoryController.syncFare);
router.post('/sync/station', InventoryController.syncStation);
router.post('/sync/equipment', InventoryController.syncEquipment);
router.post('/sync/users', InventoryController.syncUsers);
router.post('/sync/transactions', InventoryController.syncTransactionsByTime);

module.exports = router;
