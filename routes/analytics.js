const { getpayingraph, gettotalpayinperday, getunilevelpayoutgraph, getearningpayoutgraph, getproductgraph, getcommissiongraph, getreferrallinkstatus, getcommissionlist } = require('../controllers/analytics');
const { protectsuperadmin, protectplayer } = require('../middleware/middleware');

const router = require('express').Router();

router
.get("/getreferrallinkstatus", protectplayer, getreferrallinkstatus)
.get("/getpayingraph", protectsuperadmin, getpayingraph)
.get("/getcommissiongraph", protectsuperadmin, getcommissiongraph)
.get("/getproductgraph", protectsuperadmin, getproductgraph)
.get("/getearningpayoutgraph", protectsuperadmin, getearningpayoutgraph)
.get("/getunilevelpayoutgraph", protectsuperadmin, getunilevelpayoutgraph)
.get("/gettotalpayinperday", protectsuperadmin, gettotalpayinperday)
.get("/getcommisionlist", protectsuperadmin, getcommissionlist)

module.exports = router;