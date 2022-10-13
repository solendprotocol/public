"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSecret = void 0;
var fs_1 = __importDefault(require("fs"));
function readSecret(secretName) {
    var path = process.env.SECRET_PATH || "/run/secrets/".concat(secretName);
    try {
        return fs_1.default.readFileSync(path, 'utf8');
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            console.error("An error occurred while trying to read the secret path: ".concat(path, ". Err: ").concat(err));
        }
        else {
            console.debug("Could not find the secret,: ".concat(secretName, ". Err: ").concat(err));
        }
        return '';
    }
}
exports.readSecret = readSecret;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYnMvc2VjcmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDBDQUFvQjtBQUVwQixTQUFnQixVQUFVLENBQUMsVUFBVTtJQUNuQyxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSx1QkFBZ0IsVUFBVSxDQUFFLENBQUM7SUFDckUsSUFBSTtRQUNGLE9BQU8sWUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDdEM7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDekIsT0FBTyxDQUFDLEtBQUssQ0FDWCxrRUFBMkQsSUFBSSxvQkFBVSxHQUFHLENBQUUsQ0FDL0UsQ0FBQztTQUNIO2FBQU07WUFDTCxPQUFPLENBQUMsS0FBSyxDQUFDLHNDQUErQixVQUFVLG9CQUFVLEdBQUcsQ0FBRSxDQUFDLENBQUM7U0FDekU7UUFDRCxPQUFPLEVBQUUsQ0FBQztLQUNYO0FBQ0gsQ0FBQztBQWRELGdDQWNDIn0=