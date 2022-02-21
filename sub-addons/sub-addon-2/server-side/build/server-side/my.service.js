"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const papi_sdk_1 = require("@pepperi-addons/papi-sdk");
class MyService {
    constructor(client) {
        this.client = client;
        this.papiClient = new papi_sdk_1.PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.AddonUUID
        });
    }
    getRelations(relationName) {
        return this.papiClient.get(`/addons/data/relations?where=RelationName=${relationName}`);
    }
    upsertRelation(relation) {
        return this.papiClient.post('/addons/data/relations', relation);
    }
}
exports.default = MyService;
//# sourceMappingURL=my.service.js.map