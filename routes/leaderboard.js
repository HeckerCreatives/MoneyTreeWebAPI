const { getLeaderboard, sendeventpoints, getLeaderboardHistory, getLeaderboardsa, getLeaderboardDates } = require("../controllers/leaderboard")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()

router
.get("/getleaderboard", protectplayer, getLeaderboard)
.get("/getleaderboardsa", protectsuperadmin, getLeaderboardsa)
.get("/getleaderboardhistory", protectsuperadmin, getLeaderboardHistory)
.get("/getleaderboardhistorydates", protectsuperadmin, getLeaderboardDates)

module.exports = router