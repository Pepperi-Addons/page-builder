import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';

class MyService {

    papiClient: PapiClient

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken
        });
    }

    getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    getRelations(relationName: string): Promise<any> {
        return this.papiClient.get(`/addons/data/relations?where=RelationName=${relationName}`);
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