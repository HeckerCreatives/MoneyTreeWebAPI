
const { getunclaimedincomeinventory, getinventory, getinventoryhistory, gettotalpurchased, buybank, getinventoryhistoryuseradmin, getplayerinventoryforadmin, claimtotalincome, maxplayerinventorysuperadmin, deleteplayerinventorysuperadmin, deleteplayerinventoryhistorysuperadmin, dailyclaimhistory, dailyclaimhistorysa, deletedailyclaimhistorysa } = require("../controllers/inventory")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()


router 
.get("/getunclaimedincomeinventory", protectplayer, getunclaimedincomeinventory)
.get("/getinventory", protectplayer, getinventory)
.get("/getinventoryhistory", protectplayer, getinventoryhistory)
.get("/gettotalpurchased", protectplayer, gettotalpurchased)
.get("/dailyclaimhistory", protectplayer, dailyclaimhistory)
.post("/buybank", protectplayer, buybank)
.post("/claimtotalincome", protectplayer, claimtotalincome)

.get("/dailyclaimhistorysa", protectsuperadmin, dailyclaimhistorysa)
.get("/getinventoryhistoryuseradmin", protectsuperadmin, getinventoryhistoryuseradmin)
.get("/getplayerinventoryforadmin", protectsuperadmin, getplayerinventoryforadmin)
.post("/maxplayerinventorysuperadmin", protectsuperadmin, maxplayerinventorysuperadmin)
.post("/deleteplayerinventoryforadmin", protectsuperadmin, deleteplayerinventorysuperadmin)
.post("/deleteplayerinventoryhistorysuperadmin", protectsuperadmin, deleteplayerinventoryhistorysuperadmin)
.post("/deletedailyclaimhistorysa", protectsuperadmin, deletedailyclaimhistorysa)

module.exports = router