const router = require("express").Router()
const { requestpayout, getrequesthistoryplayer, processpayout, getpayoutlist, getpayouthistorysuperadmin, getpayouthistoryadmin, deletepayout, gettotalrequest } = require("../controllers/payout")
const { protectsuperadmin, protectplayer, protectadmin } = require("../middleware/middleware")

router
    .get("/getrequesthistoryplayer", protectplayer, getrequesthistoryplayer)
    .get("/getpayoutlist", protectsuperadmin, getpayoutlist)
    .get("/getpayouthistorysuperadmin", protectsuperadmin, getpayouthistorysuperadmin)
    .get("/getpayoutlistadmin", protectadmin, getpayoutlist)
    .get("/getpayouthistoryadmin", protectadmin, getpayouthistorysuperadmin)
    .get("/gettotalrequest", protectsuperadmin, gettotalrequest)
    .post("/deletepayout", protectsuperadmin, deletepayout)
    .post("/requestpayout", protectplayer, requestpayout)
    .post("/processpayout", protectsuperadmin, processpayout)
    .post("/processpayoutadmin", protectadmin, processpayout)

module.exports = router;
