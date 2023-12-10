require("dotenv").config();
const mysql = require("mysql2/promise");
const { DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// connection.connect(function (err) {
//   if (err) throw err;
//   console.log("Database Connected!");
// });

module.exports = pool;
