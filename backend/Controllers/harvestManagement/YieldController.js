const mongoose = require('mongoose');
const YieldRecords = require('../../Model/harvestManagement/YieldModel'); // Ensure this path is correct

// Controller for creating a new Yield Record
exports.createYieldRecords = async (req, res) => {
    try {
        const {scheduleId,harvestdate, greenhouseSection, cropType, PlantedDate, quantity, treesPicked, storageLocation } = req.body;

        // Validate required fields
        if (!scheduleId ||!harvestdate || !greenhouseSection || !cropType || !PlantedDate || !quantity || !treesPicked || !storageLocation) {
            return res.status(400).json({
                message: 'Please provide all required fields',
            });
        }       

        const errors = [];

// harvestdate not in the future
    const h = new Date(harvestdate);
    const today = new Date(); today.setHours(0,0,0,0);
    const harvestMid = new Date(h); harvestMid.setHours(0,0,0,0);
    if (isNaN(h.getTime())) errors.push('harvestdate is not a valid date.');
    else if (harvestMid > today) errors.push('Harvest date cannot be in the future.');

    // quantity > 0
    const qty = Number(quantity);
    if (Number.isNaN(qty)) errors.push('Quantity must be a number.');
    else if (qty <= 0) errors.push('Quantity must be greater than 0.');

    // treesPicked integer > 0
    const trees = Number(treesPicked);
    if (Number.isNaN(trees)) errors.push('Trees picked must be a number.');
    else if (!Number.isInteger(trees)) errors.push('Trees picked must be an integer.');
    else if (trees <= 0) errors.push('Trees picked must be greater than 0.');

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
        


        // Create a new yield record
        const newRecord = new YieldRecords({
            scheduleId,
            harvestdate,
            greenhouseSection,
            cropType,
            PlantedDate,
            quantity,
            treesPicked,
            storageLocation,
        });

        // Save the record to the database
        const savedRecord = await newRecord.save();
        return res.status(201).json({
            success: true,
            message: 'Yield recorded successfully',
            data: savedRecord,
        });
    } catch (err) {
    console.error('Error creating yield record:', err);
    // Surface mongoose validation errors cleanly (optional)
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: msgs });
    }
    return res.status(500).json({ message: 'Failed to create record.' });
  }
};



// Controller for getting all Yield Records
exports.getAllYieldRecords = async (req, res) => {
    try {
        const records = await YieldRecords.find({});
        return res.status(200).json({
            count: records.length,
            data: records,
        });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ message: 'Failed to fetch records.', error: error.message });
    }
};

// Controller for getting a single Yield Record by Id
exports.getYieldRecordsById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check for a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }

        const record = await YieldRecords.findById(id);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        return res.status(200).json(record);
    } catch (error) {
        console.error('Error fetching record by id:', error);
        res.status(500).json({ message: 'Failed to fetch record.', error: error.message });
    }
};

// Controller for updating a Yield Record by Id
exports.updateYieldRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { harvestdate, greenhouseSection, cropType, PlantedDate, quantity, treesPicked, storageLocation } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format.' });
    }

    if (!harvestdate || !greenhouseSection || !cropType || !PlantedDate || !quantity || !treesPicked || !storageLocation) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // ✅ declare errors first
    const errors = [];

    // validations (same as create)
    const h = new Date(harvestdate);
    const today = new Date(); today.setHours(0,0,0,0);
    const harvestMid = new Date(h); harvestMid.setHours(0,0,0,0);
    if (isNaN(h.getTime())) errors.push('harvestdate is not a valid date.');
    else if (harvestMid > today) errors.push('Harvest date cannot be in the future.');

    const qty = Number(quantity);
    if (Number.isNaN(qty)) errors.push('Quantity must be a number.');
    else if (qty <= 0) errors.push('Quantity must be greater than 0.');

    const trees = Number(treesPicked);
    if (Number.isNaN(trees)) errors.push('Trees picked must be a number.');
    else if (!Number.isInteger(trees)) errors.push('Trees picked must be an integer.');
    else if (trees <= 0) errors.push('Trees picked must be greater than 0.');

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const result = await YieldRecords.findByIdAndUpdate(
      id,
      { harvestdate, greenhouseSection, cropType, PlantedDate, quantity, treesPicked, storageLocation },
      { new: true, runValidators: true }
    );

    if (!result) return res.status(404).json({ message: 'Yield Record not found' });

    return res.status(200).json({ message: 'Yield Record updated successfully', data: result });
  } catch (error) {
    console.error('Error updating record:', error);
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: msgs });
    }
    return res.status(500).json({ message: 'Failed to update record.' });
  }
};




// Controller for deleting a Yield Record by Id
exports.deleteYieldRecords = async (req, res) => {
    try {
        const { id } = req.params; // Ensure this is correctly obtained
        const deletedRecord = await YieldRecords.findByIdAndDelete(id);

        if (!deletedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }

        return res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error.message);
        res.status(500).json({ message: 'Failed to delete record.' });
    }
};


