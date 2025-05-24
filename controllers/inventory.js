const { default: mongoose } = require("mongoose")
const Inventory = require("../models/Inventory")

const { saveinventoryhistory, getfarm } = require("../utils/inventorytools")
const { walletbalance, sendcommissionunilevel, reducewallet, addwallet } = require("../utils/walletstools")
const { addanalytics } = require("../utils/analyticstools")
const { DateTimeServerExpiration, DateTimeServer, RemainingTime, AddUnixtimeDay } = require("../utils/datetimetools")
const Inventoryhistory = require("../models/Inventoryhistory")
const { addwallethistory } = require("../utils/wallethistorytools")
const Maintenance = require("../models/Maintenance")
const Bank = require("../models/Bank")
const Dailyclaim = require("../models/Dailyclaim")

exports.buybank = async (req, res) => {
    const {id, username} = req.user
    const {type, amount } = req.body


    const wallet = await walletbalance("fiatbalance", id)

    if (wallet == "failed"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }

    if (wallet == "nodata"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }

    if (wallet < amount){
        return res.status(400).json({ message: 'failed', data: `You don't have enough funds to buy this bank! Please top up first and try again.` })
    }

    const bank = await Bank.findOne({ type: type })

    if (amount < bank.min){
        return res.status(400).json({ message: 'failed', data: `The price for ${bank.name} is ${bank.min} pesos`})
    }

    const buy = await reducewallet("fiatbalance", amount, id)

    if (buy != "success"){
        return res.status(400).json({ message: 'failed', data: `You don't have enough funds to buy this bank! Please top up first and try again.` })
    }

    const unilevelrewards = await sendcommissionunilevel(amount, id, bank.name, bank.type)

    if (unilevelrewards != "success"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }

    const totalincome = (bank.profit * amount) + amount
    
    // if (bank.type === 'Novice') {
    //     if (!mongoose.Types.ObjectId.isValid(id)) {
    //         return res.status(400).json({ message: 'Invalid user ID' });
    //     }
    
    //     const finalamount = await Inventory.aggregate([
    //         { $match: { owner: new mongoose.Types.ObjectId(id), type: "Novice" } },
    //         { $group: { _id: null, totalAmount: { $sum: "$price" } } }
    //     ]);
    
    //     const totalAmount = finalamount.length > 0 ? finalamount[0].totalAmount : 0;
    //     const amountleft = Math.max(0, 5000 - totalAmount);
    //     const amountToBuy = Number(amount);
    
    //     if (amountleft < amountToBuy) {
    //         return res.status(400).json({
    //             message: 'failed',
    //             data: `You only have ${amountleft} pesos left to buy a novice bank.`
    //         });
    //     }

    //     console.log(amountleft, amountToBuy)
    // }
    
    
    
    // const b1t1 = await Maintenance.findOne({ type: "b1t1", value: "1" })
    // .then(data => data)
    // .catch(err => {
    //     console.log(`There's a problem getting b1t1 maintenance. Error: ${err}`)

    //     return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support."})
    // })

    if(bank.b1t1 == '1'){
        // Create first inventory
        await Inventory.create({
            owner: new mongoose.Types.ObjectId(id), 
            type: type,
            startdate: DateTimeServer(), 
            duration: bank.duration,
            profit: bank.profit, 
            expiration: DateTimeServerExpiration(bank.duration), 
            bankname: bank.name,
            fruitcollection: 0,
            dailyclaim: 0, 
            totalaccumulated: 0, 
            dailyaccumulated: 0,
            totalincome: totalincome,
            price: amount,
        }).catch(err => {
            console.log(`Failed to bank inventory data for ${username} type: ${type}, error: ${err}`)
            return res.status(400).json({ 
                message: 'failed', 
                data: `There's a problem with your account. Please contact customer support for more details` 
            })
        })
        
        // Record history for first inventory
        const inventoryhistory1 = await saveinventoryhistory(id, bank.name, `Buy ${bank.name} (1/2)`, amount)
        await addanalytics(id, inventoryhistory1.data.transactionid, `Buy ${bank.name}`, `User ${username} bought ${bank.name} (1/2)`, amount)
    
        // Create second inventory (B1T1)
        await Inventory.create({
            owner: new mongoose.Types.ObjectId(id), 
            type: type,
            startdate: DateTimeServer(), 
            duration: bank.duration,
            profit: bank.profit, 
            expiration: DateTimeServerExpiration(bank.duration), 
            bankname: bank.name,
            fruitcollection: 0,
            dailyclaim: 0, 
            totalaccumulated: 0, 
            dailyaccumulated: 0,
            totalincome: totalincome,
            price: amount,
        }).catch(err => {
            console.log(`Failed to bank inventory data for ${username} type: ${type}, error: ${err}`)
            return res.status(400).json({ 
                message: 'failed', 
                data: `There's a problem with your account. Please contact customer support for more details` 
            })
        })
    
        // Record history for second inventory (free B1T1)
        const inventoryhistory2 = await saveinventoryhistory(id, bank.name, `Buy ${bank.name} (2/2 - Free B1T1)`, 0)
        await addanalytics(id, inventoryhistory2.data.transactionid, `Buy ${bank.name}`, `User ${username} received free ${bank.name} (B1T1)`, 0)
    } else {
        await Inventory.create({
            owner: new mongoose.Types.ObjectId(id), 
            type: type,
            startdate: DateTimeServer(), 
            duration: bank.duration,
            profit: bank.profit,  
            expiration: DateTimeServerExpiration(bank.duration), 
            bankname: bank.name,
            fruitcollection: 0,
            dailyclaim: 0, 
            totalaccumulated: 0, 
            dailyaccumulated: 0,
            totalincome: totalincome,
            price: amount,
        })
    .catch(err => {
        
        console.log(`Failed to bank inventory data for ${username} type: ${type}, error: ${err}`)
        
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    
    const inventoryhistory = await saveinventoryhistory(id, bank.name, `Buy ${bank.name}`, amount)
    
    await addanalytics(id, inventoryhistory.data.transactionid, `Buy ${bank.name}`, `User ${username} bought ${bank.name}`, amount)
    }

    return res.json({message: "success"})
}

exports.claimtotalincome = async (req, res) => {
    const {id, username} = req.user
    const {bankid} = req.body

    if (!bankid || bankid == ""){
        return res.status(400).json({message: "failed", data: "No bank is selected"})
    }

    const bankdb = await Inventory.findOne({_id: new mongoose.Types.ObjectId(bankid)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the bank data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the bank data! Please contact customer support"})
    })

    if (!bankdb){
        return res.status(400).json({message: "failed", data: "No bank is selected"})
    }

    const bank = await Bank.findOne({ name: bankdb.bankname, type: bankdb.type})

    const templimit = (bankdb.price * bank.profit) + bankdb.price

    if (Math.round(bankdb.totalaccumulated) < templimit){
        return res.status(400).json({message: "failed", data: "You still didn't reach the limit of this bank! keep playing and reach the limit in order to claim"})
    }

    await addwallet("gamebalance", bankdb.totalincome, id)

    await Inventory.findOneAndDelete({_id: new mongoose.Types.ObjectId(bankid)})
    .catch(async err => {
        console.log(`There's a problem getting the deleting bank data for ${username} bank id: ${bankid}. Error: ${err}`)

        await reducewallet("gamebalance",  bankdb.totalincome, id)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the finishing bank data! Please contact customer support"})
    })

    const wallethistory = await addwallethistory(id, "gamebalance",  bankdb.totalincome, process.env.MONEYTREE_ID, bank.name, bank.type)

    if (wallethistory.message != "success"){
        return res.status(400).json({message: "bad-request", data: "There's a problem processing your data. Please contact customer support"})
    }
    await saveinventoryhistory(id, `${bank.name}`, `Claim ${bank.name}`, bankdb.totalincome)

    await addanalytics(id, wallethistory.data.transactionid, `gamebalance`, `Player ${username} claim ${bankdb.totalaccumulated} in Bank ${bankdb.type}`, bankdb.totalaccumulated)

    return res.json({message: "success"})
}

exports.gettotalpurchased = async (req, res) => {
    const {id, username} = req.user

    const finaldata = {
        totalpurchased: 0
    }

    const statisticInventoryHistory = await Inventoryhistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: { $regex: "^Buy", $options: "i" }
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of total purchase for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of total purchased. Please contact customer support."})
    })

    if (statisticInventoryHistory.length > 0) {
        finaldata.totalpurchased = statisticInventoryHistory[0].totalAmount;
    }

    return res.json({message: "success", data: finaldata})
}

exports.getinventory = async (req, res) => {
    const { id, username } = req.user;
    const { page, limit } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    try {
        const [inventoryItems, totalDocuments] = await Promise.all([
            Inventory.find({ owner: id })
                .skip(pageOptions.page * pageOptions.limit)
                .limit(pageOptions.limit)
                .sort({ 'createdAt': -1 }),
            Inventory.countDocuments({ owner: id })
        ]);

        const pages = Math.ceil(totalDocuments / pageOptions.limit);

        const data = await Promise.all(inventoryItems.map(async (item) => {
            const { _id, type, bankname, duration, dailyaccumulated, totalaccumulated, qty, price, startdate, profit } = item;

            const creaturelimit = (parseInt(price) * profit) + parseInt(price);
            const limitperday = creaturelimit / duration;

            const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), creaturelimit);
            const remainingtime = RemainingTime(parseFloat(startdate), duration);

            return {
                bankid: _id,
                type: type,
                bankname: bankname,
                qty: qty,
                duration: duration,
                totalaccumulated: totalaccumulated,
                dailyaccumulated: dailyaccumulated,
                limittotal: creaturelimit,
                limitdaily: limitperday,
                earnings: earnings,
                remainingtime: remainingtime
            };
        }));

        return res.json({ message: "success", data: data.filter(item => item !== null), totalpages: pages });
    } catch (err) {
        console.log(`Failed to get inventory data for ${username}, error: ${err}`);
        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` });
    }
};
exports.getunclaimedincomeinventory = async (req, res) => {
    const {id, username} = req.user

    const unclaimedincome = await Inventory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id)
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalaccumulated: { $sum: "$totalaccumulated" }
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of total purchase for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of total purchased. Please contact customer support."})
    })

    return res.json({message: "success", data: {
        totalaccumulated: unclaimedincome.length > 0 ? unclaimedincome[0].totalaccumulated : 0
    }})
}
exports.getinventoryhistory = async (req, res) => {
    const {id, username} = req.user
    const {type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const history = await Inventoryhistory.find({
        owner: new mongoose.Types.ObjectId(id),
        type: { $regex: type, $options: "i" } // Case-insensitive regex search
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the inventory history of ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the inventory history. Please contact customer support."})
    })

    if (history.length <= 0){
        return res.json({message: "success", data: {
            history: [],
            totalpages: 0
        }})
    }

    const totalPages = await Inventoryhistory.countDocuments({
        owner: new mongoose.Types.ObjectId(id),
        type: { $regex: type, $options: "i" } 
    })
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory history data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        history: [],
        totalpages: pages
    }

    history.forEach(tempdata => {
        const {createdAt,  bankname, type, amount} = tempdata

        data.history.push({
            bankname: bankname,
            type: type,
            amount: amount,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

exports.getplayerinventoryforadmin = async (req, res) => {
    const { id, username } = req.user;
    const { playerid, page, limit } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    try {
        const [inventoryItems, totalDocuments] = await Promise.all([
            Inventory.find({ owner: new mongoose.Types.ObjectId(playerid) })
                .skip(pageOptions.page * pageOptions.limit)
                .limit(pageOptions.limit)
                .sort({ 'createdAt': -1 }),
            Inventory.countDocuments({ owner: new mongoose.Types.ObjectId(playerid) })
        ]);

        const pages = Math.ceil(totalDocuments / pageOptions.limit);

        const data = await Promise.all(inventoryItems.map(async (item) => {
            const { _id, type, name, duration, dailyaccumulated, totalaccumulated, qty, price, startdate } = item;

            const bank = await Bank.findOne({ type: type });

            if (!bank) {
                console.log(`Bank type ${type} not found for ${username}`);
                return null; // Skip if no bank details found
            }

            const creaturelimit = (parseInt(price) * bank.profit) + parseInt(price);
            const limitperday = creaturelimit / bank.duration;

            const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), creaturelimit);
            const remainingtime = RemainingTime(parseFloat(startdate), duration);

            return {
                type: type,
                bank: _id,
                name: name,
                qty: qty,
                duration: duration,
                totalaccumulated: totalaccumulated,
                dailyaccumulated: dailyaccumulated,
                limittotal: creaturelimit,
                limitdaily: limitperday,
                earnings: earnings,
                remainingtime: remainingtime
            };
        }));

        return res.json({ message: "success", data: data.filter(item => item !== null), totalpages: pages });
    } catch (err) {
        console.log(`Failed to get inventory data for ${username}, error: ${err}`);
        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` });
    }
};

exports.getinventoryhistoryuseradmin = async (req, res) => {
    const {id, username} = req.user
    const {userid, type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const history = await Inventoryhistory.find({ owner: new mongoose.Types.ObjectId(userid), type: { $regex: type, $options: "i" }})    
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the inventory history of ${userid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the inventory history. Please contact customer support."})
    })

    if (history.length <= 0){
        return res.json({message: "success", data: {
            history: [],
            totalpages: 0
        }})
    }

    const totalPages = await Inventoryhistory.countDocuments({owner: new mongoose.Types.ObjectId(userid),  type: { $regex: type, $options: "i" }})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory history data for ${userid}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        history: [],
        totalpages: pages
    }

    history.forEach(tempdata => {
        const {createdAt,  bankname, amount, type} = tempdata

        data.history.push({
            id: tempdata._id,
            bankname: bankname,
            type: type,
            amount: amount,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}


exports.maxplayerinventorysuperadmin = async (req, res) => {
    
    const {id, username} = req.user

    const {playerid, bankid} = req.body
    
    if (!mongoose.Types.ObjectId.isValid(playerid)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {    
    
        const bank = await Inventory.findOne({ owner: new mongoose.Types.ObjectId(playerid), _id: new mongoose.Types.ObjectId(bankid) })
        .then(data => data)

        bank.totalaccumulated = bank.totalincome
        bank.duration = 0.0007

        await bank.save();

        return res.status(200).json({ message: "success"});
        
    } catch (error) {
        console.error(error)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support."});
    }
}

exports.deleteplayerinventorysuperadmin = async (req, res) => {
    const {id, username} = req.user

    const {bankid} = req.body
    
    try {    

    
        const bank = await Inventory.findOne({  _id: new mongoose.Types.ObjectId(bankid) });

        
        if (!bank) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }

        const inventoryhistory = await Inventoryhistory.findOne({ 
            owner: new mongoose.Types.ObjectId(bank.owner),
            createdAt: {
            $gte: new Date(bank.createdAt.getTime() - 10000), // 3 seconds before
            $lte: new Date(bank.createdAt.getTime() + 10000)  // 3 seconds after
            },
            bankname: bank.bankname 
        }).catch(err => {
            console.log(`Failed to delete inventory history for ${username}, error: ${err}`)
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        console.log(inventoryhistory)
        if (!inventoryhistory) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }        

        await Inventory.findOneAndDelete({ _id: new mongoose.Types.ObjectId(bankid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the bank data for ${username}. Error: ${err}`)
            
            return res.status(400).json({message: "bad-request", data: "There's a problem getting the bank data! Please contact customer support"})
        })

        await Inventoryhistory.findOneAndDelete({ 
            owner: new mongoose.Types.ObjectId(bank.owner),
            createdAt: {
            $gte: new Date(bank.createdAt.getTime() - 10000), // 3 seconds before
            $lte: new Date(bank.createdAt.getTime() + 10000)  // 3 seconds after
            },
            bankname: bank.bankname 
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


exports.deleteplayerinventoryhistorysuperadmin = async (req, res) => {

    const {id, username} = req.user

    const {historyid} = req.body

    if (!mongoose.Types.ObjectId.isValid(historyid)) {
        return res.status(400).json({ message: 'Invalid History ID' });
    }

    const history = await Inventoryhistory.findOne({ _id: new mongoose.Types.ObjectId(historyid) })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
    })

    if (!history){
        return res.status(400).json({message: "failed", data: "History not found"})
    }

    await Inventory.findOneAndDelete({ 
        owner: new mongoose.Types.ObjectId(history.owner),
        createdAt: {
        $gte: new Date(history.createdAt.getTime() - 10000), // 3 seconds before
        $lte: new Date(history.createdAt.getTime() + 10000)  // 3 seconds after
        },
        bankname: history.bankname
    })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
    })

    await Inventoryhistory.findOneAndDelete({ _id: new mongoose.Types.ObjectId(historyid) })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
    })

    return res.status(200).json({ message: "success"});
}

exports.dailyclaimhistory = async (req, res) => {
    const { id, username } = req.user;
    const { page, limit } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    try {
        const history = await Dailyclaim.find({ owner: new mongoose.Types.ObjectId(id) })
            .populate('inventory')
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort({ 'createdAt': -1 });

        if (!history || history.length === 0) {
            return res.json({
                message: "success",
                data: {
                    history: [],
                    totalpages: 0
                }
            });
        }

        const totalPages = await Dailyclaim.countDocuments({ owner: new mongoose.Types.ObjectId(id) });
        const pages = Math.ceil(totalPages / pageOptions.limit);

        const data = {
            history: [],
            totalpages: pages
        };

        history.forEach(tempdata => {
            // Get values from Dailyclaim and populated inventory
            const bankname = tempdata.inventory?.bankname || "Unknown";
            const type = tempdata.inventory?.type || "Unknown";
            const amount = tempdata.amount;
            const createdAt = tempdata.createdAt;

            data.history.push({
                bankname: bankname,
                type: type,
                amount: amount,
                createdAt: createdAt
            });
        });

        return res.json({ message: "success", data: data });
    } catch (err) {
        console.log(`There's a problem getting the daily claim history of ${username}. Error: ${err}`);
        return res.status(400).json({
            message: "bad-request",
            data: "There's a problem getting the daily claim history. Please contact customer support."
        });
    }
};

exports.dailyclaimhistorysa = async (req, res) => {
    const { id, username } = req.user;
    const { playerid, page, limit } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    try {
        const history = await Dailyclaim.find({ owner: new mongoose.Types.ObjectId(playerid) })
            .populate('inventory')
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort({ 'createdAt': -1 });

        if (!history || history.length === 0) {
            return res.json({
                message: "success",
                data: {
                    history: [],
                    totalpages: 0
                }
            });
        }

        const totalPages = await Dailyclaim.countDocuments({ owner: new mongoose.Types.ObjectId(playerid) });
        const pages = Math.ceil(totalPages / pageOptions.limit);

        const data = {
            history: [],
            totalpages: pages
        };

        history.forEach(tempdata => {
            // Get values from Dailyclaim and populated inventory
            const bankname = tempdata.inventory?.bankname || "Unknown";
            const type = tempdata.inventory?.type || "Unknown";
            const amount = tempdata.amount;
            const createdAt = tempdata.createdAt;

            data.history.push({
                bankname: bankname,
                type: type,
                amount: amount,
                createdAt: createdAt
            });
        });

        return res.json({ message: "success", data: data });
    } catch (err) {
        console.log(`There's a problem getting the daily claim history of ${username}. Error: ${err}`);
        return res.status(400).json({
            message: "bad-request",
            data: "There's a problem getting the daily claim history. Please contact customer support."
        });
    }
};

exports.deletedailyclaimhistorysa = async (req, res) => {
    const { id, username } = req.user;
    const { historyid } = req.body;

    if (!mongoose.Types.ObjectId.isValid(historyid)) {
        return res.status(400).json({ message: 'Invalid History ID' });
    }

    const history = await Dailyclaim.findOne({ _id: new mongoose.Types.ObjectId(historyid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support" })
        })

    if (!history) {
        return res.status(400).json({ message: "failed", data: "History not found" })
    }

    const inventory = await Inventory.findOne({ _id: new mongoose.Types.ObjectId(history.inventory) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support" })
        })

    if (!inventory) {
        return res.status(400).json({ message: "failed", data: "Inventory not found" })
    }

    inventory.totalaccumulated = Number(inventory.totalaccumulated) - Number(history.amount)

    await inventory.save()
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support" })
        })
    await Dailyclaim.findOneAndDelete({ _id: new mongoose.Types.ObjectId(historyid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support" })
        })

    return res.status(200).json({ message: "success" });
}