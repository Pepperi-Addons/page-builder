"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_server_1 = require("@pepperi-addons/debug-server");
const addon_config_json_1 = __importDefault(require("../addon.config.json"));
const dir = __dirname;
const server = new debug_server_1.DebugServer({
    addonUUID: addon_config_json_1.default.AddonUUID,
    apiDirectory: dir,
    port: addon_config_json_1.default.DebugPort
});
// serve the plugin file locally
server.addStaticFolder(`/assets/plugins/${addon_config_json_1.default.AddonUUID}/${addon_config_json_1.default.AddonVersion}`, process.cwd() + '/../publish/editors');
server.addStaticFolder(`/`, process.cwd() + '/../publish/editors');
// serve the plugin assets locally
server.addStaticFolder(`/Addon/Public/${addon_config_json_1.default.AddonUUID}/${addon_config_json_1.default.AddonVersion}`, process.cwd() + '/../publish/assets');
server.addStaticFolder(`/assets/plugins/${addon_config_json_1.default.AddonUUID}/${addon_config_json_1.default.AddonVersion}`, process.cwd() + '/../publish/assets');
server.start();
console.log("Open webapp at: ", `${addon_config_json_1.default.WebappBaseUrl}/settings/${addon_config_json_1.default.AddonUUID}/${addon_config_json_1.default.DefaultEditor}?dev=true`);
//# sourceMappingURL=app.local.js.map