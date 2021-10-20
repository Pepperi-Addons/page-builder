import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonDataScheme, PageSection, SplitTypes, DataViewScreenSizes, PageBlock, PageSectionColumn } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { TempBlankPageData } from './pages.model';

const PAGES_TABLE_NAME = 'Pages';
const DRAFT_PAGES_TABLE_NAME = 'PagesDrafts';

// TODO: Use it from the papi-sdk
const PageSizeTypes = [
    'SM',
    'MD',
    'LG',
];

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
    private async getPage(pagekey: string, tableName: string): Promise<Page> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).key(pagekey).get() as Page;
    }

    // Hide the page (set hidden to true).
    private async hidePage(pagekey: string, tableName: string): Promise<boolean> {
        let page = await this.getPage(pagekey, tableName);

        if (page) {
            page.Hidden = true;
            await this.upsertPageInternal(page, tableName);
            return Promise.resolve(true);
        }
    
        return Promise.resolve(false);
    }

    private upsertPageInternal(page: Page, tableName = PAGES_TABLE_NAME): Promise<Page> {
        let res: any;

        if (page) {
            if (!page.Key) {
                page.Key = uuid();
            }

            // Validate page object before upsert.
            this.validatePage(page);
            page = this.getPageAccordingInterface(page);

            res = this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page);
            return Promise.resolve(res);
        } else {
            return Promise.reject(null);
        }
    }

    private getNotExistError(objectBreadcrumb: string, propertyName: string) {
        return `${objectBreadcrumb} -> ${propertyName} is missing.`;
    }
    
    private getWrongTypeError(objectBreadcrumb: string, propertyName: string, typeName: string) {
        return `${objectBreadcrumb} -> ${propertyName} should be ${typeName}.`;
    }

    private validatePageBlock(pagePropertyBreadcrumb: string, block: PageBlock, blockIndex: number): void {
        const blocksPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Blocks at index ${blockIndex}`;

        // Validate Key
        if (!block.hasOwnProperty('Key')) {
            throw new Error(this.getNotExistError(blocksPropertyBreadcrumb, 'Key'));
        } else if (typeof block.Key !== 'string') {
            throw new Error(this.getWrongTypeError(blocksPropertyBreadcrumb, 'Key', 'string'));
        }

        // Validate Relation
        if (!block.hasOwnProperty('Relation')) {
            throw new Error(this.getNotExistError(blocksPropertyBreadcrumb, 'Relation'));
        } else if (typeof block.Relation !== 'object') {
            throw new Error(this.getWrongTypeError(blocksPropertyBreadcrumb, 'Relation', 'NgComponentRelation object'));
        } else {
            // TODO: Validate Relation properties.
        }
        
        // Validate Configuration if exist (Optional)
        if (block.hasOwnProperty('Configuration')) {
            if (typeof block.Configuration !== 'object') {
                throw new Error(this.getWrongTypeError(blocksPropertyBreadcrumb, 'Configuration', 'object'));
            }
        }
        
        // Validate PageConfiguration if exist (Optional)
        if (block.hasOwnProperty('PageConfiguration')) {
            if (typeof block.PageConfiguration !== 'object') {
                throw new Error(this.getWrongTypeError(blocksPropertyBreadcrumb, 'PageConfiguration', 'PageConfiguration object'));
            } else {
                // TODO: Validate PageConfiguration properties.

            }
        }
    }

    private validatePageSectionColumnBlock(sectionsPropertyBreadcrumb: string, sectionColumn: PageSectionColumn): void {
        const blockPropertyBreadcrumb = `${sectionsPropertyBreadcrumb} -> Block`;
        
        // Validate Block if exist (Optional)
        if (sectionColumn.hasOwnProperty('Block')) {
            if (!sectionColumn.Block) {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Block', 'PageSectionBlock object'));
            } else {
                // Validate BlockKey in Block
                if (!sectionColumn.Block.hasOwnProperty('BlockKey')) {
                    throw new Error(this.getNotExistError(blockPropertyBreadcrumb, 'BlockKey'));
                } else if (typeof sectionColumn.Block.BlockKey !== 'string') {
                    throw new Error(this.getWrongTypeError(blockPropertyBreadcrumb, 'BlockKey', 'string'));
                }
    
                // Validate Hide in Block if exist (Optional)
                if (sectionColumn.Block.hasOwnProperty('Hide')) {
                    if (!Array.isArray(sectionColumn.Block.Hide)) {
                        throw new Error(this.getWrongTypeError(blockPropertyBreadcrumb, 'Hide', 'DataViewScreenSize array'));
                    } else {
                        for (let index = 0; index < sectionColumn.Block.Hide.length; index++) {
                            const hide = sectionColumn.Block.Hide[index];
                            if (!DataViewScreenSizes.some(dvss => dvss === hide)) {
                                throw new Error(this.getWrongTypeError(blockPropertyBreadcrumb, 'Hide', `value from [${DataViewScreenSizes}]`));
                            }
                        }
                    }
                }
            }
        }
    }

    private validatePageSection(pagePropertyBreadcrumb: string, section: PageSection, sectionIndex: number): void {
        const sectionsPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Layout -> Sections at index ${sectionIndex}`;

        // Validate Key
        if (!section.hasOwnProperty('Key')) {
            throw new Error(this.getNotExistError(sectionsPropertyBreadcrumb, 'Key'));
        } else if (typeof section.Key !== 'string') {
            throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Key', 'string'));
        }

        // Validate Name if exist (Optional)
        if (section.hasOwnProperty('Name')) {
            if (typeof section.Name !== 'string') {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Name', 'string'));
            }
        }
        
        // Validate Height if exist (Optional)
        if (section.hasOwnProperty('Height')) {
            if (typeof section.Height !== 'number') {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Height', 'number'));
            }
        }

        // Validate Min Height if exist (Optional)
        if (section.hasOwnProperty('MinHeight')) {
            if (typeof section.MinHeight !== 'number') {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'MinHeight', 'number'));
            }
        }

        // Validate Split if exist (Optional)
        if (section.hasOwnProperty('Split')) {
            if (typeof section.Split !== 'string') {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Split', 'string'));
            } else if (section.Split.length > 0 && !SplitTypes.some(st => st == section.Split)) {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Split', `empty or value from [${SplitTypes}]`));
            }
        }
        
        // Validate Columns
        if (!section.hasOwnProperty('Columns')) {
            throw new Error(this.getNotExistError(sectionsPropertyBreadcrumb, 'Columns'));
        } else if (!Array.isArray(section.Columns)) {
            throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Columns', 'PageSectionColumn array'));
        } else {
            for (let index = 0; index < section.Columns.length; index++) {
                const column = section.Columns[index];
                this.validatePageSectionColumnBlock(`${sectionsPropertyBreadcrumb} -> Columns at index ${index}`, column);
            }
        }
        
        // Validate Hide if exist (Optional)
        if (section.hasOwnProperty('Hide')) {
            if (!Array.isArray(section.Hide)) {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Hide', 'DataViewScreenSize array'));
            } else {
                for (let index = 0; index < section.Hide.length; index++) {
                    const hide = section.Hide[index];
                    if (!DataViewScreenSizes.some(dvss => dvss === hide)) {
                        throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Hide', `value from [${DataViewScreenSizes}]`));
                    }
                }
            }
        }
    }

    // Validate the page and throw error if not valid.
    private validatePage(page: Page): void {
        const pagePropertyBreadcrumb = 'Page';
        
        // Validate Key if exist (Optional)
        if (page.hasOwnProperty('Key')) {
            if (typeof page.Key !== 'string') {
                throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Key', 'string'));
            }
        }

        // Validate Hidden if exist (Optional)
        if (page.hasOwnProperty('Hidden')) {
            if (typeof page.Hidden !== 'boolean') {
                throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Hidden', 'string'));
            }
        }

        // Validate Name if exist (Optional)
        if (page.hasOwnProperty('Name')) {
            if (typeof page.Name !== 'string') {
                throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Name', 'string'));
            }
        }
        
        // Validate Description if exist (Optional)
        if (page.hasOwnProperty('Description')) {
            if (typeof page.Description !== 'string') {
                throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Description', 'string'));
            }
        }

        // Validate Type if exist (Optional)
        if (page.hasOwnProperty('Type')) {
            if (typeof page.Type !== 'string') {
                throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Type', 'string'));
            }
        }

        // Validate Blocks
        if (!page.hasOwnProperty('Blocks')) {
            throw new Error(this.getNotExistError(pagePropertyBreadcrumb, 'Blocks'));
        } else if (!Array.isArray(page.Blocks)) {
            throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Blocks', 'PageBlock array'));
        } else {
            for (let index = 0; index < page.Blocks.length; index++) {
                this.validatePageBlock(pagePropertyBreadcrumb, page.Blocks[index], index);
            }
        }

        // Validate Layout
        if (!page.hasOwnProperty('Layout')) {
            throw new Error(this.getNotExistError(pagePropertyBreadcrumb, 'Layout'));
        } else if (typeof page.Layout !== 'object') {
            throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout', 'PageLayout object'));
        } else {
            // Validate Layout -> Sections
            if (!page.Layout.hasOwnProperty('Sections')) {
                throw new Error(this.getNotExistError(pagePropertyBreadcrumb, 'Layout -> Sections'));
            } else if (!Array.isArray(page.Layout.Sections)) {
                throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> Sections', 'PageSection array'));
            } else {
                for (let index = 0; index < page.Layout.Sections.length; index++) {
                    this.validatePageSection(pagePropertyBreadcrumb, page.Layout.Sections[index], index);
                }
            }

            // Validate Layout -> SectionsGap if exist (Optional)
            if (page.Layout.hasOwnProperty('SectionsGap')) {
                if (typeof page.Layout.SectionsGap !== 'string') {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> SectionsGap', 'string'));
                } else if (!PageSizeTypes.some(pst => pst === page.Layout.SectionsGap)) {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> SectionsGap', `value from [${PageSizeTypes}]`));
                }
            }

            // Validate Layout -> ColumnsGap if exist (Optional)
            if (page.Layout.hasOwnProperty('ColumnsGap')) {
                if (typeof page.Layout.ColumnsGap !== 'string') {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> ColumnsGap', 'string'));
                } else if (!PageSizeTypes.some(pst => pst === page.Layout.ColumnsGap)) {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> ColumnsGap', `value from [${PageSizeTypes}]`));
                }
            }

            // Validate Layout -> HorizontalSpacing if exist (Optional)
            if (page.Layout.hasOwnProperty('HorizontalSpacing')) {
                if (typeof page.Layout.HorizontalSpacing !== 'string') {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> HorizontalSpacing', 'string'));
                } else if (!PageSizeTypes.some(pst => pst === page.Layout.HorizontalSpacing)) {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> HorizontalSpacing', `value from [${PageSizeTypes}]`));
                }
            }

            // Validate Layout -> VerticalSpacing if exist (Optional)
            if (page.Layout.hasOwnProperty('VerticalSpacing')) {
                if (typeof page.Layout.VerticalSpacing !== 'string') {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> VerticalSpacing', 'string'));
                } else if (!PageSizeTypes.some(pst => pst === page.Layout.VerticalSpacing)) {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> VerticalSpacing', `value from [${PageSizeTypes}]`));
                }
            }
            
            // Validate Layout -> MaxWidth if exist (Optional)
            if (page.Layout.hasOwnProperty('MaxWidth')) {
                if (typeof page.Layout.MaxWidth !== 'number') {
                    throw new Error(this.getWrongTypeError(pagePropertyBreadcrumb, 'Layout -> MaxWidth', 'number'));
                }
            }

        }
    }

    private addOptionalPropertyIfExist(source: any, target: any, propertyName: string) {
        if (source.hasOwnProperty(propertyName)) {
            target[propertyName] = source[propertyName];
        }
    }

    private getPageAccordingInterface(page: Page): Page {
        // Init with the mandatories properties.
        let res: Page = {
            Blocks: [],
            Layout: {
                Sections: []
            }
        };

        this.addOptionalPropertyIfExist(page, res, 'Hidden');
        this.addOptionalPropertyIfExist(page, res, 'CreationDateTime');
        this.addOptionalPropertyIfExist(page, res, 'Key');
        this.addOptionalPropertyIfExist(page, res, 'Name');
        this.addOptionalPropertyIfExist(page, res, 'Description');
        this.addOptionalPropertyIfExist(page, res, 'Type');
        
        // Add Blocks specific properties.
        for (let blockIndex = 0; blockIndex < page.Blocks.length; blockIndex++) {
            const currentBlock = page.Blocks[blockIndex];
            const blockToAdd: PageBlock = {
                Key: currentBlock.Key,
                Relation: currentBlock.Relation,
            };

            this.addOptionalPropertyIfExist(currentBlock, blockToAdd, 'Configuration');
            this.addOptionalPropertyIfExist(currentBlock, blockToAdd, 'PageConfiguration');

            res.Blocks.push(blockToAdd);
        } 

        // Add Layout specific properties.
        for (let sectionIndex = 0; sectionIndex < page.Layout.Sections.length; sectionIndex++) {
            const currentSection = page.Layout.Sections[sectionIndex];
            const sectionToAdd: PageSection = {
                Key: currentSection.Key,
                Columns: [],
            };

            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'Name');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'Height');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'MinHeight');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'Split');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'Hide');

            // Add Columns -> blocks specific properties.
            for (let columnIndex = 0; columnIndex < currentSection.Columns.length; columnIndex++) {
                const currentColumn = currentSection.Columns[columnIndex];
                const columnToAdd: PageSectionColumn = {};

                if (currentColumn.Block) {
                    columnToAdd.Block = {
                        BlockKey: currentColumn.Block.BlockKey
                    };

                    this.addOptionalPropertyIfExist(currentColumn.Block, columnToAdd.Block, 'Hide');
                }

                sectionToAdd.Columns.push(columnToAdd);
            }

            res.Layout.Sections.push(sectionToAdd);
        } 

        return res;
    }

    async createPagesTablesSchemes(): Promise<AddonDataScheme[]> {
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
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).find(options) as Page[];
    }

    // Upsert page object if key not exist create new one.
    upsertPage(page: Page, tableName = PAGES_TABLE_NAME): Promise<Page> {
        return this.upsertPageInternal(page, tableName);
    }

    createTemplatePage(query: any): Promise<Page> {
        const templateId = query['templateId'] || '';
        // TODO: Get the correct page by template (options.TemplateKey)
        const page: Page = TempBlankPageData;
        page.Key = '';
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    }

    async removePage(query: any): Promise<boolean> {
        const pagekey = query['key'] || '';
        
        let draftRes = await this.hidePage(pagekey, DRAFT_PAGES_TABLE_NAME);
        let res = await this.hidePage(pagekey, PAGES_TABLE_NAME);

        return Promise.resolve(draftRes || res);
    }

    async savePage(page: Page): Promise<Page>  {
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    }

    async getPagesData(options): Promise<any[]> {
        // TODO: Change to pages endpoint after added in NGINX.
        // return this.papiClient.pages.find
        let pages: Page[] = await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).find(options) as Page[];
        let draftPages: Page[] = await this.papiClient.addons.data.uuid(this.addonUUID).table(DRAFT_PAGES_TABLE_NAME).find(options) as Page[];

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
}