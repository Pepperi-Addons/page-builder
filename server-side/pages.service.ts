import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';

const TABLE_NAME = 'Pages';

export class PagesService {
    papiClient: PapiClient;
    addonUUID: string;

    constructor(private client: Client) {
        this.addonUUID = client.AddonUUID;

        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client["ActionUUID"]
        });
    }

    // upsertRelation(relations): Promise<any> {
    //     const promises: Array<Promise<any>> = [];
    //     relations.forEach(relation => {
    //         promises.push(this.papiClient.post('/addons/data/relations', relation));
    //     })

    //     return Promise.all(promises)
                
    // }

    // TODO: Check that the table is not exist.
    async createPagesTableSchemes() {
        await this.papiClient.addons.data.schemes.post({
            Name: TABLE_NAME,
            Type: 'data',
            Fields: {
                Name: {
                    Type: 'String'
                },
                Description: {
                    Type: 'String'
                },
                Type: {
                    Type: 'String'
                }
            }
        });
    }

    async dropPagesTable() {
        // TODO: Check that this is working.
        return this.papiClient.post(`/addons/data/schemes/${TABLE_NAME}/purge`);
        // return this.papiClient.addons.data.schemes.tableName('table').purge();
    }

    getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    getRelations(relationName: string): Promise<any> {
        return this.papiClient.get(`/addons/data/relations?where=RelationName=${relationName}`);
    }

    getPage(options) {
        // TODO: Change to pages endpoint after added in NGINX.
        // return this.papiClient.pages.find
        return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find(options);
    }

    upsertPage(body) {
        if (body.Key) {
            body.Key = uuid();
        }

        return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(body);
    }
}