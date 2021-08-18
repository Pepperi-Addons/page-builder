import { PapiClient, InstalledAddon, PageRelation } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { TempBlankPageData } from './pages.model';

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
        const pageBlockRelations: PageRelation[] = await this.getRelations('PageBlock');

        // Distinct the addons uuid's and filter by pageType
        const pageType = body['PageType'] || '';
        const distinctAddonsUuids = [...new Set(pageBlockRelations.filter(row => (
                row.AllowedPageTypes === undefined || row.AllowedPageTypes.lenth === 0 || pageType.length === 0 || (row.AllowedPageTypes.lenth > 0 && row.AllowedPageTypes.includes(pageType))
            )).map(obj => obj.AddonUUID))];
        
        // Get the data of those installed addons
        const addonsPromises: Promise<any>[] = [];
        distinctAddonsUuids.forEach( (uuid: any) => addonsPromises.push(this.getInstalledAddon(uuid))); 
        const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);

        const availableBlocks: any[] = [];
        pageBlockRelations.forEach((pbRelation: PageRelation) => {
            const installedAddon: InstalledAddon | undefined = addons.find((ia: InstalledAddon) => ia?.Addon?.UUID === pbRelation?.AddonUUID);
            if (installedAddon) {
                // const availableAddon = this.createAvailableAddon(pbRelation, entryAddon);
                // availableBlocks.push(availableAddon);
                availableBlocks.push({
                    relation: pbRelation,
                    addon: installedAddon
                });
            }
        });
    
        return availableBlocks;
    }
    
    // private getRemoteEntryByType(pbRelation: PageRelation, entryAddon, remoteName = 'remoteEntry') {
    //     switch (pbRelation.Type){
    //         case "NgComponent":
    //             // // HACK FOR LOCALHOST PLEASE REMOVE
    //             if (pbRelation?.ComponentName == 'SlideshowComponent'){
    //                 const res = 'http://localhost:4401/slideshow.js';
    //                 return res;
    //             }
    //             // if (field?.ComponentName == 'SubAddon2Component'){
    //             //     const res = 'http://localhost:4402/sub_addon_2.js';
    //             //     return res;
    //             // }
    //             // if (field?.ComponentName == 'SubAddon3Component'){
    //             //     const res = 'http://localhost:4403/sub_addon_3.js';
    //             //     return res;
    //             // }
    //             // if (field?.ComponentName == 'SubAddon4Component'){
    //             //     const res = 'http://localhost:4404/sub_addon_4.js';
    //             //     return res;
    //             // }
    //             // if (field?.ComponentName == 'SubAddon5Component'){
    //             //     const res = 'http://localhost:4405/sub_addon_5.js';
    //             //     return res;
    //             // }
    //             else
    //             // // END OF HACK 
    //                 return entryAddon?.PublicBaseURL +  remoteName + '.js';
    //         default:
    //             return pbRelation?.AddonRelativeURL;
    //     }
    // }

    // private createAvailableAddon(pbRelation: PageRelation, entryAddon: InstalledAddon) {
    //     const remoteName = pbRelation?.AddonRelativeURL ? 
    //         pbRelation.AddonRelativeURL : toSnakeCase(pbRelation.ModuleName?.toString().replace('Module',''));

    //     const rmOptions: RemoteModuleOptions = {  
    //         uuid: pbRelation?.AddonUUID,
    //         // title: `${pbRelation?.Description}`,
    //         remoteEntry: this.getRemoteEntryByType(pbRelation, entryAddon, remoteName),
    //         remoteName: remoteName,
    //         exposedModule: './' + pbRelation?.ModuleName,
    //         componentName: '' + pbRelation?.ComponentName,
    //         // editorModuleName: "./" + pbRelation?.EditorModuleName,
    //         // editorComponentName: pbRelation?.EditorComponentName,
    //         // key: `${pbRelation.Name}_${pbRelation.AddonUUID}_${pbRelation.RelationName}`,
    //         // visibleEndpoint: pbRelation?.VisibilityRelativeURL,
    //         // addon: entryAddon,
    //         // layout: { section: 0, block: 0},
    //     }
    
    //     return {
    //         options: rmOptions,
    //         relation: pbRelation
    //     };
    // }

    // TODO: Check that the table is not exist.

    async createPagesTableSchemes() {
        await this.papiClient.addons.data.schemes.post({
            Name: TABLE_NAME,
            Type: 'cpi_meta_data',
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

    dropPagesTable() {
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
        // return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find(options);

        return { page: TempBlankPageData };
    }

    upsertPage(body) {
        if (body.Key) {
            body.Key = uuid();
        }

        return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(body);
    }
}