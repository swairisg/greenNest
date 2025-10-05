const Quality = require("../../Model/qualityControl/qualityControlmodel");


//display
const getAllUsers = async (req, res, next)=> {
    let users;
    try{
        users = await Quality.find();
    }catch(err){
        console.error(err.message);
        return res.status(500).json({ message: "Server Error" });
    }

    if(!users||users.length===0){
        return res.status(404).json({message:"Users not found!"});
    }

     return res.status(200).json({users});
};


//insert

const addQuality = async (req, res, next) => {
    const body = req.body || {};
    const {
        batchId,
        productName,
        variety,
        size,
        color,
        freshness,
        weight,
        notes,
        grade,
    } = body;

    // Basic validation to avoid crashes and give useful feedback
    if (!batchId) {
        return res.status(400).json({
            error: "batchId is required",
            hint: "Send JSON with Content-Type: application/json",
            receivedBody: body,
        });
    }

    let users;

    try {
        users = new Quality({ batchId, productName, variety, size, color, freshness, weight, notes, grade });
        await users.save();
    } catch (err) {
        console.error("addQuality save error:", err);
        return res.status(404).json({ error: "Failed to save quality record" });
    }

    //if not inserting
    if (!users) {
        return res.status(404).json({ message: "Data not entered!" });
    }

    return res.status(200).json({ users });
};

//getbyId

const getById = async (req, res, next) =>{
    
    const itemId = req.params.itemId;
    
    let item;

    try{
        item = await Quality.findById(itemId);
    }catch(err){
        console.log(err);
    }

    //if item not found
    if (!item) {
        return res.status(404).json({ message: "Item not Found!" });
    }
    return res.status(200).json({ item });
};

const updateItem = async (req, res, next) =>{

    const itemId = req.params.itemId;
    const body = req.body || {};
    const {
        batchId,
        productName,
        variety,
        size,
        color,
        freshness,
        weight,
        notes,
        grade,
    } = body;

    let item;

    try{
        item = await Quality.findByIdAndUpdate(itemId,{batchId:batchId,
            productName:productName,
            variety:variety,
            size:size,
            color:color,
            freshness:freshness,
            weight:weight,
            notes:notes,
            grade:grade,})

            item = await item.save();
    }catch(err){
        console.log(err);
    }

    //if item not updated
    if (!item) {
        return res.status(404).json({ message: "Item not Updated!" });
    }
    return res.status(200).json({ item });



};

//delete item records

const deleteItem = async (req, res, next) =>{

    const itemId = req.params.itemId;

    let item;
    try{
        item = await Quality.findByIdAndDelete(itemId);
    }catch(err){
        console.log(err);
    }
//if item not deleted
    if (!item) {
        return res.status(404).json({ message: "Item not deleted!" });
    }
    return res.status(200).json({ item });

}

exports.deleteItem = deleteItem;
exports.updateItem = updateItem;
exports.getById = getById;
exports.addQuality = addQuality;
exports.getAllUsers = getAllUsers;
