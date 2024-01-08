"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReserve = void 0;
const react_1 = require("react");
const core_1 = require("../core");
const prices_1 = require("../core/utils/prices");
const sbv2_lite_1 = __importDefault(require("@switchboard-xyz/sbv2-lite"));
function useReserve(connection, reserveAddress) {
    const [reserve, setReserve] = (0, react_1.useState)();
    async function loadReserve() {
        if (!reserveAddress) {
            setReserve(null);
        }
        else {
            const [parsedReserve, switchboardProgram] = await Promise.all([
                (0, core_1.fetchPoolByAddress)(reserveAddress, connection),
                sbv2_lite_1.default.loadMainnet(connection),
            ]);
            if (parsedReserve) {
                const [prices, currentSlot] = await Promise.all([
                    (0, prices_1.fetchPrices)([parsedReserve], connection, switchboardProgram),
                    connection.getSlot(),
                ]);
                setReserve((0, core_1.formatReserve)(parsedReserve, prices[0], currentSlot));
            }
        }
    }
    (0, react_1.useEffect)(() => {
        loadReserve();
    }, [reserveAddress]);
    return reserve;
}
exports.useReserve = useReserve;
