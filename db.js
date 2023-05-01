import mariadb from 'mariadb';
// https://stackoverflow.com/a/74320569
import dotenv from 'dotenv';
// Load modules
import PoolManager from 'mysql-connection-pool-manager';

dotenv.config();

/* const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'course_management',
  connectionLimit: 5,
  waitForConnections: false,
  trace: false,
  idleTimeout: 1
}); */

// Define mySQL settings
const mySql = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'course_management',
}

// Pool manager settings
const poolManager = {
  idleCheckInterval: 1000,
  maxConnextionTimeout: 30000,
  idlePoolTimeout: 3000,
  errorLimit: 5,
  preInitDelay: 50,
  sessionTimeout: 60000,
  mySQLSettings: mySql
}

// Initialising the instance
const pool = PoolManager(poolManager);

export default pool;
