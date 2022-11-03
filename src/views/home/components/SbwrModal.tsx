import { useState } from "react";
import { Borrow, Supply, Repay, Withdraw } from "views/home/components";
const SbwrModal = () => {
  const [activeTab, setActiveTab] = useState("Supply");
  const tabs = ["Supply", " Borrow", "Withdraw", "Repay"];
  return (
    <>
      <input type="checkbox" id="sbwr-modal" className="modal-toggle" />

      <label id="sbwr-modal" className="modal cursor-pointer">
        <label className="modal-box relative">
          <label
            htmlFor="sbwr-modal"
            className="btn btn-sm btn-circle absolute right-2 top-2"
          >
            ✕
          </label>
          {/* modal tabs */}
          <div className="tabs w-full">
            {tabs.map((tab) => (
              <a
                className={`tab tab-lg tab-lifted text-primary-content ${
                  activeTab == tab && "tab-active"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </a>
            ))}
          </div>
          {/* This is the body of the tabs */}
          {activeTab == "Supply" ? (
            <Supply />
          ) : activeTab == "Borrow" ? (
            <Borrow />
          ) : activeTab == "Withdraw" ? (
            <Withdraw />
          ) : activeTab == "Repay" ? (
            <Repay />
          ) : (
            ""
          )}
        </label>
      </label>
    </>
  );
};
export default SbwrModal;
