import { PagesService } from './pages.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function pages(client: Client, request: Request): Promise<any> {
    const service = new PagesService(client);
    let res;

    if (request.method === 'POST') {
        res = service.upsertPage(request.body);
    } else if (request.method === 'GET') {
        res = service.getPage(request.query);
    } else {
        throw new Error(`Method ${request.method} is not supported.`);
    }

    return res;
}

export async function init_page_editor(client: Client, request: Request): Promise<any> {
    const service = new PagesService(client);
    return service.getPageEditorData(request.body);
};



