import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonData, AddonDataScheme } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { TempBlankPageData } from './pages.model';

const PAGES_TABLE_NAME = 'Pages';
const DRAFT_PAGES_TABLE_NAME = 'PagesDrafts';

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

    private async getAvailableBlocks(pageType: string) {
        // Get the PageBlock relations 
        const pageBlockRelations: NgComponentRelation[] = await this.getRelations('PageBlock');
                
        // Distinct the addons uuid's and filter by pageType
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

    async createPagesTablesSchemes(): Promise<AddonDataScheme[]> {
        // TODO: Check that the table is not exist.
        const promises: AddonDataScheme[] = [];
        
        // Create pages table
        const createPagesTable = await this.papiClient.addons.data.schemes.post({
            Name: PAGES_TABLE_NAME,
            Type: 'cpi_meta_data',
        });

        // Create pages draft table
        const createPagesDraftTable = await this.papiClient.addons.data.schemes.post({
            Name: DRAFT_PAGES_TABLE_NAME,
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
        promises.push(this.papiClient.post(`/addons/data/schemes/${PAGES_TABLE_NAME}/purge`));
        promises.push(this.papiClient.post(`/addons/data/schemes/${DRAFT_PAGES_TABLE_NAME}/purge`));

        return Promise.all(promises);
    }

    async getPages(options): Promise<any[]> {
        // TODO: Change to pages endpoint after added in NGINX.
        // return this.papiClient.pages.find
        let pages: Page[] = await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).find(options) as Page[];
        let draftPages: Page[] = await this.papiClient.addons.data.uuid(this.addonUUID).table(DRAFT_PAGES_TABLE_NAME).find(options) as Page[];

        const promise = new Promise<any[]>((resolve, reject): void => {
            let allPages = [...new Set(pages.concat(draftPages).map((page: Page) => {
                // Return projection object.
                return {
                    key: page.Key,
                    name: page.Name,
                    creationDate: page.CreationDateTime,
                    modificationDate: page.ModificationDateTime,
                    status: '',
                }
            }))];

            resolve(allPages);
        });

        return promise;
    }

    upsertPage(page: Page): Promise<AddonData> {
        if (page.Key) {
            page.Key = uuid();
        }

        // TODO: Validate page object before upsert.
        return this.papiClient.addons.data.uuid(this.addonUUID).table(DRAFT_PAGES_TABLE_NAME).upsert(page);
    }

    createTemplatePage(query: any): Promise<AddonData> {
        const templateId = query['TemplateId'] || '';
        // TODO: Get the correct page by template (options.TemplateKey)
        const page: Page = TempBlankPageData;
        
        return this.upsertPage(page);
    }

    private deletePageDraft(pagekey: string): Promise<AddonData> {
        return this.papiClient.addons.data.uuid(this.addonUUID).table(DRAFT_PAGES_TABLE_NAME).key(pagekey).hardDelete(true);
    }

    deletePage(query: any): Promise<AddonData> {
        const pagekey = query['key'] || '';
        const promises: AddonData[] = [];

        promises.push(this.deletePageDraft(pagekey));
        promises.push(this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).key(pagekey).hardDelete(true));

        return Promise.all(promises);
    }

    async getPageEditorData(query: any) {
        let res;
        const pagekey = query['key'] || '';
        
        if (pagekey) {
            let page: Page | null = null;

            try {
                // Get the page from the drafts.
                page = await this.papiClient.addons.data.uuid(this.addonUUID).table(DRAFT_PAGES_TABLE_NAME).key(pagekey).get() as Page;
                
                // If there is no page in the drafts
                if (!page) {
                    page = await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).key(pagekey).get() as Page;
                }
            } catch (err) {
                // TODO: Temp - sould remove this.
                page = TempBlankPageData;
            }

            // If page found get the available blocks by page type and return combined object.
            if (page) {
                const pageType = page.Type || '';
                const availableBlocks = this.getAvailableBlocks(pageType);
                
                res = {
                    page, 
                    availableBlocks
                };
            }
        }

        const promise = new Promise<any[]>((resolve, reject): void => {
            resolve(res);
        });

        return promise;
    }
    
    publishPage(page: Page): Promise<AddonData> {
        const promises: AddonData[] = [];
        if (page && page.Key) {
            // Delete the draft and upsert the page into Pages table.
            promises.push(this.deletePageDraft(page.Key));
            // Save the current page in pages table
            promises.push(this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).upsert(page));
        }

        return Promise.all(promises);
    }
}