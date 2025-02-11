const { default: mongoose } = require("mongoose");
const Leaderboard = require("../models/Leaderboard");
const LeaderboardHistory = require("../models/Leaderboardhistory");


exports.getLeaderboard = async (req, res) => {
    const { id, username } = req.user;

    await Leaderboard.find({})
        .populate('owner')
        .sort({ amount: -1 })
        .limit(10)
        .then(async (top10) => {
            const user = await Leaderboard.findOne({ owner: new mongoose.Types.ObjectId(id) });

            if (!user) {
                return res.status(404).json({ message: "failed", data: "No leaderboard found" });
            }

            const userRank = await Leaderboard.countDocuments({ amount: { $gt: user.amount } });
            const finaldata = {
                user: {
                    username: user.owner.username,
                    amount: user.amount,
                    rank: userRank + 1
                },
                top10: top10.map((item, index) => {
                    return {
                        username: item.owner.username,
                        amount: item.amount,
                        rank: index + 1
                    };
                })
            };

            return res.json({ message: "success", data: finaldata });
        })
        .catch(err => {
            console.log(`There's a problem getting the leaderboard for ${username}. Error ${err}`);
            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the leaderboard. Please contact customer support." });
        });
};


exports.getLeaderboardsa = async (req, res) => {
    const { id, username } = req.user;

    await Leaderboard.find({})
        .populate('owner')
        .sort({ amount: -1 })
        .limit(10)
        .then(async (top10) => {


            const finaldata = {
                top10: top10.map((item, index) => {
                    return {
                        username: item.owner.username,
                        amount: item.amount,
                        rank: index + 1
                    };
                })
            };

            return res.json({ message: "success", data: finaldata });
        })
        .catch(err => {
            console.log(`There's a problem getting the leaderboard for ${username}. Error ${err}`);
            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the leaderboard. Please contact customer support." });
        });
};


exports.getLeaderboardHistory = async (req, res) => {
    const { page, limit, date, hour } = req.query;

    const pageOptions = {
        page: parseInt(page, 10) || 0,
        limit: parseInt(limit, 10) || 10
    };

    let query = {};
    if (date) {
        query.date = { $regex: new RegExp(`^${date}`) }; // Allow date search in YYYY-MM-DD format
    }
    if (hour) {
        query.date = { $regex: new RegExp(`^${date} ${hour}`) }; // Allow date and hour search in YYYY-MM-DD HH format
    }

    try {
        const totalDocuments = await LeaderboardHistory.countDocuments(query);
        const data = await LeaderboardHistory.find(query)
            .populate('owner', 'username')
            .sort({ date: 1 }) // Sort by date in ascending order
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit);

        if (data.length === 0) {
            return res.status(404).json({ message: "failed", data: "No leaderboard history found" });
        }

        const finaldata = [];
        let previousDate = null;
        let rank = pageOptions.page * pageOptions.limit + 1; // Initialize rank based on the page

        data.forEach((item, index) => {
            const currentDate = item.date.split(' ')[0]; // Extract the date part from the string

            if (previousDate && previousDate !== currentDate) {
                rank = pageOptions.page * pageOptions.limit + 1; // Reset rank if the date has changed
            }

            finaldata.push({
                username: item.owner.username,
                amount: item.amount,
                date: item.date,
                rank: rank
            });

            previousDate = currentDate;
            rank++;
        });

        const totalPages = Math.ceil(totalDocuments / pageOptions.limit);

        return res.json({ message: "success", data: finaldata, totalPages: totalPages });
    } catch (err) {
        console.log(`There's a problem getting the leaderboard history. Error ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting the leaderboard history. Please contact customer support." });
    }
};

exports.getLeaderboardDates = async (req, res) => {
    try {
        const dates = await LeaderboardHistory.aggregate([
            {
                $group: {
                    _id: { $substr: ["$date", 0, 13] } // Group by the first 13 characters of the date string (YYYY-MM-DD HH)
                }
            },
            { $sort: { "_id": 1 } } // Sort by date in ascending order
        ]);

        if (dates.length === 0) {
            return res.status(404).json({ message: "failed", data: "No dates found in leaderboard history" });
        }

        const formattedDates = dates.map(date => date._id);

        return res.json({ message: "success", data: formattedDates });
    } catch (err) {
        console.log(`There's a problem getting the leaderboard dates. Error ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting the leaderboard dates. Please contact customer support." });
    }
};