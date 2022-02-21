import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
declare class MyService {
    private client;
    papiClient: PapiClient;
    constructor(client: Client);
    getRelations(relationName: string): Promise<any>;
    upsertRelation(relation: any): Promise<any>;
}
export default MyService;
