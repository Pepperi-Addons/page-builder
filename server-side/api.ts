import { PagesApiService } from './pages-api.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function pages(client: Client, request: Request): Promise<any> {
    try {
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
    } catch(err) {
        throw err;
    }
}

export async function get_page(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        const pageKey = request?.query['key'] || '';
        return service.getByKey(pageKey);
    } catch(err) {
        throw new Error(`Failed to get page. error - ${err}`);
    }
}

export async function create_page(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.createTemplatePage(request.query);
    } catch(err) {
        throw new Error(`Failed to create page. error - ${err}`);
    }
}

export async function remove_page(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.removePage(request.query);
    } catch(err) {
        throw new Error(`Failed to remove page. error - ${err}`);
    }
}

export async function save_page(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.savePage(request.body);
    } catch(err) {
        throw new Error(`Failed to save page. error - ${err}`);
    }
}

export async function get_pages_data(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.getPagesData(request.query);
    } catch(err) {
        throw new Error(`Failed to get pages data. error - ${err}`);
    }
};

export async function get_page_builder_data(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.getPageBuilderData(request.query);
    } catch(err) {
        throw new Error(`Failed to get page builder data. error - ${err}`);
    }
};

export async function restore_to_last_publish(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.restoreToLastPublish(request.query);
    } catch(err) {
        throw new Error(`Failed to restore to last publish. error - ${err}`);
    }
}

export async function publish_page(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.publishPage(request.body);
    } catch(err) {
        throw new Error(`Failed to publish page. error - ${err}`);
    }
};



