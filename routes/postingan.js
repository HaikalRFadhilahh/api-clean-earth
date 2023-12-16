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
router.post("/", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const connection = await pool.getConnection();

  try {
    const [dataPostingan, result] = await connection.execute(
      `select p.*,u.*,p.id as id,u.id as user_pk_id,p.created_at as created_at,p.updated_at as updated_at,u.created_at as user_created_at,u.updated_at as user_updated_at from postingan p inner join users u on p.user_id = u.id order by p.updated_at desc limit ${limit}`
    );
    connection.release();
    var data;
    if (dataPostingan.length > 0) {
      data = dataPostingan.map((item) => {
        return {
          id: item.id,
          judul: item.judul,
          slug: item.slug,
          isi: item.isi,
          created_at: item.created_at,
          updated_at: item.updated_at,
          users: {
            id: item.user_pk_id,
            nama: item.nama,
            username: item.username,
            email: item.email,
            role: item.role,
            kontak: item.kontak,
            created_at: item.user_created_at,
            updated_at: item.user_created_at,
          },
        };
      });
    }

    return res.status(200).json({
      status: "success",
      message: "data postingan",
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
    judul: "string|empty:false|min:5|max:255",
    isi: "string|empty:false|min:50",
  };

  const validate = v.validate(req.body, schema);

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  }

  try {
    const connection = await pool.getConnection();
    const isi = req.body.isi;
    const sluq = isi.substring(0, 80) + "...";
    const [data, fields] = await connection.execute(
      `insert into postingan(judul,slug,isi,user_id) values ('${
        req.body.judul
      }','${sluq}','${req.body.isi}',${parseInt(req.dataUser.id)})`
    );
    connection.release();
    return res.status(200).json({
      status: "success",
      message: "success insert postingan",
      data: {
        judul: req.body.judul,
        slug: sluq,
        isi: req.body.isi,
        user_id: req.dataUser.id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error,
    });
  }
});

router.delete("/delete/:id", checkAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const schema = {
    id: "number|min:1",
  };

  const validate = v.validate({ id: id }, schema);

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      messsage: validate,
    });
  }

  try {
    const connection = await pool.getConnection();
    await connection.execute(`delete from postingan where id=${id}`);
    connection.release();

    return res.status(200).json({
      status: "success",
      message: `Postingan id ${id} has been deleted`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "server error",
    });
  }
});

router.put("/update/:id", checkAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const schema = {
    judul: "string|empty:false|min:5|max:255",
    isi: "string|empty:false|min:50",
  };

  const validate = v.validate(req.body, schema);

  if (validate.length) {
    return res.status(400).json({
      status: "error",
      message: validate,
    });
  }

  try {
    const connection = await pool.getConnection();
    var [dataPost, fields] = await connection.execute(
      `select * from postingan where id=${id}`
    );
    if (dataPost.length <= 0) {
      return res.status(404).json({
        status: "error",
        message: "postingan not found",
      });
    }
    dataPost = dataPost[0];
    const isi = req.body.isi;
    const sluq = isi.substring(0, 80) + "...";
    await connection.execute(
      `update postingan set judul='${req.body.judul}',slug='${sluq}',isi='${req.body.isi}' where id=${id}`
    );

    return res.status(200).json({
      status: "success",
      message: "success edit postingan",
      data: {
        id: dataPost.id,
        judul: req.body.judul,
        slug: sluq,
        isi: isi,
        user_id: dataPost.user_id,
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
    var [result, fields] = await connection.execute(
      `select p.*,u.*,p.id as id,u.id as user_pk_id,p.created_at as created_at,p.updated_at as updated_at,u.created_at as user_created_at,u.updated_at as user_updated_at from postingan p inner join users u on p.user_id = u.id where p.id = ${id}`
    );
    connection.release();
    result = result[0];
    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "data postingan not found",
      });
    } else {
      return res.status(200).json({
        status: "success",
        message: "data postingan",
        data: {
          id: result.id,
          judul: result.judul,
          slug: result.slug,
          isi: result.isi,
          created_at: result.created_at,
          updated_at: result.updated_at,
          users: {
            id: result.user_pk_id,
            nama: result.nama,
            username: result.username,
            email: result.email,
            role: result.role,
            kontak: result.kontak,
            created_at: result.user_created_at,
            updated_at: result.user_created_at,
          },
        },
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
