import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../../../api";

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
    const ask = await Swal.fire({
      icon: "warning",
      title: "Delete this yield record?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel"
    });
    if (!ask.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/yieldrecords/${encodeURIComponent(_id)}`);

      await Swal.fire({
        icon: "success",
        title: "Yield record deleted",
        timer: 1400,
        showConfirmButton: false
      });

      if (props.onDelete) props.onDelete(_id);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.response?.data?.message || err?.message || "Unknown error"
      });
    }
  };


  return (
    <tr className="viewyield-row">
      <td className="viewyield-cell--id">{_id}</td>
      <td>{fmtDate(PlantedDate)}</td>
      <td>{fmtDate(harvestdate)}</td>
      <td>{greenhouseSection}</td>
      <td>{cropType}</td>
      <td>{quantity}</td>
      <td>{treesPicked}</td>
      <td>{storageLocation}</td>
      <td className="viewyield-actions-cell">
        <button
          type="button"
          className="viewyield-btn viewyield-btn--update" 
          onClick={() => navigate(`/yieldrecords/edit/${_id}`)}
        >
          Update
        </button>
        <button
          type="button"
          className="viewyield-btn viewyield-btn--delete" 
          onClick={deleteHandler}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default Record;
