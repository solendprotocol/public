import { 
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Input,
    Button,
    useMenuItem,
    Box,
 } from "@chakra-ui/react";
 import {
    ChevronDownIcon,
 } from "@chakra-ui/icons";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { poolsAtom, ReserveType } from 'stores/pools';
import { DEFAULT_RPC_ENDPOINTS } from "utils/config";
import { selectedRpcAtom } from "stores/settings";

const MenuInput = (props: any) => {
    const { role, ...rest } = useMenuItem(props);
    return (
      <Box px="3" role={role}>
        <Input placeholder="Enter custom RPC" size="sm" {...rest} />
      </Box>
    );
  };
  
export default function Pool() {
    const [selectedRpc, setSelectedRpc] = useAtom(selectedRpcAtom);
    const [customEndpoint, setCustomEndpoint] = useState('');
    const [pools] = useAtom(poolsAtom);

    return  <Menu gutter={0}>
    <MenuButton as={Button}>
      Rpc: {selectedRpc.name} <ChevronDownIcon />
    </MenuButton>
    <MenuList>
      {DEFAULT_RPC_ENDPOINTS.map(endpoint => 
        <MenuItem key={endpoint.name} onClick={() => setSelectedRpc(endpoint)}>{endpoint.name}</MenuItem>  
      )}
      <MenuInput
       value={customEndpoint} 
        onChange={(e) => {
        e.stopPropagation();
            setCustomEndpoint(e.target.value)
            if (customEndpoint.length) {
                try {
                    const _test = new URL(customEndpoint);
                    setSelectedRpc({
                        name: 'Custom',
                        endpoint: customEndpoint
                    })
                } catch (e) {
                    console.error(e)
                }}
            }
        }
      />
    </MenuList>
  </Menu>
}