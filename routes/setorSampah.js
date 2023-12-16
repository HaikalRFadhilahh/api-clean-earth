/* Import Require Library */
const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/CheckAuth");
const Validator = require("fastest-validator");
const pool = require("../database/connection");

/* Declare Class */
const v = new Validator();

/* GET Postingan Route */

/* POST Postingan Route */
router.post("/", checkAuth, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result, fields] = await connection.execute(
      "select a.*,b.*,a.id as id,a.created_at as created_at,a.updated_at as updated_at,b.id as user_pk_id,b.created_at as user_created_at,b.updated_at as user_updated_at from setorsampah a inner join users b on a.user_id = b.id"
    );
    connection.release();
    const data = result.map((items) => {
      return {
        id: items.id,
        user_id: items.user_id,
        waktu: items.waktu,
        jenis_sampah: items.jenis_sampah,
        jumlah: items.jumlah,
        nominal: items.nominal,
        created_at: items.created_at,
        updated_at: items.updated_at,
        users: {
          id: items.user_pk_id,
          nama: items.nama,
          username: items.username,
          email: items.email,
          role: items.role,
          kontak: items.kontak,
          image: items.image,
          created_at: items.user_created_at,
          updated_at: items.user_updated_at,
        },
      };
    });
    return res.status(200).json({
      status: "success",
      message: "data user",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "server error",
    });
  }
});

router.post("/create", checkAuth, async (req, res) => {
  const schema = {
    user_id: "number|min:1",
    jenis_sampah: "string|min:3|max:255",
    jumlah: "number|min:1",
    nominal: "number|min:500",
  };

  const validate = v.validate(req.body, schema);

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  }

  try {
    const data = req.body;
    const connection = await pool.getConnection();
    await connection.execute(
      `insert into setorsampah(user_id,waktu,jenis_sampah,jumlah,nominal) values (${data.user_id},'${data.waktu}','${data.jenis_sampah}',${data.jumlah},${data.nominal})`
    );
    connection.release();

    return res.status(200).json({
      status: "success",
      message: "insert data setorsampah",
      data: {
        user_id: data.user_id,
        waktu: data.waktu,
        jenis_sampah: data.jenis_sampah,
        jumlah: data.jumlah,
        nominal: data.nominal,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "server error",
      data: error,
    });
  }
});

router.post("/:id", checkAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const connection = await pool.getConnection();
    const [result, fields] = await connection.execute(
      `select a.*,b.*,a.id as id,a.created_at as created_at,a.updated_at as updated_at,b.id as user_pk_id,b.created_at as user_created_at,b.updated_at as user_updated_at from setorsampah a inner join users b on a.user_id = b.id where a.id = ${id}`
    );
    connection.release();
    const data = result[0];
    if (data) {
      return res.status(200).json({
        status: "success",
        message: "fetch data users",
        data: {
          id: data.id,
          user_id: data.user_id,
          waktu: data.waktu,
          jenis_sampah: data.jenis_sampah,
          jumlah: data.jumlah,
          nominal: data.nominal,
          created_at: data.created_at,
          updated_at: data.updated_at,
          users: {
            id: data.user_pk_id,
            nama: data.nama,
            username: data.username,
            email: data.email,
            role: data.role,
            kontak: data.kontak,
            image: data.image,
            created_at: data.user_created_at,
            updated_at: data.user_updated_at,
          },
        },
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "data setor sampah not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "server error",
    });
  }
});

module.exports = router;
