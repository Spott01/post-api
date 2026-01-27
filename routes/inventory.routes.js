const express = require('express');
const InventoryController = require('../controllers/inventory.controller');


const router = express.Router();

router.post('/sync/station', InventoryController.syncStation);
router.post('/sync/fare', InventoryController.syncFare);
router.post('/sync/equipment', InventoryController.syncEquipment);
router.post('/sync/users', InventoryController.syncUsers);
router.post('/login-sessions/sync',InventoryController.syncLoginSessionsDay);
router.post('/login-sessions/update',InventoryController.updateLoginSessions);
router.post('/sync/transactions', InventoryController.syncTransactionsByTime);
router.post('/qr/sync', InventoryController.syncQrUpdateOnly);



module.exports = router;
