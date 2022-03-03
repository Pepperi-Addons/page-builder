import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonDataScheme, PageSection, SplitTypes, DataViewScreenSizes, PageBlock, PageSectionColumn, PageSizeTypes, PageLayout, Subscription, FindOptions, Relation } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { PageRowProjection, DEFAULT_BLANK_PAGE_DATA, IAvailableBlockData, IPageBuilderData, DEFAULT_BLOCKS_NUMBER_LIMITATION, DEFAULT_BLOCKS_SIZE_LIMITATION, IPagesVariable } from './pages.model';
import { PagesValidatorService } from './pages-validator.service';
import { v4 as uuidv4 } from 'uuid';

export const PAGES_TABLE_NAME = 'Pages';
export const DRAFT_PAGES_TABLE_NAME = 'PagesDrafts';
export const PAGES_VARIABLES_TABLE_NAME = 'PagesVariables';

export class PagesApiService {
    papiClient: PapiClient;
    addonUUID: string;
    pagesValidatorService: PagesValidatorService;

    constructor(client: Client) {
        this.addonUUID = client.AddonUUID;
        this.pagesValidatorService = new PagesValidatorService();

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

    private async getAvailableBlocks(): Promise<IAvailableBlockData[]> {
        // Get the PageBlock relations 
        const pageBlockRelations: NgComponentRelation[] = await this.getRelations('PageBlock');
                
        // Distinct the addons uuid's
        const distinctAddonsUuids = [...new Set(pageBlockRelations.map(obj => obj.AddonUUID))];

        // Get the installed addons (for the relative path and the current version)
        const addonsPromises: Promise<any>[] = [];
        distinctAddonsUuids.forEach((uuid: any) => {
            addonsPromises.push(this.getInstalledAddon(uuid))
        });

        const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);

        const availableBlocks: IAvailableBlockData[] = [];
        pageBlockRelations.forEach((relation: NgComponentRelation) => {
            const installedAddon: InstalledAddon | undefined = addons.find((ia: InstalledAddon) => ia?.Addon?.UUID === relation?.AddonUUID);
            if (installedAddon) {
                availableBlocks.push({
                    relation: relation,
                    addonPublicBaseURL: installedAddon.PublicBaseURL
                });
            }
        });

        return availableBlocks;
    }
    
    private async hidePage(pagekey: string, tableName: string): Promise<boolean> {
        let page = await this.getPage(pagekey, tableName);

        if (!page) {
            return Promise.reject(null);
        }

        page.Hidden = true;
        const res = await this.upsertPageInternal(page, tableName);
        return Promise.resolve(res != null);
    }

    private async upsertPageInternal(page: Page, tableName = PAGES_TABLE_NAME): Promise<Page> {
        if (!page) {
            return Promise.reject(null);
        }

        if (!page.Key) {
            page.Key = uuidv4();
        }
    
        // Validate page limitations before upsert.
        const pagesVariables = await this.getPagesVariables();
        this.pagesValidatorService.validatePageLimitations(page, pagesVariables);

        // Validate page object before upsert.
        this.pagesValidatorService.validatePageProperties(page);

        // Validate page blocks (check that the blocks are in the available blocks).
        const availableBlocks = await this.getAvailableBlocks();
        this.pagesValidatorService.validatePageData(page, availableBlocks);

        // Override the page according the interface.
        page = this.pagesValidatorService.getPageCopyAccordingInterface(page);

        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page) as Page;
    }

    private async deleteBlockFromPage(page: Page, addonUUID: string, tableName: string) {
        try {
            // Get the blocks to remove by the addon UUID
            const blocksToRemove = page.Blocks.filter(block => block.Relation.AddonUUID === addonUUID);

            if (blocksToRemove?.length > 0) {
                    console.log(`page blocks before - ${JSON.stringify(page.Blocks)}`);

                    // Remove the page blocks with the addonUUID
                    page.Blocks = page.Blocks.filter(block => block.Relation.AddonUUID !== addonUUID);

                    console.log(`page blocks after - ${JSON.stringify(page.Blocks)}`);

                    // Remove the blocks from the columns.
                    for (let sectioIndex = 0; sectioIndex < page.Layout.Sections.length; sectioIndex++) {
                        const section = page.Layout.Sections[sectioIndex];
                        
                        for (let columnIndex = 0; columnIndex < section.Columns.length; columnIndex++) {
                            const column = section.Columns[columnIndex];
                            
                            if (column.BlockContainer && blocksToRemove.some(btr => btr.Key === column.BlockContainer?.BlockKey)) {
                                console.log(`delete block with the key - ${JSON.stringify(column.BlockContainer.BlockKey)}`);
                                delete column.BlockContainer;
                            }
                        }
                    }

                    // Update the page
                    await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page);
            }
        } catch (err) {
            console.log(`err - ${JSON.stringify(err)}`);
            // Do nothing.
        }
    }

    private getAddonUUID(installedAddonUUID: string): Promise<string | undefined>  {
        // need to use where clause b/c currently there is no endpoint for
        // retrieving an installed addon by UUID
        return this.papiClient.addons.installedAddons
            .find({
                where: `UUID = '${installedAddonUUID}'`,
                include_deleted: true,
            })
            .then((res) => res[0]?.Addon.UUID || undefined);
    }

    private async getPagesVariables(options: FindOptions | undefined = undefined) {
        const pagesVariables = await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_VARIABLES_TABLE_NAME).find(options) as Array<IPagesVariable> || [];

        // Add default blocks number limitations if not exist
        if (!pagesVariables.find(pv => pv.Key === DEFAULT_BLOCKS_NUMBER_LIMITATION.key)) {
            pagesVariables.push({
                Key: DEFAULT_BLOCKS_NUMBER_LIMITATION.key,
                Value: DEFAULT_BLOCKS_NUMBER_LIMITATION.softValue.toString(),
            });
        }

        // Add default blocks size limitations if not exist
        if (!pagesVariables.find(pv => pv.Key === DEFAULT_BLOCKS_SIZE_LIMITATION.key)) {
            pagesVariables.push({
                Key: DEFAULT_BLOCKS_SIZE_LIMITATION.key,
                Value: DEFAULT_BLOCKS_SIZE_LIMITATION.softValue.toString(),
            });
        }

        return pagesVariables;
    }

    /***********************************************************************************************/
    /*                                  Protected functions
    /***********************************************************************************************/

    protected async getPagesFrom(tableName: string, options: FindOptions | undefined = undefined): Promise<Page[]> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).find(options) as Page[];
    }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/
    // async getAddonUUID(installedAddonUUID: string) : Promise<string | undefined> {
    //     const installedAddon = await this.papiClient.addons.installedAddons.uuid(installedAddonUUID).get();
    //     return installedAddon?.Addon.UUID || undefined;
    // }
    
    async getPage(pagekey: string, tableName: string = PAGES_TABLE_NAME): Promise<Page> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).key(pagekey).get() as Page;
    }

    async createPagesTablesSchemes(): Promise<AddonDataScheme[]> {
        const promises: AddonDataScheme[] = [];
        
        // Create pages table
        const createPagesTable = await this.papiClient.addons.data.schemes.post({
            Name: PAGES_TABLE_NAME,
            Type: 'cpi_meta_data'
        });

        // Create pages draft table
        const createPagesDraftTable = await this.papiClient.addons.data.schemes.post({
            Name: DRAFT_PAGES_TABLE_NAME,
            Type: 'meta_data',
        });

        // Create pages variables table
        const createPagesVariablesTable = await this.papiClient.addons.data.schemes.post({
            Name: PAGES_VARIABLES_TABLE_NAME,
            Type: 'meta_data',
            Fields: {
                Key: {
                    Type: 'String'
                },
                Value: {
                    Type: 'String'
                },
            }
        });

        promises.push(createPagesTable);
        promises.push(createPagesDraftTable);
        promises.push(createPagesVariablesTable);
        return Promise.all(promises);
    }

    async createPagesRelations(): Promise<any> {
        // Create new var settings relation.
        const varSettingsRelation: Relation = {
            RelationName: 'VarSettings',
            Name: PAGES_VARIABLES_TABLE_NAME,
            Description: 'Set pages variables from var settings',
            Type: 'AddonAPI',
            SubType: 'NG11',
            AddonUUID: this.addonUUID,
            AddonRelativeURL: '/api/set_pages_variable',
            Title: 'Pages variables', // The title of the tab in which the fields will appear
            Fields: [{
                Id: DEFAULT_BLOCKS_NUMBER_LIMITATION.key,
                Label: 'Blocks number limitation',
                PepComponent: 'textbox',
                Type: 'int'
            }, {
                Id: DEFAULT_BLOCKS_SIZE_LIMITATION.key,
                Label: 'Blocks size limitation',
                PepComponent: 'textbox',
                Type: 'int'
            }],             
        };                

        return await this.papiClient.post('/addons/data/relations', varSettingsRelation);
    }

    async getPages(options: FindOptions | undefined = undefined): Promise<Page[]> {
        return await this.getPagesFrom(PAGES_TABLE_NAME, options);
    }

    savePage(page: Page): Promise<Page> {
        return this.upsertPageInternal(page, PAGES_TABLE_NAME);
    }

    async saveDraftPage(page: Page): Promise<Page>  {
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    }

    createTemplatePage(query: any): Promise<Page> {
        const templateId = query['templateId'] || '';
        // TODO: Get the correct page by template (options.TemplateKey)
        const page: Page = DEFAULT_BLANK_PAGE_DATA;
        page.Key = '';
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    }

    async removePage(query: any): Promise<boolean> {
        const pagekey = query['key'] || '';
        
        let draftRes = false;
        try {
            draftRes = await this.hidePage(pagekey, DRAFT_PAGES_TABLE_NAME);
        } catch (e) {

        }

        let res = false;
        try {
            res = await this.hidePage(pagekey, PAGES_TABLE_NAME);
        } catch (e) {
            
        }

        return Promise.resolve(draftRes || res);
    }

    async getPagesData(options: FindOptions | undefined = undefined): Promise<PageRowProjection[]> {
        let pages: Page[] = await this.getPagesFrom(PAGES_TABLE_NAME, options);
        let draftPages: Page[] = await this.getPagesFrom(DRAFT_PAGES_TABLE_NAME, options);

        //  Add the pages into map for distinct them.
        const distinctPagesMap = new Map<string, Page>();
        pages.forEach(page => {
            if (page.Key) {
                distinctPagesMap.set(page.Key, page);
            }
        });
        draftPages.forEach(draftPage => {
            if (draftPage.Key) {
                distinctPagesMap.set(draftPage.Key, draftPage);
            }
        });

        // Convert the map values to array.
        const distinctPagesArray = Array.from(distinctPagesMap.values());
        
        const promise = new Promise<any[]>((resolve, reject): void => {
            let allPages = distinctPagesArray.map((page: Page) => {
                // Return projection object.
                const prp: PageRowProjection = {
                    Key: page.Key,
                    Name: page.Name,
                    Description: page.Description,
                    CreationDate: page.CreationDateTime,
                    ModificationDate: page.ModificationDateTime,
                    Status: draftPages.some(draft => draft.Key === page.Key) ? 'draft' : 'published',
                };

                return prp;
            });

            resolve(allPages);
        });

        return promise;
    }

    async getPageData(query: any, lookForDraft = false): Promise<IPageBuilderData> {
        let res: any;
        const pageKey = query['key'] || '';
        
        if (pageKey) {
            let page;
            
            // If lookForDraft try to get the page from the draft first.
            if (lookForDraft) {
                try {
                    // Get the page from the drafts.
                    page = await this.getPage(pageKey, DRAFT_PAGES_TABLE_NAME);
                } catch {
                    // Do nothing
                }
            }

            // If there is no page in the drafts
            if (!page || page.Hidden) {
                page = await this.getPage(pageKey, PAGES_TABLE_NAME);
            }

            // If page found get the available blocks return combined object.
            if (page) {
                const availableBlocks = await this.getAvailableBlocks() || [];
                const pagesVariables = await this.getPagesVariables() || [];

                res = {
                    page, 
                    availableBlocks,
                    pagesVariables
                };
            }
        }

        const promise = new Promise<IPageBuilderData>((resolve, reject): void => {
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

        return Promise.resolve(res);
    }

    async publishPage(page: Page): Promise<boolean> {
        let res = false;

        if (page && page.Key) {
            // Save the current page in pages table
            res = await this.upsertPageInternal(page, PAGES_TABLE_NAME) != null;

            if (res) {
                // Delete the draft.
                res = await this.hidePage(page.Key, DRAFT_PAGES_TABLE_NAME);
            }
        }

        return Promise.resolve(res);
    }
    
    /***********************************************************************************************/
    //                              Pages variables Public functions
    /************************************************************************************************/

    async savePagesVariable(pagesVariable: IPagesVariable) {
        const valueAsNumber = Number(pagesVariable.Value);

        if (!isNaN(valueAsNumber)) {
            let canSaveVariable = false;
            
            if (pagesVariable.Key === DEFAULT_BLOCKS_NUMBER_LIMITATION.key) {
                if (valueAsNumber >= 1 && valueAsNumber <= DEFAULT_BLOCKS_NUMBER_LIMITATION.hardValue) {
                    canSaveVariable = true;
                } else {
                    throw new Error(`${valueAsNumber} is in the range (1 - ${DEFAULT_BLOCKS_NUMBER_LIMITATION.hardValue}).`);
                }
            } else if (pagesVariable.Key === DEFAULT_BLOCKS_SIZE_LIMITATION.key) {
                if (valueAsNumber >= 1 && valueAsNumber <= DEFAULT_BLOCKS_SIZE_LIMITATION.hardValue) {
                    canSaveVariable = true;
                } else {
                    throw new Error(`${valueAsNumber} is in the range (1 - ${DEFAULT_BLOCKS_SIZE_LIMITATION.hardValue}).`);
                }
            }

            if (canSaveVariable) {
                return this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_VARIABLES_TABLE_NAME).upsert(pagesVariable);
            }
        } else {
            throw new Error(`${valueAsNumber} is not a number.`);
        }
    }

    /***********************************************************************************************/
    //                              PNS Public functions
    /************************************************************************************************/
    async subscribeUninstallAddons(key: string, functionPath: string): Promise<Subscription> {
        return await this.papiClient.notification.subscriptions.upsert({
            Key: key,
            AddonUUID: this.addonUUID,
            AddonRelativeURL: functionPath,
            Type: 'data',
            Name: key,
            FilterPolicy: {
                Action: ['update'],
                ModifiedFields: ['Hidden'],
                Resource: ['installed_addons'],
                AddonUUID: ['00000000-0000-0000-0000-000000000a91']
            }
        });
    }
    
    async unsubscribeUninstallAddons(key: string, functionPath: string): Promise<Subscription> {
        return await this.papiClient.notification.subscriptions.upsert({
            Hidden: true,
            Key: key,
            AddonUUID: this.addonUUID,
            AddonRelativeURL: functionPath,
            Type: 'data',
            Name: key,
            FilterPolicy: {}
        });
    }

    async deleteBlockFromPages(body: any, draft = false): Promise<void> {
        const obj = body?.Message?.ModifiedObjects[0];
        console.log(`obj - ${obj}`);
        
        if (obj) {
            // If the field id is hidden AND the value is true (this block is uninstalled)
            if (obj.ModifiedFields?.filter(field => field.FieldID === 'Hidden' && field.NewValue === true)) {
                console.log(`obj.ObjectKey - ${obj.ObjectKey}`);
                const addonUUID = await this.getAddonUUID(obj.ObjectKey);

                console.log(`addonUUID - ${addonUUID}`);

                if (addonUUID) {
                    const tableName = draft ? DRAFT_PAGES_TABLE_NAME : PAGES_TABLE_NAME;
                    console.log(`tableName - ${tableName}`);

                    let pages = await this.getPagesFrom(tableName);
                    
                    console.log(`pages length - ${pages.length}`);

                    // Delete the blocks with this addonUUID from al the pages.
                    for (let index = 0; index < pages.length; index++) {
                        const page = pages[index];
                        console.log(`page before - ${JSON.stringify(page)}`);

                        await this.deleteBlockFromPage(page, addonUUID, tableName);

                        console.log(`page after - ${JSON.stringify(page)}`);
                    }
                }
            }
        }
    }
}