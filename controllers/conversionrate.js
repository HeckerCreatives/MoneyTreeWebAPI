const Conversionrate = require("../models/Conversionrate")

exports.getcurrentconversionrate = async (req, res) => {
    const rate = await Conversionrate.find()
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the conversion rate. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the conversion rate. Please contact customer support"})
    })

    if (rate.length <= 0){
        return res.json({message: "success", data: {
            rate: 0
        }})
    }

    return res.json({message: "success", data: {
        rate: rate[0].amount
    }})
}

exports.saveconversionrate = async (req, res) => {
    const {id, username} = req.user
    const {rate} = req.body

    if (rate == 0 || !rate){
        return res.status(400).json({message: "failed", data: "Conversion rate must be greater than zero!"})
    }

    await Conversionrate.create({amount: rate})
    .catch(err => {
        console.log(`There's a problem saving the conversion rate. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem saving the conversion rate. Please contact customer support"})
    })

    return res.json({message: "success"})
}
