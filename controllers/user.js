const { default: mongoose } = require("mongoose")
const Userdetails = require("../models/Userdetails")
const Users = require("../models/Users")
const fs = require("fs")
const Payin = require("../models/Payin")
const bcrypt = require('bcrypt');

exports.getreferrallink = async (req, res) => {
    const {id} = req.user

    return res.json({message: "success", data: id})
}

exports.getuserdetails = async (req, res) => {
    const {id, username} = req.user

    const details = await Userdetails.findOne({owner: new mongoose.Types.ObjectId(id)})
    .populate("owner", "gameid")
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user details for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    if (!details){
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact customer support." })
    }


    const data = {
        username: username,
        phonenumber: details.phonenumber,
        fistname: details.firstname,
        lastname: details.lastname,
        address: details.address,
        city: details.city,
        country: details.country,
        postalcode: details.postalcode,
        paymentmethod: details.paymentmethod,
        accountnumber: details.accountnumber,
        profilepicture: details.profilepicture,
        gameid: details.owner.gameid
    }

    return res.json({message: "success", data: data})
}

exports.getuserdetailssuperadmin = async (req, res) => {
    const {id, username} = req.user
    const {userid} = req.query

    const details = await Users.findOne({_id: new mongoose.Types.ObjectId(userid)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user details for ${userid} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    if (!details){
        return res.status(400).json({ message: "failed", data: "No user found! Please select a valid user." })
    }

    const data = {
        username: details.username,
        status: details.status
    }

    return res.json({message: "success", data: data})
}

exports.changepassworduser = async (req, res) => {
    const {id, username} = req.user
    const {password} = req.body
    
    if (password == ""){
        return res.status(400).json({ message: "failed", data: "Please complete the form first before saving!" })
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    await Users.findOneAndUpdate({_id: new mongoose.Types.ObjectId(id)}, {password: hashPassword})
    .catch(err => {

        console.log(`There's a problem changing password user for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem changing your password. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.changepassworduserforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid, password} = req.body
    
    if (password == ""){
        return res.status(400).json({ message: "failed", data: "Please complete the form first before saving!" })
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    await Users.findOneAndUpdate({_id: new mongoose.Types.ObjectId(playerid)}, {password: hashPassword})
    .catch(err => {

        console.log(`There's a problem changing password user for ${username}, player: ${playerid} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem changing password. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.updateuserprofile = async (req, res) => {
    const {id, username} = req.user
    const {phonenumber, firstname, lastname, address, city, country, postalcode, paymentmethod, accountnumber} = req.body

    if (firstname == "" || lastname == "" || address == "" || city == "" || country == "" || postalcode == "" || paymentmethod == "" || accountnumber == ""){
        return res.status(400).json({ message: "bad-request", data: "Please complete the form before updating!." })
    }

    await Userdetails.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id)}, {firstname: firstname, lastname: lastname, address: address, city: city, country: country, postalcode: postalcode, paymentmethod: paymentmethod, accountnumber: accountnumber, phonenumber: phonenumber})
    .catch(err => {

        console.log(`There's a problem saving user details for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem updating your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}


exports.searchplayerlist = async (req, res) => {
    const {id, username} = req.user
    const {playerusername, page, limit} = req.query

    const userlistpipeline = [
        {
            $match: {
                username: { $regex: new RegExp(playerusername, 'i') }
            }
        },
        {
            $facet: {
                data: [
                    {
                        $lookup: {
                            from: "userdetails", // Assuming the collection name for UserDetails is "userdetails"
                            localField: "_id",
                            foreignField: "owner",
                            as: "userDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: "users", // Assuming the collection name for Users is "users"
                            localField: "referral",
                            foreignField: "_id",
                            as: "referredUser"
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            email: { $arrayElemAt: ["$userDetails.email", 0] },
                            referralUsername: { $arrayElemAt: ["$referredUser.username", 0] },
                            createdAt: 1,
                            status: 1
                        }
                    }
                ]
            }
        }
    ]

    const userlist = await Users.aggregate(userlistpipeline)
    .catch(err => {
        console.log(`There's a problem getting users list for ${username}. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    const data = {
        totalPages: 0,
        userlist: []
    }

    userlist[0].data.forEach(value => {
        const {_id, username, status, createdAt, email, referralUsername} = value

        data["userlist"].push(
            {
                id: _id,
                username: username,
                email: email,
                referralUsername: referralUsername,
                status: status,
                createdAt: createdAt
            }
        )
    })

    return res.json({message: "success", data: data})

}

exports.getplayerlist = async (req, res) => {
    const { id, username } = req.user;
    const { page, limit, search } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const userlistpipeline = [];

    if (search) {
        userlistpipeline.push({
            $match: {
                username: { $regex: search, $options: "i" }
            }
        });
    }

    userlistpipeline.push(
        {
            $facet: {
                totalCount: [
                    {
                        $count: "total"
                    }
                ],
                data: [
                    {
                        $lookup: {
                            from: "userdetails", // Assuming the collection name for UserDetails is "userdetails"
                            localField: "_id",
                            foreignField: "owner",
                            as: "userDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: "users", // Assuming the collection name for Users is "users"
                            localField: "referral",
                            foreignField: "_id",
                            as: "referredUser"
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            phonenumber: { $arrayElemAt: ["$userDetails.phonenumber", 0] },
                            referralUsername: { $arrayElemAt: ["$referredUser.username", 0] },
                            createdAt: 1,
                            status: 1
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
        }
    );

    const userlist = await Users.aggregate(userlistpipeline)
        .catch(err => {
            console.log(`There's a problem getting users list for ${username} Error: ${err}`);
            return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." });
        });

    const data = {
        totalPages: Math.ceil(userlist[0].totalCount[0].total / pageOptions.limit),
        userlist: []
    };

    userlist[0].data.forEach(value => {
        const { _id, username, status, createdAt, phonenumber, referralUsername } = value;

        data["userlist"].push({
            id: _id,
            username: username,
            phonenumber: phonenumber,
            referralUsername: referralUsername,
            status: status,
            createdAt: createdAt
        });
    });

    return res.json({ message: "success", data: data });
};

exports.banunbanuser = async (req, res) => {
    const {id, username} = req.user
    const {status, userid} = req.body

    await Users.findOneAndUpdate({_id: new mongoose.Types.ObjectId(userid)}, {status: status})
    .catch(err => {

        console.log(`There's a problem banning or unbanning user for ${username}, player: ${userid}, status: ${status} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.multiplebanusers = async (req, res) => {
    const {id, username} = req.user;
    const {userlist, status} = req.body

    const data = [];

    userlist.forEach(tempdata => {
        const {userid, banreason} = tempdata
        data.push({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(userid) },
                update: { status: status, banreason: banreason }
            }
        })
    })

    if (data.length <= 0){
        return res.json({message: "success"})
    }

    await Users.bulkWrite(data)
    .catch(err => {
        console.log(`There's a problem setting status to ${status} to the users. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: `There's a problem setting status to ${status} to the users`})
    })

    return res.json({message: "success"})
}

exports.getplayercount = async (req, res) => {
    const {id, username} = req.user

    const totalusers = await Users.countDocuments()
    .then(data => data)

    // const activeusers = await Payin.aggregate([
    //     {
    //         $match: { status: "done" } // Filter payins with status "done"
    //     },
    //     {
    //         $group: {
    //             _id: "$owner", // Group by user ID (owner)
    //         }
    //     },
    //     {
    //         $count: "totalUsers" // Count the number of unique users
    //     }
    // ]);

    const activeusers = await Users.countDocuments({status: "active"})
    const banusers = await Users.countDocuments({status: "banned"})
    .then(data => data)

    data = {
        totalusers: totalusers,
        activeusers: activeusers,
        banusers: banusers
    }

    return res.json({message: "success", data: data})
}