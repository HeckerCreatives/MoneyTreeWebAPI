const { buytbank, gettinventory, treeclaimtotalincome, getplayertinventory, deleteplayertreeinventorysuperadmin } = require("../controllers/tinventory");
const { protectplayer, protectsuperadmin } = require("../middleware/middleware");

const router = require("express").Router();

router
 .post("/buytbank", protectplayer, buytbank)
 .get("/gettinventory", protectplayer, gettinventory)
 .post("/treeclaimtotalincome", protectplayer, treeclaimtotalincome)

 .get("/getplayertinventory", protectsuperadmin, getplayertinventory)
 .post("/deleteplayertinventory", protectsuperadmin, deleteplayertreeinventorysuperadmin)

module.exports = router;
 