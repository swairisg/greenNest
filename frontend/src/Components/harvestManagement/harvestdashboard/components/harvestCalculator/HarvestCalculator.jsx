import React, { useState, useMemo } from "react";
import "./HarvestCalculator.css";

const HarvestCalculator = ({ records }) => {
  const [selectedCrop, setSelectedCrop] = useState("");
  const [numberOfTrees, setNumberOfTrees] = useState("");
  const [calculationResult, setCalculationResult] = useState(null);

  // Get unique crop types from records for dropdown
  const availableCrops = useMemo(() => {
    const crops = [...new Set(records.map(record => record.cropType).filter(Boolean))];
    return crops.sort();
  }, [records]);

  // Calculate average yield per tree for each crop
  const cropYieldData = useMemo(() => {
    const yieldMap = {};
    
    records.forEach(record => {
      if (!record.cropType || !record.quantity || !record.treesPicked) return;
      
      const cropType = record.cropType;
      const yieldPerTree = record.quantity / record.treesPicked;
      
      if (!yieldMap[cropType]) {
        yieldMap[cropType] = {
          totalYield: 0,
          count: 0,
          records: []
        };
      }
      
      yieldMap[cropType].totalYield += yieldPerTree;
      yieldMap[cropType].count += 1;
      yieldMap[cropType].records.push({
        yieldPerTree,
        date: record.harvestdate,
        quantity: record.quantity,
        treesPicked: record.treesPicked
      });
    });
    
    // Calculate averages
    const result = {};
    Object.keys(yieldMap).forEach(crop => {
      result[crop] = {
        averageYieldPerTree: yieldMap[crop].totalYield / yieldMap[crop].count,
        totalRecords: yieldMap[crop].count,
        records: yieldMap[crop].records
      };
    });
    
    return result;
  }, [records]);

  const calculateHarvest = () => {
    if (!selectedCrop || !numberOfTrees || numberOfTrees <= 0) {
      alert("Please select a crop and enter a valid number of trees");
      return;
    }

    const cropData = cropYieldData[selectedCrop];
    if (!cropData) {
      alert("No historical data available for selected crop");
      return;
    }

    const estimatedHarvest = cropData.averageYieldPerTree * parseInt(numberOfTrees);
    
    setCalculationResult({
      crop: selectedCrop,
      numberOfTrees: parseInt(numberOfTrees),
      averageYieldPerTree: cropData.averageYieldPerTree,
      estimatedHarvest: estimatedHarvest,
      basedOnRecords: cropData.totalRecords
    });
  };

  const resetCalculator = () => {
    setSelectedCrop("");
    setNumberOfTrees("");
    setCalculationResult(null);
  };

  return (
    <div className="harvestcal-section">
      <div className="harvestcal-header">
        <h2>Estimated Harvest Calculator</h2>
        <p>Calculate expected harvest based on historical yield data</p>
      </div>

      <div className="harvestcal-form">
        <div className="harvestcal-form-group">
          <label htmlFor="crop-select" className="harvestcal-label">Select Crop:</label>
          <select
            id="crop-select"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="harvestcal-select"
          >
            <option value="">Choose a crop...</option>
            {availableCrops.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>

        <div className="harvestcal-form-group">
          <label htmlFor="trees-input" className="harvestcal-label">Number of Trees:</label>
          <input
            id="trees-input"
            type="number"
            value={numberOfTrees}
            onChange={(e) => setNumberOfTrees(e.target.value)}
            placeholder="Enter number of trees"
            min="1"
            className="harvestcal-input"
          />
        </div>

        <div className="harvestcal-actions">
          <button 
            onClick={calculateHarvest}
            className="harvestcal-btn harvestcal-btn-calculate"
            disabled={!selectedCrop || !numberOfTrees}
          >
            Calculate Harvest
          </button>
          <button 
            onClick={resetCalculator}
            className="harvestcal-btn harvestcal-btn-reset"
          >
            Reset
          </button>
        </div>
      </div>

      {calculationResult && (
        <div className="harvestcal-result">
          <h3 className="harvestcal-result-title">Calculation Results</h3>
          <div className="harvestcal-result-cards">
            <div className="harvestcal-result-card">
              <span className="harvestcal-result-label">Selected Crop:</span>
              <span className="harvestcal-result-value">{calculationResult.crop}</span>
            </div>
            <div className="harvestcal-result-card">
              <span className="harvestcal-result-label">Number of Trees:</span>
              <span className="harvestcal-result-value">{calculationResult.numberOfTrees.toLocaleString()}</span>
            </div>
            <div className="harvestcal-result-card">
              <span className="harvestcal-result-label">Average Yield per Tree:</span>
              <span className="harvestcal-result-value">{calculationResult.averageYieldPerTree.toFixed(2)} kg</span>
            </div>
            <div className="harvestcal-result-card harvestcal-result-card-highlight">
              <span className="harvestcal-result-label">Estimated Total Harvest:</span>
              <span className="harvestcal-result-value">{calculationResult.estimatedHarvest.toFixed(2)} kg</span>
            </div>
          </div>
          <div className="harvestcal-footnote">
            <p className="harvestcal-footnote-text">
              * Based on analysis of {calculationResult.basedOnRecords} historical harvest records
            </p>
          </div>
        </div>
      )}

      {/* Show available crop data for reference */}
      <div className="harvestcal-reference">
        <h4 className="harvestcal-reference-title">Historical Yield Reference (per tree)</h4>
        <div className="harvestcal-reference-grid">
          {Object.entries(cropYieldData).map(([crop, data]) => (
            <div key={crop} className="harvestcal-reference-item">
              <span className="harvestcal-crop-name">{crop}:</span>
              <span className="harvestcal-yield-value">{data.averageYieldPerTree.toFixed(2)} kg</span>
              <span className="harvestcal-record-count">({data.totalRecords} records)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HarvestCalculator;