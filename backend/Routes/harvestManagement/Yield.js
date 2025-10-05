const express = require('express');
const {
    createYieldRecords,
    getAllYieldRecords,
    getYieldRecordsById,
    updateYieldRecords,
    deleteYieldRecords,
    
    
} = require('../../Controllers/harvestManagement/YieldController');

const router = express.Router();


router.post('/', createYieldRecords);
router.get('/', getAllYieldRecords);
router.get('/:id', getYieldRecordsById);
router.put('/:id', updateYieldRecords);
router.delete('/:id', deleteYieldRecords);


module.exports = router;