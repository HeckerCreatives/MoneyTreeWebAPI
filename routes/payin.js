const router = require("express").Router()
const { getpayinlist, processpayin, getpayinhistorysuperadmin, requestpayin, getpayinhistoryplayer, getpayinhistoryadmin, sendfiattoplayer, getpayingraph, deletepayinplayersuperadmin, gettotalpayin } = require("../controllers/payin")
const { protectsuperadmin, protectplayer, protectadmin } = require("../middleware/middleware")

router
    .get("/getpayinlist", protectsuperadmin, getpayinlist)
    .get("/getpayinhistorysuperadmin", protectsuperadmin, getpayinhistorysuperadmin)
    .get("/getpayinhistoryplayer", protectplayer, getpayinhistoryplayer)
    .get("/gettotalpayin", gettotalpayin)
    .post("/processpayin", protectsuperadmin, processpayin)
    .post("/requestpayin", protectplayer, requestpayin)
    .post("/superadminsendfiatplayer", protectsuperadmin, sendfiattoplayer)
    .post("/deletepayinplayersuperadminn", protectsuperadmin, deletepayinplayersuperadmin)
    
    .get("/getpayinhistoryadmin", protectadmin, getpayinhistoryadmin)
    .get("/getpayinlistadmin", protectadmin, getpayinlist)
    .post("/processpayinadmin", protectadmin, processpayin)
    .post("/adminsendfiatplayer", protectadmin, sendfiattoplayer)
module.exports = router;
