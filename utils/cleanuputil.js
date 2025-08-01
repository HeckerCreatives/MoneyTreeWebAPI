const { RaffleWinner } = require("../models/Raffle")



exports.cleanupraffle = async () => {
    // Only run cleanup if there are Buffer entries with index not 0
    const shouldClean = await RaffleWinner.findOne({ eventname: "Buffer", index: { $ne: 0 } });
    if (shouldClean) {
        // Set all Buffer entries' index to 0
        await RaffleWinner.updateMany({ eventname: "Buffer", index: { $ne: 0 } }, { $set: { index: 0 } });

        // Re-index all non-Buffer winners incrementally
        const realWinners = await RaffleWinner.find({ eventname: { $ne: "Buffer" } }).sort({ createdAt: 1 });
        for (let i = 0; i < realWinners.length; i++) {
            realWinners[i].index = i + 1;
            await realWinners[i].save();
        }
    }
}