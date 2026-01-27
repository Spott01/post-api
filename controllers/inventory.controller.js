const InventoryService = require('../services/inventory.service');

class InventoryController {
  
 static async syncFare(req, res) {
    try {
      const result = await InventoryService.syncFareFromRemote();

      return res.status(200).json({
        success: true,
        message: 'Fare data synced successfully',
        inserted: result.inserted,
        updated: result.updated,
      });
    } catch (error) {
      console.error('Sync Fare Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to sync fare data',
      });
    }
  }

  static async syncStation(req, res) {
    try {
      const result = await InventoryService.syncStationFromRemote();
      return res.json({
        success: true,
        message: 'Station synced successfully',
        inserted: result
      });
    } catch (error) {
      console.error('Sync Station Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Station sync failed',
        error: error.message
      });
    }
  }
   static async syncEquipment(req, res) {
    try {
      const count = await InventoryService.syncEquipmentFromRemote();

      return res.status(200).json({
        success: true,
        message: `Equipment sync completed`,
        synced: count
      });
    } catch (error) {
      console.error('Sync Equipment Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to sync equipment',
        error: error.message
      });
    }
  }

   static async syncUsers(req, res) {
    try {
      const count = await InventoryService.syncUsersFromRemote();

      return res.status(200).json({
        success: true,
        message: 'User sync completed',
        synced: count
      });
    } catch (error) {
      console.error('Sync User Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to sync users',
        error: error.message
      });
    }
  }
   static async syncTransactionsByTime(req, res) {
    try {
      const { date, fromTime, toTime } = req.body;

      const result = await InventoryService.syncTransactionsFromRemote(
        date,
        fromTime,
        toTime
      );

      return res.json({
        success: true,
        message: 'Transactions synced successfully',
        transactions: result.transactions,
        qrs: result.qrs
      });
    } catch (error) {
      console.error('Sync Transaction Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Transaction sync failed',
        error: error.message
      });
    }
  }

}

module.exports = InventoryController;
