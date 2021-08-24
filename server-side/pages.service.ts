import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonData, AddonDataScheme } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { TempBlankPageData } from './pages.model';

const TABLE_NAME = 'Pages';
const TABLE_DRAFT_NAME = 'PagesDrafts';

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

    private getRelations(relationName: string): Promise<any> {
        return this.papiClient.get(`/addons/data/relations?where=RelationName=${relationName}`);
    }

    private getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    async getPageEditorData(body) {
        // Get the PageBlock relations 
        const pageBlockRelations: NgComponentRelation[] = await this.getRelations('PageBlock');

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
        pageBlockRelations.forEach((relation: NgComponentRelation) => {
            const installedAddon: InstalledAddon | undefined = addons.find((ia: InstalledAddon) => ia?.Addon?.UUID === relation?.AddonUUID);
            if (installedAddon) {
                availableBlocks.push({
                    relation: relation,
                    addon: installedAddon
                });
            }
        });
    
        return availableBlocks;
    }
    
    // TODO: Check that the table is not exist.
    async createPagesTablesSchemes(): Promise<AddonDataScheme[]> {
        const promises: AddonDataScheme[] = [];
        
        // Create pages table
        const createPagesTable = await this.papiClient.addons.data.schemes.post({
            Name: TABLE_NAME,
            Type: 'cpi_meta_data',
        });

        // Create pages draft table
        const createPagesDraftTable = await this.papiClient.addons.data.schemes.post({
            Name: TABLE_DRAFT_NAME,
            Type: 'meta_data',
            // Fields: {
            //     Name: {
            //         Type: 'String'
            //     },
            //     Description: {
            //         Type: 'String'
            //     },
            //     Type: {
            //         Type: 'String'
            //     }
            // }
        });

        promises.push(createPagesTable);
        promises.push(createPagesDraftTable);
        return Promise.all(promises);
    }

    dropPagesTables(): Promise<any> {
        const promises: any[] = [];
        
        // TODO: Check that this is working.
        // return this.papiClient.addons.data.schemes.tableName('table').purge();
        promises.push(this.papiClient.post(`/addons/data/schemes/${TABLE_NAME}/purge`));
        promises.push(this.papiClient.post(`/addons/data/schemes/${TABLE_DRAFT_NAME}/purge`));

        return Promise.all(promises);
    }

    getPage(options): Promise<Page> {
        // TODO: Change to pages endpoint after added in NGINX.
        // return this.papiClient.pages.find
        // return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find(options);

        const promise = new Promise<Page>((resolve, reject): void => {
            resolve(TempBlankPageData);
        });

        return promise;
    }

    upsertPage(page: Page): Promise<AddonData> {
        if (page.Key) {
            page.Key = uuid();
        }

        return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_DRAFT_NAME).upsert(page);
    }

    publishPage(page: Page): Promise<AddonData> {
        const promises: AddonData[] = [];
        if (page.Key) {
            // Delete the draft and upsert the page into Pages table.
            // TODO: Why delete get id as number?
            // promises.push(this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_DRAFT_NAME).delete(page.Key));
            promises.push(this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(page));

            // const options = {};
            // const a = this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find(options);
            // a.then(value => {
            //     value[0].
            // })
        }

        return Promise.all(promises);
    }
}