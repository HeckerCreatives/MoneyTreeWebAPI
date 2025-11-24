const { default: mongoose } = require("mongoose");
const Bank = require("./models/Bank");
const Inventory = require("./models/Inventory");
const Users = require("./models/Users");
const Userwallets = require("./models/Userwallets");
const Maintenance = require("./models/Maintenance");
require("dotenv").config();

async function updatebanks () {
try {

    
        await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

            const maintenancelistdata = ["game", "referral", "unilevel", "rankbonus"]
            for (const maintenanceitem of maintenancelistdata) {
                const existingMaintenance = await Maintenance.findOne({ type: maintenanceitem });
                if (!existingMaintenance) {
                    await Maintenance.create({ type: maintenanceitem, value: "0" });
                    console.log(`Created maintenance list for ${maintenanceitem}`);
                }
            }
        console.log("Finished processing all maintenance items.");

        
        process.exit(0);

        
} catch (error) {
    console.error(error)
}
}

updatebanks()