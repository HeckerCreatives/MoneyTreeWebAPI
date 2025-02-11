const { getsociallinks, getspecificsociallink, createsociallink, editsociallink, deletesociallink } = require("../controllers/sociallinks")
const { protectsuperadmin, protectplayer } = require("../middleware/middleware")

const router = require("express").Router()

router
.get("/getsociallinksa", protectplayer, getsociallinks)
.get("/getspecificsociallink", getspecificsociallink)
.get("/getsociallinks", protectsuperadmin, getsociallinks)
.get("/getsociallinkslp", getsociallinks)
.get("/deletesociallink",protectsuperadmin, deletesociallink)
.post("/createsociallink", protectsuperadmin, createsociallink)
.post("/editsociallink", protectsuperadmin, editsociallink)

module.exports = router