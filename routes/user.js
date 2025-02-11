const router = require("express").Router()
const { getuserdetails, updateuserprofile, getreferrallink, changepassworduser, changepassworduserforadmin, getuserdetailssuperadmin, searchplayerlist, getplayerlist, banunbanuser, multiplebanusers, getplayercount } = require("../controllers/user")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router
    .get("/getreferrallink", protectplayer, getreferrallink)
    .get("/getuserdetails", protectplayer, getuserdetails)
    .get("/getuserdetailssuperadmin", protectsuperadmin, getuserdetailssuperadmin)
    .post("/changepassworduser", protectplayer, changepassworduser)
    .post("/changepassworduserforadmin", protectsuperadmin, changepassworduserforadmin)
    .post("/updateuserprofile", protectplayer, updateuserprofile)
    .get("/searchplayerlist", protectsuperadmin, searchplayerlist)
    .post("/banunbanuser", protectsuperadmin, banunbanuser)
    .get("/getplayerlist", protectsuperadmin, getplayerlist)
    .post("/multiplebanusers", protectsuperadmin, multiplebanusers)

    .get("/getplayercount", protectsuperadmin, getplayercount)

module.exports = router;
