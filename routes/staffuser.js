const router = require("express").Router()
const { getsadashboard, getadminlist, updateadmin, multiplebanstaffusers, getadmindashboard, searchadminlist, changepass, banunbanuser } = require("../controllers/staffuser")
const { protectsuperadmin, protectadmin } = require("../middleware/middleware")

router
    .get("/getsadashboard", protectsuperadmin, getsadashboard)
    .get("/getadminlist", protectsuperadmin, getadminlist)
    .get("/getadmindashboard", protectadmin, getadmindashboard)
    .get("/searchadminlist", protectsuperadmin, searchadminlist)
    .post("/updateadmin", protectsuperadmin, updateadmin)
    .post("/multiplebanstaffusers", protectsuperadmin, multiplebanstaffusers)
    .post("/changepasssuperadmin", protectsuperadmin, changepass)
    .post("/changepasadmin", protectadmin, changepass)
    .post("/banunbanuser", protectsuperadmin, banunbanuser)

module.exports = router;
