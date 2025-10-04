const User = require("../../Model/pestControl/PestDetectModel");

//View-display data
const getAllUsers = async (req, res, next) =>{

    let users;

    //get all users
    try{
        users = await User.find();
        return res.status(200).json({ users: users ?? [] });
    }catch(err){
        console.log(err);
        return res.status(500).json({message:"Failed to fetch users"});
    }

};

//create-insert data

const addUsers = async (req, res) => {
  try {
    const {
      date_identified,
      crop,
      symptoms,
      severity_level,
      pesticide,
      application_method,
      dosage,
      treatment_date,
    } = req.body || {};

    // simple validations
    const errors = [];
    if (!date_identified) errors.push("date_identified is required");
    if (!crop) errors.push("crop is required");
    if (!symptoms) errors.push("symptoms is required");
    if (!severity_level) errors.push("severity_level is required");

    // basic type/format checks
    if (date_identified && isNaN(Date.parse(date_identified))) errors.push("date_identified must be a valid date");
    if (crop && typeof crop !== "string") errors.push("crop must be a string");
    if (symptoms && typeof symptoms !== "string") errors.push("symptoms must be a string");
    if (severity_level && !["Low","Moderate","High"].includes(severity_level)) errors.push("severity_level must be Low, Moderate or High");

    if (treatment_date && isNaN(Date.parse(treatment_date))) errors.push("treatment_date must be a valid date");
    if (pesticide !== undefined && typeof pesticide !== "string") errors.push("pesticide must be a string");
    if (application_method !== undefined && typeof application_method !== "string") errors.push("application_method must be a string");
    if (dosage !== undefined && typeof dosage !== "string") errors.push("dosage must be a string");

    if (errors.length) {
      return res.status(422).json({ message: "Invalid request", errors });
    }

    const payload = {
      date_identified,
      crop,
      symptoms,
      severity_level,
      pesticide,
      application_method,
      dosage,
      treatment_date,
    };

    const user = await User.create(payload);
    return res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Validation error", error: err.message });
  }
};

//get by ID
const getByID = async(req, res, next) =>{

    const id = req.params.id;

    let user;

    try{
        user = await User.findById(id);
    }catch(err){
        console.log(err);
    }

    if(!user){
        return res.status(404).json({message:"User not Found"});
    }
    return res.status(200).json({user});
}

// PUT /users/:id -> specialist updates (or allow partial updates in general)
const updateUser = async (req, res) => {
  try {
    // Only take fields that are present (partial update)
    const allowed = [
      "pesticide",
      "application_method",
      "dosage",
      "treatment_date",
      // if you also want to allow farmer fields to be edited later, include:
      "date_identified",
      "crop",
      "symptoms",
      "severity_level",
    ];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

    // simple validations on provided fields only
    const errors = [];
    if (updates.date_identified && isNaN(Date.parse(updates.date_identified))) errors.push("date_identified must be a valid date");
    if (updates.crop !== undefined && typeof updates.crop !== "string") errors.push("crop must be a string");
    if (updates.symptoms !== undefined && typeof updates.symptoms !== "string") errors.push("symptoms must be a string");
    if (updates.severity_level !== undefined && !["Low","Moderate","High"].includes(updates.severity_level)) errors.push("severity_level must be Low, Moderate or High");
    if (updates.treatment_date && isNaN(Date.parse(updates.treatment_date))) errors.push("treatment_date must be a valid date");
    if (updates.pesticide !== undefined && typeof updates.pesticide !== "string") errors.push("pesticide must be a string");
    if (updates.application_method !== undefined && typeof updates.application_method !== "string") errors.push("application_method must be a string");
    if (updates.dosage !== undefined && typeof updates.dosage !== "string") errors.push("dosage must be a string");

    if (errors.length) {
      return res.status(422).json({ message: "Invalid request", errors });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Update failed", error: err.message });
  }
};

//delete user details

const deleteUser = async (req, res, next) =>{
    const id = req.params.id;

    let user;

    try{
        user = await User.findByIdAndDelete(id)
    }catch(err){
        console.log(err);
        return res.status(500).json({message:"Failed to delete user"});
    }

    if(!user){
        return res.status(404).json({message:"Unable to Delete user details"});
    }
    return res.status(200).json({user});
}

exports.getAllUsers = getAllUsers;
exports.addUsers = addUsers;
exports.getByID = getByID;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;