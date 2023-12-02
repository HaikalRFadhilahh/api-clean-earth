require("dotenv").config;
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const checkAuth = async (req, res, next) => {
  token = req.headers.authorization;
  if (token == undefined || token == "" || token == null) {
    return res.status(400).json({
      status: "error",
      message: "token cannot be null",
    });
  } else {
    jwt.verify(token, JWT_SECRET, (err, decode) => {
      if (err) {
        return res.status(403).json({
          status: "error",
          message: "invalid token",
        });
      } else {
        req.dataUser = decode;
        next();
      }
    });
  }
};

module.exports = checkAuth;
