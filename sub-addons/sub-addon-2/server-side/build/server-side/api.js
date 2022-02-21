"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const my_service_1 = __importDefault(require("./my.service"));
// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
async function foo(client, request) {
    const service = new my_service_1.default(client);
    // const res = await service.getAddons()
    // return res
}
exports.foo = foo;
;
//# sourceMappingURL=api.js.map