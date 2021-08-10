import { PapiClient, InstalledAddon, AddonDataScheme } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';

class MyService {

    papiClient: PapiClient

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            actionUUID: client.AddonUUID,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
        });
    }

    getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    getRelations(relationName: string): Promise<any> {
        return this.papiClient.get(`/addons/data/relations?where=RelationName=${relationName}`);
    }

    async getPages(addonUUID: string): Promise<any> {

        return this.papiClient.addons.data.uuid(addonUUID).table('Pages').find();

       


    }

    createDataScheme(tableScheme: AddonDataScheme): Promise<any> {
        return this.papiClient.addons.data.schemes.post(tableScheme);
    }

    dropTable(tableName: string): Promise<any> {
        // this.papiClient.pages(pageName).();
// TODO
        // this.papiClient.addons.api.uuid('uuid').file('pages').func('get');
        // this.papiClient.addons.api.uuid('uuid').file('pages').func('post');
        return this.papiClient.post(`/addons/data/schemes/${tableName}/purge`);
        // return this.papiClient.addons.data.schemes.tableName('table').purge();
    }

  

    // upsertRelation(relations): Promise<any> {
    //     const promises: Array<Promise<any>> = [];
    //     relations.forEach(relation => {
    //         promises.push(this.papiClient.post('/addons/data/relations', relation));
    //     })

    //     return Promise.all(promises)
                
    // }
  
}

export default MyService;