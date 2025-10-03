import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Record(props) {
  const navigate = useNavigate();

  const {
    _id,
    harvestdate,
    greenhouseSection,
    cropType,
    PlantedDate,
    quantity,
    treesPicked,
    storageLocation,
  } = props.yieldrecord;

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  const deleteHandler = async () => {
    if (!window.confirm("Delete this yield record?")) return;
    try {
      await axios.delete(`http://localhost:5000/yieldrecords/${_id}`);
      if (props.onDelete) props.onDelete(_id);
      console.log("Deleted yield record", _id);      
    } catch (err) {
      console.error(err);
      alert(
        `Delete failed: ${
          err?.response?.data?.message || err?.message || "Unknown error"
        }`
      );
    }
  };

  return (
    <tr className="viewyield-row">{/* CHANGED */}
      <td className="viewyield-cell--id">{/* CHANGED */}{_id}</td>
      <td>{fmtDate(PlantedDate)}</td>
      <td>{fmtDate(harvestdate)}</td>
      <td>{greenhouseSection}</td>
      <td>{cropType}</td>
      <td>{quantity}</td>
      <td>{treesPicked}</td>
      <td>{storageLocation}</td>
      <td className="viewyield-actions-cell">{/* CHANGED */}
        <button
          type="button"
          className="viewyield-btn viewyield-btn--update" // CHANGED
          onClick={() => navigate(`/yieldrecords/edit/${_id}`)}
        >
          Update
        </button>
        <button
          type="button"
          className="viewyield-btn viewyield-btn--delete" // CHANGED
          onClick={deleteHandler}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default Record;
