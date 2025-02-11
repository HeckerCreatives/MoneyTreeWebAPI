const router = require("express").Router()
const { getpayinlist, processpayin, getpayinhistorysuperadmin, requestpayin, getpayinhistoryplayer, getpayinhistoryadmin, sendfiattoplayer, getpayingraph, deletepayinplayersuperadmin, gettotalpayin } = require("../controllers/payin")
const { protectsuperadmin, protectplayer, protectadmin } = require("../middleware/middleware")

router
    .get("/getpayinlist", protectsuperadmin, getpayinlist)
    .get("/getpayinhistorysuperadmin", protectsuperadmin, getpayinhistorysuperadmin)
    .get("/getpayinhistoryplayer", protectplayer, getpayinhistoryplayer)
    .get("/getpayinlistadmin", protectadmin, getpayinlist)
    .get("/getpayinhistoryadmin", protectadmin, getpayinhistoryadmin)
    .get("/gettotalpayin", gettotalpayin)
    .post("/processpayin", protectsuperadmin, processpayin)
    .post("/requestpayin", protectplayer, requestpayin)
    .post("/processpayinadmin", protectadmin, processpayin)
    .post("/superadminsendfiatplayer", protectsuperadmin, sendfiattoplayer)
    .post("/adminsendfiatplayer", protectadmin, sendfiattoplayer)
    .post("/deletepayinplayersuperadminn", protectsuperadmin, deletepayinplayersuperadmin)

module.exports = router;
