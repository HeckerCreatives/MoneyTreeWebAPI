const Users = require("../models/Users");

exports.generateUniqueGameId = async () => {
    let unique = false;
    let gameid;
    while (!unique) {
        gameid = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // Generate a 10-digit number
        const existingUser = await Users.findOne({ gameid });
        if (!existingUser) {
            unique = true;
        }
    }
    return gameid;
}