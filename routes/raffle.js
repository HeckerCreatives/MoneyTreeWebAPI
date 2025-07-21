const router = require("express").Router();
const { addselectedplayer, getselectedplayers, selectwinner, getrafflewinners, resetselectedplayers, deletefromselectedplayers } = require("../controllers/raffle");
const { protectsuperadmin } = require("../middleware/middleware");

router
    .post("/addselectedplayer", protectsuperadmin, addselectedplayer)
    .get("/getselectedplayers", protectsuperadmin, getselectedplayers)
    .post("/resetselectedplayers", protectsuperadmin, resetselectedplayers)
    .post("/deleteselectedplayer", protectsuperadmin, deletefromselectedplayers)

    .post("/selectwinner", protectsuperadmin, selectwinner)
    .get("/getrafflewinners", protectsuperadmin, getrafflewinners);

module.exports = router;