const { default: mongoose } = require("mongoose")
const Userwallets = require("../models/Userwallets")
const Wallethistory = require("../models/Wallethistory")

exports.playerwallets = async (req, res) => {
    const { id } = req.user

    // Initialize the response data object
    const data = {}

    // Get current wallet balances
    const wallets = await Userwallets.find({owner: new mongoose.Types.ObjectId(id)})
        .then(data => data)
        .catch(err => {
            console.log(`Failed to get dashboard wallet data for ${id}, error: ${err}`)
            return res.status(401).json({ 
                message: 'failed', 
                data: `There's a problem with your account. Please contact customer support for more details` 
            })
        })

    // Map current wallet balances
    wallets.forEach(datawallet => {
        const {type, amount} = datawallet
        data[type] = amount
    })

    // Get total direct referral earnings
    const statisticReferral = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "directreferralbalance" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ]).catch(err => {
        console.log(`Failed to get referral statistics for ${id}, error: ${err}`)
        return []
    })

    // Get total commission earnings
    const statisticUnilevel = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "commissionbalance" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ]).catch(err => {
        console.log(`Failed to get commission statistics for ${id}, error: ${err}`)
        return []
    })

    // Set default values and add totals to response
    data.directreferralbalance = data.directreferralbalance || 0
    data.commissionbalance = data.commissionbalance || 0
    data.totalDirectReferral = statisticReferral.length > 0 ? statisticReferral[0].totalAmount : 0
    data.totalCommission = statisticUnilevel.length > 0 ? statisticUnilevel[0].totalAmount : 0

    return res.json({
        message: "success", 
        data: data
    })
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