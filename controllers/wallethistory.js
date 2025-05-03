const { default: mongoose } = require("mongoose")
const Wallethistory = require("../models/Wallethistory")
const Userwallets = require("../models/Userwallets")

exports.playerwallethistory = async (req, res) => {
    const {id, username} = req.user
    const {type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };
    
    if (type == "fiatbalance"){
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(id), 
                    type: type
                }
            },
            {
                $sort: { "createdAt": -1 }
            },
            {
                $lookup: {
                    from: "staffusers",
                    localField: "from",
                    foreignField: "_id",
                    as: "staffuserinfo"
                }
            },
            {
                $unwind: "$staffuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$staffuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }
    else{
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(id), 
                    type: type
                }
            },
            {
                $sort: { "createdAt": -1 }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "from",
                    foreignField: "_id",
                    as: "fromuserinfo"
                }
            },
            {
                $unwind: "$fromuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$fromuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1,
                    bankname: 1,
                    banktype: 1,
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }

    const history = await Wallethistory.aggregate(wallethistorypipeline)
    .catch(err => {

        console.log(`Failed to get wallet history data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    const historypages = await Wallethistory.countDocuments({owner: new mongoose.Types.ObjectId(id), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get wallet history count document data for ${username}, wallet type: ${type}, player: ${id} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = Math.ceil(historypages / pageOptions.limit)

    const data = {
        history: [],
        pages: totalPages
    }

    history.forEach(historydata => {
        const {username, type, amount, fromusername, bankname, banktype, createdAt} = historydata

        data.history.push({
            username: username,
            type: type,
            amount: amount,
            fromusername: fromusername,
            banktype: banktype,
            bankname: bankname == null ? "" : bankname,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}


exports.getwalletstatistics = async (req, res) => {
    const {id, username} = req.user

    const finaldata = {
        game: 0,
        referral: 0,
        unilevel: 0
    }

    const statisticGame = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "gamebalance" 
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
        console.log(`There's a problem getting the statistics of earning game for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of earning game. Please contact customer support."})
    })

    if (statisticGame.length > 0) {
        finaldata.game = statisticGame[0].totalAmount;
    }

    const statisticReferral = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "directreferralbalance" 
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
        console.log(`There's a problem getting the statistics of Referral for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of Referral. Please contact customer support."})
    })

    if (statisticReferral.length > 0) {
        finaldata.referral = statisticReferral[0].totalAmount;
    }

    const statisticUnilevel = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "commissionbalance" 
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
        console.log(`There's a problem getting the statistics of Unilevel ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of Unilevel. Please contact customer support."})
    })

    if (statisticUnilevel.length > 0) {
        finaldata.unilevel = statisticUnilevel[0].totalAmount;
    }

    return res.json({message: "success", data: finaldata})
}



exports.getplayerwallethistoryforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid, type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };
    
    let wallethistorypipeline

    if (type == "fiatbalance" || type == "gamebalance"){
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(playerid), 
                    type: type
                }
            },
            {
                $lookup: {
                    from: "staffusers",
                    localField: "from",
                    foreignField: "_id",
                    as: "staffuserinfo"
                }
            },
            {
                $unwind: "$staffuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$staffuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }
    else{
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(playerid), 
                    type: type
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "from",
                    foreignField: "_id",
                    as: "fromuserinfo"
                }
            },
            {
                $unwind: "$fromuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$fromuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }

    const history = await Wallethistory.aggregate(wallethistorypipeline)
    .catch(err => {

        console.log(`Failed to get wallet history data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    const historypages = await Wallethistory.countDocuments({owner: new mongoose.Types.ObjectId(playerid), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get wallet history count document data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = Math.ceil(historypages / pageOptions.limit)

    const data = {
        history: [],
        pages: totalPages
    }

    history.forEach(historydata => {
        const {username, type, amount, fromusername, createdAt} = historydata

        data.history.push({
            username: username,
            type: type,
            amount: amount,
            fromusername: fromusername,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}



exports.gettopcommissions = async (req, res) => {
    const {startDate, endDate, search} = req.query

    let matchStage = {};
    let searchStage = {};

    // Add startDate conditionally
    if (startDate) {
        matchStage.createdAt = { $gte: new Date(startDate + "T00:00:00Z") };
    }

    // Add endDate conditionally
    if (endDate) {
        matchStage.createdAt = matchStage.createdAt || {}; // Initialize if not already
        matchStage.createdAt.$lte = new Date(endDate + "T00:00:00Z");
    }

    if (search){
        searchStage = {
            'user.username': { $regex: search, $options: "i" } 
        }
    }



    console.log(matchStage)

    const topUsers = await Wallethistory.aggregate([
        {
            // Match documents based on provided date range
            $match: matchStage
        },
        {
          // Group wallet history by user and calculate directReferralBalance and commissionBalance
          $group: {
            _id: "$owner", // Group by user (owner field)
            directReferralBalance: {
              // Sum the amounts where type is 'referral'
              $sum: {
                $cond: [{ $eq: ["$type", "directreferralbalance"] }, "$amount", 0]
              }
            },
            commissionBalance: {
              // Sum the amounts where type is 'commission'
              $sum: {
                $cond: [{ $eq: ["$type", "commissionbalance"] }, "$amount", 0]
              }
            }
          }
        },
        {
          // Calculate the total combined balance
          $addFields: {
            totalBalance: {
              $add: ["$directReferralBalance", "$commissionBalance"]
            }
          }
        },
        {
          // Sort by totalBalance in descending order
          $sort: { totalBalance: -1 }
        },
        {
          // Limit to the top 20 users
          $limit: 20
        },
        {
          // Lookup user data from the Users collection
          $lookup: {
            from: "users", // The users collection
            localField: "_id", // The owner field in walletHistorySchema
            foreignField: "_id", // The _id field in Users schema
            as: "user"
          }
        },
        ...(search ? [{ $match: searchStage }] : []), // Add search stage conditionally
        {
          // Unwind the user array to get the actual user object
          $unwind: "$user"
        },
        // {
        //     // Filter out users where username is 'paypetroll'
        //     $match: {
        //       "user.username": { $ne: "paypetroll" }
        //     }
        // },
        {
          // Project the fields you want to return
          $project: {
            username: "$user.username",
            totalBalance: 1,
            directReferralBalance: 1,
            commissionBalance: 1
          }
        }
      ]);

      const data = {}
      let index = 1;

      topUsers.forEach(tempdata => {
        const { username, directReferralBalance, commissionBalance, totalBalance} = tempdata

        data[index] = {
            username: username,
            directReferralBalance: directReferralBalance,
            commissionBalance: commissionBalance,
            totalBalance: totalBalance
        }

        index++;
      })
  
      return res.json({message: "success", data: data});
}


// exports.gettotalgamedailyforuser = async (req, res) => {
//     const {userid} = req.query

//     const totalgamedaily = await Wallethistory.aggregate(
//         [
//             {
//                 $match: {
//                     owner: new mongoose.Types.ObjectId(userid),
//                     type: "Creature Daily"
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalAmount: { $sum: "$amount" }
//                 }
//             }
//         ]
//     )

//     return res.json({message: "success", data: {
//         totalgamedaily: totalgamedaily.length > 0 ? totalgamedaily[0].totalAmount : 0,
//     }})
// }


exports.editplayerwallethistoryforadmin = async (req, res) => {
    const { id, username } = req.user;
    const { historyid, amount } = req.body;

    if (!historyid || !amount) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    if (parseFloat(amount) < 0) {
        return res.status(400).json({ message: "failed", data: "Amount cannot be negative." });
    }

    try {
        // Fetch the wallet history entry
        const history = await Wallethistory.findOne({ _id: new mongoose.Types.ObjectId(historyid) });
        if (!history) {
            return res.status(400).json({ message: "failed", data: "Wallet history not found." });
        }

        history.amount = parseFloat(amount);
        await history.save();

        let newwallettype 

        if (history.type === "fiatbalance") {
            newwallettype = "fiatbalance"
        } else if (history.type === "gamebalance") {
            newwallettype = "gamebalance"
        } else if (history.type === "unilevelbalance") {
            newwallettype = "commissionbalance"
        } else if (history.type === "directbalance") {
            newwallettype = "directreferralbalance"
        }

        // get the current wallet balance of the user

        const wallet = await Userwallets.findOne({ owner: history.owner, type: newwallettype });
        if (!wallet) {
            return res.status(400).json({ message: "failed", data: "Wallet not found." });
        }

        // increment or decrement the wallet balance based on the new amount

        const difference = parseFloat(amount) - history.amount;
        await Userwallets.findOneAndUpdate(
            { owner: history.owner, type: history.type },
            { $inc: { amount: difference } }
        )
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem encountered while updating ${historyid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
        })

        
    if (history.type === "unilevelbalance" || history.type === "directreferralbalance") {
        await Userwallets.findOneAndUpdate(
            {
                owner: new mongoose.Types.ObjectId(playerid),
                type: "commissionbalance"
            },
            {
                $inc: {
                    amount: parseFloat(difference)
                }
            }
        )
    }


        return res.status(200).json({ message: "success" });
    } catch (err) {
        console.log(`Failed to edit wallet history for ${username}, history id: ${historyid}, Error: ${err}`);
        return res.status(500).json({ message: "failed", data: "An error occurred while editing the wallet history." });
    }
};


exports.deleteplayerwallethistoryforadmin = async (req, res) => {
    const { id, username } = req.user;
    const { historyid } = req.body;

    if (!historyid) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    try {
        // Fetch the wallet history entry
        const history = await Wallethistory.findOne({ _id: new mongoose.Types.ObjectId(historyid) });
        if (!history) {
            return res.status(400).json({ message: "failed", data: "Wallet history not found." });
        }


        // delete the wallet history entry

        await Wallethistory.findOneAndDelete({ _id: new mongoose.Types.ObjectId(historyid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem encountered while deleting ${historyid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
        })

        return res.status(200).json({ message: "success" });
    } catch (err) {
        console.log(`Failed to delete wallet history for ${username}, history id: ${historyid}, Error: ${err}`);
        return res.status(500).json({ message: "failed", data: "An error occurred while deleting the wallet history." });
    }
};
