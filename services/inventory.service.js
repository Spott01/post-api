const db = require('../config/db');
const axios = require('axios');

class InventoryService {
static async syncFareFromRemote() {
    const API_URL = 'http://192.168.1.106/inventory/data/fare';

    const response = await axios.get(API_URL);
    const fares = response.data?.data || [];

    let inserted = 0;
    let updated = 0;

    for (const item of fares) {
      const { station_id, fare } = item;

      // 1️⃣ Check if station exists
      const checkQuery = `
        SELECT id FROM fare WHERE station_id = $1
      `;
      const checkResult = await db.query(checkQuery, [station_id]);

      if (checkResult.rows.length > 0) {
        // 2️⃣ Update
        const updateQuery = `
          UPDATE fare
          SET fare = $1
          WHERE station_id = $2
        `;
        await db.query(updateQuery, [fare, station_id]);
        updated++;
      } else {
        // 3️⃣ Insert
        const insertQuery = `
          INSERT INTO fare (station_id, fare)
          VALUES ($1, $2)
        `;
        await db.query(insertQuery, [station_id, fare]);
        inserted++;
      }
    }
    return { inserted, updated };
}

static async syncStationFromRemote() {
  const info = await db.query(
    `SELECT current_database(), current_schema()`
  );
  console.log(info.rows);

  const response = await axios.get(
    'http://192.168.1.106/inventory/data/station'
  );

  if (!Array.isArray(response.data.data)) {
    throw new Error('Invalid station data format');
  }

  let count = 0;

  for (const s of response.data.data) {
    const res = await db.query(
      `
      INSERT INTO public.station (
        id,
        station_name,
        station_code,
        ip_address,
        is_active,
        "lineId"
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (id)
      DO UPDATE SET
        station_name = EXCLUDED.station_name,
        station_code = EXCLUDED.station_code,
        ip_address = EXCLUDED.ip_address,
        is_active = EXCLUDED.is_active,
        "lineId" = EXCLUDED."lineId"
      RETURNING id
      `,
      [
        s.station_id,   // remote id mapped to PK
        s.station_name,
        s.station_code,
        s.ip_address,
        s.is_active,
        s.line_id       // remote line_id → local "lineId"
      ]
    );

    if (res.rowCount > 0) count++;
  }

  return count;
}

static async syncEquipmentFromRemote() {
  const response = await axios.get(
    'http://192.168.1.106/inventory/data/equipment'
  );

  if (!Array.isArray(response.data.data)) {
    throw new Error('Invalid equipment data format');
  }

  let count = 0;

  for (const e of response.data.data) {

    const existing = await db.query(
      `SELECT id FROM public.equipment WHERE device_id = $1`,
      [e.device_id]
    );

    if (existing.rowCount > 0) {
      // 🔁 UPDATE (use API updated_at)
      await db.query(
        `
        UPDATE public.equipment
        SET
          device_name = $2,
          description = $3,
          device_serial_no = $4,
          ip_address = $5,
          sc_ip = $6,
          cc_ip = $7,
          sc_port = $8,
          hardware = $9,
          tid = $10,
          mid = $11,
          ncmc_hardware = $12,
          ncmc_tid = $13,
          ncmc_mid = $14,
          qr = $15,
          model_type = $16,
          direction_type = $17,
          subnet_address = $18,
          ssid = $19,
          ssid_password = $20,
          created_by = $21,
          updated_by = $22,
          iv_hash = $23,
          device_reference = $24,
          master_hash = $25,
          is_active = $26,
          is_qr_active = $27,
          is_qr_active_date = $28,
          qr_reset_date = $29,
          "stationId" = $30,
          "equipmentTypeId" = $31,
          "equipmentStatusId" = $32,
          "specialModeId" = $33,
          updated_at = $34
        WHERE device_id = $1
        `,
        [
          e.device_id,
          e.device_name,
          e.description,
          e.device_serial_no,
          e.ip_address,
          e.sc_ip,
          e.cc_ip,
          e.sc_port,
          e.hardware,
          e.tid,
          e.mid,
          e.ncmc_hardware,
          e.ncmc_tid,
          e.ncmc_mid,
          e.qr,
          e.model_type,
          e.direction_type,
          e.subnet_address,
          e.ssid,
          e.ssid_password,
          e.created_by,
          e.updated_by,
          e.iv_hash,
          e.device_reference,
          e.master_hash,
          e.is_active,
          e.is_qr_active,
          e.is_qr_active_date,
          e.qr_reset_date,
          e.station_id,
          e.equipment_type_id,
          e.equipment_status_id,
          e.special_mode_id,
          e.updated_at        // ← from API
        ]
      );
    } else {
      // ➕ INSERT (use API created_at & updated_at)
      await db.query(
        `
        INSERT INTO public.equipment (
          device_id,
          device_name,
          description,
          device_serial_no,
          ip_address,
          sc_ip,
          cc_ip,
          sc_port,
          hardware,
          tid,
          mid,
          ncmc_hardware,
          ncmc_tid,
          ncmc_mid,
          qr,
          model_type,
          direction_type,
          subnet_address,
          ssid,
          ssid_password,
          created_by,
          updated_by,
          iv_hash,
          device_reference,
          master_hash,
          is_active,
          is_qr_active,
          is_qr_active_date,
          qr_reset_date,
          "stationId",
          "equipmentTypeId",
          "equipmentStatusId",
          "specialModeId",
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,
          $30,$31,$32,$33,
          $34,$35
        )
        `,
        [
          e.device_id,
          e.device_name,
          e.description,
          e.device_serial_no,
          e.ip_address,
          e.sc_ip,
          e.cc_ip,
          e.sc_port,
          e.hardware,
          e.tid,
          e.mid,
          e.ncmc_hardware,
          e.ncmc_tid,
          e.ncmc_mid,
          e.qr,
          e.model_type,
          e.direction_type,
          e.subnet_address,
          e.ssid,
          e.ssid_password,
          e.created_by,
          e.updated_by,
          e.iv_hash,
          e.device_reference,
          e.master_hash,
          e.is_active,
          e.is_qr_active,
          e.is_qr_active_date,
          e.qr_reset_date,
          e.station_id,
          e.equipment_type_id,
          e.equipment_status_id,
          e.special_mode_id,
          e.created_at,   // ← from API
          e.updated_at    // ← from API
        ]
      );
    }

    count++;
  }

  return count;
}


static async syncUsersFromRemote() {
  const response = await axios.get(
    'http://192.168.1.106/inventory/data/users'
  );

  if (!Array.isArray(response.data.data)) {
    throw new Error('Invalid user response format');
  }

  let count = 0;

  for (const u of response.data.data) {

    // 🔍 Check by email
    const existing = await db.query(
      `SELECT id FROM public.user WHERE email = $1`,
      [u.email]
    );

    if (existing.rowCount > 0) {
      await db.query(
        `
        UPDATE public.user
        SET
          first_name = $2,
          last_name = $3,
          mobile_number = $4,
          designation = $5,
          password = $6,
          is_admin = $7,
          is_super_admin = $8,
          is_active = $9,
          "stationId" = $10,
          "userGroupId" = $11,
          user_type_code = $12
        WHERE email = $1
        `,
        [
          u.email,
          u.first_name,
          u.last_name,
          u.mobile_number,
          u.designation,
          u.password,
          u.is_admin,
          u.is_super_admin,
          u.is_active,
          u.station_id,      // FK → "stationId"
          u.user_group_id,   // FK → "userGroupId"
          u.user_type_code
        ]
      );
    } else {
      // ➕ INSERT
      await db.query(
        `
        INSERT INTO public.user (
          email,
          first_name,
          last_name,
          mobile_number,
          designation,
          password,
          is_admin,
          is_super_admin,
          is_active,
          "stationId",
          "userGroupId",
          user_type_code
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )
        `,
        [
          u.email,
          u.first_name,
          u.last_name,
          u.mobile_number,
          u.designation,
          u.password,
          u.is_admin,
          u.is_super_admin,
          u.is_active,
          u.station_id,
          u.user_group_id,
          u.user_type_code
        ]
      );
    }

    count++;
  }

  return count;
}

static async syncTransactionsFromRemote({ date, fromTime, toTime }) {
  const response = await axios.post(
    'http://192.168.1.106/inventory/data/transactions/time',
    {
      date,
      fromTime,
      toTime
    },
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  const transactions = response.data.data;
  let count = 0;


  for (const t of transactions) {

    // 🔍 Check if transaction exists by ID
    const exists = await db.query(
      `SELECT id FROM "transaction" WHERE id = $1`,
      [t.id]
    );

    if (exists.rowCount > 0) {
      // 🔁 UPDATE (preserve timestamps)
      await db.query(
        `
        UPDATE "transaction"
        SET
          order_id = $2,
          amount = $3,
          status = $4,
          no_of_tickets = $5,
          transaction_id = $6,
          bank_txn_id = $7,
          payment_mode = $8,
          txn_type = $9,
          device_id = $10,
          operator_id = $11,
          shift_id = $12,
          support_type = $13,
          extended_time = $14,
          "stationId" = $15,
          "destinationId" = $16,
          created_at = $17,
          updated_at = $18
        WHERE id = $1
        `,
        [
          t.id,
          t.order_id,
          t.amount,
          t.status,
          t.no_of_tickets,
          t.transaction_id,
          t.bank_txn_id,
          t.payment_mode,
          t.txn_type,
          t.device_id,
          t.operator_id,
          t.shift_id,
          t.support_type,
          t.extended_time,
          t.station_id,
          t.destination_id,
          t.created_at,
          t.updated_at
        ]
      );
    } else {
      // ➕ INSERT with SAME ID
      await db.query(
        `
        INSERT INTO "transaction" (
          id,
          order_id,
          amount,
          status,
          no_of_tickets,
          transaction_id,
          bank_txn_id,
          payment_mode,
          txn_type,
          device_id,
          operator_id,
          shift_id,
          support_type,
          extended_time,
          "stationId",
          "destinationId",
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18
        )
        `,
        [
          t.id,
          t.order_id,
          t.amount,
          t.status,
          t.no_of_tickets,
          t.transaction_id,
          t.bank_txn_id,
          t.payment_mode,
          t.txn_type,
          t.device_id,
          t.operator_id,
          t.shift_id,
          t.support_type,
          t.extended_time,
          t.station_id,
          t.destination_id,
          t.created_at,
          t.updated_at
        ]
      );
    }

    // 🔁 Sync QR under this transaction
    await this.syncQrs(t.qrs);

    count++;
  }

  return count;

}
static async syncQrs(qrs = []) {
  if (!Array.isArray(qrs) || qrs.length === 0) return;

  for (const q of qrs) {

    const exists = await db.query(
      `SELECT id FROM qr WHERE id = $1`,
      [q.id]
    );

    if (exists.rowCount > 0) {
      // 🔁 UPDATE
      await db.query(
        `
        UPDATE qr
        SET
          source_id = $2,
          destination_id = $3,
          amount = $4,
          qr_date_time = $5,
          status = $6,
          entry_time = $7,
          exit_time = $8,
          entry_gate_id = $9,
          exit_gate_id = $10,
          entry_station_id = $11,
          exit_station_id = $12,
          is_cancelled = $13,
          entry_count = $14,
          exit_count = $15,
          qr_ticket_no = $16,
          ref_ticket_no = $17,
          reason = $18,
          is_refreshed = $19,
          refund_time = $20,
          refund_device_id = $21,
          admin_fee = $22,
          qr_block = $23,
          "transactionId" = $24,
          type = $25,
          order_id = $26,
          no_of_tickets = $27,
          payment_mode = $28,
          refund_station_id = $29,
          refund_shift_id = $30,
          created_at = $31,
          updated_at = $32
        WHERE id = $1
        `,
        [
          q.id,
          q.source_id,
          q.destination_id,
          q.amount,
          q.qr_date_time,
          q.status,
          q.entry_time,
          q.exit_time,
          q.entry_gate_id,
          q.exit_gate_id,
          q.entry_station_id,
          q.exit_station_id,
          q.is_cancelled,
          q.entry_count,
          q.exit_count,
          q.qr_ticket_no,
          q.ref_ticket_no,
          q.reason,
          q.is_refreshed,
          q.refund_time,
          q.refund_device_id,
          q.admin_fee,
          q.qr_block,
          q.transaction_id,
          q.type,
          q.order_id,
          q.no_of_tickets,
          q.payment_mode,
          q.refund_station_id,
          q.refund_shift_id,
          q.created_at,
          q.updated_at
        ]
      );
    } else {
      // ➕ INSERT with SAME ID
      await db.query(
        `
        INSERT INTO qr (
          id,
          source_id,
          destination_id,
          amount,
          qr_date_time,
          status,
          entry_time,
          exit_time,
          entry_gate_id,
          exit_gate_id,
          entry_station_id,
          exit_station_id,
          is_cancelled,
          entry_count,
          exit_count,
          qr_ticket_no,
          ref_ticket_no,
          reason,
          is_refreshed,
          refund_time,
          refund_device_id,
          admin_fee,
          qr_block,
          "transactionId",
          type,
          order_id,
          no_of_tickets,
          payment_mode,
          refund_station_id,
          refund_shift_id,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
          $31,$32
        )
        `,
        [
          q.id,
          q.source_id,
          q.destination_id,
          q.amount,
          q.qr_date_time,
          q.status,
          q.entry_time,
          q.exit_time,
          q.entry_gate_id,
          q.exit_gate_id,
          q.entry_station_id,
          q.exit_station_id,
          q.is_cancelled,
          q.entry_count,
          q.exit_count,
          q.qr_ticket_no,
          q.ref_ticket_no,
          q.reason,
          q.is_refreshed,
          q.refund_time,
          q.refund_device_id,
          q.admin_fee,
          q.qr_block,
          q.transaction_id,
          q.type,
          q.order_id,
          q.no_of_tickets,
          q.payment_mode,
          q.refund_station_id,
          q.refund_shift_id,
          q.created_at,
          q.updated_at
        ]
      );
    }
  }
}



}

module.exports = InventoryService;
