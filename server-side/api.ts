import { PagesApiService } from './pages-api.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function pages(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    let res;

    if (request.method === 'POST') {
        res = service.upsertPage(request.body);
    } else if (request.method === 'GET') {
        res = service.getPages(request.query);
    } else {
        throw new Error(`Method ${request.method} is not supported.`);
    }

    return res;
}

export async function create_page(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.createTemplatePage(request.query);
}

export async function delete_page(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.deletePage(request.query);
}

export async function editor_page_data(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.getPageEditorData(request.query);
};

export async function publish_page(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.publishPage(request.body);
};



