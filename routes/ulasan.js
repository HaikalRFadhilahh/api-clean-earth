const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/CheckAuth");
const Validator = require("fastest-validator");
const pool = require("../database/connection");
const v = new Validator();

router.post("/", async (req, res) => {
  const connection = await pool.getConnection();
  const q = parseInt(req.query.q) || undefined;

  var query;
  if (q == undefined) {
    query =
      "SELECT a.*, b.*, a.created_at AS ulasan_created_at, a.updated_at AS ulasan_updated_at,b.created_at AS user_created_at, b.updated_at AS user_updated_at FROM ulasan a INNER JOIN users b ON a.user_id = b.id ORDER BY a.created_at DESC";
  } else {
    query = `SELECT a.*, b.*, a.created_at AS ulasan_created_at, a.updated_at AS ulasan_updated_at,b.created_at AS user_created_at, b.updated_at AS user_updated_at FROM ulasan a INNER JOIN users b ON a.user_id = b.id where a.user_id=${q} ORDER BY a.created_at DESC`;
  }
  const [result, fields] = await connection.execute(query);
  const transformResultData = transformData(result);
  connection.release();

  return res.status(200).json({
    status: "success",
    message: "data ulasan users",
    data: transformResultData,
  });
});

router.post("/create", checkAuth, async (req, res) => {
  const connection = await pool.getConnection();
  const schema = {
    bintang: "number|min:1|max:5",
    komentar: "string|empty:false|min:5|max:255",
  };

  const validate = v.validate(req.body, schema);
  var [checkUlasan, fields] = await connection.execute(
    `select * from ulasan where user_id=${req.dataUser.id}`
  );

  checkUlasan = checkUlasan[0];

  if (validate.length) {
    connection.release();
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  } else if (checkUlasan) {
    connection.release();
    return res.status(409).json({
      status: "error",
      message: `error insert ulasan,user ${req.dataUser.nama} has submit ulasan`,
    });
  } else {
    try {
      const [result, fields] = await connection.execute(
        `insert into ulasan(bintang,komentar,user_id) values (${req.body.bintang},'${req.body.komentar}',${req.dataUser.id})`
      );
      connection.release();
      return res.status(200).json({
        status: "success",
        message: "success insert data ulasan",
        data: {
          bintang: req.body.bintang,
          komentar: req.body.komentar,
          user_id: req.dataUser.id,
        },
      });
    } catch (error) {
      connection.release();
      return res.status(500).json({
        status: "error",
        message: "server error",
      });
    }
  }
});

router.post("/update", checkAuth, async (req, res) => {
  const connection = await pool.getConnection();
  const schema = {
    bintang: "number|min:1|max:5",
    komentar: "string|empty:false|min:5|max:255",
  };

  const validate = v.validate(req.body, schema);
  var [checkExistUlasan, fields] = await connection.execute(
    `select * from ulasan where user_id=${req.dataUser.id}`
  );
  checkExistUlasan = checkExistUlasan[0];

  if (validate.length) {
    connection.release();
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  } else if (checkExistUlasan) {
    try {
      const [result, fields] = await connection.execute(
        `update ulasan set bintang=${req.body.bintang},komentar='${req.body.komentar}' where user_id=${req.dataUser.id}`
      );
      connection.release();
      return res.status(200).json({
        status: "success",
        message: `succes to edit ulasan for user ${req.dataUser.nama}`,
        data: {
          bintang: req.body.bintang,
          komentar: req.body.komentar,
        },
      });
    } catch (error) {
      connection.release();
      return res.status(500).json({
        status: "error",
        message: "server error",
      });
    }
  } else {
    connection.release();
    return res.status(404).json({
      status: "error",
      message: `Data Ulasan User ${req.dataUser.nama} Not Found!`,
    });
  }
});

function transformData(inputData) {
  const transformedData = inputData.map((item) => {
    return {
      id: item.id,
      bintang: item.bintang,
      komentar: item.komentar,
      user_id: item.user_id,
      created_at: item.ulasan_created_at,
      updated_at: item.ulasan_updated_at,
      users: {
        id: item.user_id,
        nama: item.nama,
        username: item.username,
        email: item.email,
        kontak: item.kontak,
        created_at: item.user_created_at,
        updated_at: item.user_updated_at,
      },
    };
  });

  return transformedData;
}

module.exports = router;
