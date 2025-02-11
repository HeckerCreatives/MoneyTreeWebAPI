
const { getunclaimedincomeinventory, getinventory, getinventoryhistory, gettotalpurchased, buybank, getinventoryhistoryuseradmin, getplayerinventoryforadmin, claimtotalincome } = require("../controllers/inventory")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()


router 
.get("/getunclaimedincomeinventory", protectplayer, getunclaimedincomeinventory)
.get("/getinventory", protectplayer, getinventory)
.get("/getinventoryhistory", protectplayer, getinventoryhistory)
.get("/gettotalpurchased", protectplayer, gettotalpurchased)
.post("/buybank", protectplayer, buybank)
.post("/claimtotalincome", protectplayer, claimtotalincome)

.get("/getinventoryhistoryuseradmin", protectsuperadmin, getinventoryhistoryuseradmin)
.get("/getplayerinventoryforadmin", protectsuperadmin, getplayerinventoryforadmin)


module.exports = router