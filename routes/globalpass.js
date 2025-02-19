const { createGlobalPass, getusagehistory } = require("../controllers/globalpass")
const { protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()


router
 .post("/createglobalpassword", protectsuperadmin, createGlobalPass)
 .get("/getusagehistory", protectsuperadmin, getusagehistory)


module.exports = router