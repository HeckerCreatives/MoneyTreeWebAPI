const { default: mongoose } = require("mongoose")


exports.tbankdata = [
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f7"),
    name: "Avocado",
    price: 500,
    profit: 0.5,
    duration: 6,
    type: "tree",
    stocks: 10,
    limit: 1,
    isActive: true
},
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f8"),
    name: "Mango",
    price: 1000,
    profit: 0.6,
    duration: 7,
    type: "tree",
    stocks: 8,
    limit: 2,
    isActive: true
},
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f9"),
    name: "Moneytree",
    price: 2500,
    profit: 0.8,
    duration: 8,
    type: "tree",
    stocks: 5,
    limit: 3,
    isActive: true
},
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e698"),
    name: "Rambutan",
    price: 2500,
    profit: 0.8,
    duration: 8,
    type: "tree",
    stocks: 5,
    limit: 3,
    isActive: true
},
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e699"),
    name: "Lanzones",
    price: 2500,
    profit: 0.8,
    duration: 8,
    type: "tree",
    stocks: 5,
    limit: 3,
    isActive: true
},
]
