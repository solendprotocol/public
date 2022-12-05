import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { ReactSVG } from "react-svg";
import { rpcAtom } from "stores/globalStates";
import { ENDPOINTS } from "common/config";

const RpcSwitcher = () => {
  const [rpc, setRpc] = useAtom(rpcAtom);

  const [tempEndpoint, setTempEndpoint] = useState(
    rpc.name == "Custom" ? rpc.endpoint : ""
  );
  
  const handleCustomRpc = (e) => {
    if (e.key == "Enter") {
      if (e.target.value !== "" && e.target.value.startsWith("http")) {
        setRpc({ name: "Custom", endpoint: e.target.value });
      }
    }
  };
  const lists = ENDPOINTS.map((endpoint) => (
    <li
      className={`${rpc.name === endpoint.name && "bordered"}`}
      key={endpoint.key}
      onClick={() => {
        setRpc({ name: endpoint.name, endpoint: endpoint.endpoint });
      }}
    >
      <a>{endpoint.name}</a>
    </li>
  ));

  return (
    <div className="dropdown md:dropdown-top lg:dropdown-top dropdown-bottom">
      <label
        tabIndex={0}
        className="btn p-2 px-3 bg-base-200 w-35 flex gap-1 text-primary-content"
      >
        <p className="text-primary-content">{rpc.name}</p>

        <ReactSVG wrapper="span" src={"/icons/caretdown.svg"} />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-4 shadow rounded-box  w-52 bg-base-200"
      >
        {lists}
        <li className={`${rpc.name === "Custom" && "bordered"}`}>
          <a>Custom</a>
          <input
            type="text"
            placeholder="Paste Rpc and enter"
            className="input input-bordered w-full max-w-xs"
            onKeyDown={(e) => handleCustomRpc(e)}
            value={tempEndpoint}
            onChange={(e) => setTempEndpoint(e.target.value)}
          />
        </li>
      </ul>
    </div>
  );
};

export default RpcSwitcher;
