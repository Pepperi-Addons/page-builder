
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { Relation } from './metadata';
import { PageComponentRelations } from './metadata';
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
    // try {
        const relations = await addRelations(client, PageComponentRelations, "PageComponent");
        return relations;
    //     return { success: true, relations };
    // } catch(e){
    //     return { success: false };
    // }
}

async function addRelations(client: Client, relations: Relation[], relationName){
    const service = new MyService(client);
    const promises: Promise<any>[] = [];
    relations.forEach(relation =>{ 
        relation.AddonUUID = client.AddonUUID;
        relation.RelationName = relationName;
        const key = `${relation.Name}_${relation.AddonUUID}_${relation.RelationName}`;
        relation.Key = key;
        promises.push(service.createRelation(relation));
    });
    // const result = await service.createRelation(relations);
    const result = await Promise.all(promises);
    return result;
}