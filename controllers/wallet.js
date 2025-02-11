const { default: mongoose } = require("mongoose")
const Userwallets = require("../models/Userwallets")

exports.playerwallets = async (req, res) => {
    const { id } = req.user

    const wallets = await Userwallets.find({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get dashboard wallet data for ${data.owner}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const data = {}

    wallets.forEach(datawallet => {
        const {type, amount} = datawallet

        data[type] = amount
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