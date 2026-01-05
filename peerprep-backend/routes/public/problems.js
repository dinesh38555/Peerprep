const express = require("express");
const router = express.Router();
const problemsController = require("../../controllers/problemsController");

router.get("/sheet/:sheet_id",problemsController.getProblemsBySheet);
router.get("/:id",problemsController.getProblemByID); 

module.exports = router;
