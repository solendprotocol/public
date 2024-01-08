import React, { useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import { ReserveType, fetchObligationByAddress } from "../core";
import { RawObligationType } from "../state";

export function useObligation(
  connection: Connection,
  reserve: ReserveType | null,
  obligationAddress: string | null
) {
  const [obligation, setObligation] = useState<RawObligationType | null>();

  async function loadObligation() {
    if (!obligationAddress || !reserve) {
      setObligation(null);
    } else {
      const res = await fetchObligationByAddress(obligationAddress, connection);
      if (res) {
        setObligation(res);
      }
    }
  }

  useEffect(() => {
    loadObligation();
  }, [obligationAddress]);

  return obligation;
}
