require("dotenv").config();
const mysql = require("mysql2");
const { DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;

const connection = mysql.createConnection({
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USERNAME,
  password: DB_PASSWORD,
});

connection.connect(function (err) {
  if (err) throw err;
  console.log("Database Connected!");
});

module.exports = connection;
