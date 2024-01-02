import React, {
    useEffect,
    useState,
  } from 'react';
  import { Connection } from "@solana/web3.js";
  import { ReserveType, fetchPoolByAddress, formatReserve } from '../core';
  import { fetchPrices } from '../core/utils/prices';
import SwitchboardProgram from '@switchboard-xyz/sbv2-lite';
  
  export function useReserve(
    connection: Connection,
    reserveAddress: string | null,
  ) {
    const [reserve, setReserve] = useState<ReserveType | null>();
  
    async function loadReserve() {
      if (!reserveAddress) {
        setReserve(null);
      } else {
        const [parsedReserve, switchboardProgram] = await Promise.all([fetchPoolByAddress(reserveAddress, connection), SwitchboardProgram.loadMainnet(connection)]);
        if (parsedReserve) {
          const [prices, currentSlot] = await Promise.all([
            fetchPrices(
            [parsedReserve],
            connection,
            switchboardProgram,
          ), connection.getSlot()]);
          setReserve(formatReserve(parsedReserve, prices[0], currentSlot));
        }
      }
    }
    useEffect(() => {
      loadReserve();
    }, [reserveAddress]);
  

    return reserve;
  }