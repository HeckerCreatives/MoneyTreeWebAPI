const { default: mongoose } = require("mongoose")
const GlobalPassword = require("../models/Globalpass")
const GlobalpassUsage = require("../models/GlobalpassUsage")

exports.createGlobalPass = async (req, res) => {
    
    const { id, username } = req.user

    const { secretkey } = req.body

    if(!id){
        return res.status(400).json({ message: "Unauthorized", data: "You are not authorized to view this page. Please login to the right account."})
    }

    if(!secretkey){
        return res.status(400).json({ message: "failed", data: "Please input secret key."})
    }

    await GlobalPassword.updateMany({ status: true }, { status: false })
    .then(data => data)
    .catch(err => {
        console.log(`Failed to create Global Password by ${username}. Error: ${err}`)
        return res.status(400).json({ message: 'bad-request', data: `There's a problem with the server. Please contact customer support for more details` })
    })

    await GlobalPassword.create({ owner: new mongoose.Types.ObjectId(id), secretkey: secretkey})
    .then(data => data)
    .catch(err => {
        console.log(`Failed to create Global Password by ${username}. Error: ${err}`)
        return res.status(400).json({ message: 'bad-request', data: `There's a problem with the server. Please contact customer support for more details` })
    })

    return res.status(200).json({ message: "success" })

}

exports.getusagehistory = async (req, res) => {

    const { limit, page } = req.query

    const pageOptions = {
        limit: parseInt(limit) || 10,
        page: parseInt(page) || 0
    }
    const matchCondition = [
        {
            $lookup: {
                from: "users", 
                localField: "user", 
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $lookup: {
                from: "staffusers",
                localField: "user",
                foreignField: "_id",
                as: "staffUserDetails"
            }
        },
        {
            $addFields: {
                user: {
                    $cond: {
                        if: { $eq: ["$userType", "Staffusers"] },
                        then: { $arrayElemAt: ["$staffUserDetails.username", 0] },
                        else: { $arrayElemAt: ["$userDetails.username", 0] }
                    }
                }
            }
        },
        {
            $project: {
                ipAddress: 1,
                date: 1,
                user: 1,
                userType: 1
            }
        },
        {
            $skip: pageOptions.page * pageOptions.limit
        },
        {
            $limit: pageOptions.limit
        }
    ];

    const usageHistory = await GlobalpassUsage.aggregate(matchCondition);
    const totalUsageHistory = await GlobalpassUsage.countDocuments(matchCondition);

    const totalPages = Math.ceil(totalUsageHistory / pageOptions.limit)
    const finaldata = {
        totalPages: totalPages,
        usageHistory: []
    }

    usageHistory.forEach(temp => {
        const { ipAddress, _id, user, userType} = temp
        finaldata.usageHistory.push({
            id: _id,
            ipAddress: ipAddress,
            user: user,
            userType: userType
        })
    })

    return res.status(200).json({ message: "success", data: finaldata})
}