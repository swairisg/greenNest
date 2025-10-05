import React, { useEffect, useState } from "react";
import { fetchOrderById } from "./orderApi";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./OrderDetails.css";


export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  const navigate = useNavigate();

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return "-";
    return `LKR ${Number(val).toLocaleString()}`;
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  const generatePDF = () => {
    if (!order) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("GreenNest — Order Details", 14, 18);

    doc.setFontSize(11);
    const y0 = 28;
    doc.text(`Order No: ${order.orderNo || '-'}`, 14, y0);
    // doc.text(`User ID: ${order.userId || '-'}`, 14, y0 + 6);
    doc.text(`Status: ${order.status || '-'}`, 14, y0 + 6);
    doc.text(`Payment: ${order.paymentStatus || '-'}`, 14, y0 + 12);
    doc.text(`Timestamp: ${formatDateTime(order.createdAt)}`, 14, y0 + 18);

    const rows = (order.items || []).map((it) => {
      const name = it.name || it.productName || '-';
      const qty = String(it.qty ?? it.quantity ?? '-');
      const unit = formatCurrency(it.unitPrice ?? it.price);
      const sub = formatCurrency((it.qty ?? it.quantity ?? 0) * (it.unitPrice ?? it.price ?? 0));
      return [name, qty, unit, sub];
    });

    autoTable(doc, {
      head: [['Item', 'Qty', 'Unit Price', 'Subtotal']],
      body: rows,
      startY: y0 + 32,
      styles: { fontSize: 10 },
      headStyles: { halign: 'left' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    const endY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : (y0 + 32);
    const subtotal = order.amounts?.subtotal;
    const shipping = order.amounts?.shipping;
    const grand = order.amounts?.grandTotal;

    let y = endY + 10;
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 14, y);
    y += 6;
    doc.text(`Shipping: ${formatCurrency(shipping)}`, 14, y);
    y += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Grand Total: ${formatCurrency(grand)}`, 14, y);
    doc.setFont(undefined, 'normal');

    const fileName = `Order_${order.orderNo || 'details'}.pdf`;
    doc.save(fileName);
  };

  useEffect(() => {
    fetchOrderById(id)
      .then(res => setOrder(res.data.order))
      .catch(err => console.error(err));
  }, [id]);

  if (!order) return <p>Loading...</p>;

return (
  <div className="order-detail">
    <div className="actions">
      <button
        type="button"
        onClick={() => navigate('/cart')}
        className="btn outline"
      >
        ← Back to Catalog
      </button>
      <button
        type="button"
        onClick={generatePDF}
        className="btn"
      >
        Download PDF
      </button>
    </div>
    <h2>Order Details</h2>
    <p><b>Order No:</b> {order.orderNo}</p>
    {/* <p><b>User ID:</b> {order.userId}</p> */}
    <p><b>Status:</b> {order.status}</p>
    <p><b>Payment:</b> {order.paymentStatus}</p>
    <p><b>Timestamp:</b> {formatDateTime(order.createdAt)}</p>
    <p><b>Total:</b> {formatCurrency(order.amounts?.grandTotal)}</p>

    <h3>Items:</h3>
    <ul>
      {order.items.map((item, idx) => (
        <li key={idx}>
          {item.name} – {item.qty} × {formatCurrency(item.unitPrice)}
        </li>
      ))}
    </ul>
  </div>
);
}