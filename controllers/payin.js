const { default: mongoose } = require("mongoose")
const Payin = require("../models/Payin")
const Userwallets = require("../models/Userwallets")
const Users = require("../models/Users")
const { addwallethistory } = require("../utils/wallethistorytools")
const { addanalytics, deleteanalytics } = require("../utils/analyticstools")
const { createpayin } = require("../utils/payintools")
const {checktwentyfourhours} = require("../utils/datetimetools")

exports.getpayinlist = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query
    
    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payinlist = await Payin.aggregate([
        { $match: { status: "processing" } },
        { $sort: { createdAt: -1 } },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $lookup: {
                from: "staffusers",
                localField: "processby",
                foreignField: "_id",
                as: "processbyDetails"
            }
        },
        { $unwind: { path: "$processbyDetails", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                status: 1,
                value: 1,
                owner: { username: "$ownerDetails.username", _id: "$ownerDetails._id" },
                processby: { username: "$processbyDetails.username", _id: "$processbyDetails._id" }
            }
        }
    ]);

    return res.json({message: "success", data: payinlist});

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        payinlist: [],
        totalPages: pages
    }
    
    payinlist.forEach(valuedata => {
        const {_id, owner, processby, status, value} = valuedata

        data.payinlist.push({
            id: _id,
            owner: owner,
            processby: processby != null ? processby : "",
            status: status,
            value: value
        })
    })

    return res.json({message: "success", data: data})
}

exports.getpayinhistorysuperadmin = async (req, res) => {
    const { id, username } = req.user;
    const { page, limit, searchUsername } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const payinpipelinelist = [
        {
            $match: {
                status: { $in: ["done", "reject"] }  // Using $in is more concise for this case
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerinfo"
            }
        },
        { $unwind: "$ownerinfo" },
        {
            $lookup: {
                from: "userdetails",
                localField: "owner",
                foreignField: "owner",
                as: "userdetails"
            }
        },
        { $unwind: "$userdetails" }
    ];
    
    // Conditionally add $match stage for username if searchUsername is provided
    if (searchUsername) {
        payinpipelinelist.push({
            $match: {
                "ownerinfo.username": { $regex: new RegExp(searchUsername, 'i') }
            }
        });
    }
    
    // Sort by createdAt before pagination
    payinpipelinelist.push({ $sort: { createdAt: -1 } });
    
    // Add $facet to perform pagination and count
    payinpipelinelist.push({
        $facet: {
            totalPages: [{ $count: "count" }],
            data: [
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        value: 1,
                        type: 1,
                        username: "$ownerinfo.username",
                        userid: "$ownerinfo._id",
                        firstname: "$userdetails.firstname",
                        lastname: "$userdetails.lastname",
                        createdAt: 1
                    }
                },
                { $skip: pageOptions.page * pageOptions.limit },
                { $limit: pageOptions.limit }
            ]
        }
    });

    
    const payinhistory = await Payin.aggregate(payinpipelinelist)
    .catch(err => {
        console.log(`Failed to get payin list data for ${username}, error: ${err}`);
        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` });
    });

    const totalPages = payinhistory[0].totalPages[0]?.count || 0;
    const pages = Math.ceil(totalPages / pageOptions.limit);

    console.log(payinhistory[0])

    const data = {
        payinhistory: [],
        totalPages: pages
    };

    if (payinhistory.length >= 0){
        payinhistory[0].data.forEach(valuedata => {
            const { _id, owner, status, value, type, username, firstname, lastname, userid, createdAt } = valuedata;

            data.payinhistory.push({
                id: _id,
                owner: owner,
                username: username,
                userid: userid,
                firstname: firstname,
                lastname: lastname,
                value: value,
                status: status,
                type: type,
                createdAt: createdAt
            });
        });
    }

    return res.json({ message: "success", data: data });
}

exports.getpayinhistoryadmin = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query
    
    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payinhistory = await Payin.find({processby: new mongoose.Types.ObjectId(id), $or: [{status: "done"}, {status: "reject"}]})
    .populate({
        path: "owner processby"
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get payin list data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Payin.countDocuments({processby: new mongoose.Types.ObjectId(id), $or: [{status: "done"}, {status: "reject"}]})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        payinhistory: [],
        totalPages: pages
    }
    
    payinhistory.forEach(valuedata => {
        const {_id, owner, processby, status, value} = valuedata

        data.payinhistory.push({
            transactionid: _id,
            owner: owner.username,
            ownerid: owner._id,
            processby: processby != null ? processby.username : "",
            status: status,
            value: value
        })
    })

    return res.json({message: "success", data: data})
}

exports.processpayin = async (req, res) => {
    const {id, username} = req.user
    const {payinid, status} = req.body

    let payinvalue = 0
    let playerid = ""

    const payindata = await Payin.findOne({_id: new mongoose.Types.ObjectId(payinid)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (payindata.status != "processing"){
        return res.status(401).json({ message: 'failed', data: `You already processed this payin` })
    }

    await Payin.findOneAndUpdate({_id: new mongoose.Types.ObjectId(payinid)}, {status: status, processby: new mongoose.Types.ObjectId(id)})
    .then(data => {
        payinvalue = data.value
        playerid = data.owner._id
    })
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (status == "done"){
        await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(playerid), type: "fiatbalance"}, {$inc: {amount: payinvalue}})
        .catch(err => {

            console.log(`Failed to process Payin data for ${username}, player: ${playerid}, payinid: ${payinid} error: ${err}`)
    
            return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        const wallethistoryadd = await addwallethistory(playerid, "fiatbalance", payinvalue, id, "", "")

        if (wallethistoryadd.message != "success"){
            return res.status(401).json({ message: 'failed', data: `There's a problem saving payin in wallet history. Please contact customer support for more details` })
        }

        const analyticsadd = await addanalytics(playerid, wallethistoryadd.data.transactionid, wallethistoryadd.data.transactionid, "payinfiatbalance", `Add balance to user ${playerid} with a value of ${payinvalue} processed by ${username}`, payinvalue)

        if (analyticsadd != "success"){
            return res.status(401).json({ message: 'failed', data: `There's a problem saving payin in analytics history. Please contact customer support for more details` })
        }
    }

    return res.json({message: "success"})
}

exports.requestpayin = async (req, res) => {
    const {id, username} = req.user
    const {payinvalue} = req.body

    await Payin.create({owner: new mongoose.Types.ObjectId(id), value: payinvalue, status: "processing"})
    .catch(err => {

        console.log(`Failed to create Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    return res.json({message: "success"})
}

exports.getpayinhistoryplayer = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payinhistory = await Payin.find({owner: new mongoose.Types.ObjectId(id)})
    .populate({
        path: "owner processby",
        select: "username -_id"
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get payin list data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Payin.countDocuments({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        payinhistory: [],
        totalPages: pages
    }
    
    payinhistory.forEach(valuedata => {
        const {owner, processby, status, value, createdAt} = valuedata

        data.payinhistory.push({
            owner: owner.username,
            processby: processby != null ? processby.username : "",
            status: status,
            value: value,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

exports.sendfiattoplayer = async (req, res) => {
    const {id, username} = req.user
    const {playerusername, amount} = req.body

    const player = await Users.findOne({username: playerusername})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get player data for ${username}, player: ${playerusername} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (!player){
        return res.status(401).json({ message: 'failed', data: `The account does not exist! Please enter the correct username` })
    }

    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(player._id), type: "fiatbalance"}, {$inc: {amount: amount}})
    .catch(err => {

        console.log(`Failed to add wallet fiat player data for ${username}, player: ${playerusername}, amount: ${amount}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const addpayin = await createpayin(player._id, amount, id, "done")

    if (addpayin != "success"){
        return res.status(401).json({ message: 'failed', data: `There's a problem creating payin in wallet history. Please contact customer support for more details` })
    }
    
    const wallethistoryadd = await addwallethistory(player._id, "fiatbalance", amount, id, "", "")

    if (wallethistoryadd.message != "success"){
        return res.status(401).json({ message: 'failed', data: `There's a problem saving payin in wallet history. Please contact customer support for more details` })
    }

    const analyticsadd = await addanalytics(player._id, wallethistoryadd.data.transactionid, "payinfiatbalance", `Add balance to user ${player._id} with a value of ${amount} processed by ${username}`, amount)

    if (analyticsadd != "success"){
        return res.status(401).json({ message: 'failed', data: `There's a problem saving payin in analytics history. Please contact customer support for more details` })
    }

    return res.json({message: "success"})
}

exports.deletepayinplayersuperadmin = async (req, res) => {
    const {id, username} = req.user
    const {transactionid, userid} = req.body

    const transaction = await Payin.findOne({_id: new mongoose.Types.ObjectId(transactionid), status: "done"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the transaction ${transactionid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the transaction. Please contact customer support!"})
    })

    if (!transaction){
        return res.status(400).json({message: "failed", data: "No transaction is found! Please select a valid transaction"})
    }

    await Payin.findByIdAndUpdate({_id: new mongoose.Types.ObjectId(transactionid)}, {status: "deleted"})
    .catch(err => {
        console.log(`There's a problem getting the changing the transaction ${transactionid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem changing the transaction Please contact customer support!"})
    })

    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(userid), type: "fiatbalance"}, {$inc: {amount: -transaction.value}})
    .catch(async err => {
        console.log(`There's a problem getting the changing the transaction ${transactionid}. Error: ${err}`)

        await Payin.findByIdAndUpdate({_id: new mongoose.Types.ObjectId(transactionid)}, {status: "done"})

        return res.status(400).json({message: "bad-request", data: "There's a problem changing the transaction Please contact customer support!"})
    })

    await deleteanalytics(transactionid)

    return res.json({message: "success"})
}

exports.gettotalpayin = async(req, res)  => {
    const totalpayin = await Payin.aggregate(
        [
            {
                $match: {
                    status: "done"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$value" }
                }
            }
        ]
    )

    return res.json({message: "success", data: {
        totalpayin: totalpayin.length > 0 ? totalpayin[0].totalAmount : 0,
    }})
}

