import mysql from "mysql2/promise";
import { env } from "../config/env.js";

export const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  connectionLimit: env.dbConnectionLimit,
  waitForConnections: true,
  queueLimit: 0,
});

export async function query(sql, params = []) {
  const [rowsOrResult] = await pool.query(sql, params);

  if (Array.isArray(rowsOrResult)) {
    return { rows: rowsOrResult, rowCount: rowsOrResult.length };
  }

  return {
    rows: [],
    rowCount: Number(rowsOrResult.affectedRows || 0),
    insertId: rowsOrResult.insertId,
  };
}
  