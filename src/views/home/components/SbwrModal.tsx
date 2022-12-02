import { useState } from "react";
import { useAtom } from "jotai";
import { selectedReserveAtom } from "stores/globalStates";
import { Borrow, Supply, Repay, Withdraw } from "views/home/components";

const SbwrModal = () => {
  const [selectedReserve, setSelectedReserve] = useAtom(selectedReserveAtom);
  const [activeTab, setActiveTab] = useState("Supply");
  const tabs = ["Supply", "Borrow", "Withdraw", "Repay"];
  return (
    <>
      <input type="checkbox" id="sbwr-modal" className="modal-toggle" />

      <label
        id="sbwr-modal"
        className="modal cursor-pointer"
        htmlFor="sbwr-modal"
      >
        <label className="modal-box relative" htmlFor="">
          <label
            htmlFor="sbwr-modal"
            className="btn btn-sm btn-circle absolute right-2 top-2"
          >
            ✕
          </label>
          {/* modal tabs */}
          <div className="tabs w-full ">
            {tabs.map((tab) => (
              <a
                className={`tab tab-lg tab-bordered text-primary-content ${
                  activeTab == tab && "tab-active"
                }`}
                onClick={() => setActiveTab(tab)}
                key={tab}
              >
                {tab}
              </a>
            ))}
          </div>
          {/* This is the body of the tabs */}
          {activeTab === "Supply" ? (
            <Supply selectedToken={selectedReserve} />
          ) : activeTab === "Borrow" ? (
            <Borrow selectedToken={selectedReserve} />
          ) : activeTab === "Withdraw" ? (
            <Withdraw selectedToken={selectedReserve} />
          ) : activeTab === "Repay" ? (
            <Repay selectedToken={selectedReserve} />
          ) : (
            ""
          )}
        </label>
      </label>
    </>
  );
};
export default SbwrModal;
