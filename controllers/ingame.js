const Maintenance = require("../models/Maintenance")
const Ingame = require("../models/Ingame")
const Evententrylimit = require("../models/Evententrylimit")
const Eventtierentry = require("../models/Eventtierentry")
const { default: mongoose } = require("mongoose")
const Eventtimelimit = require("../models/Eventtimelimit")

exports.getingamelist = async (req, res) => {
    const {id, username} = req.user

    const mainte = await Ingame.find()
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting maintenance data for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    const data = {
        ingamelist: []
    }

    mainte.forEach(valuedata => {
        const {type, value} = valuedata

        data.ingamelist.push(
            {
                type: type,
                value: value
            }
        )
    })

    return res.json({message: "success", data: data})
}

exports.updateingamelist = async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!type || value === undefined) {
      return res.status(400).json({
        message: 'bad-request',
        data: 'Missing required fields: type and value',
      });
    }

    const isValid =
      typeof value === 'number' ||
      (Array.isArray(value) && value.every(v => typeof v === 'string'));

    if (!isValid) {
      return res.status(400).json({
        message: 'bad-request',
        data: 'Value must be a number or an array of strings',
      });
    }

    const updated = await Ingame.findOneAndUpdate(
      { type },
      { value },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: 'not-found',
        data: `Ingame entry of type '${type}' not found.`,
      });
    }

    return res.json({ message: 'success', data: updated });
  } catch (err) {
    console.error(`Error updating ingame list: ${err}`);
    return res.status(500).json({
      message: 'server-error',
      data: 'An unexpected error occurred while updating ingame data.',
    });
  }
};

exports.getplayerentrylimit = async (req, res) => {
  const {id} = req.user

  const limit = await Evententrylimit.find()

  if (limit.length <= 0){
    return res.json({message: "success", data: { limit: 0 }})
  }

    return res.json({message: "success", data: { limit: limit[0].limit }})
}

exports.saveplayerentrylimit = async (req, res) => {
  const {id} = req.user

  const {entrylimit} = req.body

  const limit = await Evententrylimit.find()

  if (limit.length <= 0){

    await Evententrylimit.create({limit: entrylimit});
    return res.json({message: "success"})
  }


  await Evententrylimit.findOneAndUpdate({_id: new mongoose.Types.ObjectId(limit[0]._id)}, {limit: entrylimit})
  .catch(err => {
    console.log(err)
  })

  return res.json({message: "success"})
}

exports.gettierentry = async (req, res) => {
  const {id} = req.user

  const entries = await Eventtierentry.find()

  const entrydata = {
    "Free": false,
    "Novice": false,
    "Expert": false,
    "Elite": false
  }

  entries.forEach(tempdata => {
    const {type, status} = tempdata

    entrydata[type] = status
  })

  return res.json({ message: "success", 
    data: entrydata
  })
}

exports.setevententry = async (req, res) => {
  const {id} = req.user

  const {entries} = req.body

  if (!Array.isArray(entries)){
    return res.status(400).json({message: "failed", data: "Please enter a valid entries"})
  }

  const tempentries = []
  
  entries.forEach(tempdata => {
    const {type, status} = tempdata

    tempentries.push({
      updateOne: {
        filter: { type: type},
        update: { $set: {status: status}},
        upsert: true
      }
    })
  })

  if (tempentries.length > 0){
    await Eventtierentry.bulkWrite(tempentries)
  }

  return res.json({ message: "success" })
}

exports.geteventtimelimit = async (req, res) => {
  const {id} = req.user

  const temptime = await Eventtimelimit.find()

  if (temptime.length <= 0){
    return res.json({message: "success", 
      data: {
        minutes: 0,
        seconds: 0
      }
    })
  }

  return res.json({message: "success", 
    data: {
      minutes: temptime[0].minutes,
      seconds: temptime[0].seconds
    }
  })
}

exports.saveeventtimelimit = async (req, res) => {
  const {id} = req.user

  const {minute, seconds} = req.body

  if (minute >= 60 || seconds >= 60){
    return res.status(400).json({message: "failed", data: "Please enter a valid time limit. Minutes and seconds should be less than 60."})
  }
  const temptime = await Eventtimelimit.find()

  if (temptime.length <= 0){
    await Eventtimelimit.create({minutes: minute, seconds: seconds})

    return res.json({message: "success"})
  }

  await Eventtimelimit.findOneAndUpdate({_id: new mongoose.Types.ObjectId(temptime[0]._id)}, {minutes: minute, seconds: seconds})

  return res.json({message: "success"})
}