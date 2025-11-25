const { default: mongoose } = require("mongoose")
const Userwallets = require("../models/Userwallets")
const Wallethistory = require("../models/Wallethistory")
const Analytics = require("../models/Analytics")

exports.playerwallets = async (req, res) => {
    const { id } = req.user

    const wallets = await Userwallets.find({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get dashboard wallet data for ${data.owner}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    let rankbonuswalletamount = await Wallethistory.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(id),
                    type: "directreferralbalance",
                    createdAt: {
                        // november 16 2025 to december 15 2025
                        $gte: new Date("2025-11-16T00:00:00Z"),
                        $lt: new Date("2025-12-16T00:00:00Z")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ])

    rankbonuswalletamount = rankbonuswalletamount[0] || { totalAmount: 0 }
    let rankEarnings = 0;

    if (rankbonuswalletamount.totalAmount >= 5000000) {
        rankEarnings = rankbonuswalletamount.totalAmount * 0.75;
    } else if (rankbonuswalletamount.totalAmount >= 1000000) {
        rankEarnings = rankbonuswalletamount.totalAmount * 0.55;
    } else if (rankbonuswalletamount.totalAmount >= 500000) {
        rankEarnings = rankbonuswalletamount.totalAmount * 0.35;
    } else if (rankbonuswalletamount.totalAmount >= 100000) {
        rankEarnings = rankbonuswalletamount.totalAmount * 0.20;
    } else if (rankbonuswalletamount.totalAmount >= 50000) {
        rankEarnings = rankbonuswalletamount.totalAmount * 0.10;
    } else if (rankbonuswalletamount.totalAmount >= 5000) {
        rankEarnings = rankbonuswalletamount.totalAmount * 0.05;
    }

    const data = {}

    wallets.forEach(datawallet => {
        const {type, amount} = datawallet
        
        data[type] = amount
        if (type === "rankbonusbalance"){
            data["rankbonusbalance"] = rankEarnings
            if (amount > 0){
                data["rankbonusbalance"] = amount
            }
        }

    })

    return res.json({message: "success", data: data})
}

exports.getplayerwalletforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid} = req.query

    const playerwallet = await Userwallets.find({owner: new mongoose.Types.ObjectId(playerid)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user wallet for ${username}, player: ${playerid}, Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    const data = {
        userwallets: []
    }

    playerwallet.forEach(value => {
        const {type, amount} = value

        data.userwallets.push({
            type: type,
            amount: amount
        })
    })

    return res.json({message: "success", data: data})
}


exports.edituserwalletforadmin = async (req, res) => {
    const { id, username } = req.user

    const { playerid, wallettype, amount } = req.body

    if (!playerid || !wallettype) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    if (parseFloat(amount) < 0) {
        return res.status(400).json({ message: "failed", data: "Amount cannot be negative." });
    }

    let type  // analytics type
    let newwallettype // wallet history

    if (wallettype === "fiatbalance") {
        type = "payinfiatbalance"
        newwallettype = "fiatbalance"
    } else if (wallettype === "gamebalance") {
        type = "Buy"
        newwallettype = "gamebalance"
    } else if (wallettype === "unilevelbalance") {
        type = "commissionbalance"
        newwallettype = "commissionbalance"
    } else if (wallettype === "directreferralbalance") {
        type = "directreferralbalance"
        newwallettype = "directreferralbalance"
    }

    const wallet = await Userwallets.findOne({
        owner: new mongoose.Types.ObjectId(playerid),
        type: wallettype
    })
    .then(data => data)
    .catch(err => {
        console.log(`Failed to find wallet for ${playerid}, error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
    })

    if (!wallet) {
        return res.status(404).json({ message: "bad-request", data: "Wallet not found" })
    }

    const difference = parseFloat(amount) - wallet.amount;

    if (wallet.amount > 0) {
        await Wallethistory.create({
            owner: playerid,
            type: newwallettype,
            amount: -wallet.amount,
            from: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID),
        })
        .then(data => data)
        .catch(err => {
            console.log(`Failed to create wallet history for ${playerid}, error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
        })

        await Analytics.create({
            owner: playerid,
            type: type,
            amount: -wallet.amount,
            from: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID),
         })
         .then(data => data)
         .catch(err => {
            console.log(`There's a problem encountered while creating ${playerid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
         })
    }
     
     // add the new amount to the history
     await Wallethistory.create({
         owner: playerid,
         type: newwallettype,
         amount: parseFloat(amount),
         from: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID),
        })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem encountered while creating ${playerid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
        })
    

         // add the new amount to the analytics
         await Analytics.create({
            owner: playerid,
            type: type,
            amount: parseFloat(amount),
            from: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID),
         })
         .then(data => data)
         .catch(err => {
            console.log(`There's a problem encountered while creating ${playerid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
         })


         await Userwallets.findOneAndUpdate(
        {
            owner: new mongoose.Types.ObjectId(playerid),
            type: wallettype
        },
        {
            $set: {
                amount: parseFloat(amount)
            }
        }
    )
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while updating ${playerid} wallet. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
    })

    // increment or decrement commision wallet balance

    if (wallettype === "unilevelbalance" || wallettype === "directreferralbalance") {
        await Userwallets.findOneAndUpdate(
            {
                owner: new mongoose.Types.ObjectId(playerid),
                type: "commissionbalance"
            },
            {
                $inc: {
                    amount: parseFloat(difference)
                }
            }
        )
    }

    return res.status(200).json({ message: "success" })
    
}

