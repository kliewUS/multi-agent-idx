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

export async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
}

export async function closeConnection(): Promise<void> { //Must close the pool to prevent hanging after getting the results.
    await pool.end();
    console.log("Pool connection closed.");
}