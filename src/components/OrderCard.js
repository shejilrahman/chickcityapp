"use client";

import { useState, useCallback } from "react";
import { Clock, Phone, MapPin, CheckCircle, Truck, Pencil, Printer, X, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// ─── Thermal receipt CSS (injected once into a hidden <style> inside the print iframe) ──
const RECEIPT_CSS = `
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    font-weight: 600;
    width: 72mm;
    padding: 4mm 3mm;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .bold   { font-weight: 900; }
  .large  { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
  .hr     { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  .hr-solid { border: none; border-top: 2px solid #000; margin: 5px 0; }
  table   { width: 100%; border-collapse: collapse; }
  th, td  { padding: 2px 2px; vertical-align: top; }
  th      { font-weight: 900; text-decoration: underline; }
  .no-col { width: 8%; }
  .item-col { width: 46%; }
  .rate-col { width: 16%; text-align: right; }
  .qty-col  { width: 10%; text-align: center; }
  .tot-col  { width: 20%; text-align: right; }
  .total-row { font-weight: 900; font-size: 14px; }
  .footer { text-align: center; margin-top: 6px; font-size: 11px; font-weight: 700; }
`;

function printReceipt(order, items) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  const grandTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const billNo = order.id?.slice(-5).toUpperCase() || "00000";

  const rows = items.map((item, idx) => {
    const total = (item.price * item.quantity).toFixed(2);
    const itemLabel = `${item.name}${item.unit ? ` (${item.unit})` : ""}`;
    return `
      <tr>
        <td class="no-col">${idx + 1}</td>
        <td class="item-col">${itemLabel}</td>
        <td class="rate-col">${item.price.toFixed(2)}</td>
        <td class="qty-col">${item.quantity}</td>
        <td class="tot-col">${total}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>${RECEIPT_CSS}</style>
</head>
<body>
  <div class="center">
    <div class="large">Palathingal Store</div>
    <div>Pallipuram, Munnamburn, Ernakulam</div>
    <div>883515 Phone: 9744381539</div>
  </div>
  <hr class="hr-solid"/>
  <div><span class="bold">Bill No:</span> ${billNo}</div>
  <div><span class="bold">Date:</span> ${dateStr} ${timeStr}</div>
  <hr class="hr"/>
  <div class="bold">Customer Information:</div>
  <div>${order.customerName || "-"}</div>
  ${order.customerPhone ? `<div>${order.customerPhone}</div>` : ""}
  ${order.customerLocation ? `<div>${order.customerLocation}</div>` : ""}
  <hr class="hr"/>
  <div class="center bold">RETAIL INVOICE</div>
  <hr class="hr"/>
  <table>
    <thead>
      <tr>
        <th class="no-col">No</th>
        <th class="item-col">Item</th>
        <th class="rate-col">Rate</th>
        <th class="qty-col">Qty</th>
        <th class="tot-col">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <hr class="hr"/>
  <table>
    <tr class="total-row">
      <td colspan="4" style="text-align:right;">Grand Total</td>
      <td class="tot-col">${grandTotal.toFixed(2)}</td>
    </tr>
  </table>
  <hr class="hr-solid"/>
  <div class="footer">
    <div>================================</div>
    <div>Thank you for doing business with us.</div>
    <div>================================</div>
  </div>
</body>
</html>`;

  // Open a tiny iframe, write HTML, print, remove
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 300);
}

export default function OrderCard({ order }) {
  // ── State ──────────────────────────────────────────────────────────────
  const [editedItems, setEditedItems] = useState(
    () => order.items.map(i => ({ ...i }))
  );
  const [editingIdx, setEditingIdx] = useState(null); // which row is being edited
  const [editPrice, setEditPrice]   = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const grandTotal = editedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditPrice(String(editedItems[idx].price));
  };

  const cancelEdit = () => { setEditingIdx(null); setEditPrice(""); };

  const saveEdit = useCallback(async (idx) => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) return cancelEdit();

    const newItems = editedItems.map((item, i) =>
      i === idx ? { ...item, price: newPrice } : item
    );
    const newTotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);

    setIsSavingPrice(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        items: newItems,
        total: parseFloat(newTotal.toFixed(2)),
      });
      setEditedItems(newItems);
    } catch (e) {
      console.error("Failed to save price", e);
      alert("Error saving price.");
    } finally {
      setIsSavingPrice(false);
      setEditingIdx(null);
      setEditPrice("");
    }
  }, [editPrice, editedItems, order.id]);

  const updateStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, "orders", order.id), { status: newStatus });
    } catch (e) {
      console.error("Failed to update status", e);
      alert("Error updating order status.");
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const statusColors = {
    pending:           "bg-yellow-100 text-yellow-800 border border-yellow-200",
    confirmed:         "bg-blue-100 text-blue-800 border border-blue-200",
    "out-for-delivery":"bg-orange-100 text-orange-800 border border-orange-200",
    delivered:         "bg-green-100 text-green-800 border border-green-200",
    rejected:          "bg-red-100 text-red-800 border border-red-200",
  };

  const canEdit = ["pending", "confirmed"].includes(order.status);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{order.customerName}</h3>
          <div className="flex flex-col space-y-1 mt-1">
            <div className="flex items-center text-gray-500 text-sm">
              <Phone size={14} className="mr-1" />
              <a href={`tel:${order.customerPhone}`} className="hover:text-green-600">
                {order.customerPhone}
              </a>
            </div>
            {order.customerLocation && (
              <div className="flex items-start text-gray-500 text-sm mt-1">
                <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 leading-tight">{order.customerLocation}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
            {order.status.replace(/-/g, " ")}
          </span>
          <div className="flex items-center justify-end text-xs text-gray-400 mt-2">
            <Clock size={12} className="mr-1" />
            {order.timestamp?.toDate
              ? new Intl.DateTimeFormat("en-IN", { timeStyle: "short", dateStyle: "medium" }).format(order.timestamp.toDate())
              : "Just now"}
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Order Items
          </h4>
          {canEdit && (
            <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
              <Pencil size={10} /> Tap ₹ to edit price
            </span>
          )}
        </div>

        <div className="space-y-2">
          {editedItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm gap-2">
              <span className="text-gray-700 flex-1">
                <span className="font-medium">{item.quantity}x</span>{" "}
                {item.name}{item.unit ? ` (${item.unit})` : ""}
              </span>

              {/* Price — editable */}
              {editingIdx === idx ? (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-20 border border-blue-400 rounded-lg px-2 py-0.5 text-right text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") saveEdit(idx);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(idx)}
                    disabled={isSavingPrice}
                    className="p-1 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => canEdit && startEdit(idx)}
                  className={`font-semibold text-gray-900 flex items-center gap-1 rounded-lg px-2 py-0.5 transition-colors ${
                    canEdit ? "hover:bg-blue-50 hover:text-blue-700 cursor-pointer group" : "cursor-default"
                  }`}
                  title={canEdit ? "Click to edit price" : undefined}
                  disabled={!canEdit}
                >
                  ₹{(item.price * item.quantity).toFixed(2)}
                  {canEdit && (
                    <Pencil size={11} className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span className="text-lg text-green-600">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {/* Status action row */}
        <div className="flex gap-2">
          {order.status === "pending" && (
            <>
              <button
                onClick={() => updateStatus("confirmed")}
                className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => updateStatus("rejected")}
                className="flex-1 bg-white border border-gray-200 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {order.status === "confirmed" && (
            <button
              onClick={() => updateStatus("out-for-delivery")}
              className="flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <Truck size={18} />
              Mark Out for Delivery
            </button>
          )}

          {order.status === "out-for-delivery" && (
            <button
              onClick={() => updateStatus("delivered")}
              className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Mark as Delivered
            </button>
          )}
        </div>

        {/* Print receipt — always available */}
        <button
          onClick={() => printReceipt(order, editedItems)}
          className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Printer size={16} />
          Print Receipt
        </button>
      </div>
    </div>
  );
}
