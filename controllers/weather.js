const { default: mongoose } = require("mongoose")
const Weather = require("../models/Weather")

exports.getweather = async (req, res) => {

    const weather = await Weather.find()
    .then(data => data)
    .catch(err => {
        console.log(`Error finding weather data: ${err}`)
    })

    if(weather.length <= 0){
        return res.status(400).json({
            message: "No weather data found"
        })
    }

    res.status(200).json({
        message: "success",
        data: weather
    })

}

exports.editweather = async (req, res) => {

    const { name, sound, id } = req.body

    const weather = await Weather.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id)}, {sound: sound, name: name}, {new: true})
    .then(data => data)
    .catch(err => {
        console.log(`Error updating weather data: ${err}`)
    })

    if(!weather){
        return res.status(400).json({
            message: "No weather data found"
        })
    }

    res.status(200).json({
        message: "success"
    })
}



