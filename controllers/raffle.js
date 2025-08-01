const { default: mongoose } = require("mongoose");
const { SelectedPlayer, RaffleWinner } = require("../models/Raffle");


exports.addselectedplayer = async (req, res) => {

    const { id, username } = req.user;
    const { playerid } = req.body;

    if (!playerid) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    // const existingPlayer = await SelectedPlayer.findOne({ owner: playerid });
    // if (existingPlayer) {
    //     return res.status(400).json({ message: "failed", data: "You have already selected this player." });
    // }

    await SelectedPlayer.create({
        owner: playerid,
    })
    .then(data => data)
    .catch(err => {
        console.error("Error adding selected player:", err);
        return res.status(500).json({ message: "failed", data: "Internal server error." });
    });

    return res.status(200).json({ message: "success", data: "Player selected successfully." });
}

exports.getselectedplayers = async (req, res) => {

    const { id, username } = req.user;
    const { page, limit } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10,
    }

    let data = await SelectedPlayer.find()
        .populate("owner", "username")
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .then(data => data)
        .catch(err => {
            console.error("Error fetching selected players:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });

    if (!data || data.length === 0) {
        return res.status(404).json({ message: "failed", data: "No selected players found." });
    }

    const totalCount = await SelectedPlayer.countDocuments();
    const totalPages = Math.ceil(totalCount / pageOptions.limit);

    const formattedData = data.map(player => ({
        id: player.owner._id,
        username: player.owner.username,
        createdAt: player.createdAt,
    }));

    return res.status(200).json({ message: "success", data: formattedData, pagination: { totalCount, totalPages, currentPage: pageOptions.page } });
}

exports.deletefromselectedplayers = async (req, res) => {
    const { id, username } = req.user;
    const { playerid } = req.body;
    if (!playerid) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    const existingPlayer = await SelectedPlayer.findOne({ owner: playerid });
    if (!existingPlayer) {
        return res.status(404).json({ message: "failed", data: "Player not found in selected players." });
    }

    await SelectedPlayer.findOneAndDelete({ owner: new mongoose.Types.ObjectId(playerid) })
        .then(data => data)
        .catch(err => {
            console.error("Error deleting selected player:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });
    return res.status(200).json({ message: "success" });
}

exports.resetselectedplayers = async (req, res) => {
    const { id, username } = req.user;
    await SelectedPlayer.deleteMany({})
        .then(data => data)
        .catch(err => {
            console.error("Error resetting selected players:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });

        await RaffleWinner.create({
            eventname: "Buffer",
            owner: null,
            index: 0,
            createdAt: new Date().toISOString()
        });

    return res.status(200).json({ message: "success" });
}

exports.selectwinner = async (req, res) => {

    const { id, username } = req.user;

    const highestIndex = await RaffleWinner.findOne()
        .sort({ index: -1 });

    const nextIndex = highestIndex ? highestIndex.index + 1 : 1;

    const selectedPlayers = await SelectedPlayer.find()
        .populate("owner", "username")
        .then(data => data)
        .catch(err => {
            console.error("Error fetching selected players:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });

    

    if (!selectedPlayers || selectedPlayers.length === 0) {
        return res.status(404).json({ message: "failed", data: "No selected players found." });
    }

    const randomIndex = Math.floor(Math.random() * selectedPlayers.length);
    const winner = selectedPlayers[randomIndex];

    await RaffleWinner.create({
        owner: winner.owner._id,
        eventname: `Raffle Winner #${nextIndex}`,
        index: nextIndex,
        newindex: nextIndex,
    })
    .then(data => data)
    .catch(err => {
        console.error("Error selecting raffle winner:", err);
        return res.status(500).json({ message: "failed", data: "Internal server error." });
    });

    return res.status(200).json({ message: "success", data: `Winner is ${winner.owner.username}`, username: winner.owner.username, id: winner.owner._id});
}


exports.getrafflewinners = async (req, res) => {

    const { id, username } = req.user;
    const { page, limit } = req.query;
    
    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10,
    }

    let data = await RaffleWinner.find({ eventname: { $ne: "Buffer" } })
        .populate("owner", "username")
        .sort({ index: -1 })
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .then(data => data)
        .catch(err => {
            console.error("Error fetching raffle winners:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });

    if (!data || data.length === 0) {
        return res.status(404).json({ message: "success", data: [], pagination: { totalCount: 0, totalPages: 0, currentPage: pageOptions.page }, lastwinner: null });
    }

    const totalCount = await RaffleWinner.countDocuments({ eventname: { $ne: "Buffer" } });
    const totalPages = Math.ceil(totalCount / pageOptions.limit);


    const formattedData = data.map((winner, i) => {
        return {
            id: winner._id,
            owner: winner.owner ? winner.owner.username : "No winner selected yet",
            eventname: winner.eventname,
            index: winner.newindex,
            createdAt: winner.createdAt,
        };
    });

    const lwinner = await RaffleWinner.findOne({})
        .sort({ createdAt: -1 })
        .populate("owner", "username")
        .then(data => data)
        .catch(err => {
            console.error("Error fetching last winner:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });

    let lastWinner = lwinner || null;
    let formatlastWinner = lastWinner ? {
        id: lastWinner._id,
        owner: lastWinner.owner ? lastWinner.owner.username : "No winner selected yet",
        eventname: lastWinner.eventname,
        index: lastWinner.index,
        createdAt: lastWinner.createdAt,
    } : null;
    if (lastWinner && lastWinner.eventname === "Buffer") {
        formatlastWinner = {
            id: null,
            owner: "No winner selected yet",
            eventname: "Buffer",
            index: 0,
            createdAt: new Date().toISOString(),
        };
    }

    return res.status(200).json({ message: "success", data: formattedData, pagination: { totalCount, totalPages, currentPage: pageOptions.page }, lastwinner: formatlastWinner });
}