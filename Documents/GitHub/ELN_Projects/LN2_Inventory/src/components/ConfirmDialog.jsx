import React from "react";

export default function ConfirmDialog({ open, onConfirm, onCancel, message }) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message || "Are you sure you want to delete?"}</p>
        <button onClick={onConfirm} style={{ marginRight: 10, color: "red" }}>Yes, delete</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
