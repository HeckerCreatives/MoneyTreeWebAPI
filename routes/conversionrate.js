const router = require("express").Router()
const { getcurrentconversionrate, saveconversionrate } = require("../controllers/conversionrate")
const { protectsuperadmin } = require("../middleware/middleware")

router
    .get("/getcurrentconversionrate", getcurrentconversionrate)
    .post("/saveconversionrate", protectsuperadmin, saveconversionrate)

module.exports = router;
