"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useObligation = void 0;
const react_1 = require("react");
const core_1 = require("../core");
function useObligation(connection, reserve, obligationAddress) {
    const [obligation, setObligation] = (0, react_1.useState)();
    async function loadObligation() {
        if (!obligationAddress || !reserve) {
            setObligation(null);
        }
        else {
            const res = await (0, core_1.fetchObligationByAddress)(obligationAddress, connection);
            if (res) {
                setObligation(res);
            }
        }
    }
    (0, react_1.useEffect)(() => {
        loadObligation();
    }, [obligationAddress]);
    return obligation;
}
exports.useObligation = useObligation;
