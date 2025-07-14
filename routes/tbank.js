const { gettbanks, edittbank } = require("../controllers/tbank");
const { protectplayer, protectsuperadmin } = require("../middleware/middleware");

const router = require("express").Router();

router
 .get("/gettbank", protectplayer, gettbanks)
 .get("/gettbankadmin", protectsuperadmin, gettbanks)
 .post("/edittbank", protectsuperadmin, edittbank)

module.exports = router;