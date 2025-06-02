const router = require("express").Router()
const { getingamelist, updateingamelist, getplayerentrylimit, saveplayerentrylimit, gettierentry, setevententry, geteventtimelimit, saveeventtimelimit } = require("../controllers/ingame");
const { getmaintenance, changemaintenance, geteventmainte } = require("../controllers/maintenance")
const { protectsuperadmin, protectplayer } = require("../middleware/middleware")

router
    .get("/getingamelist", protectsuperadmin, getingamelist)
    .get("/getplayerentrylimit", protectsuperadmin, getplayerentrylimit)
    .get("/gettierentry", protectsuperadmin, gettierentry)
    .get("/geteventtimelimit", protectsuperadmin, geteventtimelimit)
    .post("/updateingamelist", protectsuperadmin, updateingamelist)
    .post("/saveplayerentrylimit", protectsuperadmin, saveplayerentrylimit)
    .post("/setevententry", protectsuperadmin, setevententry)
    .post("/saveeventtimelimit", protectsuperadmin, saveeventtimelimit)

module.exports = router;
