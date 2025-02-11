const { default: mongoose } = require("mongoose")
const Userwallets = require("../models/Userwallets")
const Walletconversion = require("../models/Walletconversion")


exports.convertwallet = async (req, res) => {
    const { id } = req.user
    const { type, amount } = req.body

    if(!type || !amount){
        return res.status(400).json({ message: "failed", data: "Please input type and amount."})
    }
    if (type !== "game" && type !== "commission") {
        return res.status(400).json({ message: "failed", data: "Incorrect wallet type." });
    }    

    const balance = await Userwallets.findOne({ owner: new mongoose.Types.ObjectId(id), type: `${type}balance` })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while fetching balance for user ${id}. Error: ${err}`)
    })

    if(balance.amount < amount) {
        return res.status(400).json({ message: "failed", data: "Not enough balance."})
    }

    await Userwallets.findOneAndUpdate({ owner: new mongoose.Types.ObjectId(id), type: `${type}balance` }, { $inc: { amount: -amount }})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered when removing balance from ${type} of user ${id}. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })

    await Userwallets.findOneAndUpdate({ owner: new mongoose.Types.ObjectId(id), type: "fiatbalance" }, { $inc: { amount: amount }})
    .then(data => data)
    .catch(async err => {
        console.log(`There's a problem encountered when Adding balance from ${type} of user ${id}. Error: ${err}`)
        await Userwallets.findOneAndUpdate({ owner: new mongoose.Types.ObjectId(id), type: `${type}balance` }, { $inc: { amount: amount }})
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem encountered when removing balance from ${type} of user ${id}. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
        })
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })

    await Walletconversion.create({ owner: new mongoose.Types.ObjectId(id), type: `${type} balance to fiat balance`, amount: amount})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered when creating coversion history from user ${id}. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })

    return res.status(200).json({ message: "success" })

}

exports.getwalletconversionhistory = async (req, res) => {
    const { page, limit } = req.query
    const { id, username } = req.user

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const walletConversionHistory = await Walletconversion.find({ owner: new mongoose.Types.ObjectId(id) })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while fetching wallet conversion history for user: ${username}. Error: ${err}`)
        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalConversionHistory = await Walletconversion.countDocuments({ owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while fetching wallet conversion history for user: ${username}. Error: ${err}`)
        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalConversionHistory / pageOptions.limit)


    const finaldata = {
        totalPages: pages,
        data: []
    }

    walletConversionHistory.forEach(temp => {
        const { _id, owner, type, amount, createdAt } = temp

        finaldata.data.push({
            id: _id,
            owner: owner,
            type: type,
            amount: amount,
            date: createdAt
        })
    })

    return res.status(200).json({ message: "success", data: finaldata })
}