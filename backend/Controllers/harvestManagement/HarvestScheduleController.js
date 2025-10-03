const { get } = require("mongoose");
const HarvestSchedule = require("../../Model/harvestManagement/HarvestScheduleModel");

//Display harvest schedule
const getAllharvestschedules = async(req, res, next)=>{

    let harvestSchedules;

    try{
        harvestSchedules = await HarvestSchedule.find();
    }catch (err){
        console.log(err);
    }
    //not found
    if(!harvestSchedules){
        return res.status(404).json({message:"harvest schedule not found"})
    }

    //display all
    return res.status(200).json({ data: harvestSchedules });
};

    

//Insert harvest schedules
    const addharvestschedules = async(req, res, next) =>{

        const{cropType,greenhouseSection,plantedDate,status,notes}=req.body;

        let harvestSchedules;

        try{
            harvestSchedules=new HarvestSchedule({cropType,greenhouseSection,plantedDate,status,notes});
            await harvestSchedules.save();
        }catch (err) {

        //validation check
        if (err.name === "ValidationError") {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
        return res.status(400).json({ message: "Validation failed", errors });
    }
    console.log(err);
    return next?.(err); 
  }

  if (!harvestSchedules) {
    return res.status(404).send({ message: "unable to add harvest schedules" });
  }
  return res.status(200).json({ harvestSchedules });
};



// get by id
const getById = async (req, res, next) => {
  const id = req.params.id;

  let harvestSchedule;

  try {
    harvestSchedule = await HarvestSchedule.findById(id);
  } catch (err) {
    console.log(err);
  }

  // if not available
  if (!harvestSchedule) {
    return res.status(404).send({ message: "harvestSchedule not available" });
  }
  return res.status(200).json({ harvestSchedule });
}


//update user details
const updateharvestschedules = async(req, res,next) =>{

    const id = req.params.id;
    const {cropType,greenhouseSection,plantedDate,status,notes  } = req.body; 

    let harvestSchedules;
try {
    
    harvestSchedules = await HarvestSchedule.findByIdAndUpdate(
      id,
      { cropType, greenhouseSection, plantedDate, status, notes },
      { new: true, runValidators: true, context: "query" } 
    );

    
    if (harvestSchedules) {
      harvestSchedules = await harvestSchedules.save(); 
    }
  } catch (err) {
    
    if (err.name === "ValidationError") {
      const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
      return res.status(400).json({ message: "Validation failed", errors });
    }
    console.log(err);
    return next?.(err);
  }

  if (!harvestSchedules) {
    return res.status(404).send({ message: "unable to update harvestSchedules" });
  }
  return res.status(200).json({ harvestSchedules });
};



//Delete user details
const deleteharvestschedules = async (req, res,next)=>{
    const id = req.params.id;

    let harvestSchedule;

    try{
        harvestSchedule = await HarvestSchedule.findByIdAndDelete(id)
    }catch(err){
        console.log(err);
    }

     // if not available
    if (!harvestSchedule) {
    return res.status(404).send({ message: "unable to delete harvestSchedule" });
    }
    return res.status(200).json({ harvestSchedule });
};



exports.getAllharvestschedules=getAllharvestschedules;
exports.addharvestschedules=addharvestschedules;
exports.getById=getById;
exports.updateharvestschedules=updateharvestschedules;
exports.deleteharvestschedules=deleteharvestschedules;