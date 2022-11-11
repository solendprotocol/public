import { useState } from "react";

const PoolPositionModal = () => {
  return (
    <>
      <input type="checkbox" id="pp-modal" className="modal-toggle" />

      <label id="pp-modal" className="modal cursor-pointer">
        <label className="modal-box relative">
          <label
            htmlFor="pp-modal"
            className="btn btn-sm btn-circle absolute right-2 top-2"
          >
            ✕
          </label>
          <div className="">
            <h1>Pool Position</h1>
          </div>
        </label>
      </label>
    </>
  );
};
export default PoolPositionModal;
