import { PagesApiService } from './pages-api.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function pages(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        let res;

        if (request.method === 'POST') {
            res = service.savePage(request.body);
        } else if (request.method === 'GET') {
            res = service.getPages(request.query);
        } else {
            throw new Error(`Method ${request.method} is not supported.`);
        }

        return res;
    } catch(err) {
        throw err;
    }
}

export async function on_uninstall_block(client:Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        await service.deleteBlockFromPages(request.body);
    } catch(err) {
        throw new Error(`Failed to remove uninstall block from pages. error - ${err}`);
    }
}