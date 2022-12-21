import { IContext } from "@pepperi-addons/cpi-node/build/cpi-side/events";
import { NgComponentRelation, Page } from "@pepperi-addons/papi-sdk";
import { IBlockLoaderData, IPageBuilderData } from "shared";
import config from "../addon.config.json";
class ClientPagesService {

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

    private async overrideBlocksData(page: Page, availableBlocks: IBlockLoaderData[], context: IContext | undefined): Promise<void> {
        // Let the blocks manipulate there data and replace it in page blocks
        await Promise.all(page.Blocks.map(async (block: any) => {
            const blockRelation = block.Relation;
            const currentAvailableBlock = availableBlocks.find(ab => ab.relation.AddonUUID === blockRelation.AddonUUID && ab.relation.Name === blockRelation.Name);
            const blockCpiFunc = currentAvailableBlock?.relation.OnPageLoadEndpoint;

            if (blockCpiFunc?.length > 0) {
                try {
                    // Call block CPI side for getting the data to override.
                    const data: any = {
                        url: blockCpiFunc,
                        body: {
                            Configuration: block.Configuration
                        },
                        ...(context && { context }) // Add context if not undefined.
                    };
                    
                    const blockDataToOverride: any = await pepperi.addons.api.uuid(blockRelation.AddonUUID).post(data);
                    block.Configuration = blockDataToOverride?.Configuration ?? block.Configuration;
                }
                catch {
                    // Do nothing
                }
            }
        }));
    }

    private async isSyncInstalled(): Promise<boolean> {
        let isSyncInstalled = false;

        try {
            const res = await pepperi.api.adal.getList({
                addon: 'bb6ee826-1c6b-4a11-9758-40a46acb69c5', // CPI Node
                table: 'addons'
            }); 
            
            isSyncInstalled = res?.objects?.length > 0 ? true : false;
        } catch {
            isSyncInstalled = false;
        }

        return isSyncInstalled;
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
    
    async getPageData(pageKey: string, context: IContext | undefined): Promise<IPageBuilderData> {
        let result: IPageBuilderData;
        const isSyncInstalled = await this.isSyncInstalled();

        if (isSyncInstalled) {
            let page = await this.getPage(pageKey);
            const availableBlocks: IBlockLoaderData[] = await this.getBlocksData('PageBlock');
    
            // This function override blocks data properties in page object.
            await this.overrideBlocksData(page, availableBlocks, context);
    
            result = {
                page: page,           
                availableBlocks: availableBlocks || [],
            }
        } else {
            // Get the page data online if sync isn't installed.
            const temp = await pepperi.papiClient.apiCall("GET", `/internal_api/get_page_data?key=${pageKey}`);
            result = temp.ok ? await(temp.json()) : null;
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
            const temp = await pepperi.papiClient.apiCall("GET", `/addon_blocks/get_addon_block_loader_data?blockType=${blockType}&name=${name}`);
            result = temp.ok ? await(temp.json()) : null;
        }
        
        return result;
    }
    
}
export default ClientPagesService;
