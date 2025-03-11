const router = require("express").Router()
const { getweather, editweather } = require("../controllers/weather")
const { protectsuperadmin } = require("../middleware/middleware")

router
 .get("/getweather", protectsuperadmin, getweather)
 .post("/editweather", protectsuperadmin, editweather)

module.exports = router