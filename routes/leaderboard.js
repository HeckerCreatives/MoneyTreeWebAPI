const { getLeaderboard, sendeventpoints, getLeaderboardHistory, getLeaderboardsa, getLeaderboardDates, getlblimit, savelblimit } = require("../controllers/leaderboard")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()

router
.get("/getleaderboard", protectplayer, getLeaderboard)
.get("/getleaderboardsa", protectsuperadmin, getLeaderboardsa)
.get("/getleaderboardhistory", protectsuperadmin, getLeaderboardHistory)
.get("/getleaderboardhistorydates", protectsuperadmin, getLeaderboardDates)
.get("/getlblimit", protectsuperadmin, getlblimit)
.post("/savelblimit", protectsuperadmin, savelblimit)

module.exports = router