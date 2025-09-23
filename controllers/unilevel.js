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
            $lookup: {
                from: "users",
                localField: "referral",
                foreignField: "_id",
                as: "referrer"
            }
        },
        {
            $addFields: {
                level: { $add: ["$level", 1] },
                referrerUsername: {
                    $cond: {
                        if: { $gt: [{ $size: "$referrer" }, 0] },
                        then: { $arrayElemAt: ["$referrer.username", 0] },
                        else: null
                    }
                }
            }
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
                                    {
                                        $or: [
                                            { $eq: ["$type", "commissionbalance"] },
                                            { $eq: ["$type", "directreferralbalance"] }
                                        ]
                                    },
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
                lowercaseUsername: { $toLower: "$username" }
            }
        },
        // Filter only users with totalAmount > 0
        {
            $match: {
                totalAmount: { $gt: 0 },
                ...(search ? { username: { $regex: new RegExp(search, "i") } } : {})
            }
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
                referrerUsername: 1
            }
        },
        {
            $group: {
                _id: "$level",
                data: { $push: "$$ROOT" },
                totalDocuments: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        },
        {
            $match: {
                _id: { $lte: 14 }
            }
        },
        {
            $project: {
                _id: 1,
                data: {
                    $slice: [
                        "$data",
                        pageOptions.page * pageOptions.limit,
                        pageOptions.limit
                    ]
                },
                totalDocuments: 1,
                totalPages: {
                    $ceil: { $divide: ["$totalDocuments", pageOptions.limit] }
                }
            }
        },
        // Optional: Remove levels with no paginated data
        {
            $match: {
                "data.0": { $exists: true }
            }
        }
    ]);

    const filtereddownline = downline
        .map(level => ({
            ...level,
            data: level.data
        }))
        .filter(level => level.data.length > 0);

    return res.json({message: "success", data: filtereddownline});
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
            $lookup: {
                from: "users",
                localField: "referral",
                foreignField: "_id",
                as: "referrer"
            }
        },
        {
            $addFields: {
                level: { $add: ["$level", 1] },
                referrerUsername: {
                    $cond: {
                        if: { $gt: [{ $size: "$referrer" }, 0] },
                        then: { $arrayElemAt: ["$referrer.username", 0] },
                        else: null
                    }
                }
            }
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
            $match: {
                totalAmount: { $gt: 0 },
                ...(search ? { username: { $regex: new RegExp(search, "i") } } : {})
            }        
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
                referrerUsername: 1, 
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
                _id: { $lte: 14 },
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
        // Step 1: Find the root user
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playerid),
            },
        },
        // Step 2: Recursively find all downlines
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
        // Step 3: Filter by exact level
        {
            $match: {
                "ancestors.level": parseInt(level),
            },
        },
        {
            $replaceRoot: { newRoot: "$ancestors" },
        },
        // Step 4: Lookup referrer info
        {
            $lookup: {
                from: "users",
                localField: "referral",
                foreignField: "_id",
                as: "referrer"
            }
        },
        {
            $addFields: {
                level: { $add: ["$level", 1] },
                referrerUsername: {
                    $cond: {
                        if: { $gt: [{ $size: "$referrer" }, 0] },
                        then: { $arrayElemAt: ["$referrer.username", 0] },
                        else: null
                    }
                }
            }
        },
        // Step 5: Lookup wallet history and sum amount
        {
            $lookup: {
                from: "wallethistories",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $or: [
                                            { $eq: ["$type", "commissionbalance"] },
                                            { $eq: ["$type", "directreferralbalance"] }
                                        ]
                                    },
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
        // Step 6: Filter out users with zero or no earnings
        {
            $match: {
                totalAmount: { $gt: 0 },
                ...(search ? { username: { $regex: new RegExp(search, "i") } } : {})
            }
        },
        // Step 7: Sort
        {
            $sort: { lowercaseUsername: 1 }
        },
        // Step 8: Project only needed fields
        {
            $project: {
                _id: 1,
                username: 1,
                level: 1,
                totalAmount: 1,
                createdAt: 1,
                referrerUsername: 1
            }
        },
        // Step 9: Group by level
        {
            $group: {
                _id: "$level",
                data: { $push: "$$ROOT" },
                totalDocuments: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        },
        {
            $match: {
                _id: { $lte: 14 }
            }
        },
        // Step 10: Paginate within each level
        {
            $project: {
                _id: 1,
                data: {
                    $slice: [
                        "$data",
                        pageOptions.page * pageOptions.limit,
                        pageOptions.limit
                    ]
                },
                totalDocuments: 1,
                totalPages: {
                    $ceil: { $divide: ["$totalDocuments", pageOptions.limit] }
                }
            }
        },
        // Step 11: Filter out empty levels (optional)
        {
            $match: {
                "data.0": { $exists: true }
            }
        },
        // Step 12: Wrap everything in { data: [...] } format
        {
            $group: {
                _id: null,
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                data: 1
            }
        }
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
            $lookup: {
                from: "users",
                localField: "referral",
                foreignField: "_id",
                as: "referrer"
            }
        },
        {
            $addFields: {
                level: { $add: ["$level", 1] },
                referrerUsername: {
                    $cond: {
                        if: { $gt: [{ $size: "$referrer" }, 0] },
                        then: { $arrayElemAt: ["$referrer.username", 0] },
                        else: null
                    }
                }
            }
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
                                    {
                                        $or: [
                                            { $eq: ["$type", "commissionbalance"] },
                                            { $eq: ["$type", "directreferralbalance"] }
                                        ]
                                    },
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
        // Filter only users with totalAmount > 0 and optional search
        {
            $match: {
                totalAmount: { $gt: 0 },
                ...(search ? { username: { $regex: new RegExp(search, "i") } } : {})
            }
        },
        {
            $sort: { lowercaseUsername: 1 }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                level: 1,
                totalAmount: 1,
                createdAt: 1,
                referrerUsername: 1
            }
        },
        {
            $group: {
                _id: "$level",
                data: { $push: "$$ROOT" },
                totalDocuments: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        },
        {
            $match: {
                _id: { $lte: 14 }
            }
        },
        {
            $project: {
                _id: 1,
                data: {
                    $slice: [
                        "$data",
                        pageOptions.page * pageOptions.limit,
                        pageOptions.limit
                    ]
                },
                totalDocuments: 1,
                totalPages: {
                    $ceil: { $divide: ["$totalDocuments", pageOptions.limit] }
                }
            }
        },
        {
            $match: {
                "data.0": { $exists: true } // Filter out empty paginated levels
            }
        },
        {
            $group: {
                _id: null,
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                data: 1
            }
        }
    ]);
    
    return res.json({message: "success", data: downline})
}
