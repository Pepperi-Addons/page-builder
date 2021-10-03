import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonDataScheme } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { TempBlankPageData } from './pages.model';

const PAGES_TABLE_NAME = 'Pages';
const DRAFT_PAGES_TABLE_NAME = 'PagesDrafts';

export class PagesApiService {
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
    
    // Get the page by the key.
    private async getPage(pagekey: string, tableName: string): Promise<Page | null> {
        try {
            let page = await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).key(pagekey).get() as Page;
            return Promise.resolve(page);
        } catch(err) {
            return Promise.resolve(null);
        }
    }

    // Hide the page (set hidden to true).
    private async hidePage(pagekey: string, tableName: string): Promise<boolean> {
        let res: any = null;
        
        let page = await this.getPage(pagekey, tableName);

        if (page) {
            page.Hidden = true;
            res = await this.upsertPage(page as Page, tableName);
        }
    
        return Promise.resolve(res !== null);
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

    async getPages(options): Promise<any[]> {
        // TODO: Change to pages endpoint after added in NGINX.
        // return this.papiClient.pages.find
        let pages: Page[] = await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).find(options) as Page[];
        let draftPages: Page[] = await this.papiClient.addons.data.uuid(this.addonUUID).table(DRAFT_PAGES_TABLE_NAME).find(options) as Page[];

        //  Add the pages into map for distinct them.
        const distinctPagesMap = new Map<string, Page>();
        pages.forEach(page => {
            distinctPagesMap.set(page.Key || '', page); // TODO: Key sould be mandatory.
        });
        draftPages.forEach(draftPage => {
            distinctPagesMap.set(draftPage.Key || '', draftPage); // TODO: Key sould be mandatory.
        });

        // Convert the map values to array.
        const distinctPagesArray = Array.from(distinctPagesMap.values());
        
        const promise = new Promise<any[]>((resolve, reject): void => {
            let allPages = distinctPagesArray.map((page: Page) => {
                // Return projection object.
                return {
                    Key: page.Key,
                    Name: page.Name,
                    Description: page.Description,
                    CreationDate: page.CreationDateTime,
                    ModificationDate: page.ModificationDateTime,
                    Status: draftPages.some(draft => draft.Key === page.Key) ? 'draft' : 'published',
                }
            });

            resolve(allPages);
        });

        return promise;
    }

    // Upsert page object if key not exist create new one.
    upsertPage(page: Page, tableName = DRAFT_PAGES_TABLE_NAME): Promise<Page | null> {
        let res: any;

        if (page) {
            if (!page.Key) {
                page.Key = uuid();
            }

            try {
                // TODO: Validate page object before upsert.
                res = this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page);
                return Promise.resolve(res);
            } catch(err) {
                return Promise.resolve(null);
            }
        } else {
            return Promise.resolve(null);
        }
    }

    createTemplatePage(query: any): Promise<Page | null> {
        const templateId = query['templateId'] || '';
        // TODO: Get the correct page by template (options.TemplateKey)
        const page: Page = TempBlankPageData;
        page.Key = '';
        return this.upsertPage(page);
    }

    async removePage(query: any): Promise<boolean> {
        const pagekey = query['key'] || '';
        
        let draftRes = await this.hidePage(pagekey, DRAFT_PAGES_TABLE_NAME);
        let res = await this.hidePage(pagekey, PAGES_TABLE_NAME);

        return Promise.resolve(draftRes || res);
    }

    async getPageBuilderData(query: any) {
        let res: any;
        const pagekey = query['key'] || '';
        
        if (pagekey) {
            // Get the page from the drafts.
            let page = await this.getPage(pagekey, DRAFT_PAGES_TABLE_NAME);

            // If there is no page in the drafts
            if (!page) {
                page = await this.getPage(pagekey, PAGES_TABLE_NAME);
            }

            // If page found get the available blocks by page type and return combined object.
            if (page) {
                page.Hidden = false;
                const pageType = page.Type || '';
                const availableBlocks = await this.getAvailableBlocks(pageType) || [];
                
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
    
    async restoreToLastPublish(query: any): Promise<boolean> {
        let res = false;
        const pagekey = query['key'];
        if (pagekey) {
            res = await this.hidePage(pagekey, DRAFT_PAGES_TABLE_NAME);
        } 

        return Promise.resolve(false);
    }

    async publishPage(page: Page): Promise<boolean> {
        let res = false;

        if (page && page.Key) {
            // Save the current page in pages table
            res = await this.upsertPage(page, PAGES_TABLE_NAME) != null;

            // Delete the draft.
            this.hidePage(page.Key, DRAFT_PAGES_TABLE_NAME);

        }

        return Promise.resolve(res);
    }
}