const { default: mongoose } = require("mongoose")

const Inventoryhistory = require("../models/Inventoryhistory")
const Inventory = require("../models/Inventory")
const Bank = require("../models/Bank")


exports.getBanks = async (req, res) => {
    try {
        const banks = await Bank.find({});

        if (!banks || banks.length === 0) {
            return res.status(400).json({
                message: "failed",
                data: "There are no banks available.",
            });
        }

        // Define custom order for sorting by type
        const sortOrder = [
            "nest_stash",
            "wealth_jar",
            "piggy_bank",
            "money_vault",
            "treasure_chest"
        ];

        // Sort banks based on their `type` field according to sortOrder
        banks.sort((a, b) => {
            return sortOrder.indexOf(a.type) - sortOrder.indexOf(b.type);
        });

        const formattedBanks = banks.map(bank => ({
            id: bank._id,
            type: bank.type,
            name: bank.name,
            min: bank.min,
            max: bank.max,
            profit: bank.profit,
            duration: bank.duration,
            b1t1: bank.b1t1,
            islocked: bank.islocked,
            isActive: bank.isActive !== undefined ? bank.isActive : true, // Ensure isActive is set to true if not defined
        }));
        return res.status(200).json({
            message: "success",
            data: formattedBanks,
        });
    } catch (err) {
        console.log(`There's a problem encountered while fetching banks. Error: ${err}`);
        return res.status(400).json({
            message: "bad-request",
            data: "There's a problem with the server. Please contact customer support for more details.",
        });
    }

}

exports.editbank = async (req, res) => {

    const { bankid, profit, duration, min, max, b1t1, islocked, isActive } = req.body

    if (!bankid){
        return res.status(400).json({ message: "failed", data: "Bank ID is required." });
    }

    const updatedata = {}

    if (profit !== undefined) updatedata.profit = parseFloat(profit);
    if (duration !== undefined) updatedata.duration = parseFloat(duration);
    if (min !== undefined) updatedata.min = parseFloat(min);
    if (max !== undefined) updatedata.max = parseFloat(max);
    if (b1t1 !== undefined) updatedata.b1t1 = b1t1;
    if (islocked !== undefined) updatedata.islocked = islocked;
    if (isActive !== undefined) updatedata.isActive = isActive;


    await Bank.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(bankid)
        },
        {
            $set: updatedata
        },
        {
            upsert: true,
        }
    )
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while updating ${bankid} mole. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })

    return res.status(200).json({ message: "success" })
}



// exports.getusertrainer = async (req, res) => {
//     const { id, username } = req.user

//     const { type } = req.query


//     if (!type) {
//         return res.status(400).json({ message: "failed", data: "Incomplete form data." });
//     }

//     if(type === 'Novice'){
//         const finalamount = await Inventory.aggregate([
//             { $match: { owner: new mongoose.Types.ObjectId(id), rank: "Novice" } },
//             { $group: { _id: null, totalAmount: { $sum: "$price" } } }
//         ]);

//         const totalAmount = finalamount.length > 0 ? finalamount[0].totalAmount : 0;

//         const amountleft = 5000 - totalAmount;

//         return res.status(200).json({ message: "success", data: { amountleft: amountleft}})
       
//     }
//     else if(type === 'Expert'){
//         const test1 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Novice" })

//         if(!test1){
//             return res.status(400).json({ message: "failed", data: `You need to claim a Novice (1) Trainer first.` });
//         }
//     } else if (type === 'Ace'){
//         const test1 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Novice" })
//         const test2 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Expert" })

//         if(!test1 || !test2){
//             return res.status(400).json({ message: "failed", data: `You need to claim a Novice (1) and Expert (1) Trainer first.` });
//         }
//     } else if (type === 'Ace of Spade'){
//         const test1 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Novice" })
//         const test2 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Expert" })
//         const test3 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Ace" })

//         if(!test1 || !test2 || !test3){
//             return res.status(400).json({ message: "failed", data: `You need to claim a Novice (1), Expert (1) and Ace (1) Trainer first.` });
//         }
//     }  else if (type === 'Ace of Heart'){
//         const test1 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Novice" })
//         const test2 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Expert" })
//         const test3 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Ace" })
//         const test4 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Ace of Spade" })

//         if(!test1 || !test2 || !test3 || !test4){
//             return res.status(400).json({ message: "failed", data: `You need to claim a Novice (1), Expert (1), Ace (1) and Ace of Spade (1) Trainer first.` });
//         }
//     } else {
//         return res.status(400).json({ message: "failed", data: "Invalid type." });
//     }


//     return res.status(200).json({ message: "success" })
// }