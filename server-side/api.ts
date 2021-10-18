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

export async function remove_page(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.removePage(request.query);
}

export async function save_page(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.savePage(request.body);
}

export async function get_pages_data(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.getPagesData(request.query);
};

export async function get_page_builder_data(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.getPageBuilderData(request.query);
};

export async function restore_to_last_publish(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.restoreToLastPublish(request.query);
}

export async function publish_page(client: Client, request: Request): Promise<any> {
    const service = new PagesApiService(client);
    return service.publishPage(request.body);
};



