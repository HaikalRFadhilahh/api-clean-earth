const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const checkAuth = require("../middleware/CheckAuth");
const prisma = new PrismaClient();
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

  return res.status(200).json({
    status: "success",
    message: "data ulasan users",
    data: transformResultData,
  });
});

router.post("/create", checkAuth, async (req, res) => {
  const schema = {
    bintang: "number|min:1|max:5",
    komentar: "string|empty:false|min:5|max:255",
  };

  const validate = v.validate(req.body, schema);
  const checkUlasan = await prisma.ulasan.findFirst({
    where: {
      user_id: req.dataUser.id,
    },
  });

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  } else if (checkUlasan) {
    return res.status(409).json({
      status: "error",
      message: `error insert ulasan,user ${req.dataUser.nama} has submit ulasan`,
    });
  } else {
    try {
      const insertUlasan = await prisma.ulasan.create({
        data: {
          bintang: req.body.bintang,
          komentar: req.body.komentar,
          user_id: req.dataUser.id,
        },
      });

      return res.status(200).json({
        status: "success",
        message: "success insert data ulasan",
        data: insertUlasan,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "server error",
      });
    }
  }
});

router.post("/update", checkAuth, async (req, res) => {
  const schema = {
    bintang: "number|min:1|max:5",
    komentar: "string|empty:false|min:5|max:255",
  };

  const validate = v.validate(req.body, schema);
  const checkExistUlasan = await prisma.ulasan.findFirst({
    where: {
      user_id: req.dataUser.id,
    },
  });

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  } else if (checkExistUlasan) {
    try {
      const updateDataUlasan = await prisma.ulasan.update({
        where: {
          user_id: req.dataUser.id,
        },
        data: {
          bintang: req.body.bintang,
          komentar: req.body.komentar,
        },
      });

      return res.status(200).json({
        status: "success",
        message: `succes to edit ulasan for user ${req.dataUser.nama}`,
        data: updateDataUlasan,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "server error",
      });
    }
  } else {
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
      created_at_ulasan: item.ulasan_created_at,
      updated_at_ulasan: item.ulasan_updated_at,
      users: {
        id: item.user_id,
        nama: item.nama,
        username: item.username,
        email: item.email,
        kontak: item.kontak,
        created_at_user: item.user_created_at,
        updated_at_user: item.user_updated_at,
      },
    };
  });

  return transformedData;
}

module.exports = router;
