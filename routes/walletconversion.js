const { convertwallet, getwalletconversionhistory } = require("../controllers/walletconversion")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()

router
 .post("/convertwallet", protectplayer, convertwallet)
 .get("/getwalletconversionhistory", protectplayer, getwalletconversionhistory)

module.exports = router