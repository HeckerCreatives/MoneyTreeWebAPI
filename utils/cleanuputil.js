const { RaffleWinner } = require("../models/Raffle")



exports.cleanupraffle = async () => {
    try {
        const shouldClean = await RaffleWinner.findOne({ eventname: "Buffer", index: { $ne: 0 } });
        if (shouldClean) {
            await RaffleWinner.updateMany({ eventname: "Buffer", index: { $ne: 0 } }, { $set: { index: 0 } });

            const realWinners = await RaffleWinner.find({ eventname: { $ne: "Buffer" } }).sort({ createdAt: 1 });
            for (let i = 0; i < realWinners.length; i++) {
                realWinners[i].index = i + 1;
                await realWinners[i].save();
            }
        }
    }
    catch (err) {
        console.error("Error during raffle cleanup:", err);
    }
}