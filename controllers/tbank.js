const { default: mongoose } = require("mongoose");
const Tbank = require("../models/Tbank");
const { tbankdata } = require("../initialization/data");
const Tinventory = require("../models/Tinventory");
const Inventoryhistory = require("../models/Inventoryhistory");


exports.gettbanks = async (req, res) => {

    const { id, username } = req.user;

    let data = await Tbank.find()
        .then(data => data)
        .catch(err => {
            console.error("Error fetching NFT trainers:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });

    if (!data || data.length === 0) {
         data = await Tbank.insertMany(tbankdata)
    }

    const sortOrder = ['Avocado', 'Lanzones', 'Rambutan', 'Mango', 'Moneytree', 'Durian', 'Mangosteen', 'Pineapple', 'Pomello', 'Marang'];

    let playertbankassets = await Tinventory.find({ owner: new mongoose.Types.ObjectId(id) })
        .then(data => data)
        .catch(err => {
            console.error("Error fetching player bank assets:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });
    
    let timesbought = await Inventoryhistory.find({ 
        rank: "tree", 
        type: { $regex: /^Buy/i } 
    })
        .then(data => data)
        .catch(err => {
            console.error("Error fetching times bought:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });

    const formattedData = data.map(item => ({
        id: item._id,
        name: item.name,
        scientificName: item.scientificName,
        description: item.description,
        healthBenefits: item.healthBenefits,
        price: item.price,
        profit: item.profit,
        duration: item.duration,
        type: item.type,
        stocks: item.stocks,
        limit: item.limit || 0,
        isActive: item.isActive !== undefined ? item.isActive : true, 
        isPurchased: playertbankassets.some(asset => asset.bankname === item.name) || false,
        purchasedCount: playertbankassets.filter(asset => asset.bankname === item.name).length || 0,
        timesBought: timesbought.filter(history => history.bankname === item.name).length || 0
    }));

    formattedData.sort((a, b) => {
        const indexA = sortOrder.indexOf(a.name);
        const indexB = sortOrder.indexOf(b.name);
        return indexA - indexB;
    });
    
    return res.status(200).json({ message: "success", data: formattedData });
}


exports.edittbank = async (req, res) => {
    const { tbankid, name, scientificName, description, healthBenefits, profit, duration, price, type, stocks, limit, isActive } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (scientificName !== undefined) updateData.scientificName = scientificName;
    if (description !== undefined) updateData.description = description;
    if (healthBenefits !== undefined) updateData.healthBenefits = healthBenefits;
    if (type !== undefined) updateData.type = type;
    if (stocks !== undefined) updateData.stocks = parseInt(stocks);
    if (profit !== undefined) updateData.profit = parseFloat(profit);
    if (duration !== undefined) updateData.duration = parseFloat(duration);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (limit !== undefined) updateData.limit = parseInt(limit); 
    if (isActive !== undefined) updateData.isActive = isActive;

    console.log("Update Data:", updateData);
    
    const numericValues = [price, profit, duration, stocks, limit].filter(val => val !== undefined);
    if (numericValues.some(val => parseFloat(val) < 0)) {
        return res.status(400).json({ message: "failed", data: "Values cannot be negative." });
    }

    await Tbank.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(tbankid) },
        { $set: updateData }
    )
        .then(data => data)
        .catch(err => {
            console.error(`Error updating NFT trainer ${tbankid}:`, err);
            return res.status(500).json({ message: "bad-request", data: "Internal server error." });
        });

    return res.status(200).json({ message: "success" });
}
