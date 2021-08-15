import { PapiClient, InstalledAddon, Relation } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { RemoteModuleOptions } from './pages.model';

const toSnakeCase = str => 
    str &&
    str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('_');

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

    private getRelations(relationName: string): Promise<any> {
        return this.papiClient.get(`/addons/data/relations?where=RelationName=${relationName}`);
    }

    async getPageEditorData(body) {
        // Get the PageBlock relations 
        const pageBlockRelations: Relation[] = await this.getRelations('PageBlock');

        // Distinct the addons uuid's
        const distinctAddonsUuids = [...new Set(pageBlockRelations.filter( row => row.AddonUUID).map(obj => obj.AddonUUID))];
        
        // Get the data of those installed addons
        const addonsPromises: Promise<any>[] = [];
        distinctAddonsUuids.forEach( (uuid: any) => addonsPromises.push(this.getInstalledAddon(uuid))); 
        const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);

        const availableBlocks: RemoteModuleOptions[] = [];
        pageBlockRelations.forEach((pbRelation: Relation) => {
            const entryAddon: InstalledAddon & any = addons.find( (addon: InstalledAddon) => addon?.Addon?.UUID === pbRelation?.AddonUUID);
            const rmOptions = this.createRemoteModuleOptions(pbRelation, entryAddon);
            availableBlocks.push(rmOptions);
        });
    
        // TODO: Remove this only for testing.
        pageBlockRelations.forEach((pbRelation: Relation) => {
            const entryAddon: InstalledAddon & any = addons.find( (addon: InstalledAddon) => addon?.Addon?.UUID === pbRelation?.AddonUUID);
            const rmOptions = this.createRemoteModuleOptions(pbRelation, entryAddon, true);
            availableBlocks.push(rmOptions);
        });
    
        return { availableBlocks: availableBlocks };
    }
    
    private getRemoteEntryByType(pbRelation: Relation, entryAddon, remoteName = 'remoteEntry') {
        switch (pbRelation.Type){
            case "NgComponent":
                // // HACK FOR LOCALHOST PLEASE REMOVE
                if (pbRelation?.ComponentName == 'SlideshowComponent'){
                    const res = 'http://localhost:4401/slideshow.js';
                    return res;
                }
                // if (field?.ComponentName == 'SubAddon2Component'){
                //     const res = 'http://localhost:4402/sub_addon_2.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon3Component'){
                //     const res = 'http://localhost:4403/sub_addon_3.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon4Component'){
                //     const res = 'http://localhost:4404/sub_addon_4.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon5Component'){
                //     const res = 'http://localhost:4405/sub_addon_5.js';
                //     return res;
                // }
                else
                // // END OF HACK 
                if (pbRelation?.AddonRelativeURL) {
                    return entryAddon?.PublicBaseURL +  pbRelation?.AddonRelativeURL + '.js';
                }
                else {
                    return entryAddon?.PublicBaseURL +  remoteName + '.js';
                }
            default:
                return pbRelation?.AddonRelativeURL;
        }
    }

    private createRemoteModuleOptions(pbRelation: Relation, entryAddon, dupplicate = false) {
        const remoteName = pbRelation?.AddonRelativeURL ? 
            pbRelation.AddonRelativeURL : 
            pbRelation?.Type === "NgComponent" ? toSnakeCase(pbRelation.ModuleName?.toString().replace('Module','')) : '';

        // const obj = Configuration;
        const rmOptions: RemoteModuleOptions = { // & any = {  
            type: pbRelation.Type,
            subType: pbRelation.SubType, 
            remoteName: remoteName,
            remoteEntry: this.getRemoteEntryByType(pbRelation, entryAddon, remoteName),
            componentName: pbRelation?.Type === "NgComponent" ? pbRelation?.ComponentName : "",
            exposedModule:  pbRelation?.Type === "NgComponent" ? "./" + pbRelation?.ModuleName : "",
            title: dupplicate ? 'dupplicate' : '' + `${pbRelation?.Description}`,
            uuid: pbRelation?.AddonUUID,
            key: `${pbRelation.Name}_${pbRelation.AddonUUID}_${pbRelation.RelationName}`,
            visibleEndpoint: pbRelation?.VisibilityRelativeURL,
            addon: entryAddon,
            // layout: { section: 0, block: 0},
            editorModuleName: pbRelation?.Type === "NgComponent" ? "./" + pbRelation?.EditorModuleName : "",
            editorComponentName: pbRelation?.Type === "NgComponent" ? pbRelation?.EditorComponentName : "",
        }
    
        return rmOptions;
    }

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