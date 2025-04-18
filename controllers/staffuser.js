const { default: mongoose } = require("mongoose")
const Analytics = require("../models/Analytics")
const Userwallets = require("../models/Userwallets")
const Users = require("../models/Users")
const Payin = require("../models/Payin")
const Payout = require("../models/Payout")
const Staffusers = require("../models/Staffusers")
const StaffUserwallets = require("../models/Staffuserwallets")
const bcrypt = require('bcrypt');

exports.getsadashboard = async(req, res) => {
    const {id, username} = req.user

    const data = {}

    const commissiontotalpipeline = [
        {
            $match: {
                type: "commissionbalance"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const commission = await Analytics.aggregate(commissiontotalpipeline)
    .catch(err => {

        console.log(`There's a problem getting commission and buy aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["commission"] = commission.length > 0 ? commission[0].totalAmount : 0

    const referralcommissiontotalpipeline = [
        {
            $match: {
                type: "directreferralbalance"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const referral = await Analytics.aggregate(referralcommissiontotalpipeline)
    .catch(err => {

        console.log(`There's a problem getting commission and buy aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["referral"] = referral.length > 0 ? referral[0].totalAmount : 0

    const unilevelcommissiontotalpipeline = [
        {
            $match: {
                type: "unilevelbalance"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const unilevel = await Analytics.aggregate(unilevelcommissiontotalpipeline)
    .catch(err => {

        console.log(`There's a problem getting commission and buy aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["unilevel"] = unilevel.length > 0 ? unilevel[0].totalAmount : 0

    const productspipeline = [
        {
            $match: {
                type: { $regex: /^Buy\s/, $options: "i" } // Match 'Buy' followed by whitespace, case-insensitive
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const products = await Analytics.aggregate(productspipeline)
    .catch(err => {

        console.log(`There's a problem getting commission aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["products"] = products.length > 0 ? products[0].totalAmount : 0

        // Get total unilevel balance across all users
        const unilevelBalances = await Userwallets.aggregate([
            {
                $match: { 
                    type: "unilevelbalance"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]).catch(err => {
            console.log(`There's a problem getting unilevel totals. Error: ${err}`)
            return res.status(400).json({ 
                message: "bad-request", 
                data: `There's a problem with the server. Please try again later.` 
            })
        })

        data["unilevelbalance"] = unilevelBalances.length > 0 ? unilevelBalances[0].totalAmount : 0

        // Get total direct referral balance across all users
        const directBalances = await Userwallets.aggregate([
            {
                $match: { 
                    type: "directreferralbalance"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]).catch(err => {
            console.log(`There's a problem getting direct referral totals. Error: ${err}`)
            return res.status(400).json({ 
                message: "bad-request", 
                data: `There's a problem with the server. Please try again later.` 
            })
        })

        data["direct"] = directBalances.length > 0 ? directBalances[0].totalAmount : 0

                // Get total direct referral balance across all users
        const gameBalance = await Userwallets.aggregate([
                    {
                        $match: { 
                            type: "gamebalance"
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$amount" }
                        }
                    }
                ]).catch(err => {
                    console.log(`There's a problem getting direct referral totals. Error: ${err}`)
                    return res.status(400).json({ 
                        message: "bad-request", 
                        data: `There's a problem with the server. Please try again later.` 
                    })
                })
        
        data["gamewalletbalance"] = gameBalance.length > 0 ? gameBalance[0].totalAmount : 0

    const commissioned = await Userwallets.findOne({owner: new mongoose.Types.ObjectId(process.env.MONEYTREE_ID), type: "commissionbalance"})
    .then(data => data.amount)
    .catch(err => {

        console.log(`There's a problem getting commissioned for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })
    
    data["commissioned"] = commissioned

    const usercount = await Users.countDocuments({username: { $ne: "paypetrolls"}})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user count for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["registered"] = usercount

    const payinpipline = [
        {
            $match: {
                type: "payinfiatbalance"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]
    const payin = await Analytics.aggregate(payinpipline)
    .catch(err => {

        console.log(`There's a problem getting payin aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["payin"] = payin.length > 0 ? payin[0].totalAmount : 0

    const payoutgamepipeline = [
        {
            $match: {
                type: "payoutgamebalance"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]
    const payoutgame = await Analytics.aggregate(payoutgamepipeline)
    .catch(err => {

        console.log(`There's a problem getting payout game aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["payoutgame"] = payoutgame.length > 0 ? payoutgame[0].totalAmount : 0

    const payoutdirectcommissionpipeline = [
        {
            $match: {
                type: "payoutdirectreferralbalance"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]
    const payoutdirect = await Analytics.aggregate(payoutdirectcommissionpipeline)
    .catch(err => {

        console.log(`There's a problem getting payout direct referral aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })
    
    data["payoutdirect"] = payoutdirect.length > 0 ? payoutdirect[0].totalAmount : 0

    const payoutunilevelpipeline = [
        {
            $match: {
                type: "payoutunilevelbalance"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]
    const payoutunilevel = await Analytics.aggregate(payoutunilevelpipeline)
    .catch(err => {

        console.log(`There's a problem getting payout commission aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })
    
    data["payoutunilevel"] = payoutunilevel.length > 0 ? payoutunilevel[0].totalAmount : 0

    data["payout"] = parseFloat(data["payoutgame"]) + parseFloat(data["payoutdirect"]) + parseFloat(data["payoutunilevel"])

    const adminfee = await StaffUserwallets.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting admin fee wallet for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })


    data["adminfeewallet"] = adminfee.amount;

    
    return res.json({message: "success", data: data})
}

exports.banunbanuser = async (req, res) => {
    const {id, username} = req.user
    const {status, staffusername} = req.body

    await Staffusers.findOneAndUpdate({username: staffusername}, {status: status})
    .catch(err => {

        console.log(`There's a problem banning or unbanning user for ${username}, player: ${staffusername}, status: ${status} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.multiplebanstaffusers = async (req, res) => {
    const {id, username} = req.user;
    const {staffuserlist, status} = req.body

    const data = [];

    staffuserlist.forEach(tempdata => {
        console.log(tempdata)
        data.push({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(tempdata) },
                update: { status: status }
            }
        })
    })

    console.log(data)

    if (data.length <= 0){
        return res.json({message: "success"})
    }

    await Staffusers.bulkWrite(data)
    .catch(err => {
        console.log(`There's a problem setting status to ${status} to the users. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: `There's a problem setting status to ${status} to the users`})
    })

    return res.json({message: "success"})
}

// exports.multipledeletestaffusers = async (req, res) 

exports.getadminlist = async (req, res) => {
    const { id, username } = req.user;
    const { page, limit, search } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const searchOptions = search ? { username: { $regex: search, $options: "i" } } : {};

    try {
        const [adminlist, totalDocuments] = await Promise.all([
            Staffusers.find({ auth: { $ne: "superadmin" }, ...searchOptions })
                .skip(pageOptions.page * pageOptions.limit)
                .limit(pageOptions.limit)
                .sort({ createdAt: -1 }),
            Staffusers.countDocuments({ auth: { $ne: "superadmin" }, ...searchOptions })
        ]);

        const pages = Math.ceil(totalDocuments / pageOptions.limit);

        const data = {
            users: adminlist.map(({ _id, username, status, createdAt }) => ({
                userid: _id,
                username: username,
                status: status,
                createdAt: createdAt
            })),
            totalPages: pages
        };

        return res.json({ message: "success", data: data });
    } catch (err) {
        console.log(`Failed to get admin list data for ${username}, error: ${err}`);
        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` });
    }
};

exports.updateadmin = async (req, res) => {
    const {id, username} = req.user
    const {staffusername, password} = req.body

    if (password == ""){
        return res.status(400).json({ message: "failed", data: "Please complete the form first before saving!" })
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    await Staffusers.findOneAndUpdate({username: staffusername}, {password: hashPassword})
    .catch(err => {

        console.log(`There's a problem updating user data for ${staffusername}, admin execution: ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.getadmindashboard = async (req, res) => {
    const {id, username} = req.user

    const data = {}

    const payinpipeline = [
        {
            $match: {
                processby: new mongoose.Types.ObjectId(id),
                status: "done"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const payin = await Payin.aggregate(payinpipeline)
    .catch(err => {

        console.log(`There's a problem getting commission and buy aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["totalpayin"] = payin.length > 0 ? payin[0].totalAmount : 0

    const payoutpipeline = [
        {
            $match: {
                processby: new mongoose.Types.ObjectId(id),
                status: "done"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const payout = await Payout.aggregate(payoutpipeline)
    .catch(err => {

        console.log(`There's a problem getting commission and buy aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["totalpayout"] = payout.length > 0 ? payout[0].totalAmount : 0

    
    const adminfee = await StaffUserwallets.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting admin fee wallet for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["adminfeewallet"] = adminfee.amount;

    return res.json({message: "success", data: data})
}

exports.changepass = async (req, res) => {
    const {id, username} = req.user
    const {password} = req.body

    if (password == ""){
        return res.status(400).json({ message: "failed", data: "Please complete the form first before saving!" })
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    await Staffusers.findOneAndUpdate({username: username}, {password: hashPassword})
    .catch(err => {

        console.log(`There's a problem updating user data for ${username}, admin execution: ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.searchadminlist = async (req, res) => {
    const {id, username} = req.user
    const {adminusername, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const adminlist = await Staffusers.find({username: { $regex: new RegExp(adminusername, 'i') }, auth: {$ne: "superadmin"}})
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({createdAt: -1})
    .catch(err => {
        console.log(`Failed to get admin list data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Staffusers.countDocuments({auth: {$ne: "superadmin"}})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents staff users data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        users: [],
        totalPages: pages
    }

    adminlist.forEach(value => {
        const {_id, username, status, createdAt} = value

        data["users"].push(
            {
                userid: _id,
                username: username,
                status: status,
                createdAt: createdAt
            }
        )
    });

    return res.json({message: "success", data: data})
}