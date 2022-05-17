import { PagesApiService } from './pages-api.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function get_page(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        return service.getPage(request?.query['key']);
    } catch(err) {
        throw new Error(`Failed to get page. error - ${err}`);
    }
}

export async function pages(client: Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        let res;

        if (request.method === 'POST') {
            res = service.publishPage(request.body);
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

export async function pages_variables(client:Client, request: Request): Promise<any> {
    try {
        const service = new PagesApiService(client);
        let res;

        if (request.method === 'POST') {
            res = service.savePagesVariables(request.body);
        } else if (request.method === 'GET') {
            res = service.getPagesVariables(request.query);
        } else {
            throw new Error(`Method ${request.method} is not supported.`);
        }

        return res;
    } catch(err) {
        throw err;
    }
}

// export async function pages_import(client:Client, request: Request): Promise<any> {
//     try {
//         const service = new PagesApiService(client);
//         return service.importPages(request.body);
//     } catch(err) {
//         throw err;
//     }
// }

// export async function pages_import_mapping(client:Client, request: Request): Promise<any> {
//     try {
//         const service = new PagesApiService(client);
//         return service.importMappingPages(request.body);
//     } catch(err) {
//         throw err;
//     }
// }

// export async function pages_export(client:Client, request: Request): Promise<any> {
//     try {
//         const service = new PagesApiService(client);
//         return service.exportPages(request.body);
//     } catch(err) {
//         throw err;
//     }
// }