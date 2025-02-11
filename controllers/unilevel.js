const { default: mongoose } = require("mongoose");
const Users = require("../models/Users")

exports.playerunilevel = async (req, res) => {
    const {id} = req.user;
    const {level, page, limit, search} = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const downline = await Users.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
            },
        },
        {
            $graphLookup: {
                from: "users",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "referral",
                as: "ancestors",
                depthField: "level",
            },
        },
        {
            $unwind: "$ancestors",
        },
        {
            $match: {
                "ancestors.level": parseInt(level),
            },
        },
        {
            $replaceRoot: { newRoot: "$ancestors" },
        },
        {
            $addFields: {
                level: { $add: ["$level", 1] },
            },
        },
        {
            $lookup: {
                from: "wallethistories",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $or: [
                                        { $eq: ["$type", "commissionbalance"] },
                                        { $eq: ["$type", "directreferralbalance"] }
                                    ] },
                                    { $eq: ["$from", "$$userId"] },
                                    { $eq: ["$owner", new mongoose.Types.ObjectId(id)] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$amount" }
                        }
                    }
                ],
                as: "walletHistory"
            }
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: { $gt: [{ $size: "$walletHistory" }, 0] },
                        then: { $arrayElemAt: ["$walletHistory.totalAmount", 0] },
                        else: 0
                    }
                },
                // Add a new field to store the lowercase version of the username
                lowercaseUsername: { $toLower: "$username" }
            }
        },
        // Search functionality
        {
            $match: search ? { username: { $regex: new RegExp(search, "i") } } : {}
        },
        // Sort by the lowercase version of username
        {
            $sort: { lowercaseUsername: 1 }
        },
        {
            $project: {
                username: 1,
                level: 1,
                totalAmount: 1,
                createdAt: 1,
                // lowercaseUsername is not included, so it will be excluded
            },
        },
        {
            $group: {
                _id: "$level",
                data: { $push: "$$ROOT" },
                totalDocuments: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
        {
            $match: {
                _id: { $lte: 10 },
            },
        },
        {
            $project: {
                _id: 1,
                data: {
                    $slice: [
                        "$data",
                        pageOptions.page * pageOptions.limit,
                        pageOptions.limit,
                    ],
                },
                totalDocuments: 1,
                totalPages: {
                    $ceil: { $divide: ["$totalDocuments", pageOptions.limit] },
                },
            },
        },
    ]);

    return res.json({message: "success", data: downline});
};

exports.playeviewadminunilevel = async (req, res) => {
    const {playerid, level, page, limit, search} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const downline = await Users.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playerid),
            },
        },
        {
            $graphLookup: {
                from: "users",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "referral",
                as: "ancestors",
                depthField: "level",
            },
        },
        {
            $unwind: "$ancestors",
        },
        {
            $match: {
                "ancestors.level": parseInt(level),
            },
        },
        {
            $replaceRoot: { newRoot: "$ancestors" },
        },
        {
            $addFields: {
                level: { $add: ["$level", 1] },
            },
        },
        {
            $lookup: {
                from: "wallethistories",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $or: [
                                        { $eq: ["$type", "commissionbalance"] },
                                        { $eq: ["$type", "directreferralbalance"] }
                                    ] },
                                    { $eq: ["$from", "$$userId"] },
                                    { $eq: ["$owner", new mongoose.Types.ObjectId(playerid)] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$amount" }
                        }
                    }
                ],
                as: "walletHistory"
            }
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: { $gt: [{ $size: "$walletHistory" }, 0] },
                        then: { $arrayElemAt: ["$walletHistory.totalAmount", 0] },
                        else: 0
                    }
                },
                // Add a new field to store the lowercase version of the username
                lowercaseUsername: { $toLower: "$username" }
            }
        },
        // Search functionality
        {
            $match: search ? { username: { $regex: new RegExp(search, "i") } } : {}
        },
        // Sort by the lowercase version of username
        {
            $sort: { lowercaseUsername: 1 }
        },
        {
            $project: {
                username: 1,
                level: 1,
                totalAmount: 1,
                createdAt: 1,
                // lowercaseUsername is not included, so it will be excluded
            },
        },
        {
            $group: {
                _id: "$level",
                data: { $push: "$$ROOT" },
                totalDocuments: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
        {
            $match: {
                _id: { $lte: 10 },
            },
        },
        {
            $project: {
                _id: 1,
                data: {
                    $slice: [
                        "$data",
                        pageOptions.page * pageOptions.limit,
                        pageOptions.limit,
                    ],
                },
                totalDocuments: 1,
                totalPages: {
                    $ceil: { $divide: ["$totalDocuments", pageOptions.limit] },
                },
            },
        },
    ]);
    
    return res.json({message: "success", data: downline})
}

exports.playerviewadminunilevelCommissionWallet = async (req, res) => {
    const {playerid, level, page, limit, search} = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const downline = await Users.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playerid),
            },
        },
        {
            $graphLookup: {
                from: "users",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "referral",
                as: "ancestors",
                depthField: "level",
            },
        },
        {
            $unwind: "$ancestors",
        },
        {
            $match: {
                "ancestors.level": parseInt(level),
            },
        },
        {
            $replaceRoot: { newRoot: "$ancestors" },
        },
        {
            $addFields: {
                level: { $add: ["$level", 1] },
            },
        },
        {
            $lookup: {
                from: "wallethistories",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$type", "commissionbalance"] },
                                    { $eq: ["$from", "$$userId"] },
                                    { $eq: ["$owner", new mongoose.Types.ObjectId(playerid)] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$amount" }
                        }
                    }
                ],
                as: "walletHistory"
            }
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: { $gt: [{ $size: "$walletHistory" }, 0] },
                        then: { $arrayElemAt: ["$walletHistory.totalAmount", 0] },
                        else: 0
                    }
                },
                // Add a new field to store the lowercase version of the username
                lowercaseUsername: { $toLower: "$username" }
            }
        },
        // Search functionality
        {
            $match: search ? { username: { $regex: new RegExp(search, "i") } } : {}
        },
        // Sort by the lowercase version of username
        {
            $sort: { lowercaseUsername: 1 }
        },
        {
            $project: {
                username: 1,
                level: 1,
                totalAmount: 1,
                createdAt: 1,
                // lowercaseUsername is not included, so it will be excluded
            },
        },
        {
            $group: {
                _id: "$level",
                data: { $push: "$$ROOT" },
                totalDocuments: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
        {
            $match: {
                _id: { $lte: 10 },
            },
        },
        {
            $project: {
                _id: 1,
                data: {
                    $slice: [
                        "$data",
                        pageOptions.page * pageOptions.limit,
                        pageOptions.limit,
                    ],
                },
                totalDocuments: 1,
                totalPages: {
                    $ceil: { $divide: ["$totalDocuments", pageOptions.limit] },
                },
            },
        },
    ]);
    
    return res.json({message: "success", data: downline})
}

exports.playerviewadminunilevelDirectCommissionWallet = async (req, res) => {
    const {playerid, level, page, limit, search} = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const downline = await Users.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playerid),
            },
        },
        {
            $graphLookup: {
                from: "users",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "referral",
                as: "ancestors",
                depthField: "level",
            },
        },
        {
            $unwind: "$ancestors",
        },
        {
            $match: {
                "ancestors.level": parseInt(level),
            },
        },
        {
            $replaceRoot: { newRoot: "$ancestors" },
        },
        {
            $addFields: {
                level: { $add: ["$level", 1] },
            },
        },
        {
            $lookup: {
                from: "wallethistories",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$type", "directreferralbalance"] },
                                     { $eq: ["$from", "$$userId"] },
                                    { $eq: ["$owner", new mongoose.Types.ObjectId(playerid)] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$amount" }
                        }
                    }
                ],
                as: "walletHistory"
            }
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: { $gt: [{ $size: "$walletHistory" }, 0] },
                        then: { $arrayElemAt: ["$walletHistory.totalAmount", 0] },
                        else: 0
                    }
                },
                lowercaseUsername: { $toLower: "$username" }
            }
        },
        {
            $match: search ? { username: { $regex: new RegExp(search, "i") } } : {}
        },
        {
            $sort: { lowercaseUsername: 1 }
        },
        {
            $project: {
                username: 1,
                level: 1,
                totalAmount: 1,
                createdAt: 1,
            },
        },
        {
            $group: {
                _id: "$level",
                data: { $push: "$$ROOT" },
                totalDocuments: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
        {
            $match: {
                _id: { $lte: 10 },
            },
        },
        {
            $project: {
                _id: 1,
                data: {
                    $slice: [
                        "$data",
                        pageOptions.page * pageOptions.limit,
                        pageOptions.limit,
                    ],
                },
                totalDocuments: 1,
                totalPages: {
                    $ceil: { $divide: ["$totalDocuments", pageOptions.limit] },
                },
            },
        },
    ]);
    
    return res.json({message: "success", data: downline})
}
