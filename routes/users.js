const express = require("express");
const router = express.Router();
const Validator = require("fastest-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database/connection");
const v = new Validator();
const checkAuth = require("../middleware/CheckAuth");
const isBase64 = require("is-base64");
const base64Img = require("base64-img");
const fs = require("fs");
const { SALT, JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRED } = process.env;

/* Post Request Method */
router.post("/login", async (req, res) => {
  const connection = await pool.getConnection();
  const schema = {
    email: "email|empty:false",
    password: "string|empty:false",
  };

  const validate = v.validate(req.body, schema);

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  }

  let [checkUsers, fields] = await connection.execute(
    `select * from users where email='${req.body.email}'`
  );

  connection.release();

  checkUsers = checkUsers[0];

  if (checkUsers) {
    try {
      const isValidPass = await bcrypt.compare(
        req.body.password,
        checkUsers.password
      );

      if (isValidPass) {
        const token = jwt.sign(checkUsers, JWT_SECRET, {
          expiresIn: JWT_ACCESS_TOKEN_EXPIRED,
        });

        return res.status(200).json({
          status: "success",
          token: token,
        });
      } else {
        return res.status(403).json({
          status: "error",
          message: "email atau password salah",
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.error,
      });
    }
  } else {
    return res.status(403).json({
      status: "error",
      message: "email atau password salah",
    });
  }
});

router.post("/register", async (req, res) => {
  req.body.role = "user";
  const connection = await pool.getConnection();

  const schema = {
    nama: "string|min:3",
    username: "string|min:3",
    email: "email",
    kontak: "string",
    password: "string|min:3",
  };

  const validate = v.validate(req.body, schema);

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  }

  var [checkUser, fields] = await connection.execute(
    `select * from users where username='${req.body.username}' or email='${req.body.email}' or kontak='${req.body.kontak}'`
  );

  checkUser = checkUser[0];

  if (checkUser) {
    connection.release();
    let err;
    if (checkUser.username == req.body.username) {
      err = "Username";
    } else if (checkUser.email == req.body.email) {
      err = "Email";
    } else if (checkUser.kontak == req.body.kontak) {
      err = "Kontak";
    }

    return res.status(409).json({
      status: "error",
      message: `${err} Udah Terpakai Harap Ganti Gunakan ${err} Anda Yang Lain!`,
    });
  } else {
    try {
      req.body.password = await bcrypt.hash(req.body.password, parseInt(SALT));
      const [result, fields] = await connection.execute(
        `insert into users (nama,username,email,role,kontak,password) values ('${req.body.nama}','${req.body.username}','${req.body.email}','${req.body.role}','${req.body.kontak}','${req.body.password}')`
      );

      connection.release();
      return res.status(200).json({
        status: "success",
        message: {
          nama: req.body.nama,
          username: req.body.username,
          email: req.body.email,
          role: req.body.role,
          kontak: req.body.kontak,
        },
      });
    } catch (error) {
      connection.release();
      return res.status(500).json({
        status: "error",
      });
    }
  }
});

router.post("/validate", async (req, res) => {
  const AuthToken = req.headers.authorization;

  if (AuthToken == undefined || AuthToken == null || AuthToken == "") {
    return res.status(403).json({
      status: "error",
      message: "invalid token!",
    });
  } else {
    try {
      const dataDecode = jwt.verify(AuthToken, JWT_SECRET);
      return res.status(200).json({
        status: "success",
        message: "users data",
        data: dataDecode,
      });
    } catch (error) {
      return res.status(403).json({
        status: "error",
        message: "invalid token!",
      });
    }
  }
});

router.put("/update", checkAuth, async (req, res) => {
  const schema = {
    nama: "string|min:3",
    username: "string|min:3",
    email: "email",
    kontak: "string",
    password: "string|optional|min:3",
    img: "string|optional",
    usia: "number|min:5",
    alamat: "string|min:5",
    gender: {
      type: "enum",
      values: ["L", "P"],
    },
  };

  const validate = v.validate(req.body, schema);

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  }

  /* Validation Data username,email,and kontak */
  const connection = await pool.getConnection();
  var [checkUsers, fields] = await connection.execute(
    `select * from users where ( email='${req.body.email}' or username='${req.body.username}' or kontak='${req.body.kontak}') and id != ${req.dataUser.id}`
  );
  connection.release();

  if (
    (req.body.username != undefined ||
      req.body.email != undefined ||
      req.body.kontak != undefined) &&
    checkUsers.length > 0
  ) {
    checkUsers = checkUsers[0];

    if (checkUsers.username == req.body.username) {
      return res.status(409).json({
        status: "error",
        message: "Username Sudah Di Gunakan Harap Ganti Username Yang Lain",
      });
    } else if (checkUsers.email == req.body.email) {
      return res.status(409).json({
        status: "error",
        message: "Email Sudah Di Gunakan Harap Ganti Email Yang Lain",
      });
    } else if (checkUsers.kontak == req.body.kontak) {
      return res.status(409).json({
        status: "error",
        message: "Kontak Sudah Di Gunakan Harap Ganti Kontak Yang Lain",
      });
    }
  }

  /* updating data users */
  const conn = await pool.getConnection();
  if (req.body.image == null || req.body.image == undefined) {
    var query;
    if (req.body.password == null || req.body.password == undefined) {
      query = `update users set nama='${req.body.nama}',username='${req.body.username}',email='${req.body.email}',kontak='${req.body.kontak}',usia=${req.body.usia},alamat='${req.body.alamat}',gender='${req.body.gender}' where id = ${req.dataUser.id}`;
    } else {
      const password = await bcrypt.hash(req.body.password, parseInt(SALT));
      query = `update users set nama='${req.body.nama}',username='${req.body.username}',email='${req.body.email}',kontak='${req.body.kontak}',password='${password}',usia=${req.body.usia},alamat='${req.body.alamat}',gender='${req.body.gender}' where id = ${req.dataUser.id}`;
    }
    await conn.execute(query);
    const [d, f] = await connection.execute(
      `select * from users where id=${req.dataUser.id}`
    );
    conn.release();
    const token = jwt.sign(d[0], JWT_SECRET, {
      expiresIn: JWT_ACCESS_TOKEN_EXPIRED,
    });
    return res.status(200).json({
      status: "success",
      message: "success edit data users",
      token: token,
    });
  } else {
    if (!isBase64(req.body.image, { mimeRequired: true })) {
      return res.status(400).json({
        status: "error",
        message: "invalid image type ",
      });
    }

    const check = await pool.getConnection();
    var [d, f] = await check.execute(
      `select * from users where id=${req.dataUser.id}`
    );
    check.release();

    d = d[0];
    if (d.image != null) {
      fs.access(`./public${d.image}`, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(`./public${d.image}`, async (err) => {
            if (err) {
              return res.status(500).json({
                status: "error",
                message: "server error",
              });
            }
          });
        }
      });
    }

    base64Img.img(
      req.body.image,
      "./public/images",
      Date.now(),
      async (err, filepath) => {
        if (err) {
          return res.status(400).json({
            status: "error",
            message: err.message,
          });
        }

        const filename = filepath.split("/").pop();

        var query;
        if (req.body.password == null || req.body.password == undefined) {
          query = `update users set nama='${req.body.nama}',username='${req.body.username}',email='${req.body.email}',kontak='${req.body.kontak}',image='/images/${filename}',usia=${req.body.usia},alamat='${req.body.alamat}',gender='${req.body.gender}' where id = ${req.dataUser.id}`;
        } else {
          const password = await bcrypt.hash(req.body.password, parseInt(SALT));
          query = `update users set nama='${req.body.nama}',username='${req.body.username}',email='${req.body.email}',kontak='${req.body.kontak}',password='${password}',image='/images/${filename}',usia=${req.body.usia},alamat='${req.body.alamat}',gender='${req.body.gender}' where id = ${req.dataUser.id}`;
        }

        await conn.execute(query);
        const [d, f] = await connection.execute(
          `select * from users where id=${req.dataUser.id}`
        );
        conn.release();
        const token = jwt.sign(d[0], JWT_SECRET, {
          expiresIn: JWT_ACCESS_TOKEN_EXPIRED,
        });
        return res.status(200).json({
          status: "success",
          message: "success edit data users",
          token: token,
        });
      }
    );
  }
});

router.delete("/delete/:id", checkAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id) || undefined;
    console.log(id);
    if (id == NaN || id == undefined) {
      return res.status(400).json({
        status: "error",
        message: "Id User Must Be Integer",
      });
    } else {
      const connection = await pool.getConnection();
      await connection.execute(`delete from users where id=${id}`);
      connection.release();
      return res.status(200).json({
        status: "success",
        message: `User With Id ${id} Has Success Deleted`,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "server error",
    });
  }
});

router.post("/getusers", checkAuth, async (req, res) => {
  const limit = parseInt(req.query.limit) || undefined;
  var query = `select id,nama,username,email,alamat,role,kontak,image,created_at,updated_at from users`;

  if (limit != undefined && limit != 0 && limit != null) {
    query = `select id,nama,username,email,alamat,role,kontak,image,created_at,updated_at from users limit ${limit}`;
  }

  try {
    const connection = await pool.getConnection();
    const [result, fields] = await connection.execute(query);
    connection.release();
    return res.status(200).json({
      status: "error",
      message: "data users",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "server error",
    });
  }
});
module.exports = router;
