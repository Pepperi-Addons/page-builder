import { PagesApiService } from './pages-api.service'
import { Client, Request } from '@pepperi-addons/debug-server'
import FilesService from './files-service';

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

export async function get_pages_data(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.getPagesData(request.query);
    } catch(err) {
        throw new Error(`Failed to get pages data. error - ${err}`);
    }
};

export async function get_page_data(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.getPageData(request?.query);
    } catch(err) {
        throw new Error(`Failed to get page data. error - ${err}`);
    }
}

export async function get_page_builder_data(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.getPageData(request?.query, true);
    } catch(err) {
        throw new Error(`Failed to get page builder data. error - ${err}`);
    }
};

export async function save_draft_page(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.saveDraftPage(request.body);
    } catch(err) {
        throw new Error(`Failed to save page. error - ${err}`);
    }
}

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

export async function on_uninstall_block_draft(client:Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        await service.deleteBlockFromPages(request.body, true);
    } catch(err) {
        throw new Error(`Failed to remove uninstall block from pages. error - ${err}`);
    }
}

export async function draft_pages_import(client:Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        console.log('@@@@@@@@ draft_pages_import - before importPages ', JSON.stringify(request.body));
        const res = await service.importPages(request.body);
        console.log('@@@@@@@@ draft_pages_import - after importPages ', JSON.stringify(res));
        return res;
        
    } catch(err) {
        throw err;
    }
}

export async function draft_pages_import_mapping(client:Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        console.log('draft_pages_import_mapping - before ', JSON.stringify(request.body));
        const res = await service.importMappingPages(request.body);
        console.log('draft_pages_import_mapping - after ', JSON.stringify(res));
        return res;
    } catch(err) {
        throw err;
    }
}

export async function draft_pages_export(client:Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return await service.exportPages(request.body);
    } catch(err) {
        throw err;
    }
}

export async function get_pages_files_to_download(client:Client, request: Request): Promise<any> {
    try {
        if (request.method === 'GET') {
            const service = new FilesService(client);
            // return await service.getPageFilesToDownload();
            return service.getPageFilesToDownloadHack();
        }
        else {
            throw new Error(`Method ${request.method} not supported`);
        }
    } catch(err) {
        throw err;
    }
}


