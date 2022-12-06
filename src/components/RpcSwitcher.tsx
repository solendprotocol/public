import React, { useContext, useEffect, useState } from "react";
import { ReactSVG } from "react-svg";
import { ENDPOINTS } from "common/config";
import { useAtom } from "jotai";
import { Connection } from "@solana/web3.js";
import { connectionAtom, rpcEndpointAtom } from "stores/globalStates";

const RpcSwitcher = () => {
  const [rpcEndpoint, setRpcEndpoint] = useAtom(rpcEndpointAtom);
  const [, setConnection] = useAtom(connectionAtom);

  const [tempEndpoint, setTempEndpoint] = useState(
    rpcEndpoint.name == "Custom" ? rpcEndpoint.endpoint : ""
  );

  const handleCustomRpc = (e) => {
    if (e.key == "Enter") {
      const enteredEndpoint = e.target.value;
      if (enteredEndpoint !== "" && enteredEndpoint.startsWith("http")) {
        try {
          const newConnection = new Connection(enteredEndpoint, "confirmed");
          setConnection(newConnection);
          setRpcEndpoint({ name: "Custom", endpoint: enteredEndpoint });
        } catch {}
      }
    }
  };

  const lists = ENDPOINTS.map((endpoint) => (
    <li
      className={`${rpcEndpoint.name === endpoint.name && "bordered"}`}
      key={endpoint.key}
      onClick={() => {
        try {
          const newConnection = new Connection(endpoint.endpoint, "confirmed");
          setConnection(newConnection);
          setRpcEndpoint({ name: endpoint.name, endpoint: endpoint.endpoint });
        } catch {}
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
        <p className="text-primary-content">{rpcEndpoint.name}</p>

        <ReactSVG wrapper="span" src={"/icons/caretdown.svg"} />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-4 shadow rounded-box  w-52 bg-base-200"
      >
        {lists}
        <li className={`${rpcEndpoint.name === "Custom" && "bordered"}`}>
          <a>Custom</a>
          <input
            type="text"
            placeholder="Enter endpoint here"
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
