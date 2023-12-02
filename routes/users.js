const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const Validator = require("fastest-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const v = new Validator();
const { SALT, JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRED } = process.env;

/* Post Request Method */
router.post("/login", async (req, res) => {
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

  const checkUsers = await prisma.users.findFirst({
    where: {
      email: req.body.email,
    },
  });

  if (checkUsers) {
    try {
      const isValidPass = await bcrypt.compare(
        req.body.password,
        checkUsers.password
      );

      if (isValidPass) {
        const token = jwt.sign(
          {
            id: checkUsers.id,
            nama: checkUsers.nama,
            email: checkUsers.email,
            username: checkUsers.username,
            kontak: checkUsers.kontak,
          },
          JWT_SECRET,
          {
            expiresIn: JWT_ACCESS_TOKEN_EXPIRED,
          }
        );

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

  const checkUser = await prisma.users.findFirst({
    where: {
      OR: [
        {
          username: req.body.username,
        },
        {
          email: req.body.email,
        },
        {
          kontak: req.body.kontak,
        },
      ],
    },
  });

  if (checkUser) {
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
      const registerUser = await prisma.users.create({
        data: {
          nama: req.body.nama,
          username: req.body.username,
          email: req.body.email,
          role: req.body.role,
          kontak: req.body.kontak,
          password: req.body.password,
        },
      });

      delete registerUser.password;

      return res.status(200).json({
        status: "success",
        message: registerUser,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.error,
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
module.exports = router;
