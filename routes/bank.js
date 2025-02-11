
const { getBanks, editbank } = require("../controllers/bank")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()


router
.get("/getbanks", protectplayer, getBanks)
.get("/getbanksadmin", protectsuperadmin, getBanks)
// .get("/getusertrainer", protectplayer, getusertrainer)
.post("/editbank", protectsuperadmin, editbank)

module.exports = router