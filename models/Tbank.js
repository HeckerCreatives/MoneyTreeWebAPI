const { default: mongoose } = require("mongoose");


const TbankSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        scientificName: {
            type: String,
        },
        description: {
            type: String,
        },
        healthBenefits: [{
            type: String,
        }],
        price: {
            type: Number,
            default: 0,
        },
        profit: {
            type: Number,
            default: 0.2,
        },
        duration: {
            type: Number,
            default: 7,
        },
        type: {
            type: String
        },
        stocks: {
            type: Number,
            default: 0
        },
        limit: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        tiimestamps: true,
    }
)

const Tbank = mongoose.model("Tbank", TbankSchema)
module.exports = Tbank