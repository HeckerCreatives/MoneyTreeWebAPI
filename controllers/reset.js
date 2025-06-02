const mongoose = require('mongoose');
const Leaderboard = require('../models/Leaderboard');
const LeaderboardHistory = require('../models/Leaderboardhistory');
const moment = require('moment-timezone');

exports.resetleaderboard = async (req, res) => {
    try {
        // Fetch the current leaderboard data
        const currentLeaderboard = await Leaderboard.find({});
        const philippinesTime = moment.tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
        // find last entry in the leaderboard history
        const lastEntry = await LeaderboardHistory.findOne({}).sort({ date: -1 }).limit(1);
        let index = 1
        if (lastEntry) {
            // If there is a last entry, set the index to the next number
            index = lastEntry.index + 1;
        }

        if (currentLeaderboard.length > 0) {
            // Insert the fetched data into the leaderboard history with the current date
            const historyData = currentLeaderboard.map(entry => {
                const { _id, ...rest } = entry.toObject(); // Remove the _id field
                return {
                    ...rest,
                    date: philippinesTime,
                    index: index,
                    eventname: `Event Reset #${index} - ${moment().format('YYYY-MM-DD')}`,
                };
            });
            await LeaderboardHistory.insertMany(historyData);
        }

        // Delete the current leaderboard data
        await Leaderboard.updateMany({}, { $set: { amount: 0 } });

        return res.status(200).json({ message: "success", data: "Leaderboard has been reset and previous data has been archived." });
    } catch (err) {
        console.log(`There's a problem resetting the leaderboard. Error: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem resetting the leaderboard. Please contact customer support." });
    }
};

