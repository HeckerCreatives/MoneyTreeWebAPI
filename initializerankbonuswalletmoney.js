const { default: mongoose } = require("mongoose");
const Bank = require("./models/Bank");
const Inventory = require("./models/Inventory");
const Users = require("./models/Users");
const Userwallets = require("./models/Userwallets");
require("dotenv").config();

async function updatebanks () {
try {

    console.log(process.env.DATABASE_URL)
    
        await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });


        const batch = 1000;
        let lastid = null;
        const totalusers = await Users.countDocuments({});
        console.log(`Total users to process: ${totalusers}`);

        const matchCondition = lastid ? { _id: { $gt: lastid } } : {};

        for (let i = 0; i < totalusers; i += batch) {
            console.log(`Processing users ${i + 1} to ${Math.min(i + batch, totalusers)}`);
            const users = await Users.find(matchCondition).sort({ _id: 1 }).limit(batch);
            if (users.length === 0) break;
            lastid = users[users.length - 1]._id;

            // give them new wallet with 0 balance
            // wallet name rankbonusbalance

            for (const user of users) {
                const has0balance = await Userwallets.findOne({ owner: user._id, type: 'rankbonusbalance', amount: 0 });
                if (has0balance) {
                    // 
                }
                
            }

        }
        
        console.log("Finished processing all users.");
        process.exit(0);

        
} catch (error) {
    console.error(error)
}
}

updatebanks()