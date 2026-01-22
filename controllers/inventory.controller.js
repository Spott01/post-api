const InventoryService = require('../services/inventory.service');

class InventoryController {
  static async getAllStations(req, res) {
    try {
      const stations = await InventoryService.findAllStations();
      return res.status(200).json({
        success: true,
        data: stations,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch stations',
      });
    }
  }
   static async getAllFare(req, res) {
    try {
      const fares = await InventoryService.findAllFare();
      return res.status(200).json({
        success: true,
        data: fares,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch fare',
      });
    }
  }
  static async getAllEquipment(req, res) {
    try {
      const equipment = await InventoryService.findAllEquipment();
      return res.status(200).json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch equipment',
      });
    }
  }
  static async getAllUsers(req, res) {
    try {
      const users = await InventoryService.findAllUsers();
      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
      });
    }
  }
  static async getAllLoginSessions(req, res) {
  try {
    const sessions = await InventoryService.findAllLoginSessions();
    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch login sessions',
    });
  }
}
static async getLoginSessionsByDay(req, res) {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date is required (YYYY-MM-DD)',
      });
    }

    const sessions = await InventoryService.findLoginSessionsByDay(date);

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch login sessions',
    });
  }
}
static async syncLoginSessions(req, res) {
  try {
    const {
      stationId = null,
      date = null,
      fromTime = null,
      toTime = null,
      updatedAfter = null,
      limit = 100
    } = req.body;

    const result = await InventoryService.syncLoginSessions(
      stationId,
      date,
      fromTime,
      toTime,
      updatedAfter,
      limit
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Login session sync error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to sync login sessions'
    });
  }
}

static async syncTransactions(req, res) {
  try {
    const { stationId, fromId = 0, limit = 100, date } = req.body;

    const result = await InventoryService.syncTransactions(
      stationId,
      fromId,
      limit,
      date
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Transaction sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync transactions',
    });
  }
}
static async Transactions(req, res) {
  try {
    const {
      stationId,
      fromId = 0,
      limit = 100,
      date,
      fromTime,
      toTime
    } = req.body;

    const result = await InventoryService.Transactions(
      stationId,
      fromId,
      limit,
      date,
      fromTime,
      toTime
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Transaction sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync transactions',
    });
  }
}
static async syncQr(req, res) {
  try {
    const {
      stationId = null,
      date = null,
      fromTime = null,
      toTime = null,
      updatedAfter = null,
      limit = 100
    } = req.body;

    const result = await InventoryService.syncQr(
      stationId,
      date,
      fromTime,
      toTime,
      updatedAfter,
      limit
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('QR sync error:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Failed to sync QR data'
    });
  }
}



}

module.exports = InventoryController;
