const { playerwallets, getplayerwalletforadmin } = require("../controllers/wallet")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()

router
 .get("/playerwallets", protectplayer, playerwallets)
 .get("/getplayerwalletforadmin", protectsuperadmin, getplayerwalletforadmin)



module.exports = router