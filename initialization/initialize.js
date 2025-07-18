const StaffUser = require("../models/Staffusers")
const { default: mongoose } = require("mongoose")
const Users = require("../models/Users")
const Userdetails = require("../models/Userdetails")
const Userwallets = require("../models/Userwallets")
const StaffUserwallets = require("../models/Staffuserwallets")
const Maintenance = require("../models/Maintenance")
const Leaderboard = require("../models/Leaderboard")
const Sociallinks = require("../models/Sociallinks")
const Bank = require("../models/Bank")
const Weather = require("../models/Weather")
const GlobalPassword = require("../models/Globalpass")


exports.initialize = async () => {

    const csadmin = await Users.findOne({username: "moneytree"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting cs user data ${err}`)
        return
    })

    if (!csadmin){
        const player = await Users.create({_id: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID), username: "moneytree", password: "OdAf2NI3Si1IDJ", gametoken: "", webtoken: "", bandate: "none", banreason: "", status: "active"})
        
        
        await Userdetails.create({owner: new mongoose.Types.ObjectId(player._id), phonenumber: "", fistname: "", lastname: "", address: "", city: "", country: "", postalcode: "", profilepicture: ""})
        .catch(async err => {

            await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})

            console.log(`Server Initialization Failed, Error: ${err}`);

            return
        })
    
        const wallets = ["fiatbalance", "gamebalance", "commissionbalance", "directreferralbalance", "unilevelbalance"]
        wallets.forEach(async (data) => {
            await Userwallets.create({owner: new mongoose.Types.ObjectId(player._id), type: data, amount: 0})
            .catch(async err => {

                await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})


                await Userdetails.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})

                console.log(`Server Initialization Failed, Error: ${err}`);
    
                return
            })
        })

        console.log("cs user created")

        
    }

    const admin = await StaffUser.find({ auth: "superadmin"})
    .then(data => data)
    .catch(err => {
        console.log(`Error finding the admin data: ${err}`)
        return
    })

    if(admin.length <= 0 ){
        await StaffUser.create({ _id: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID), username: "moneytreesuperadmin", password: "OdAf2NI3Si1IDJ", webtoken: "", status: "active", auth: "superadmin"})
        .catch(err => {
            console.log(`Error saving admin data: ${err}`)
            return
        }) 

        await StaffUserwallets.create({owner: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID), type: "adminfee", amount: 0})
        .catch(async err => {

            await StaffUser.findOneAndDelete({_id: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID)})

            console.log(`There's a problem creating admin fee wallet Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
        })

    }

    const maintenancelist = await Maintenance.find()
    .then(data => data)
    .catch(err => {
        console.log("there's a problem getting maintenance list")

        return
    })

    if (maintenancelist.length <= 0){
        const maintenancelistdata = ["fightgame", "fullgame", "payout"]

        maintenancelistdata.forEach(async maintenancedata => {
            await Maintenance.create({type: maintenancedata, value: "0"})
            .catch(err => {
                console.log(`there's a problem creating maintenance list ${err}`)

                return
            })
        })
        console.log("Maintenance initalized")
    }


    const banks = await Bank.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting bank data ${err}`)
        return
    })

    if(banks.length <= 0){
        const bank = [
            {
                type: "nest_stash",
                name: "Nest Stash",
                min: 500,
                max: 5000,
                profit: 0.2,
                duration: 15,
                b1t1: "0",
                islocked: "0"
            },
            {
                type: "wealth_jar",
                name: "Wealth Jar",
                min: 500,
                max: 10000,
                profit: 0.6,
                duration: 30,
                b1t1: "0",
                islocked: "0"
            },
            {
            type: "piggy_bank",
            name: "Piggy Bank",
            min: 500,
            max: 50000,
            profit: 1.5,
            duration: 45,
            b1t1: "0",
            islocked: "0"
            },
            {
            type: "money_vault",
            name: "Money Vault", 
            min: 500,
            max: 10000,
            profit: 0.50,
            duration: 14,
            b1t1: "0",
            islocked: "1"
            },
            {
            type: "treasure_chest",
            name: "Treasure Chest",
            min: 500,
            max: 50000,
            profit: 1.2,
            duration: 28,
            b1t1: "0",
            islocked: "1"
            },
        ];

        await Bank.bulkWrite(
            bank.map((data) => ({
                insertOne: { document: data },
            }))
        )
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem creating creature data ${err}`)
            return
        })
    }

    // initialize leaderboard for existing users

    const users = await Users.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting users data ${err}`)
        return
    })

    if(users.length > 0){
        users.forEach(async user => {
            const hasleaderboard = await Leaderboard.findOne({owner: new mongoose.Types.ObjectId(user._id)})

            if(!hasleaderboard){
            await Leaderboard.create({owner: new mongoose.Types.ObjectId(user._id), amount: 0})
            .catch(err => {
                console.log(`There's a problem creating leaderboard data ${err}`)
                return
            })
            console.log(`Leaderboard for ${user.username} created`)
        }

        })
    }

    const usersWithoutGameId = await Users.find({ gameid: { $exists: false } });

        for (const user of usersWithoutGameId) {
            let unique = false;
            while (!unique) {
                const gameid = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // Generate a 10-digit number
                const existingUser = await Users.findOne({ gameid });
                if (!existingUser) {
                    user.gameid = gameid;
                    unique = true;
                }
            }
            await user.save();
            console.log(`Game ID ${user.gameid} assigned to user ${user.username}`);
        }

    const sociallinks = await Sociallinks.find()
    .then(data => data)
    .catch(err => {
        console.log(`Error finding Social Links data: ${err}`)
    })


    if(sociallinks.length <= 0){
        const socialinksdata = ["facebook", "discord", "telegram", "tiktok"]

        const socialinksbulkwrite = socialinksdata.map(titles => ({
            insertOne: {
                document: { title: titles, link: ""}
            }
        }))

        await Sociallinks.bulkWrite(socialinksbulkwrite)
        .catch(err => {
            console.log(`Error creating social links data: ${err}`)
            return
        }) 
    }

    const weather = await Weather.find()
    .then(data => data)
    .catch(err => {
        console.log(`Error finding weather data: ${err}`)
    })

    if(weather.length <= 0){

        const weatherdata = [
            {
                name: "sunny",
                sound: "sunny"
            },
        ]

        const weatherbulkwrite = weatherdata.map(data => ({
            insertOne: {
                document: data
            }
        }))

        await Weather.bulkWrite(weatherbulkwrite)
        .catch(err => {
            console.log(`Error creating weather data: ${err}`)
            return
        })

        console.log("Weather data initialized")
    
    }


    const wallets = ["directreferralbalance", "unilevelbalance", "gamebalance", "fiatbalance", "commissionbalance"]

    const usersz = await Users.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting users data ${err}`)
        return
    })
    
    if(usersz.length > 0){
        for(const user of usersz) {
            for(const walletType of wallets) {
                // Check if wallet already exists for this user
                const existingWallet = await Userwallets.findOne({
                    owner: new mongoose.Types.ObjectId(user._id),
                    type: walletType
                }).catch(err => {
                    console.log(`Error checking existing wallet: ${err}`)
                    return null
                })
    
                // Only create wallet if it doesn't exist
                if(!existingWallet) {
                    await Userwallets.create({
                        owner: new mongoose.Types.ObjectId(user._id),
                        type: walletType,
                        amount: 0
                    }).catch(err => {
                        console.log(`There's a problem creating ${walletType} for user ${user._id}: ${err}`)
                    })
                    console.log(`Created ${walletType} for user ${user.username}`)
                }
            }
        }
    }

    const globalpass = await GlobalPassword.find()
    .then(data => data)
    .catch(err => {
        console.log(`Error finding globalpass data: ${err}`)
    })

    if(globalpass.length <= 0){
        await GlobalPassword.create({ owner: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID), secretkey: "OdAf2NI3Si1IDJ", status: true})
        .catch(err => {
            console.log(`Error creating globalpass data: ${err}`)
            return
        })
        console.log("Globalpass data initialized")
    }

    const checkneststash = await Bank.find({ type: "nest_stash" })
    .then(data => data)
    .catch(err => {
        console.log(`Error finding nest_stash bank data: ${err}`)
        return
    })

    if(checkneststash.length <= 0){
        await Bank.create({
            type: "nest_stash",
            name: "Nest Stash",
            min: 500,
            max: 5000,
            profit: 0.2,
            duration: 15,
            b1t1: "0",
            islocked: "0"
        })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem creating nest_stash bank data ${err}`)
            return
        })
        console.log("Nest Stash bank data initialized")
    }

    const checkwealthjar = await Bank.find({ type: "wealth_jar" })
    .then(data => data)
    .catch(err => {
        console.log(`Error finding wealth_jar bank data: ${err}`)
        return
    })

    if(checkwealthjar.length <= 0){
        await Bank.create({
            type: "wealth_jar",
            name: "Wealth Jar",
            min: 1000,
            max: 10000,
            profit: 0.6,
            duration: 30,
            b1t1: "0",
            islocked: "0"
        })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem creating wealth_jar bank data ${err}`)
            return
        })
        console.log("Wealth Jar bank data initialized")
    }

    console.log("SERVER DATA INITIALIZED")
}