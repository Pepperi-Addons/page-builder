import { IContext } from "@pepperi-addons/cpi-node/build/cpi-side/events";
import { NgComponentRelation, Page, PageBlock } from "@pepperi-addons/papi-sdk";
import { resolve } from "path";
import { IAvailableBlockData, IBlockLoaderData, IPageBuilderData, IPageClientEventResult, IPageView, getAvailableBlockData } from "shared";
import config from "../addon.config.json";
class ClientPagesService {

    readonly LIMIT_COUNTER = 3;

    private convertRelationToBlockLoaderData(relations: NgComponentRelation[], name: string = ''): IBlockLoaderData[] {
        const availableBlocks: IBlockLoaderData[] = [];
        relations.forEach((relation: NgComponentRelation) => {
            if (name.length === 0 || (name.length > 0 && relation.Name === name)) {
                availableBlocks.push({
                    relation: relation,
                    addonPublicBaseURL: `${relation.AddonBaseURL}`,
                } as any);
            }
        });

        return availableBlocks;
    }

    private getAvailableBlockKey(addonUUID: string, name: string): string {
        return `${addonUUID}_${name}`;
    }

    private getBlockConsumedParameters(block: PageBlock, pageParameters: any): any {
        let parametersToSend = {};

        // If this block is consume all parameters
        if (block?.PageConfiguration?.Parameters.some(param => (param.Key === '*' && param.Consume))) {
            parametersToSend = { ...pageParameters };
        } else {
            Object.keys(pageParameters).forEach(paramKey => {
                // If this block is consume this parameter add it.
                if (block?.PageConfiguration?.Parameters.some(param => param.Key === paramKey && param.Consume)) {
                    parametersToSend[paramKey] = pageParameters[paramKey];
                }
            });
        }

        return parametersToSend;
    }
    
    private async overrideBlockData(blockCpiFunc: string, block: PageBlock, pageParameters: any, changedParameters: any, context: IContext | undefined): Promise<void> {
        if (blockCpiFunc?.length > 0) {
            try {
                // Get only the parameters that this block is consume.
                let parametersToSend = this.getBlockConsumedParameters(block, pageParameters);

                // Call block CPI side for getting the data to override.
                const data: any = {
                    url: blockCpiFunc,
                    body: {
                        PageParameters: parametersToSend,
                        Configuration: block.Configuration,
                        ConfigurationPerScreenSize: block.ConfigurationPerScreenSize
                    },
                    ...(context && { context }) // Add context if not undefined.
                };
                
                const blockDataToOverride: any = await pepperi.addons.api.uuid(block.Relation.AddonUUID).post(data);

                if (blockDataToOverride) {
                    block.Configuration = blockDataToOverride.Configuration ?? block.Configuration;
                    block.ConfigurationPerScreenSize = blockDataToOverride.ConfigurationPerScreenSize ?? block.ConfigurationPerScreenSize;

                    // If this block has ChangedParameters then merge it to the changedParameters to raise this for all the consumers of this parameters after.
                    if (blockDataToOverride.ChangedParameters) {
                        changedParameters = this.overrideProducerParametersAfterValidation(block, data.Changes?.PageParameters || {}, changedParameters); 
                    }
                }
            }
            catch {
                // Do nothing
            }
        }
    }

    private async overrideBlockDataOld(oldBlockCpiFunc: string, block: PageBlock, context: IContext | undefined): Promise<void> {
        if (oldBlockCpiFunc?.length > 0) {
            try {
                // Call block CPI side for getting the data to override.
                const data: any = {
                    url: oldBlockCpiFunc,
                    body: {
                        Configuration: block.Configuration
                    },
                    ...(context && { context }) // Add context if not undefined.
                };
                
                const blockDataToOverride: any = await pepperi.addons.api.uuid(block.Relation.AddonUUID).post(data);
                block.Configuration = blockDataToOverride?.Configuration ?? block.Configuration;
            }
            catch {
                // Do nothing
            }
        }
    }

    private async overrideBlocksDataWhenParametersChange(counter: number, page: Page, availableBlocksMap: Map<string, IBlockLoaderData>, pageParameters: any, changedParameters: any, context: IContext | undefined): Promise<any>  {
        if (counter > this.LIMIT_COUNTER) {
            throw new Error('Exceeded limit counter');
        } else {
            // Cosumers of the changed params.
            const blocksMap = new Map<string, PageBlock>();
            
            // Check if we have blocks that cosume these changedParameters.
            for (let index = 0; index < page.Blocks.length; index++) {
                const block = page.Blocks[index];
                
                Object.keys(changedParameters).forEach(paramKey => {
                    // If this parameter is changed or not exist.
                    if (!pageParameters.hasOwnProperty(paramKey) || pageParameters[paramKey] !== changedParameters[paramKey]) {
                        // If this block is consume this parameter || consume all ('*').
                        if (block?.PageConfiguration?.Parameters.some(param => (param.Key === '*' || param.Key === paramKey) && param.Consume)) {
                            blocksMap.set(block.Relation.AddonUUID, block);
                            return;
                        }
                    }
                });
            }
            
            // After we found the blocks that cosume these changedParameters, 
            // merge the changedParameters into pageParameters and init the changedParameters for let the function run again if needed.
            pageParameters = { ...changedParameters };
            changedParameters = {};
            
            // Let the blocks manipulate there data and replace it in page blocks
            const blocks: PageBlock[] = Array.from(blocksMap.values());
            await Promise.all(blocks.map(async (block: PageBlock) => {
                const currentAvailableBlock = availableBlocksMap.get(this.getAvailableBlockKey(block.Relation.AddonUUID, block.Relation.Name));
    
                if (currentAvailableBlock?.relation) {
                    // Override the block data with the BlockLoadEndpoint.
                    await this.overrideBlockData(currentAvailableBlock.relation.BlockLoadEndpoint, block, pageParameters, changedParameters, context);
                }
            }));

            // Call to override blocks data when parameters change.
            if (Object.keys(changedParameters).length > 0) {
                await this.overrideBlocksDataWhenParametersChange(counter++, page, availableBlocksMap, pageParameters, changedParameters, context);
            }
        }
    }

    private getAvailableBlocksMap(availableBlocks: IBlockLoaderData[]): Map<string, IBlockLoaderData> {
        // Create map for the available blocks data;
        const availableBlocksMap = new Map<string, IBlockLoaderData>();
        for (let index = 0; index < availableBlocks.length; index++) {
            const ab = availableBlocks[index];
            availableBlocksMap.set(this.getAvailableBlockKey(ab.relation.AddonUUID, ab.relation.Name), ab);
        }

        return availableBlocksMap;
    }

    private async overrideBlocksData(page: Page, availableBlocksMap: Map<string, IBlockLoaderData>, pageParameters: any, context: IContext | undefined): Promise<void> {
        // TODO: Sort the blocks by producers then producers & consumers then consumers only for the ChangedParameters
        const blocks = page.Blocks;
        let changedParameters = { };

        // Let the blocks manipulate there data and replace it in page blocks
        await Promise.all(blocks.map(async (block: any) => {
            const currentAvailableBlock = availableBlocksMap.get(this.getAvailableBlockKey(block.Relation.AddonUUID, block.Relation.Name));

            if (currentAvailableBlock?.relation) {
                const newBlockCpiFunc = currentAvailableBlock.relation.BlockLoadEndpoint;

                // New code for calculate all here (in CPI).
                if (newBlockCpiFunc?.length > 0) {
                    // Override the block data with the BlockLoadEndpoint.
                    await this.overrideBlockData(newBlockCpiFunc, block, pageParameters, changedParameters, context);
                } else { // Old code - this is deprecated!!!
                    await this.overrideBlockDataOld(currentAvailableBlock.relation.OnPageLoadEndpoint, block, context);
                }
            }
        }));

        // Call to override blocks data when parameters change.
        if (Object.keys(changedParameters).length > 0) {
            await this.overrideBlocksDataWhenParametersChange(1, page, availableBlocksMap, pageParameters, changedParameters, context);
        }
    }

    private async isSyncInstalled(): Promise<boolean> {
        let isSyncInstalled = false;

        try {
            const res = await pepperi.api.adal.getList({
                addon: 'bb6ee826-1c6b-4a11-9758-40a46acb69c5', // CPI Node addon uuid
                table: 'addons'
            }); 
            
            isSyncInstalled = res?.objects?.length > 0 ? true : false;
        } catch {
            isSyncInstalled = false;
        }

        return isSyncInstalled;
    }

    private async getBlocksData(blockType: string = 'AddonBlock', name: string = ''): Promise<IBlockLoaderData[]> {
        let blocks;
        
        if (blockType === 'PageBlock') {
            blocks = await pepperi.addons.data['relations'].pageBlocks();
        } else { // AddonBlock
            blocks = await pepperi.addons.data['relations'].addonBlocks();
        }
        
        const addonBlocksLoaderData = this.convertRelationToBlockLoaderData(blocks, name);
        return addonBlocksLoaderData;
    }
    
    private getPageView(page: Page, forLoad = true): IPageView {
        return {
            Key: page?.Key || '',
            // Name: page.Name,
            ...(forLoad && { Name: page?.Name }),
            // Description: page.Description,
            ...(forLoad && { Description: page?.Description }),
            Blocks: page?.Blocks.map(block => { return {
                Key: block.Key,
                RelationData: {
                    Name: block.Relation.Name,
                    AddonUUID: block.Relation.AddonUUID
                },
                Configuration: block.Configuration,
                ConfigurationPerScreenSize: block.ConfigurationPerScreenSize
            }}),
            // Layout: page.Layout
            ...(forLoad && { Layout: page?.Layout }),
        }
    }

    private overrideProducerParametersAfterValidation(block: PageBlock, parametersToValidate: any, parametersToOverride = {}): any {
        if (!parametersToOverride) {
            parametersToOverride = {};
        }

        // Set only the allowed parameters by find them in the PageConfiguration (that this block is produce of this parameter) 
        Object.keys(parametersToValidate).forEach(paramKey => {
            if (block.PageConfiguration?.Parameters.some(param => param.Key === paramKey && param.Produce)) {
                parametersToOverride[paramKey] = parametersToValidate[paramKey];
            }
        });
        
        return parametersToOverride;
    }

    async getPage(pageKey: string): Promise<Page> {
        const res = await pepperi.api.adal.get({
            addon: config.AddonUUID,
            table: 'Pages',
            key: pageKey
        }); 
        const page =  res.object as Page;
        return page;
    }

    async getPageDataOld(pageKey: string, context: IContext | undefined): Promise<IPageBuilderData> {
        let result: IPageBuilderData;
        const isSyncInstalled = await this.isSyncInstalled();

        if (isSyncInstalled) {
            let page = await this.getPage(pageKey);
            const availableBlocks: IBlockLoaderData[] = await this.getBlocksData('PageBlock');
            const availableBlocksMap = this.getAvailableBlocksMap(availableBlocks);

            // This function override blocks data properties in page object.
            await this.overrideBlocksData(page, availableBlocksMap, null, context);
    
            result = {
                page: page,           
                availableBlocks: availableBlocks || [],
            }
        } else {
            // Get the page data online if sync isn't installed.
            const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/internal_api/get_page_data?key=${pageKey}`);
            result = temp.ok ? await(temp.json()) : null;
        }

        return result;
    }
    
    async getPageLoadData(data: any, context: IContext | undefined): Promise<IPageClientEventResult> {
        let tmpResult: IPageBuilderData;
        
        let page = data.Page || null;
        const pageKey = data.PageKey || page?.Key || '';
        const pageParameters = data.State?.PageParameters || {};
        const isSyncInstalled = await this.isSyncInstalled();

        if (isSyncInstalled) {
            if (!page) {
                page = await this.getPage(pageKey);
            }

            const availableBlocks: IBlockLoaderData[] = await this.getBlocksData('PageBlock');
            const availableBlocksMap = this.getAvailableBlocksMap(availableBlocks);

            // This function override blocks data properties in page object.
            await this.overrideBlocksData(page, availableBlocksMap, pageParameters, context);
    
            tmpResult = {
                page: page,
                availableBlocks: availableBlocks || [],
            }
        } else {
            // Get the page data online if sync isn't installed (in case of editor the page already exist in the data.Page,
            // data.Page and the page that will return here should be the same cause this is load event).
            const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/internal_api/get_page_data?key=${pageKey}`);
            tmpResult = temp.ok ? await(temp.json()) : { page: null, availableBlocks: [] };
        }

        // Prepare the object as in the API Design.
        const availableBlocksData: IAvailableBlockData[] = getAvailableBlockData(tmpResult.availableBlocks, pageParameters['devBlocks']);
        const pageView = this.getPageView(tmpResult.page)
        const result: IPageClientEventResult = {
            State: {
                PageParameters: pageParameters
            },
            PageView: pageView,
            AvailableBlocksData: availableBlocksData
        }

        return result;
    }

    async getPageStateChangeData(data: any, context: IContext | undefined): Promise<IPageClientEventResult> {
        let page: Page = data.Page || null;
        const pageKey = data.PageKey || page?.Key || '';
        const blockKey = data.BlockKey;
        const pageParameters = data.State?.PageParameters || {};
        const isSyncInstalled = await this.isSyncInstalled();
        
        if (isSyncInstalled) {
            if (!page) {
                page = await this.getPage(pageKey);
            }
            
            // Get the block and check if he's allow to raise those params.
            const block = page.Blocks.find(b => b.Key === blockKey);

            if (block) {
                // Get the changed parameters after validation.
                const changedParameters = this.overrideProducerParametersAfterValidation(block, data.Changes?.PageParameters || {}); 
                
                // If there is at keast one key in the parameters.
                if (Object.keys(changedParameters).length > 0) {
                    const availableBlocks: IBlockLoaderData[] = await this.getBlocksData('PageBlock');
                    const availableBlocksMap = this.getAvailableBlocksMap(availableBlocks);
        
                    await this.overrideBlocksDataWhenParametersChange(1, page, availableBlocksMap, pageParameters, changedParameters, context);
                }
            }
        } else {
            if (!page) {
                // Get the page online if sync isn't installed (in case of editor the page already exist in the data.Page).
                const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/api/get_page?key=${pageKey}`);
                page = temp.ok ? await(temp.json()) : null;
            }
        }

        // Prepare the object as in the API Design.
        const pageView = this.getPageView(page, false);
        const result: IPageClientEventResult = {
            State: {
                PageParameters: pageParameters
            },
            PageView: pageView
        }

        return result;
    }

    async getBlockData(blockType: string = 'AddonBlock', name: string = ''): Promise<IBlockLoaderData | null> {
        let result: IBlockLoaderData | null = null;
        const isSyncInstalled = await this.isSyncInstalled();

        if (isSyncInstalled) {
            let resultArr = await this.getBlocksData(blockType, name);
            
            if (resultArr.length > 0) {
                result = resultArr[0];
            }
        } else {
            // Get the page data online if sync isn't installed.
            const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/addon_blocks/get_addon_block_loader_data?blockType=${blockType}&name=${name}`);
            result = temp.ok ? await(temp.json()) : null;
        }
        
        return result;
    }
    
}
export default ClientPagesService;
