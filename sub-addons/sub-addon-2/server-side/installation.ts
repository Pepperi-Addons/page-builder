
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { Relation } from '@pepperi-addons/papi-sdk';

import MyService from './my.service';

export async function install(client: Client, request: Request): Promise<any> {
    const res = await runMigration(client);
    return {success:true,resultObject:{res}}
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    const res = await runMigration(client);
    return {success:true,resultObject:{res}}
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

async function runMigration(client){
    try {
        const pageComponentRelation: Relation = {
            RelationName: "PageBlock",
            Name: "SubAddon2Component",
            Description:"SubAddon2",
            Type: "NgComponent",
            SubType: "NG11",
            AddonUUID: client.AddonUUID,
            AddonRelativeURL: "sub_addon_2",
            ComponentName: 'SubAddon2Component',
            ModuleName: 'SubAddon2Module',
            EditorComponentName: 'SubAddon2EditorComponent',
            EditorModuleName: 'SubAddon2EditorModule'
        };

        pageComponentRelation.Key = `${pageComponentRelation.Name}_${pageComponentRelation.AddonUUID}_${pageComponentRelation.RelationName}`;

        const service = new MyService(client);
        const result = await service.upsertRelation(pageComponentRelation);
        return result;
        
    } catch(e) {
        return { success: false };
    }
}

// async function runMigration(client){
//     try {
//         await addRelations(client, PageComponentRelations, "PageBlock");
//         return { success: true };
//     } catch(e){
//         return { success: false };
//     }
// }

// async function addRelations(client: Client, relations: Relation[], relationName){
//     const service = new MyService(client);
//     const promises: Promise<any>[] = [];
//     relations.forEach(relation =>{ 
//         relation.RelationName = relationName;
//         const key = `${relation.Name}_${relation.AddonUUID}_${relation.RelationName}`;
//         relation.Key = key;
//         promises.push(service.upsertRelation(relation));
//     });
//     const result = await Promise.all(promises);
//     return result;
// }