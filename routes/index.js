const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("Hi!,Clean Earth here.Looks like you are lost");
});

module.exports = router;
