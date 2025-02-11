const { default: mongoose } = require("mongoose");
const Analytics = require("../models/Analytics");
const Payin = require("../models/Payin");

exports.getpayingraph = async (req, res) => {
    const { id, username } = req.user;
    const { charttype } = req.query;

    if (charttype === "daily") {
        const startOfDay = new Date();
        startOfDay.setHours(6, 0, 0, 0); // Start from 6 AM

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const hourlyAmounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^payinfiatbalance$/, $options: "i" },
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const result = {};
        for (let i = 3; i < 24; i++) { // Loop from 6 AM to 11 PM
            const hour = i.toString().padStart(2, '0') + ":00";
            result[hour] = 0;
        }

        hourlyAmounts.forEach(item => {
            const hour = item._id.toString().padStart(2, '0') + ":00";
            result[hour] = item.totalAmount;
        });

        return res.json({ message: "success", data: result });
    }
    else if (charttype == "weekly"){
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Aggregate user counts by day of the week
        const weeklyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^payinfiatbalance$/, $options: "i" },
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const result = {};

        daysOfWeek.forEach(day => {
            result[day] = 0;
        });

        weeklyCounts.forEach(item => {
            const dayOfWeek = daysOfWeek[item._id - 1]; // MongoDB returns 1 for Sunday, 2 for Monday, etc.
            result[dayOfWeek] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "monthly"){
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        // Aggregate user counts by month
        const monthlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^payinfiatbalance$/, $options: "i" },
                    createdAt: {
                        $gte: startOfYear,
                        $lt: endOfYear
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const result = {};

        months.forEach(month => {
            result[month] = 0;
        });

        monthlyCounts.forEach(item => {
            const monthName = months[item._id - 1]; // MongoDB returns 1 for January, 2 for February, etc.
            result[monthName] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "yearly"){
        const releaseYear = 2025;
        const currentYear = new Date().getFullYear();

        // Aggregate user counts by year
        const yearlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^payinfiatbalance$/, $options: "i" },
                }
            },
            {
                $group: {
                    _id: { $year: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const result = {};

        for (let year = releaseYear; year <= currentYear; year++) {
            result[year] = 0;
        }

        yearlyCounts.forEach(item => {
            const year = item._id;
            if (year >= releaseYear && year <= currentYear) {
                result[year] = item.count;
            }
        });
        
        return res.json({message: "success", data: result});
    }
}

exports.gettotalpayinperday = async (req, res) => {
    const {id, username} = req.user
    const {startDate, endDate} = req.query

    const matchStage = {
        status: "done"
    };

    // Add startDate conditionally
    if (startDate) {
        matchStage.createdAt = { $gte: new Date(startDate) };
    }

    // Add endDate conditionally
    if (endDate) {
        matchStage.createdAt = matchStage.createdAt || {}; // Initialize if not already
        matchStage.createdAt.$lte = new Date(endDate);
    }

    const result = await Payin.aggregate([
        {
            // Match documents based on provided date range
            $match: matchStage
        },
        {
            // Project the date to just the day (remove time part)
            $project: {
                day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                value: 1
            }
        },
        {
            // Group by the day and sum the value
            $group: {
                _id: "$day",
                totalValue: { $sum: "$value" }
            }
        },
        {
            // Sort by date in ascending order
            $sort: { _id: 1 }
        }
    ]);

    return res.json({message: "success", data: {
        analytics: result
    }});
}

exports.getcommissiongraph = async (req, res) => {
    const {id, username} = req.user
    const {charttype} = req.query

    if (charttype == "daily"){
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
    
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const hourlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^commissionbalance$/, $options: "i" },
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const result = {};
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0') + ":00";
            result[hour] = 0;
        }

        hourlyCounts.forEach(item => {
            const hour = item._id.toString().padStart(2, '0') + ":00";
            result[hour] = item.count;
        });

        return res.json({message: "success", data: result})
    }
    else if (charttype == "weekly"){
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Aggregate user counts by day of the week
        const weeklyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^commissionbalance$/, $options: "i" },
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const result = {};

        daysOfWeek.forEach(day => {
            result[day] = 0;
        });

        weeklyCounts.forEach(item => {
            const dayOfWeek = daysOfWeek[item._id - 1]; // MongoDB returns 1 for Sunday, 2 for Monday, etc.
            result[dayOfWeek] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "monthly"){
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        // Aggregate user counts by month
        const monthlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^commissionbalance$/, $options: "i" },
                    createdAt: {
                        $gte: startOfYear,
                        $lt: endOfYear
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const result = {};

        months.forEach(month => {
            result[month] = 0;
        });

        monthlyCounts.forEach(item => {
            const monthName = months[item._id - 1]; // MongoDB returns 1 for January, 2 for February, etc.
            result[monthName] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "yearly"){
        const releaseYear = 2025;
        const currentYear = new Date().getFullYear();

        // Aggregate user counts by year
        const yearlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^commissionbalance$/, $options: "i" }
                }
            },
            {
                $group: {
                    _id: { $year: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const result = {};

        for (let year = releaseYear; year <= currentYear; year++) {
            result[year] = 0;
        }

        yearlyCounts.forEach(item => {
            const year = item._id;
            if (year >= releaseYear && year <= currentYear) {
                result[year] = item.count;
            }
        });
        
        return res.json({message: "success", data: result});
    }
}

exports.getproductgraph = async (req, res) => {
    const {id, username} = req.user
    const {charttype} = req.query
    
    if (charttype == "daily"){
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
    
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const hourlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^Buy/, $options: "i" }, // Updated regex pattern
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const result = {};
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0') + ":00";
            result[hour] = 0;
        }

        hourlyCounts.forEach(item => {
            const hour = item._id.toString().padStart(2, '0') + ":00";
            result[hour] = item.count;
        });

        return res.json({message: "success", data: result})
    }
    else if (charttype == "weekly"){
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Aggregate user counts by day of the week
        const weeklyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^Buy/, $options: "i" }, // Updated regex pattern
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const result = {};

        daysOfWeek.forEach(day => {
            result[day] = 0;
        });

        weeklyCounts.forEach(item => {
            const dayOfWeek = daysOfWeek[item._id - 1]; // MongoDB returns 1 for Sunday, 2 for Monday, etc.
            result[dayOfWeek] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "monthly"){
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        // Aggregate user counts by month
        const monthlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^Buy/, $options: "i" }, // Updated regex pattern
                    createdAt: {
                        $gte: startOfYear,
                        $lt: endOfYear
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const result = {};

        months.forEach(month => {
            result[month] = 0;
        });

        monthlyCounts.forEach(item => {
            const monthName = months[item._id - 1]; // MongoDB returns 1 for January, 2 for February, etc.
            result[monthName] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "yearly"){
        const releaseYear = 2024;
        const currentYear = new Date().getFullYear();

        // Aggregate user counts by year
        const yearlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: { $regex: /^Buy/, $options: "i" } // Updated regex pattern
                }
            },
            {
                $group: {
                    _id: { $year: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const result = {};

        for (let year = releaseYear; year <= currentYear; year++) {
            result[year] = 0;
        }

        yearlyCounts.forEach(item => {
            const year = item._id;
            if (year >= releaseYear && year <= currentYear) {
                result[year] = item.count;
            }
        });
        
        return res.json({message: "success", data: result});
    }
}

exports.getearningpayoutgraph = async (req, res) => {
    const {id, username} = req.user
    const {charttype} = req.query
    
    if (charttype == "daily"){
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
    
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const hourlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payoutgamebalance",
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const result = {};
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0') + ":00";
            result[hour] = 0;
        }

        hourlyCounts.forEach(item => {
            const hour = item._id.toString().padStart(2, '0') + ":00";
            result[hour] = item.count;
        });

        return res.json({message: "success", data: result})
    }
    else if (charttype == "weekly"){
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Aggregate user counts by day of the week
        const weeklyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payoutgamebalance",
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const result = {};

        daysOfWeek.forEach(day => {
            result[day] = 0;
        });

        weeklyCounts.forEach(item => {
            const dayOfWeek = daysOfWeek[item._id - 1]; // MongoDB returns 1 for Sunday, 2 for Monday, etc.
            result[dayOfWeek] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "monthly"){
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        // Aggregate user counts by month
        const monthlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payoutgamebalance",
                    createdAt: {
                        $gte: startOfYear,
                        $lt: endOfYear
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const result = {};

        months.forEach(month => {
            result[month] = 0;
        });

        monthlyCounts.forEach(item => {
            const monthName = months[item._id - 1]; // MongoDB returns 1 for January, 2 for February, etc.
            result[monthName] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "yearly"){
        const releaseYear = 2024;
        const currentYear = new Date().getFullYear();

        // Aggregate user counts by year
        const yearlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payoutgamebalance",
                }
            },
            {
                $group: {
                    _id: { $year: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const result = {};

        for (let year = releaseYear; year <= currentYear; year++) {
            result[year] = 0;
        }

        yearlyCounts.forEach(item => {
            const year = item._id;
            if (year >= releaseYear && year <= currentYear) {
                result[year] = item.count;
            }
        });
        
        return res.json({message: "success", data: result});
    }
}

exports.getunilevelpayoutgraph = async (req, res) => {
    const {id, username} = req.user
    const {charttype} = req.query
    
    if (charttype == "daily"){
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
    
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const hourlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payoutcommissionbalance",
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const result = {};
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0') + ":00";
            result[hour] = 0;
        }

        hourlyCounts.forEach(item => {
            const hour = item._id.toString().padStart(2, '0') + ":00";
            result[hour] = item.count;
        });

        return res.json({message: "success", data: result})
    }
    else if (charttype == "weekly"){
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Aggregate user counts by day of the week
        const weeklyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payoutcommissionbalance",
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const result = {};

        daysOfWeek.forEach(day => {
            result[day] = 0;
        });

        weeklyCounts.forEach(item => {
            const dayOfWeek = daysOfWeek[item._id - 1]; // MongoDB returns 1 for Sunday, 2 for Monday, etc.
            result[dayOfWeek] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "monthly"){
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        // Aggregate user counts by month
        const monthlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payoutcommissionbalance",
                    createdAt: {
                        $gte: startOfYear,
                        $lt: endOfYear
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const result = {};

        months.forEach(month => {
            result[month] = 0;
        });

        monthlyCounts.forEach(item => {
            const monthName = months[item._id - 1]; // MongoDB returns 1 for January, 2 for February, etc.
            result[monthName] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "yearly"){
        const releaseYear = 2024;
        const currentYear = new Date().getFullYear();

        // Aggregate user counts by year
        const yearlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payoutcommissionbalance",
                }
            },
            {
                $group: {
                    _id: { $year: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const result = {};

        for (let year = releaseYear; year <= currentYear; year++) {
            result[year] = 0;
        }

        yearlyCounts.forEach(item => {
            const year = item._id;
            if (year >= releaseYear && year <= currentYear) {
                result[year] = item.count;
            }
        });
        
        return res.json({message: "success", data: result});
    }
}

exports.getreferrallinkstatus = async (req, res) => {
    const {id, username} = req.user

    const referrallink = await Analytics.find({
        owner: new mongoose.Types.ObjectId(id), 
        type: { $regex: /^Buy/, $options: "i"  }    
    })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the referral link status for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a probelm getting the referral link status. Please contact customer support for more details"})
    })

    if (referrallink.length <= 0){
        return res.json({message: "success", data: {
            status: false
        }})
    }

    return res.json({message: "success", data: {
        status: true
    }})
}

exports.getcommissionlist = async (req, res) => {
    const { page, limit, startdate, enddate, search, type } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10,
    };

    let dateFilter = {};
    if (startdate && enddate) {
        const startOfDay = new Date(startdate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(enddate);
        endOfDay.setHours(23, 59, 59, 999);

        dateFilter.createdAt = {
            $gte: startOfDay,
            $lte: endOfDay,
        };
    }

    const aggregationpipeline = [
        {
            $match: {
                // $or: [{ type: "directreferralbalance" }, { type: "commissionbalance" }],
                type: { $regex: new RegExp(type, 'i') }, // Case-insensitive regex match for type                
                ...dateFilter,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user",
            },
        },
        ...(search
            ? [{
                $match: {
                    'user.username': {
                        $regex: new RegExp(search, 'i') // Case-insensitive regex match
                    }
                }
            }]
            : []),        
        {
            $unwind: "$user",
        },
        {
            $group: {
                _id: "$owner",
                totalAmount: { $sum: "$amount" },
                user: { $first: "$user" }
            }
        },
        {
            $project: {
                _id: 0,
                owner: "$_id",
                totalAmount: 1,
                username: "$user.username",
            }
        },
        {
            $sort: { totalAmount: -1 }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit },
    ];

    const data = await Analytics.aggregate(aggregationpipeline)
        .then((data) => data)
        .catch((err) => {
            console.log(`There's a problem encountered while fetching commission list. Error: ${err}`);
            return res
                .status(400)
                .json({ message: "bad-request", data: "There's a problem with the server! Please contact support for more details." });
        });

    if (!data) return; // Stop execution if data aggregation failed

    const totaldocuments = await Analytics.aggregate([
        {
            $match: {
                $or: [{ type: "directcommissionwallet" }, { type: "commissionwallet" }],
                ...dateFilter,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user",
            },
        },
        ...(search
            ? [{
                $match: {
                    'user.username': {
                        $regex: new RegExp(search, 'i') // Case-insensitive regex match
                    }
                }
            }]
            : []),        
        {
            $unwind: "$user",
        },
        {
            $group: {
                _id: "$owner",
                totalAmount: { $sum: "$amount" },
                user: { $first: "$user" }
            }
        },
        {
            $count: "total",
        },
    ])
        .then((result) => (result.length > 0 ? result[0].total : 0))
        .catch((err) => {
            console.log(
                `There's a problem encountered while counting commission documents. Error: ${err}`
            );
            return res.status(400).json({
                message: "bad-request",
                data: "There's a problem with the server! Please contact support for more details.",
            });
        });
    
    if (totaldocuments === undefined) return; // Stop execution if count failed
    
    const totalpages = Math.ceil(totaldocuments / pageOptions.limit);

    const finaldata = {
        data: data,
        totalpages: totalpages,
    };

    return res.status(200).json({ message: "success", data: finaldata });
};