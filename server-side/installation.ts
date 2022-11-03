
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/
import { Client, Request } from '@pepperi-addons/debug-server'
import { PagesApiService } from './pages-api.service';
import { PagesUpgradeService } from './pages-upgrade.service';
import semver from 'semver';

const pnsKeyForPages = 'uninstall_blocks_subscription';
const pnsKeyForDraftPages = 'uninstall_blocks_subscription_draft';
const pnsFunctionPathForPages = '/api/on_uninstall_block';
const pnsFunctionPathForDraftPages = '/internal_api/on_uninstall_block_draft';

export async function install(client: Client, request: Request): Promise<any> {
    try {
        const pageService = new PagesApiService(client);
        pageService.createPagesTablesSchemes();
        pageService.upsertPagesRelations();
        pageService.subscribeUninstallAddons(pnsKeyForPages, pnsFunctionPathForPages);
        pageService.subscribeUninstallAddons(pnsKeyForDraftPages, pnsFunctionPathForDraftPages);
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    try {
        const pageService = new PagesApiService(client);
        pageService.unsubscribeUninstallAddons(pnsKeyForPages, pnsFunctionPathForPages);
        pageService.unsubscribeUninstallAddons(pnsKeyForDraftPages, pnsFunctionPathForDraftPages);
    } catch (err) {
        throw new Error(`Failed to unsubscribe from PNS. error - ${err}`);
    }
    
    return { success: true, resultObject: {} };
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    try {
        const pageService = new PagesApiService(client);
        pageService.upsertPagesRelations();

        // TODO: Maybe need to remove this.
        // if (request.body.FromVersion && semver.compare(request.body.FromVersion, '0.7.61') < 0) {
        //     const pageUpgradeService = new PagesUpgradeService(client);
        //     await pageUpgradeService.upgradeToVersion61(true);
        // }
    } catch (err) {
        throw new Error(`Failed to upgrade to version 61. error - ${err}`);
    }

    return { success:true, resultObject: {} };
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return { success:true, resultObject: {} };
}