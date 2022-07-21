import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonDataScheme, Subscription, FindOptions, Relation, FormDataView } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import { PageRowProjection, DEFAULT_BLANK_PAGE_DATA, IBlockLoaderData, IPageBuilderData, DEFAULT_BLOCKS_NUMBER_LIMITATION, DEFAULT_PAGE_SIZE_LIMITATION, BlockDataType, DEFAULT_PAGES_DATA } from './pages.model';
import { PagesValidatorService } from './pages-validator.service';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
const path = require("path");
const { readFileSync } = require('fs');

export const PAGES_TABLE_NAME = 'Pages';
export const DRAFT_PAGES_TABLE_NAME = 'PagesDrafts';
export const PAGES_VARIABLES_TABLE_NAME = 'PagesVariables';

const bundleFileName = 'page_builder';
export class PagesApiService {
    papiClient: PapiClient;
    addonUUID: string;
    pagesValidatorService: PagesValidatorService;
    assetsBaseUrl: string;

    constructor(client: Client) {
        this.addonUUID = client.AddonUUID;
        this.pagesValidatorService = new PagesValidatorService();
        this.assetsBaseUrl = client.AssetsBaseUrl;

        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
    }

    private getRelations(relationName: string): Promise<any> {
        return this.papiClient.addons.data.relations.find({where: `RelationName=${relationName}`});
    }
    
    private createAddonBlockRelation() {
        const name = 'Pages';
        const blockName = 'PageBuilder';

        const addonBlockRelation: Relation = {
            RelationName: "AddonBlock",
            Name: name,
            Description: `${name} addon block`,
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.addonUUID,
            AddonRelativeURL: bundleFileName,
            ComponentName: `${blockName}Component`,
            ModuleName: `${blockName}Module`,
        }; 
        
        this.upsertRelation(addonBlockRelation);
    }

    private createSettingsRelation() {
        const settingsName = 'Settings';

        const settingsBlockRelation: Relation = {
            RelationName: "SettingsBlock",
            GroupName: 'Pages',
            Name: 'Pages',
            Description: 'Page Builder (Beta)',
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.addonUUID,
            AddonRelativeURL: bundleFileName,
            ComponentName: `${settingsName}Component`,
            ModuleName: `${settingsName}Module`,
        }; 
        
        this.upsertRelation(settingsBlockRelation);
    }

    private getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    private async getAvailableBlocks(): Promise<IBlockLoaderData[]> {
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

        const availableBlocks: IBlockLoaderData[] = [];
        pageBlockRelations.forEach((relation: NgComponentRelation) => {
            const installedAddon: InstalledAddon | undefined = addons.find((ia: InstalledAddon) => ia?.Addon?.UUID === relation?.AddonUUID);
            if (installedAddon) {
                availableBlocks.push({
                    relation: relation,
                    addonPublicBaseURL: installedAddon.PublicBaseURL,
                    addon: installedAddon
                });
            }
        });

        return availableBlocks;
    }

    private async hidePage(page: Page, tableName: string): Promise<boolean> {
        if (!page) {
            return Promise.reject(null);
        }

        page.Hidden = true;
        const res = await this.upsertPageInternal(page, tableName);
        return Promise.resolve(res != null);
    }

    private async validateAndOverridePageAccordingInterface(page: Page, validatePagesLimit: boolean): Promise<Page> {
        // Validate pages limit number.
        if (validatePagesLimit) {
            const publishedPages = await this.getPages();
            this.pagesValidatorService.validatePagesLimitNumber(page, publishedPages);
        }

        // Validate page object before upsert.
        this.pagesValidatorService.validatePageProperties(page);

        // Validate page limitations before upsert.
        const pagesVariables = await this.getPagesVariablesInternal();
        this.pagesValidatorService.validatePageLimitations(page, pagesVariables);

        // Validate page blocks (check that the blocks are in the available blocks).
        const availableBlocks = await this.getAvailableBlocks();
        this.pagesValidatorService.validatePageData(page, availableBlocks);

        // Override the page according the interface.
        return this.pagesValidatorService.getPageCopyAccordingInterface(page, availableBlocks);
    }

    private async upsertPageInternal(page: Page, tableName = PAGES_TABLE_NAME): Promise<Page> {
        if (!page) {
            return Promise.reject(null);
        }

        if (!page.Key) {
            page.Key = uuidv4();
        }

        // Validate page object before upsert.
        page = await this.validateAndOverridePageAccordingInterface(page, tableName === PAGES_TABLE_NAME);
        
        return this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page) as Promise<Page>;
    }

    private async getPagesVariablesInternal(options: FindOptions | undefined = undefined): Promise<any> {
        // Get the pages variables
        let pagesVariables;

        try {
            pagesVariables = await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_VARIABLES_TABLE_NAME).key(PAGES_VARIABLES_TABLE_NAME).get();
        } catch {
            // Declare default.
            pagesVariables = { Key: PAGES_VARIABLES_TABLE_NAME };
        }

        // If not exist add the default value of the blocks number limitation.
        if (!pagesVariables.hasOwnProperty(DEFAULT_BLOCKS_NUMBER_LIMITATION.key)) {
            pagesVariables[DEFAULT_BLOCKS_NUMBER_LIMITATION.key] = DEFAULT_BLOCKS_NUMBER_LIMITATION.softValue;
        }

        // If not exist add the default value of the page size limitation.
        if (!pagesVariables.hasOwnProperty(DEFAULT_PAGE_SIZE_LIMITATION.key)) {
            pagesVariables[DEFAULT_PAGE_SIZE_LIMITATION.key] = DEFAULT_PAGE_SIZE_LIMITATION.softValue;
        }

        return pagesVariables;
    }
    
    private upsertRelation(relation): Promise<any> {
        return this.papiClient.post('/addons/data/relations', relation);
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
    
    async getPage(pagekey: string, tableName: string = PAGES_TABLE_NAME): Promise<Page> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).key(pagekey).get() as Page;
    }

    async createPagesTablesSchemes(): Promise<AddonDataScheme[]> {
        const promises: AddonDataScheme[] = [];
        
        const DIMXSchema = {
            Blocks: {
                Type: "Array",
                Items: {
                    Type: "Object",
                    Fields: {
                        Configuration: {
                            Type: "ContainedDynamicResource"
                        }
                    }
                }
            },
        };

        // Create pages table
        const createPagesTable = await this.papiClient.addons.data.schemes.post({
            Name: PAGES_TABLE_NAME,
            Type: 'meta_data',
        });
        
        // Create pages draft table
        const createPagesDraftTable = await this.papiClient.addons.data.schemes.post({
            Name: DRAFT_PAGES_TABLE_NAME,
            Type: 'meta_data',
            Fields: DIMXSchema as any // Declare the schema for the import & export.
        });

        // Create pages variables table
        const createPagesVariablesTable = await this.papiClient.addons.data.schemes.post({
            Name: PAGES_VARIABLES_TABLE_NAME,
            Type: 'meta_data',
            Fields: {
                Key: {
                    Type: 'String'
                }
            }
        });

        promises.push(createPagesTable);
        promises.push(createPagesDraftTable);
        promises.push(createPagesVariablesTable);
        return Promise.all(promises);
    }

    createPagesRelations(): void {
        this.createVarSettingsRelation();
        this.createImportRelation();
        this.createExportRelation();
        this.createAddonBlockRelation();
        this.createSettingsRelation();
    }

    async getPages(options: FindOptions | undefined = undefined): Promise<Page[]> {
        return await this.getPagesFrom(PAGES_TABLE_NAME, options);
    }

    // savePage(page: Page): Promise<Page> {
    //     return this.upsertPageInternal(page, PAGES_TABLE_NAME);
    // }

    saveDraftPage(page: Page): Promise<Page>  {
        page.Hidden = false;
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    }

    async createTemplatePage(query: any): Promise<Page> {
        const templateFileName = query['templateFileName'] || '';
        const pageNum = query['pageNum'] || '0';
        
        let page;
        try {
            // For production.
            // const url = path.join(this.assetsBaseUrl.replace('assets', 'template_pages'), `${templateFileName}.json`);
            // const response = await fetch(url);
            // const textData:string = await response.text();
            // const page = JSON.parse(textData);

            // For local dev server
            // const filePath = path.join(process.cwd(), `template_pages/${templateFileName}.json`);
            // let buffer = readFileSync(filePath);
            // page = JSON.parse(buffer);

            page = DEFAULT_PAGES_DATA[templateFileName];

            console.log(page);
        } catch (error) {
            console.log(error);
            // If file is not exist or some other reson.
            page = JSON.parse(JSON.stringify(DEFAULT_BLANK_PAGE_DATA)) ;
        }

        page.Name = `${page.Name} ${pageNum}`;
        page.Description = `${page.Description} ${pageNum}`;

        page.Key = '';
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    }

    async removePage(query: any): Promise<boolean> {
        const pagekey = query['key'] || '';
        
        let draftRes = false;
        let res = false;

        if (pagekey.length > 0) {
            try {
                let page = await this.getPage(pagekey, DRAFT_PAGES_TABLE_NAME);
                draftRes = await this.hidePage(page, DRAFT_PAGES_TABLE_NAME);
            } catch (e) {
            }
    
            try {
                let page = await this.getPage(pagekey, PAGES_TABLE_NAME);
                res = await this.hidePage(page, PAGES_TABLE_NAME);
            } catch (e) {
            }
        }

        return Promise.resolve(draftRes || res);
    }

    async getPagesData(options: FindOptions | undefined = undefined): Promise<PageRowProjection[]> {
        let pages: Page[] = await this.getPagesFrom(PAGES_TABLE_NAME);
        let draftPages: Page[] = await this.getPagesFrom(DRAFT_PAGES_TABLE_NAME);

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
        let distinctPagesArray = Array.from(distinctPagesMap.values());
        
        // Filter.
        if (options?.where !== undefined && options?.where?.length > 0) {
            const searchString = options?.where;
            distinctPagesArray = distinctPagesArray.filter(page => page.Name?.includes(searchString) || page.Description?.includes(searchString))
        }

        const promise = new Promise<any[]>((resolve, reject): void => {
            let allPages = distinctPagesArray.map((page: Page) => {
                const isPublished = pages.some(published => published.Key === page.Key);
                const draftPage = draftPages.find(draft => draft.Key === page.Key);
                const isDraft = draftPage != null && !draftPage.Hidden;

                // Return projection object.
                const prp: PageRowProjection = {
                    Key: page.Key,
                    Name: page.Name,
                    Description: page.Description,
                    CreationDate: page.CreationDateTime,
                    ModificationDate: page.ModificationDateTime,
                    Published: isPublished,
                    Draft: isDraft
                    // Status: draftPages.some(draft => draft.Key === page.Key) ? 'draft' : 'published',
                };

                return prp;
            });

            // Sort.
            if (options?.order_by !== undefined && options?.order_by?.length > 0) {
                const orderByArr = options?.order_by.split(' ');
                const orderBy = orderByArr[0] || 'Name';
                const isAsc = orderByArr.length === 2 ? orderByArr[1] === 'ASC' : true;

                allPages = allPages.sort((p1, p2) =>
                    p1[orderBy] > p2[orderBy] ? 
                        (isAsc ? 1 : -1) : 
                        (p1[orderBy] < p2[orderBy] ? (isAsc ? -1 : 1) : 0)
                );
            }

            resolve(allPages);
        });

        return promise;
    }

    async getPageData(query: any, lookForDraft = false): Promise<IPageBuilderData> {
        let res: any;
        const pageKey = query['key'] || '';
        
        if (pageKey) {
            let page;
            
            // If lookForDraft try to get the page from the draft first (for runtime the lookForDraft will be false).
            if (lookForDraft) {
                try {
                    // Get the page from the drafts.
                    page = await this.getPage(pageKey, DRAFT_PAGES_TABLE_NAME);
                } catch {
                    // Do nothing
                }
            }

            const dataPromises: Promise<any>[] = [];
            dataPromises.push(this.getAvailableBlocks());
            dataPromises.push(this.getPagesVariablesInternal());
            
            // If draft is hidden or not exist add call to bring the publish page.
            if (!page || page.Hidden) {
                dataPromises.push(this.getPage(pageKey, PAGES_TABLE_NAME));
            }
                
            const arr = await Promise.all(dataPromises).then(res => res);

            res = {
                availableBlocks: arr[0] || [],
                pagesVariables: arr[1] || [],
                page: arr.length > 2 ? arr[2] : page, // Get the publish page if exist in the array cause we populate it only if the draft is hidden or not exist.
            }
        }

        const promise = new Promise<IPageBuilderData>((resolve, reject): void => {
            resolve(res);
        });

        return promise;
    }
    
    async restoreToLastPublish(query: any): Promise<Page> {
        const pagekey = query['key'];

        if (pagekey) {
            let page = await this.getPage(pagekey, PAGES_TABLE_NAME);

            // In case that the page was never published.
            if (!page) {
                page = await this.getPage(pagekey, DRAFT_PAGES_TABLE_NAME);
                return this.publishPage(page);
            } else {
                const pageCopy = JSON.parse(JSON.stringify(page));
                await this.hidePage(pageCopy, DRAFT_PAGES_TABLE_NAME);
                return pageCopy;
            }
        }
        
        return Promise.reject(null);
    }

    async publishPage(page: Page): Promise<Page> {
        let res: Page | null = null;

        if (page) {
            // Save the current page in pages table
            res = await this.upsertPageInternal(page, PAGES_TABLE_NAME);

            // Update the draft page and hide it.
            if (res != null) {
                const pageCopy = JSON.parse(JSON.stringify(page));
                this.hidePage(pageCopy, DRAFT_PAGES_TABLE_NAME);
            }
            
            return Promise.resolve(res);
        }

        return Promise.reject(null);
    }
    
    /***********************************************************************************************/
    //                              VarSettings functions
    /************************************************************************************************/
    
    private createVarSettingsRelation(): void {
        const title = 'Pages variables'; // The title of the tab in which the fields will appear;
        const dataView: FormDataView = {
            Type: 'Form',
            Context: {
                Object: {
                    Resource: "None",
                    InternalID: 1,
                },
                Name: 'Pages variables data view',
                ScreenSize: 'Tablet',
                Profile: {
                    InternalID: 1,
                    Name: 'MyProfile'
                }
            },
            Fields: [{
                FieldID: DEFAULT_BLOCKS_NUMBER_LIMITATION.key,
                Type: 'NumberInteger',
                Title: 'Blocks number limitation',
                Mandatory: false,
                ReadOnly: false,
                Layout: {
                    Origin: {
                        X: 0,
                        Y: 0
                    },
                    Size: {
                        Width: 1,
                        Height: 0
                    }
                },
                Style: {
                    Alignment: {
                        Horizontal: 'Stretch',
                        Vertical: 'Stretch'
                    }
                }
            }, {
                FieldID: DEFAULT_PAGE_SIZE_LIMITATION.key,
                Type: 'NumberInteger',
                Title: 'Blocks size limitation',
                Mandatory: false,
                ReadOnly: false,
                Layout: {
                    Origin: {
                        X: 0,
                        Y: 1
                    },
                    Size: {
                        Width: 1,
                        Height: 0
                    }
                },
                Style: {
                    Alignment: {
                        Horizontal: 'Stretch',
                        Vertical: 'Stretch'
                    }
                }
            }]
        };
        
        // Create new var settings relation.
        const varSettingsRelation: Relation = {
            RelationName: 'VarSettings',
            Name: PAGES_VARIABLES_TABLE_NAME,
            Description: 'Set pages variables from var settings',
            Type: 'AddonAPI',
            AddonUUID: this.addonUUID,
            AddonRelativeURL: '/api/pages_variables',
            Title: title,
            DataView: dataView
        };                

        this.upsertRelation(varSettingsRelation);
    }

    async savePagesVariables(varSettingsParams: any) {
        const blocksNumberLimitationValue = Number(varSettingsParams[DEFAULT_BLOCKS_NUMBER_LIMITATION.key]);
        const pageSizeLimitationValue = Number(varSettingsParams[DEFAULT_PAGE_SIZE_LIMITATION.key]);

        if (!isNaN(blocksNumberLimitationValue) && !isNaN(pageSizeLimitationValue)) {
            if (blocksNumberLimitationValue < 1 || blocksNumberLimitationValue > DEFAULT_BLOCKS_NUMBER_LIMITATION.hardValue) {
                throw new Error(`${DEFAULT_BLOCKS_NUMBER_LIMITATION.key} should be in the range (1 - ${DEFAULT_BLOCKS_NUMBER_LIMITATION.hardValue}).`);
            }
        
            if (pageSizeLimitationValue < 1 || pageSizeLimitationValue > DEFAULT_PAGE_SIZE_LIMITATION.hardValue) {
                throw new Error(`${DEFAULT_PAGE_SIZE_LIMITATION.key} should be in the range (1 - ${DEFAULT_PAGE_SIZE_LIMITATION.hardValue}).`);
            }
        
            // Save the key on the object for always work on the same object.
            varSettingsParams['Key'] = PAGES_VARIABLES_TABLE_NAME;
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_VARIABLES_TABLE_NAME).upsert(varSettingsParams);
        } else {
            let nanVariableName = isNaN(blocksNumberLimitationValue) ? DEFAULT_BLOCKS_NUMBER_LIMITATION.key : DEFAULT_PAGE_SIZE_LIMITATION.key;
            throw new Error(`${nanVariableName} is not a number.`);
        }
    }

    async getPagesVariables(options: FindOptions | undefined = undefined): Promise<any> {
        return await this.getPagesVariablesInternal(options);
    }

    /***********************************************************************************************/
    //                              Import & Export functions
    /************************************************************************************************/
    
    private createImportRelation(): void {
        const importRelation: Relation = {
            RelationName: 'DataImportResource',
            Name: DRAFT_PAGES_TABLE_NAME,
            Description: 'Pages import',
            Type: 'AddonAPI',
            AddonUUID: this.addonUUID,
            AddonRelativeURL: '/internal_api/draft_pages_import', // '/api/pages_import',
            MappingRelativeURL: ''// '/internal_api/draft_pages_import_mapping', // '/api/pages_import_mapping',
        };                

        this.upsertRelation(importRelation);
    }

    private createExportRelation(): void {
        const exportRelation: Relation = {
            RelationName: 'DataExportResource',
            Name: DRAFT_PAGES_TABLE_NAME,
            Description: 'Pages export',
            Type: 'AddonAPI',
            AddonUUID: this.addonUUID,
            AddonRelativeURL: '/internal_api/draft_pages_export', // '/api/pages_export',
        };                

        this.upsertRelation(exportRelation);
    }

    private async getDIMXResult(body: any, isImport: boolean): Promise<any> {
        // Validate the pages.
        if (body.DIMXObjects?.length > 0) {
            console.log('@@@@@@@@ getDIMXResult - enter ', JSON.stringify(body));
            console.log('@@@@@@@@ getDIMXResult - isImport = ', isImport);

            for (let index = 0; index < body.DIMXObjects.length; index++) {
                const dimxObject = body.DIMXObjects[index];
                try {
                    const page = await this.validateAndOverridePageAccordingInterface(dimxObject['Object'], isImport);
                    
                    // For import always generate new Key and set the Hidden to false.
                    if (isImport) {
                        page.Key = uuidv4(); // This step happans in the importMappingPages function
                        page.Hidden = false;
                    }
                    dimxObject['Object'] = page;
                } catch (err) {
                    // Set the error on the page.
                    dimxObject['Status'] = 'Error';
                    dimxObject['Details'] = err;
                }
            }

            console.log('@@@@@@@@ getDIMXResult - exit ', JSON.stringify(body));
        }
        
        return body;
    }

    async importPages(body: any, draft = true): Promise<any> {
        console.log('@@@@@@@@ importPages - before getDIMXResult');

        const res = await this.getDIMXResult(body, true);
        
        console.log('@@@@@@@@ importPages - after getDIMXResult');

        return res;
    }

    // NOTE: This function is not used TBD.
    async importMappingPages(body: any, draft = true): Promise<any> {
        const res = {};
        
        // Change the page key to a new one.
        if (body.Objects?.length > 0) {
            body.Objects.forEach((page: Page) => {
                if (page.Key) {
                    res[page.Key] = {
                        Action: 'Replace',
                        NewKey: uuidv4()
                    };
                }
            });
        }

        return res;
    }
    
    async exportPages(body: any, draft = true): Promise<any> {
        const res = await this.getDIMXResult(body, false);
        return res;
    }

    /***********************************************************************************************/
    //                              PNS functions
    /************************************************************************************************/
    
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

                    // Delete the blocks with this addonUUID from all the pages.
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
    
    /***********************************************************************************************/
    //                              Addon block data Public functions
    /************************************************************************************************/
    
    async getBlockLoaderData(name: string, blockType: BlockDataType): Promise<IBlockLoaderData> {
        const promise = new Promise<IBlockLoaderData>(async (resolve, reject) => {
            // Get the addon blocks relations 
            const addonBlockRelations: NgComponentRelation[] = await this.papiClient.addons.data.relations.find({where: `RelationName=${blockType} AND Name=${name}`});
            
            if (addonBlockRelations.length > 0) {
                const addonBlockRelation: NgComponentRelation = addonBlockRelations[0];
                const installedAddon: InstalledAddon | undefined = await this.getInstalledAddon(addonBlockRelation.AddonUUID);
                if (installedAddon) {
                    resolve({
                        relation: addonBlockRelation,
                        addonPublicBaseURL: installedAddon.PublicBaseURL,
                        addon: installedAddon
                    });
                }
            }
        
            reject(null);
        });

        return promise;
    }
}