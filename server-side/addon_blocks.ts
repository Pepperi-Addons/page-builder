
import { PagesApiService } from './pages-api.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function get_addon_block_loader_data(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.getBlockLoaderData(request?.query['name'], request?.query['blockType'] || 'AddonBlock');
        
    } catch(err) {
        throw new Error(`Failed to get addon block data. error - ${err}`);
    }
}
