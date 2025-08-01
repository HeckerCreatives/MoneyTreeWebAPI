const mongoose = require('mongoose');
const Leaderboard = require('../models/Leaderboard');
const LeaderboardHistory = require('../models/Leaderboardhistory');
const moment = require('moment-timezone');
const Evententrylimit = require('../models/Evententrylimit');
const Playerevententrylimit = require('../models/Playerevententrylimit');
const Leaderboardlimit = require('../models/Leaderboardlimit');

exports.resetleaderboard = async (req, res) => {
    try {
        // Fetch the current leaderboard data
        
        console.log("fckkkk")
        const lblimit = await Leaderboardlimit.findOne({});
        let limit = 10; // Default limit

        console.log("fckkkk 1")
        if (lblimit && lblimit.limit) {
            limit = lblimit.limit;
        }
        console.log("fckkkk 2")
        const currentLeaderboard = await Leaderboard.find({})
            .sort({ amount: -1, updatedAt: -1 })
            .limit(limit)

        console.log("fckkkk 3")
        
        const philippinesTime = moment.tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
        // find last entry in the leaderboard history
        let entrylimit = 2;
            const evententrylimit = await Evententrylimit.findOne({});
        console.log("fckkkk 4")
        if (evententrylimit && evententrylimit.limit) {
            entrylimit = evententrylimit.limit;
        }

        console.log("fckkkk5  ")
        
        const lastEntry = await LeaderboardHistory.findOne({}).sort({ date: -1 }).limit(1);
        let index = 1
        
        console.log("fckkkk6")
        if (lastEntry) {
            // If there is a last entry, set the index to the next number

            if (!isNaN(lastEntry.index)){
                index = lastEntry.index + 1;
            }
        }

        console.log("fckkkk 7")
        console.log("CHEEEEEEEEEECKKKKKKKKKK", lastEntry, index)

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
          await Playerevententrylimit.updateMany({}, {limit: entrylimit})
          .catch(err => {
            console.log(err)
          })
        return res.status(200).json({ message: "success", data: "Leaderboard has been reset and previous data has been archived." });
    } catch (err) {
        console.log(`There's a problem resetting the leaderboard. Error: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem resetting the leaderboard. Please contact customer support." });
    }
};

