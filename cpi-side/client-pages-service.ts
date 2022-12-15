import { IContext } from "@pepperi-addons/cpi-node/build/cpi-side/events";
import { NgComponentRelation, Page } from "@pepperi-addons/papi-sdk";
import { IBlockLoaderData, IPageBuilderData } from "shared";

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

    async getPage(pageKey: string): Promise<Page> {
        const res = await pepperi.api.adal.get({
            addon: '50062e0c-9967-4ed4-9102-f2bc50602d41', // pages addon
            table: 'Pages',
            key: pageKey
        }); 
        const page =  res.object as Page;
        return page;
    }

    async getPageData(pageKey: string, context: IContext | undefined): Promise<IPageBuilderData> {
        let page = await this.getPage(pageKey);
        const availableBlocks: IBlockLoaderData[] = await this.getBlocksData('PageBlock');

        // This function override blocks data properties in page object.
        await this.overrideBlocksData(page, availableBlocks, context);

        const result: IPageBuilderData = {
            page: page,           
            availableBlocks: availableBlocks || [],
        }

        return result;
    }
    
    async getBlocksData(blockType: string = 'AddonBlock', name: string = ''): Promise<IBlockLoaderData[]> {
        let blocks;
        
        if (blockType === 'PageBlock') {
            blocks = await pepperi.addons.data['relations'].pageBlocks();
        } else { // AddonBlock
            blocks = await pepperi.addons.data['relations'].addonBlocks();
        }
        
        const addonBlocksLoaderData = this.convertRelationToBlockLoaderData(blocks, name);
        return addonBlocksLoaderData;
    }
    
}
export default ClientPagesService;
