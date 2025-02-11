const { resetleaderboard } = require('../controllers/reset');
const { protectsuperadmin } = require('../middleware/middleware');

const router = require('express').Router();


router
 .get("/resetleaderboard", protectsuperadmin, resetleaderboard)

module.exports = router;


