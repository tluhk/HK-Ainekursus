import mariadb from 'mariadb';
// https://stackoverflow.com/a/74320569
import dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'course_management',
  connectionLimit: 5,
  waitForConnections: true,
  trace: false,
});

export default pool;
