import mysql from "mysql2/promise";
import * as dotenv from 'dotenv';
dotenv.config();
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
console.log(`Host: ${process.env.MYSQL_HOST}`);
console.log(`User: ${process.env.MYSQL_USER}`);
console.log(`Password: ${process.env.MYSQL_PASSWORD}`);
console.log(`DB: ${process.env.MYSQL_DATABASE}`);
export async function query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}
