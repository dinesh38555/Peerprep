const express = require("express");
const router = express.Router();
const sheetsController = require("../../controllers/sheetsController");
router.get("/",sheetsController.getAllSheets);

module.exports = router;
