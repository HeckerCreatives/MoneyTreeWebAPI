const mongoose = require("mongoose");

const TInventoryShema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        type: {
            type: String,
            index: true // Automatically creates an index on 'amount'
        },
        bankname: {
            type: String,
            index: true
        },
        price: {
            type: Number
        },
        profit: {
            type: Number,
            index: true // Automatically creates an index on 'amount'
        },
        duration: {
            type: Number
        },
        startdate: {
            type: String,
            index: true // Automatically creates an index on 'amount'
        }
    },
    {
        timestamps: true
    }
)

const Tinventory = mongoose.model("Tinventory", TInventoryShema)
module.exports = Tinventory