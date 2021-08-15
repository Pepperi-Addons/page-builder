import { PagesService } from './pages.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function pages(client: Client, request: Request): Promise<any> {
    const service = new PagesService(client);
        
    if (request.method === 'POST') {
        service.upsertPage(request.body);
    } else if (request.method === 'GET') {
        service.getPage(request.query);
    } else {
        throw new Error(`Method ${request.method} is not supported.`);
    }
}

export async function init_page_editor(client: Client, request: Request): Promise<any> {
    const service = new PagesService(client);
    return service.getPageEditorData(request.body);
};



