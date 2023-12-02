const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const checkAuth = require("../middleware/CheckAuth");
const prisma = new PrismaClient();
const Validator = require("fastest-validator");

const v = new Validator();

router.post("/", async (req, res) => {
  const q = parseInt(req.query.q) || undefined;
  const dataUlasan = await prisma.ulasan.findMany({
    where: {
      user_id: q,
    },
    include: {
      users: {
        select: {
          id: true,
          nama: true,
          username: true,
          email: true,
          kontak: true,
          created_at: true,
          updated_at: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return res.status(200).json({
    status: "success",
    message: "data ulasan users",
    data: dataUlasan,
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

module.exports = router;
