const { default: mongoose } = require("mongoose")
const Inventoryhistory = require("../models/Inventoryhistory")
const Tinventory = require("../models/Tinventory")
const { AddUnixtimeDay, DateTimeServerExpiration, DateTimeServer, RemainingTime } = require("../utils/datetimetools")
const { getfarm, saveinventoryhistory } = require("../utils/inventorytools")
const { walletbalance, reducewallet, sendcommissionunilevel, addwallet } = require("../utils/walletstools")
const Tbank = require("../models/Tbank")
const { addanalytics } = require("../utils/analyticstools")
const { addwallethistory } = require("../utils/wallethistorytools")


exports.buytbank = async (req, res) => {
    const {id, username} = req.user
    const { tbankid, quantity: UpdatedQuantity } = req.body

    const session = await mongoose.startSession();
    session.startTransaction();
    const quantity = Math.max(0, Math.floor(Number(UpdatedQuantity) || 0));
    try {
        const wallet = await walletbalance("fiatbalance", id)
        const tree = await Tbank.findOne({ _id: new mongoose.Types.ObjectId(tbankid) })
        let price = tree.price * quantity;

        if(!tree){
            return res.status(400).json({message: "failed", data: "Tree not found or invalid Tree ID."});
        }
        if (!quantity || quantity <= 0){
            return res.status(400).json({message: "failed", data: "Please input valid quantity."});
        }
        if (wallet == "failed" || wallet == "nodata"){
            return res.status(400).json({message: "failed", data: "There's a problem with your account. Please contact customer support for more details"});
        }

        if (wallet < price){
            return res.status(400).json({message: "failed", data: "You don't have enough funds to buy this tree! Please top up first and try again."});
        }

        if (!tree.isActive){
            return res.status(400).json({message: "failed", data: "This tree is currently inactive. Please try again later."});
        }


        // check inventory if the tree is already purchased
        const existingtree = await Tinventory.find({ owner: new mongoose.Types.ObjectId(id), bankname: tree.name });
        const existingtreeCount = existingtree.length + quantity;
        if (existingtreeCount > tree.limit) {
            return res.status(400).json({message: "failed", data: `You can only have a maximum of ${tree.limit} trees of name ${tree.name}.`});
        }

        if (tree.stocks <= 0){
            return res.status(400).json({message: "failed", data: `No stocks available for ${tree.name}. Please try again later.`});
        }

        if (quantity > tree.stocks) {
            return res.status(400).json({message: "failed", data: `Not enough stocks available for ${tree.name}. Please try again later.`});
        }

        const buy = await reducewallet("fiatbalance", price, id, session)
        if (buy != "success"){
            return res.status(400).json({message: "failed", data: "You don't have enough funds to buy this tree! Please top up first and try again."});
        }

        const totalincome = (tree.profit * tree.price) + tree.price
        
        const baseInventory = {
            owner: new mongoose.Types.ObjectId(id), 
            type: tree.type,
            // rank: tree.rank, 
            bankname: tree.name,
            price: tree.price,
            profit: tree.profit,
            duration: tree.duration,
            defaultduration: tree.duration, 
            expiration: DateTimeServerExpiration(tree.duration), 
            totalincome: totalincome,
            startdate: DateTimeServer(), 
        };

        const inventoryDocs = [];

        for (let i = 0; i < quantity; i++) {
            inventoryDocs.push({ ...baseInventory, _id: new mongoose.Types.ObjectId() });
        }

        try {
            await Tinventory.insertMany(inventoryDocs, { session });
        } catch (error) {
            console.log(`There's a problem creating inventory documents for ${username}. Error: ${error}`);
            throw new Error("There's a problem with your account. Please contact customer support for more details");
        }


        try {
            for (let i = 0; i < quantity; i++) {
                const unilevelrewards = await sendcommissionunilevel(tree.price, id, tree.name, tree.type, session)
                if (unilevelrewards != "success"){
                    return res.status(400).json({message: "failed", data: "There's a problem with your account. Please contact customer support for more details"});
                }
                const inventoryhistory = await saveinventoryhistory(id, tree.name, `Buy ${tree.name}`, tree.price, "tree", session);
                await addanalytics(id, inventoryhistory.data.transactionid, `Buy ${tree.name}`, `User ${username} bought ${tree.name}`, tree.price, session);
            }            
        } catch (historyError) {
            console.log(`There's a problem creating inventory history for ${username}. Error: ${historyError}`);
            throw new Error("There's a problem with your account. Please contact customer support for more details");
        }

        tree.stocks -= quantity;
        await tree.save({ session });

        await session.commitTransaction();
        return res.json({message: "success"});

    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({
            message: 'failed',
            data: error.message || "There's a problem with your account. Please contact customer support for more details"
        });
    } finally {
        session.endSession();
    }
}

exports.treeclaimtotalincome = async (req, res) => {
    const {id, username} = req.user
    const { tbankid } = req.body

    if (!tbankid || tbankid == ""){
        return res.status(400).json({message: "failed", data: "No tree is selected"})
    }

    const treedb = await Tinventory.findOne({_id: new mongoose.Types.ObjectId(tbankid)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the tree data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the tree data! Please contact customer support"})
    })

    if (!treedb){
        return res.status(400).json({message: "failed", data: "No tree is selected"})
    }

    const tree = await Tbank.findOne({ name: treedb.bankname })

    if(!tree){
        return res.status(400).json({message: "failed", data: "No tree is selected"})
    }   

    const remainingtime = RemainingTime(parseFloat(treedb.startdate), treedb.duration)

    if (remainingtime > 0){
        return res.status(400).json({message: "failed", data: "There are still remaining time before claiming! Wait for the timer to complete."})
    }

    const earnings = (treedb.price * treedb.profit) + treedb.price;

    await addwallet("gamebalance", earnings, id)

    await Tinventory.findOneAndDelete({_id: new mongoose.Types.ObjectId(tbankid)})
    .catch(async err => {
        console.log(`There's a problem getting the deleting Tree data for ${username} Tree id: ${tbankid}. Error: ${err}`)

        await reducewallet("gamebalance", earnings, id)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the finishing Tree data! Please contact customer support"})
    })

    const wallethistory = await addwallethistory(id, "gamebalance",  earnings, process.env.MONEYTREE_ID, tree.name, tree.type)

    if (wallethistory.message != "success"){
        return res.status(400).json({message: "bad-request", data: "There's a problem processing your data. Please contact customer support"})
    }
    await saveinventoryhistory(id, `${tree.type}`, `Claim ${tree.name}`, earnings, "tree")

    await addanalytics(id, wallethistory.data.transactionid, `gamebalance`, `Player ${username} claim ${earnings} in Tree ${tree.name}`, earnings)

    return res.json({message: "success"})
}

exports.gettinventory = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const tree = await Tinventory.find({owner: id})
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get inventory data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })


    const totalPages = await Tinventory.countDocuments({owner: id})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })


    // calculate total earnings when matured

    const totalearnings = await Tinventory.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(id) } },
        { $group: {
            _id: null,
            totalEarnings: {
                $sum: { $add: [
                    "$price",
                    { $multiply: ["$price", "$profit"] }
                ]}
            }
        }}
    ]).then(data => data[0]?.totalEarnings || 0)


    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        tree: {},
        totalearnings: totalearnings,
        totalPages: pages
    }

    let index = 0

    tree.forEach(datatree => {
        const {_id, bankname, type, price, profit, duration, startdate, createdAt} = datatree


        const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), (price * profit) + price)
        const remainingtime = RemainingTime(parseFloat(startdate), duration)
        const totalprofit = (price * profit) + price;
        const createdAtDate = new Date(createdAt);

        const matureDate = new Date(createdAtDate);
        matureDate.setDate(createdAtDate.getDate() + duration); 

        data.tree[index] = {
            tbankid: _id,
            bankname: bankname,
            type: type,
            buyprice: price,
            profit: profit,
            duration: duration,
            earnings: earnings,
            totalprofit: totalprofit,
            remainingtime: remainingtime,
            purchasedate: createdAt,
            maturedate: matureDate.toISOString()       
        }
        index++
    })

    return res.json({message: "success", data: data})
}

exports.getplayertinventory = async (req, res) => {
    const {id, username} = req.user
    const {playerid, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const tree = await Tinventory.find({owner: playerid})
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get inventory data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })


    const totalPages = await Tinventory.countDocuments({owner: playerid})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        tree: {},
        totalPages: pages
    }

    let index = 0

    tree.forEach(datatree => {
        const {_id, bankname, type, price, profit, duration, startdate, createdAt} = datatree

        const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), (price * profit) + price)
        const remainingtime = RemainingTime(parseFloat(startdate), duration)

        const createdAtDate = new Date(createdAt);

        const matureDate = new Date(createdAtDate);
        matureDate.setDate(createdAtDate.getDate() + duration); 

        data.tree[index] = {
            treebankid: _id,
            bankname: bankname,
            type: type,
            buyprice: price,
            profit: profit,
            duration: duration,
            earnings: earnings,
            remainingtime: remainingtime,
            purchasedate: createdAt,
            maturedate: matureDate.toISOString()       
        }

        index++
    })

    return res.json({message: "success", data: data})
}


exports.deleteplayertreeinventorysuperadmin = async (req, res) => {
    const {id, username} = req.user

    const {tbankid} = req.body
    
    try {    

    
        const tree = await Tinventory.findOne({  _id: new mongoose.Types.ObjectId(tbankid) });

        if (!tree) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }



        // we should also find the inventory history and delete it we can find it through the createdAt date and the trainer name
        const inventoryhistory = await Inventoryhistory.findOne({ 
            owner: new mongoose.Types.ObjectId(tree.owner),
            createdAt: {
            $gte: new Date(tree.createdAt.getTime() - 20000), // 10 seconds before
            $lte: new Date(tree.createdAt.getTime() + 20000)  // 10 seconds after
            },
            bankname: tree.bankname,
            type: `Buy ${tree.bankname}`,
            amount: tree.price
        }).catch(err => {
            console.log(`Failed to find inventory history for ${username}, error: ${err}`)
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        if (!inventoryhistory) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }


        await Tinventory.findOneAndDelete({ _id: new mongoose.Types.ObjectId(tbankid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
            
            return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
        })

        // we should also find the inventory history and delete it we can find it through the createdAt date and the trainer name
        await Inventoryhistory.findOneAndDelete({ 
            owner: new mongoose.Types.ObjectId(tree.owner),
            createdAt: {
            $gte: new Date(tree.createdAt.getTime() - 20000), // 10 seconds before
            $lte: new Date(tree.createdAt.getTime() + 20000)  // 10 seconds after
            },
            bankname: tree.bankname,
            type: `Buy ${tree.bankname}`,
            amount: tree.price
        }).catch(err => {
            console.log(`Failed to delete inventory history for ${username}, error: ${err}`)
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        return res.status(200).json({ message: "success"});

    } catch (error) {
        console.error(error)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support."});
    }
}

exports.maxplayertreeinventorysuperadmin = async (req, res) => {
    const {id, username} = req.user
    const {tbankid, percentage} = req.body

    if (!mongoose.Types.ObjectId.isValid(tbankid)) {
        return res.status(400).json({ message: 'Invalid Tree ID' });
    }

    try {
        const tree = await Tinventory.findOne({ _id: new mongoose.Types.ObjectId(tbankid) });

        if (!tree) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }

        // Default to 99.99% if not provided or invalid
        let percent = 99.99;
        if (percentage && percentage > 0 && percentage <= 100) {
            percent = percentage;
        }

        // Set totalaccumulated to the percentage of totalincome
        tree.totalaccumulated = tree.totalincome * (percent / 100);

        // // Adjust duration to match the percentage progress
        // // If percent is 100, duration = 0.0007 (immediate claim)
        // // Otherwise, duration = original duration * (1 - percent/100)
        // if (percent >= 100) {
        //     tree.duration = 0.0007;
        // } else {
        //     tree.duration = tree.defaultduration * (1 - (percent / 100));
        //     // Ensure duration is not negative or zero
        //     if (tree.duration < 0.0007) tree.duration = 0.0007;
        // }

        const now = DateTimeServer(); // current unix time in seconds
        const elapsedSeconds = tree.defaultduration * (percent / 100) * 24 * 60 * 60; // duration in seconds
        tree.startdate = now - elapsedSeconds;


        await tree.save();

        return res.status(200).json({ message: "success"});
    } catch (error) {
        console.error(error)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support."});
    }
}