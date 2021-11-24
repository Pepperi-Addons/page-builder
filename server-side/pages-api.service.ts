import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonDataScheme, PageSection, SplitTypes, DataViewScreenSizes, PageBlock, PageSectionColumn, PageSizeTypes, PageLayout } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { PageRowProjection, TempBlankPageData } from './pages.model';

const PAGES_TABLE_NAME = 'Pages';
const DRAFT_PAGES_TABLE_NAME = 'PagesDrafts';

interface IPageBuilderData {
    page: Page, 
    availableBlocks: IAvailableBlockData[]
}

interface IAvailableBlockData {
    relation: NgComponentRelation, 
    addonPublicBaseURL: string
    // addon: InstalledAddon 
}

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

    private async getAvailableBlocks(pageType: string): Promise<IAvailableBlockData[]> {
        // Get the PageBlock relations 
        const pageBlockRelations: NgComponentRelation[] = await this.getRelations('PageBlock');
                
        // Distinct the addons uuid's and filter by pageType
        const distinctAddonsUuids = [...new Set(pageBlockRelations.filter(row => (
            row.AllowedPageTypes === undefined || 
            row.AllowedPageTypes.lenth === 0 || 
            pageType.length === 0 || 
            (row.AllowedPageTypes.lenth > 0 && row.AllowedPageTypes.includes(pageType))
        )).map(obj => obj.AddonUUID))];

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
    
    // Get the page by the key.
    private async getPage(pagekey: string, tableName: string): Promise<Page> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).key(pagekey).get() as Page;
    }

    // Hide the page (set hidden to true).
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
            page.Key = uuid();
        }

        // Validate page object before upsert.
        this.validatePageProperties(page);

        // Validate page blocks (check that the blocks are installed and that thay are by the page type).
        this.validatePageBlocks(page);

        page = this.getPageAccordingInterface(page);

        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page) as Page;
    }

    private async validatePageBlocks(page: Page) {
        const availableBlocks = await this.getAvailableBlocks(page.Type || '');

        for (let index = 0; index < page.Blocks?.length; index++) {
            const block = page.Blocks[index];

            if (availableBlocks.findIndex(ab => ab.relation.AddonUUID === block.Relation?.AddonUUID) === -1) {
                throw new Error(`Block with AddonUUID ${block.Relation.AddonUUID} isn't exist as available page block for this type - ${page.Type}.`);
            }
        }
    }

    private getNotExistError(objectBreadcrumb: string, propertyName: string): string {
        return `${objectBreadcrumb} -> ${propertyName} is missing.`;
    }
    
    private getWrongTypeError(objectBreadcrumb: string, propertyName: string, typeName: string): string {
        return `${objectBreadcrumb} -> ${propertyName} should be ${typeName}.`;
    }

    private validateObjectProperty(objectToValidate: any, propName: string, propertyBreadcrumb: string, optional: boolean = false, objectType: string = 'string') {
        if (!optional) {
            if (!objectToValidate.hasOwnProperty(propName)) {
                throw new Error(this.getNotExistError(propertyBreadcrumb, propName));
            } else if (typeof objectToValidate[propName] !== objectType) {
                throw new Error(this.getWrongTypeError(propertyBreadcrumb, propName, objectType));
            }
        } else {
            if (objectToValidate.hasOwnProperty(propName)) {
                if (typeof objectToValidate[propName] !== objectType) {
                    throw new Error(this.getWrongTypeError(propertyBreadcrumb, 'Configuration', objectType));
                }
            }
        }
    }

    private validateArrayProperty(objectToValidate: any, propName: string, propertyBreadcrumb: string, optional: boolean = false, arrayType: readonly any[] = []) {
        if (!optional) {
            if (!objectToValidate.hasOwnProperty(propName)) {
                throw new Error(this.getNotExistError(propertyBreadcrumb, propName));
            } else if (!Array.isArray(objectToValidate[propName])) {
                throw new Error(this.getWrongTypeError(propertyBreadcrumb, propName, 'array'));
            }
        } else {
            if (objectToValidate.hasOwnProperty(propName)) {
                if (!Array.isArray(objectToValidate[propName])) {
                    throw new Error(this.getWrongTypeError(propertyBreadcrumb, propName, 'array'));
                } else {
                    for (let index = 0; index < objectToValidate[propName].length; index++) {
                        const value = objectToValidate[propName][index];
                        if (!arrayType.some(atv => atv === value)) {
                            throw new Error(this.getWrongTypeError(propertyBreadcrumb, propName, `value from [${arrayType}]`));
                        }
                    }
                }
            }
        }
    }

    private validatePageBlockProperties(pagePropertyBreadcrumb: string, block: PageBlock, blockIndex: number): void {
        const blocksPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Blocks at index ${blockIndex}`;

        // Validate Key
        this.validateObjectProperty(block, 'Key', blocksPropertyBreadcrumb);

        // Validate Relation
        this.validateObjectProperty(block, 'Relation', blocksPropertyBreadcrumb, false, 'object');
        this.validatePageBlockRelationProperties(blocksPropertyBreadcrumb, block.Relation);
        
        // Validate Configuration if exist (Optional)
        this.validateObjectProperty(block, 'Configuration', blocksPropertyBreadcrumb, true, 'object');
        
        // Validate PageConfiguration if exist (Optional)
        this.validateObjectProperty(block, 'PageConfiguration', blocksPropertyBreadcrumb, true, 'object');
        // TODO: Validate PageConfiguration properties.
    }

    private validatePageBlockRelationProperties(blockPropertyBreadcrumb: string, relation: NgComponentRelation): void {
        const relationPropertyBreadcrumb = `${blockPropertyBreadcrumb} -> Relation`;

        // Validate Name
        this.validateObjectProperty(relation, 'Name', relationPropertyBreadcrumb);
        
        // Validate SubType
        this.validateObjectProperty(relation, 'SubType', relationPropertyBreadcrumb);

        // Validate AddonUUID
        this.validateObjectProperty(relation, 'AddonUUID', relationPropertyBreadcrumb);

        // Validate AddonRelativeURL
        this.validateObjectProperty(relation, 'AddonRelativeURL', relationPropertyBreadcrumb);

        // Validate ModuleName
        this.validateObjectProperty(relation, 'ModuleName', relationPropertyBreadcrumb);

        // Validate ComponentName
        this.validateObjectProperty(relation, 'ComponentName', relationPropertyBreadcrumb);
    }

    private validatePageSectionColumnBlockProperties(sectionsPropertyBreadcrumb: string, sectionColumn: PageSectionColumn): void {
        const blockPropertyBreadcrumb = `${sectionsPropertyBreadcrumb} -> Block`;
        
        // Validate Block if exist (Optional)
        this.validateObjectProperty(sectionColumn, 'Block', blockPropertyBreadcrumb, true, 'object');

        if (sectionColumn.Block) {
            // Validate BlockKey in Block
            this.validateObjectProperty(sectionColumn.Block, 'BlockKey', blockPropertyBreadcrumb);

            // Validate Hide in Block if exist (Optional)
            this.validateArrayProperty(sectionColumn.Block, 'Hide', blockPropertyBreadcrumb, true, DataViewScreenSizes);
        }
    }

    private validatePageSectionProperties(pagePropertyBreadcrumb: string, section: PageSection, sectionIndex: number): void {
        const sectionsPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Sections at index ${sectionIndex}`;

        // Validate Key
        this.validateObjectProperty(section, 'Key', sectionsPropertyBreadcrumb);

        // Validate Name if exist (Optional)
        this.validateObjectProperty(section, 'Name', sectionsPropertyBreadcrumb, true);
        
        // Validate Height if exist (Optional)
        this.validateObjectProperty(section, 'Height', sectionsPropertyBreadcrumb, true, 'number');

        // Validate Min Height if exist (Optional)
        this.validateObjectProperty(section, 'MinHeight', sectionsPropertyBreadcrumb, true, 'number');

        // Validate Split if exist (Optional)
        if (section.hasOwnProperty('Split')) {
            if (typeof section.Split !== 'string') {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Split', 'string'));
            } else if (section.Split.length > 0 && !SplitTypes.some(st => st == section.Split)) {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Split', `empty or value from [${SplitTypes}]`));
            }
        }
        
        // Validate Columns
        this.validateArrayProperty(section, 'Columns', sectionsPropertyBreadcrumb);
        for (let index = 0; index < section.Columns.length; index++) {
            const column = section.Columns[index];
            this.validatePageSectionColumnBlockProperties(`${sectionsPropertyBreadcrumb} -> Columns at index ${index}`, column);
        }
        
        // Validate Hide if exist (Optional)
        this.validateArrayProperty(section, 'Hide', sectionsPropertyBreadcrumb, true, DataViewScreenSizes);
    }

    private validatePageLayoutProperties(layout: PageLayout, pagePropertyBreadcrumb: string): void {
        const layoutPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Layout`;

        // Validate Sections
        this.validateArrayProperty(layout, 'Sections', layoutPropertyBreadcrumb);
        for (let index = 0; index < layout.Sections.length; index++) {
            this.validatePageSectionProperties(layoutPropertyBreadcrumb, layout.Sections[index], index);
        }

        // Validate SectionsGap if exist (Optional)
        if (layout.hasOwnProperty('SectionsGap')) {
            if (typeof layout.SectionsGap !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'SectionsGap', 'string'));
            } else if (!PageSizeTypes.some(pst => pst === layout.SectionsGap)) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'SectionsGap', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate ColumnsGap if exist (Optional)
        if (layout.hasOwnProperty('ColumnsGap')) {
            if (typeof layout.ColumnsGap !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'ColumnsGap', 'string'));
            } else if (!PageSizeTypes.some(pst => pst === layout.ColumnsGap)) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'ColumnsGap', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate HorizontalSpacing if exist (Optional)
        if (layout.hasOwnProperty('HorizontalSpacing')) {
            if (typeof layout.HorizontalSpacing !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'HorizontalSpacing', 'string'));
            } else if (!PageSizeTypes.some(pst => pst === layout.HorizontalSpacing)) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'HorizontalSpacing', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate VerticalSpacing if exist (Optional)
        if (layout.hasOwnProperty('VerticalSpacing')) {
            if (typeof layout.VerticalSpacing !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'VerticalSpacing', 'string'));
            } else if (!PageSizeTypes.some(pst => pst === layout.VerticalSpacing)) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'VerticalSpacing', `value from [${PageSizeTypes}]`));
            }
        }
        
        // Validate MaxWidth if exist (Optional)
        this.validateObjectProperty(layout, 'MaxWidth', layoutPropertyBreadcrumb, true, 'number');
    }

    // Validate the page and throw error if not valid.
    private validatePageProperties(page: Page): void {
        const pagePropertyBreadcrumb = 'Page';
        
        // Validate Key if exist (Optional)
        this.validateObjectProperty(page, 'Key', pagePropertyBreadcrumb, true);

        // Validate Hidden if exist (Optional)
        this.validateObjectProperty(page, 'Hidden', pagePropertyBreadcrumb, true, 'boolean');

        // Validate Name if exist (Optional)
        this.validateObjectProperty(page, 'Name', pagePropertyBreadcrumb, true);
        
        // Validate Description if exist (Optional)
        this.validateObjectProperty(page, 'Description', pagePropertyBreadcrumb, true);
        
        // Validate Type if exist (Optional)
        this.validateObjectProperty(page, 'Type', pagePropertyBreadcrumb, true);

        // Validate Blocks
        this.validateArrayProperty(page, 'Blocks', pagePropertyBreadcrumb);
        for (let index = 0; index < page.Blocks.length; index++) {
            this.validatePageBlockProperties(pagePropertyBreadcrumb, page.Blocks[index], index);
        }
        
        // Validate Layout
        this.validateObjectProperty(page, 'Layout', pagePropertyBreadcrumb, false, 'object');
        this.validatePageLayoutProperties(page.Layout, pagePropertyBreadcrumb)
    }

    private addOptionalPropertyIfExist(source: any, target: any, propertyName: string): void {
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
                Relation: {
                    RelationName: currentBlock.Relation.RelationName,
                    Type: currentBlock.Relation.Type,
                    Name: currentBlock.Relation.Name,
                    AddonUUID: currentBlock.Relation.AddonUUID,
                    SubType: currentBlock.Relation.SubType,
                    AddonRelativeURL: currentBlock.Relation.AddonRelativeURL,
                    ModuleName: currentBlock.Relation.ModuleName,
                    ComponentName: currentBlock.Relation.ComponentName
                },
            };

            this.addOptionalPropertyIfExist(currentBlock, blockToAdd, 'Configuration');
            this.addOptionalPropertyIfExist(currentBlock, blockToAdd, 'PageConfiguration');

            res.Blocks.push(blockToAdd);
        } 

        // Add Layout specific properties.
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'SectionsGap');
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'ColumnsGap');
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'HorizontalSpacing');
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'VerticalSpacing');
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'MaxWidth');

        // Add Layout sections specific properties.
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

    async getPages(options): Promise<Page[]> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).find(options) as Page[];
    }

    // Upsert page object if key not exist create new one.
    savePage(page: Page): Promise<Page> {
        return this.upsertPageInternal(page, PAGES_TABLE_NAME);
    }

    async saveDraftPage(page: Page): Promise<Page>  {
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
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

    async getPagesData(options): Promise<PageRowProjection[]> {
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

    async getPageData(pagekey: string, lookForDraft = false): Promise<IPageBuilderData> {
        let res: any;
        
        if (pagekey) {
            let page;
            
            // If lookForDraft try to get the page from the draft first.
            if (lookForDraft) {
                // Get the page from the drafts.
                page = await this.getPage(pagekey, DRAFT_PAGES_TABLE_NAME);
            }

            // If there is no page in the drafts
            if (!page || page.Hidden) {
                page = await this.getPage(pagekey, PAGES_TABLE_NAME);
            }

            // If page found get the available blocks by page type and return combined object.
            if (page) {
                const pageType = page.Type || '';
                const availableBlocks = await this.getAvailableBlocks(pageType) || [];
                
                res = {
                    page, 
                    availableBlocks
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
}