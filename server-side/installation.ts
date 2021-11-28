
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/
import { Client, Request } from '@pepperi-addons/debug-server'
import { PagesApiService } from './pages-api.service';

const pnsKeyForPages = 'uninstall_blocks_subscription';
const pnsKeyForDraftPages = 'uninstall_blocks_subscription_draft';
const pnsFunctionPathForPages = '/api/on_uninstall_block';
const pnsFunctionPathForDraftPages = '/internal_api/on_uninstall_block_draft';

export async function install(client: Client, request: Request): Promise<any> {
    try {
        const pageService = new PagesApiService(client);
        await pageService.createPagesTablesSchemes();
        await pageService.subscribeUninstallAddons(pnsKeyForPages, pnsFunctionPathForPages);
        await pageService.subscribeUninstallAddons(pnsKeyForDraftPages, pnsFunctionPathForDraftPages);
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    try {
        const pageService = new PagesApiService(client);
        await pageService.unsubscribeUninstallAddons(pnsKeyForPages, pnsFunctionPathForPages);
        await pageService.unsubscribeUninstallAddons(pnsKeyForDraftPages, pnsFunctionPathForDraftPages);
    } catch (err) {
        throw new Error(`Failed to unsubscribe from PNS. error - ${err}`);
    }
    
    return { success: true, resultObject: {} };
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    return { success:true, resultObject: {} };
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return { success:true, resultObject: {} };
}