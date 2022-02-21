"use strict";
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const my_service_1 = __importDefault(require("./my.service"));
async function install(client, request) {
    const res = await runMigration(client);
    return { success: true, resultObject: { res } };
}
exports.install = install;
async function uninstall(client, request) {
    return { success: true, resultObject: {} };
}
exports.uninstall = uninstall;
async function upgrade(client, request) {
    const res = await runMigration(client);
    return { success: true, resultObject: { res } };
}
exports.upgrade = upgrade;
async function downgrade(client, request) {
    return { success: true, resultObject: {} };
}
exports.downgrade = downgrade;
async function runMigration(client) {
    try {
        const pageComponentRelation = {
            RelationName: "PageBlock",
            Name: "SubAddon2Component",
            Description: "SubAddon2",
            Type: "NgComponent",
            SubType: "NG11",
            AddonUUID: client.AddonUUID,
            AddonRelativeURL: "sub_addon_2",
            ComponentName: 'SubAddon2Component',
            ModuleName: 'SubAddon2Module',
            EditorComponentName: 'SubAddon2EditorComponent',
            EditorModuleName: 'SubAddon2EditorModule'
        };
        pageComponentRelation.Key = `${pageComponentRelation.Name}_${pageComponentRelation.AddonUUID}_${pageComponentRelation.RelationName}`;
        const service = new my_service_1.default(client);
        const result = await service.upsertRelation(pageComponentRelation);
        return result;
    }
    catch (e) {
        return { success: false };
    }
}
//# sourceMappingURL=installation.js.map