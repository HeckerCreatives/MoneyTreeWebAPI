const routers = app => {
    console.log("Routers are all available");

    app.use("/analytics", require("./analytics"))
    app.use("/auth", require("./auth"))
    app.use("/bank", require("./bank"))
    app.use("/conversionrate", require("./conversionrate"))
    app.use("/globalpass", require("./globalpass"))
    app.use("/ingame", require("./ingame"))
    app.use("/inventory", require("./inventory"))
    app.use("/leaderboard", require("./leaderboard"))
    app.use("/maintenance", require("./maintenance"))
    app.use("/payin", require("./payin"))
    app.use("/payout", require("./payout"))
    app.use("/raffle", require("./raffle"))
    app.use("/reset", require("./reset"))
    app.use("/sociallinks", require("./sociallinks"))
    app.use("/staffuser", require("./staffuser"))
    app.use("/tbank", require("./tbank"))
    app.use("/tinventory", require("./tinventory"))
    app.use("/unilevel", require("./unilevel"))
    app.use("/user", require("./user"))
    app.use("/wallet", require("./wallet"))
    app.use("/walletconversion", require("./walletconversion"))
    app.use("/wallethistory", require("./wallethistory"))
    app.use("/weather", require("./weather"))
}

module.exports = routers