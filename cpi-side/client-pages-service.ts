import { NgComponentRelation, Page } from "@pepperi-addons/papi-sdk";
import { IBlockLoaderData } from "shared";

class ClientPagesService {
    async getPageData(pageKey: string): Promise<any> {
        let result = {};
        const availableBlocks = await this.getAvailableBlocks();
            const page = await this.getPage(pageKey);

            result = {
                availableBlocks: availableBlocks || [],
                pagesVariables: [], // no need in cpi-side
                page: page,           
            }
        return result;
    }
    
    async getPage(pageKey: string): Promise<any> {
        const page = await pepperi.api.adal.get({
            addon: '50062e0c-9967-4ed4-9102-f2bc50602d41', // pages addon
            table: 'Pages',
            key: pageKey
        }); 
        const pageObject =  page.object;
        return await this.loadLocalAssets(pageObject as Page);
    }

    async loadLocalAssets(page: Page): Promise<Page> {
        // through each slideshow block, replace the image url with the correct url
        // TODO in the future, this, shouldn't be hardcoded!
        await Promise.all(page.Blocks.map(async (block: any) => {
            const configuration = block.Configuration;
            if (configuration.Resource === 'Slideshow') {
                await Promise.all(configuration.Data.slides.map(async (slide: any) => {
                    const assetKey = slide.image.asset;
                    const assetUrl = (await pepperi.files.assets.get(assetKey)).URL
                    slide.image.assetURL = assetUrl;
                }));
            }
            if (configuration.Resource === 'Gallery') {
                await Promise.all(configuration.Data.cards.map(async (card: any) => {
                    const assetKey = card.asset;
                    const assetUrl = (await pepperi.files.assets.get(assetKey)).URL
                    card.assetURL = assetUrl;
                }));;
            }
        }));
        
        return page;    
    }

    async getAvailableBlocks(): Promise<any> {
        // Get the PageBlock relations 
        const pageBlockRelations: NgComponentRelation[] = await this.getRelations('PageBlock');
            
        // Distinct the addons uuid's
        // const distinctAddonsUuids = [...new Set(pageBlockRelations.map(obj => obj.AddonUUID))];

        // Get the installed addons (for the relative path and the current version)
        // const addonsPromises: Promise<any>[] = [];
     
        const baseURL = "http://localhost:8088/files/Pages/Addon/Public/";
        const availableBlocks: IBlockLoaderData[] = [];
        pageBlockRelations.forEach((relation: NgComponentRelation) => {
            availableBlocks.push({
                relation: relation,
                addonPublicBaseURL: `${baseURL}${relation.AddonUUID}/`,
            } as any);
           
        });

        return availableBlocks;
    }
    
    async getRelations(relationName: string): Promise<NgComponentRelation[]> {
        const relations = await  pepperi.api.adal.getList({
            addon: '5ac7d8c3-0249-4805-8ce9-af4aecd77794', // relations addon
            table: "AddonRelations"
        });
        const objs =  relations.objects as any[];
        return objs.filter(obj => obj.RelationName === relationName);         
    }

}
export default ClientPagesService;
