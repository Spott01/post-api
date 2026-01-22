const db = require('../config/db');
// const { istToUtc } = require('../utils/datetime.util');

class InventoryService {
  static async findAllStations() {
    const query = `
      SELECT
        s.id AS station_id,
        s.station_name,
        s.station_code,
        s.ip_address,
        s.is_active,
        l.id AS line_id,
        l.name AS line_name
      FROM station s
      LEFT JOIN line l ON l.id = s."lineId"
      ORDER BY s.id ASC
    `;

    const { rows } = await db.query(query);
    return rows;
  }
static async findAllFare() {
    const query = `
      SELECT
        id,
        station_id,
        fare
      FROM fare
      ORDER BY station_id ASC
    `;

    const { rows } = await db.query(query);
    return rows;
  }
  static async findAllEquipment() {
    const query = `
      SELECT
        e.id,
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
        e.model_type,
        e.direction_type,
        e.is_active,
        e.is_qr_active,
        e.created_at,
        e.updated_at,

        s.id   AS station_id,
        s.station_name,

        et.id  AS equipment_type_id,
        et.name AS equipment_type,

        es.id  AS equipment_status_id,
        es.name AS equipment_status,

        sm.id  AS special_mode_id,
        sm.name AS special_mode

      FROM equipment e
      LEFT JOIN station s ON s.id = e."stationId"
      LEFT JOIN equipment_type et ON et.id = e."equipmentTypeId"
      LEFT JOIN equipment_status es ON es.id = e."equipmentStatusId"
      LEFT JOIN special_mode sm ON sm.id = e."specialModeId"
      ORDER BY e.id ASC
    `;

    const { rows } = await db.query(query);
    return rows;
  }
 static async findAllUsers() {
  const query = `
    SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.mobile_number,
      u.designation,
      u.password,
      u.is_admin,
      u.is_super_admin,
      u.is_active,
      u.user_type_code,
      s.id AS station_id,
      s.station_name,
      ug.id AS user_group_id,
      ug.name AS user_group,
      ut.user_type_code AS user_type
    FROM "user" u
    LEFT JOIN station s ON s.id = u."stationId"
    LEFT JOIN user_group ug ON ug.id = u."userGroupId"
    LEFT JOIN user_type ut ON ut.user_type_code = u.user_type_code
    ORDER BY u.id ASC
  `;

  const { rows } = await db.query(query);
  return rows;
}
static async findAllLoginSessions() {
  const query = `
    SELECT
      ls.id,
      ls.device_id,
      ls.shift_id,
      ls.total_amount,
      ls.cash_amount,
      ls.card_amount,
      ls.upi_amount,
      ls.no_of_tickets,
      ls.no_of_tickets_cash,
      ls.no_of_tickets_upi,
      ls.no_of_tickets_card,
      ls.no_of_refund,
      ls.total_refund_amount,
      ls.no_of_cancelled,
      ls.total_cancelled_amount,
      ls.login_time,
      ls.logout_time,
      ls.created_at,
      ls.updated_at,
      ls.employee_id,
      ls.username,

      -- station
      s.id AS station_id,
      s.station_name,
      s.station_code,

      -- user
      u.id AS user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.mobile_number,
      u.designation,
      u.is_admin,
      u.is_super_admin

    FROM login_session ls
    LEFT JOIN station s ON s.id = ls.station_id
    LEFT JOIN "user" u ON u.id = ls.user_id
    ORDER BY ls.id DESC
  `;

  const { rows } = await db.query(query);
  return rows;
}


static async findLoginSessionsByDay(date) {
  const query = `
    SELECT
      ls.id,
      ls.device_id,
      ls.shift_id,
      ls.total_amount,
      ls.cash_amount,
      ls.card_amount,
      ls.upi_amount,
      ls.no_of_tickets,
      ls.no_of_tickets_cash,
      ls.no_of_tickets_upi,
      ls.no_of_tickets_card,
      ls.no_of_refund,
      ls.total_refund_amount,
      ls.no_of_cancelled,
      ls.total_cancelled_amount,
      ls.login_time,
      ls.logout_time,
      ls.created_at,
      ls.updated_at,
      ls.employee_id,
      ls.username,

      -- station
      s.id AS station_id,
      s.station_name,
      s.station_code,

      -- user
      u.id AS user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.mobile_number,
      u.designation,
      u.is_admin,
      u.is_super_admin

    FROM login_session ls
    LEFT JOIN station s ON s.id = ls.station_id
    LEFT JOIN "user" u ON u.id = ls.user_id
    WHERE ls.login_time >= $1::date
      AND ls.login_time < ($1::date + INTERVAL '1 day')
    ORDER BY ls.login_time DESC
  `;

  const { rows } = await db.query(query, [date]);
  return rows;
}
static async syncLoginSessions(
  stationId,
  date,
  fromTime,
  toTime,
  updatedAfter,
  limit = 100
) {
  let query = `
    SELECT
      ls.*,

      -- station
      s.id AS station_id,
      s.station_name,
      s.station_code,

      -- user
      u.id AS user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.mobile_number,
      u.designation,
      u.is_admin,
      u.is_super_admin

    FROM login_session ls
    LEFT JOIN station s ON s.id = ls.station_id
    LEFT JOIN "user" u ON u.id = ls.user_id
    WHERE 1 = 1
  `;

  const values = [];
  let idx = 1;

  /* =====================================================
     ✅ 1. INCREMENTAL SYNC (UPDATED_AT — UTC SAFE)
     ===================================================== */
  if (updatedAfter) {
    query += ` AND ls.updated_at > $${idx}::timestamptz`;
    values.push(updatedAfter);
    idx++;
  }

  /* =====================================================
     ✅ 2. DATE + TIME FILTER (IST INPUT → UTC MATCH)
     ===================================================== */
  else if (date) {
    const from = `${date} ${fromTime || '00:00'}:00`;
    const to   = `${date} ${toTime   || '23:59'}:59`;

    query += `
      AND ls.updated_at BETWEEN
        ($${idx}::timestamp AT TIME ZONE 'Asia/Kolkata')
        AND
        ($${idx + 1}::timestamp AT TIME ZONE 'Asia/Kolkata')
    `;

    values.push(from, to);
    idx += 2;
  }

  /* =====================================================
     ✅ 3. OPTIONAL STATION FILTER
     ===================================================== */
  if (stationId) {
    query += ` AND ls.station_id = $${idx}`;
    values.push(stationId);
    idx++;
  }

  /* =====================================================
     ✅ 4. ORDER & LIMIT
     ===================================================== */
  query += `
    ORDER BY ls.updated_at ASC
    LIMIT $${idx}
  `;
  values.push(limit);

  const { rows } = await db.query(query, values);

  return {
    status: 'success',
    count: rows.length,

    // ✅ Cursor always returned in UTC
    lastUpdatedAt: rows.length
      ? rows[rows.length - 1].updated_at
      : updatedAfter || null,

    data: rows
  };
}


static async syncTransactions(stationId, fromId = 0, limit = 100, date) {
  let startOfDay, endOfDay;

  if (date) {
    startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
  } else {
    startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
  }

  console.log(
    `Global sync request from station ${stationId || 'ALL'}, from transaction ID ${fromId}, date: ${startOfDay.toISOString().slice(0,10)}`
  );

  let query = `
    SELECT
      t.*,

      -- source station
      s.id AS station_id,
      s.station_name,
      s.station_code,

      -- destination station
      d.id AS destination_id,
      d.station_name AS destination_name,

      -- QR tickets
      json_agg(
        json_build_object(
          'id', q.id,
          'source_id', q.source_id,
          'destination_id', q.destination_id,
          'amount', q.amount,
          'qr_date_time', q.qr_date_time,
          'status', q.status,
          'entry_time', q.entry_time,
          'exit_time', q.exit_time,
          'entry_gate_id', q.entry_gate_id,
          'exit_gate_id', q.exit_gate_id,
          'entry_station_id', q.entry_station_id,
          'exit_station_id', q.exit_station_id,
          'is_cancelled', q.is_cancelled,
          'entry_count', q.entry_count,
          'exit_count', q.exit_count,
          'qr_ticket_no', q.qr_ticket_no,
          'ref_ticket_no', q.ref_ticket_no,
          'reason', q.reason,
          'is_refreshed', q.is_refreshed,
          'refund_time', q.refund_time,
          'refund_device_id', q.refund_device_id,
          'admin_fee', q.admin_fee,
          'qr_block', q.qr_block,
          'transaction_id', q."transactionId",
          'type', q.type,
          'created_at', q.created_at,
          'updated_at', q.updated_at,
          'extended_time', q.extended_time,
          'order_id', q.order_id,
          'no_of_tickets', q.no_of_tickets,
          'payment_mode', q.payment_mode,
          'refund_station_id', q.refund_station_id,
          'refund_shift_id', q.refund_shift_id
        )
      ) FILTER (WHERE q.id IS NOT NULL) AS qrs

    FROM transaction t
    LEFT JOIN station s ON s.id = t."stationId"
    LEFT JOIN station d ON d.id = t."destinationId"
    LEFT JOIN qr q ON q."transactionId" = t.id
    WHERE t.id > $1
      AND t.created_at >= $2
      AND t.created_at <= $3
  `;

  const values = [fromId, startOfDay, endOfDay];
  let paramIndex = 4;

  if (stationId) {
    query += ` AND t."stationId" = $${paramIndex}`;
    values.push(stationId);
    paramIndex++;
  }

  query += `
    GROUP BY t.id, s.id, d.id
    ORDER BY t.id ASC
  `;

  if (limit) {
    query += ` LIMIT $${paramIndex}`;
    values.push(limit);
  }

  const { rows } = await db.query(query, values);

  const lastId =
    rows.length > 0 ? rows[rows.length - 1].id : fromId;

  return {
    status: 'success',
    count: rows.length,
    lastId,
    data: rows,
  };
}

static async Transactions(
  stationId,
  fromId = 0,
  limit = 100,
  date,
  fromTime,
  toTime
) {
  let startDateTime, endDateTime;

  if (date) {
    // Base date
    startDateTime = new Date(`${date}T00:00:00`);
    endDateTime = new Date(`${date}T23:59:59.999`);

    // If time range is provided
    if (fromTime) {
      const [h, m] = fromTime.split(':');
      startDateTime.setHours(Number(h), Number(m), 0, 0);
    }

    if (toTime) {
      const [h, m] = toTime.split(':');
      endDateTime.setHours(Number(h), Number(m), 59, 999);
    }
  } else {
    // Default today
    startDateTime = new Date();
    startDateTime.setHours(0, 0, 0, 0);
    endDateTime = new Date();
    endDateTime.setHours(23, 59, 59, 999);
  }

  console.log(
    `Global sync request | station: ${stationId || 'ALL'} | fromId: ${fromId} | from: ${startDateTime.toISOString()} | to: ${endDateTime.toISOString()}`
  );

  let query = `
    SELECT
      t.*,
      s.id AS station_id,
      s.station_name,
      s.station_code,
      d.id AS destination_id,
      d.station_name AS destination_name,

      json_agg(
        json_build_object(
     'id', q.id,
          'source_id', q.source_id,
          'destination_id', q.destination_id,
          'amount', q.amount,
          'qr_date_time', q.qr_date_time,
          'status', q.status,
          'entry_time', q.entry_time,
          'exit_time', q.exit_time,
          'entry_gate_id', q.entry_gate_id,
          'exit_gate_id', q.exit_gate_id,
          'entry_station_id', q.entry_station_id,
          'exit_station_id', q.exit_station_id,
          'is_cancelled', q.is_cancelled,
          'entry_count', q.entry_count,
          'exit_count', q.exit_count,
          'qr_ticket_no', q.qr_ticket_no,
          'ref_ticket_no', q.ref_ticket_no,
          'reason', q.reason,
          'is_refreshed', q.is_refreshed,
          'refund_time', q.refund_time,
          'refund_device_id', q.refund_device_id,
          'admin_fee', q.admin_fee,
          'qr_block', q.qr_block,
          'transaction_id', q."transactionId",
          'type', q.type,
          'created_at', q.created_at,
          'updated_at', q.updated_at,
          'extended_time', q.extended_time,
          'order_id', q.order_id,
          'no_of_tickets', q.no_of_tickets,
          'payment_mode', q.payment_mode,
          'refund_station_id', q.refund_station_id,
          'refund_shift_id', q.refund_shift_id
        )
      ) FILTER (WHERE q.id IS NOT NULL) AS qrs

    FROM transaction t
    LEFT JOIN station s ON s.id = t."stationId"
    LEFT JOIN station d ON d.id = t."destinationId"
    LEFT JOIN qr q ON q."transactionId" = t.id
    WHERE t.id > $1
      AND t.created_at BETWEEN $2 AND $3
  `;

  const values = [fromId, startDateTime, endDateTime];
  let index = 4;

  if (stationId) {
    query += ` AND t."stationId" = $${index}`;
    values.push(stationId);
    index++;
  }

  query += `
    GROUP BY t.id, s.id, d.id
    ORDER BY t.id ASC
    LIMIT $${index}
  `;
  values.push(limit);

  const { rows } = await db.query(query, values);

  return {
    status: 'success',
    count: rows.length,
    lastId: rows.length ? rows[rows.length - 1].id : fromId,
    data: rows,
  };
}
static async syncQr(
  stationId,
  date,
  fromTime,
  toTime,
  updatedAfter,
  limit = 100
) {
  let query = `
    SELECT
      q.*,

      -- ✅ IST readable timestamps (for debugging / frontend)
      (q.created_at AT TIME ZONE 'Asia/Kolkata') AS created_at_ist,
      (q.updated_at AT TIME ZONE 'Asia/Kolkata') AS updated_at_ist,
      (q.entry_time AT TIME ZONE 'Asia/Kolkata') AS entry_time_ist,
      (q.exit_time  AT TIME ZONE 'Asia/Kolkata') AS exit_time_ist,

      s.station_name AS refund_station_name
    FROM qr q
    LEFT JOIN station s ON s.id = q.refund_station_id
    WHERE 1 = 1
  `;

  const values = [];
  let idx = 1;

  /* =====================================================
     ✅ 1. INCREMENTAL SYNC (UTC cursor)
     ===================================================== */
  if (updatedAfter) {
    query += ` AND q.updated_at > $${idx}::timestamptz`;
    values.push(updatedAfter);
    idx++;
  }

  /* =====================================================
     ✅ 2. IST DATE + TIME FILTER
     ===================================================== */
  else if (date) {
    const from = `${date} ${fromTime || '00:00'}:00`;
    const to   = `${date} ${toTime   || '23:59'}:59`;

    query += `
      AND q.updated_at BETWEEN
        ($${idx}::timestamp AT TIME ZONE 'Asia/Kolkata')
        AND
        ($${idx + 1}::timestamp AT TIME ZONE 'Asia/Kolkata')
    `;

    values.push(from, to);
    idx += 2;
  }

  /* =====================================================
     ✅ 3. OPTIONAL STATION FILTER
     ===================================================== */
  if (stationId) {
    query += ` AND q.refund_station_id = $${idx}`;
    values.push(stationId);
    idx++;
  }

  /* =====================================================
     ✅ 4. ORDER + LIMIT
     ===================================================== */
  query += `
    ORDER BY q.updated_at ASC
    LIMIT $${idx}
  `;
  values.push(limit);

  const { rows } = await db.query(query, values);

  return {
    status: 'success',
    count: rows.length,

    // ✅ Always return UTC cursor
    lastUpdatedAt: rows.length
      ? rows[rows.length - 1].updated_at
      : updatedAfter || null,

    data: rows
  };
}













}

module.exports = InventoryService;

