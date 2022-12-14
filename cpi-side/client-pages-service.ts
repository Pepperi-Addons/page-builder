import { NgComponentRelation, Page } from "@pepperi-addons/papi-sdk";
import { IBlockLoaderData } from "shared";

class ClientPagesService {
    async getPageData(pageKey: string): Promise<any> {
        let result = {};

        const availableBlocks: IBlockLoaderData[] = await this.getAvailableBlocks();
        const page = await this.getPage(pageKey, availableBlocks);

        result = {
            availableBlocks: availableBlocks || [],
            page: page,           
        }

        return result;
    }
    
    async getPage(pageKey: string, availableBlocks: IBlockLoaderData[]): Promise<any> {
        const page = await pepperi.resources.resource('Pages').key(pageKey).get() as Page;
        return await this.manipulateBlocksData(page, availableBlocks);
        // const page = await pepperi.api.adal.get({
        //     addon: '50062e0c-9967-4ed4-9102-f2bc50602d41', // pages addon
        //     table: 'Pages',
        //     key: pageKey
        // }); 
        // const pageObject =  page.object;
        // return await this.loadLocalAssets(pageObject as Page);
    }

    async manipulateBlocksData(page: Page, availableBlocks: IBlockLoaderData[]): Promise<Page> {
        // Let the blocks manipulate there data and replace it in page blocks
        await Promise.all(page.Blocks.map(async (block: any) => {
            const blockRelation = block.Relation;
            const currentAvailableBlock = availableBlocks.find(ab => ab.relation.AddonUUID === blockRelation.AddonUUID && ab.relation.Name ===blockRelation.Name);
            const blockCpiFunc = currentAvailableBlock?.relation.CPINodeEndpoint;// || 'addon-cpi/test';

            if (blockCpiFunc?.length > 0) {
                try {
                    // Call block CPI side for getting the data to override.
                    const data: any = {
                        AddonUUID: blockRelation.AddonUUID,
                        RelativeURL: blockCpiFunc,
                        Method: 'POST',
                        Body: { 
                            Configuration: block.Configuration
                        }
                    }
                
                    const blockDataToOverride: any = await pepperi.events.emit('AddonAPI', data);
                    block.Configuration = blockDataToOverride.Configuration;
                }
                catch {
                    // Do nothing
                }
            }
        }));
        
        return page;    
    }

    async getAvailableBlocks(): Promise<any> {
        const pageBlocks = await pepperi.addons.data['relations'].pageBlocks();

        const availableBlocks: IBlockLoaderData[] = [];
        pageBlocks.forEach((relation: NgComponentRelation) => {
            availableBlocks.push({
                relation: relation,
                addonPublicBaseURL: `${relation.AddonBaseURL}`,
            } as any);
           
        });

        return availableBlocks;
    }
}
export default ClientPagesService;
