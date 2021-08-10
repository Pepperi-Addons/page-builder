
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk'
import MyService from './my.service';

export async function install(client: Client, request: Request): Promise<any> {
    const service = new MyService(client);
    const result = await createPagesTable(service, client);
    return {success: result ? true : false,resultObject:{result}}


   
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    const service = new MyService(client);

    const res = await service.dropTable('Pages');
    return {success:true,resultObject:{res}}
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

async function createPagesTable(service: MyService, client: Client): Promise<any> {
 
    // const pages = await service.getPages(client.AddonUUID);

    // if (!pages) {
        const pagesDataScheme: AddonDataScheme = {
            "Name": "Pages",
            "Type": "data",
            "Fields": {
                "Name": {
                    "Type": "String"
                },
                "Description": {
                    "Type": "String"
                },
                "Type": {
                    "Type": "String"
                }
            }
        };

        return service.createDataScheme(pagesDataScheme);
    // } else {
    //     return Promise.resolve(pages);
    // }
    }