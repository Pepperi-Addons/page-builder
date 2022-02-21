import { Client, Request } from '@pepperi-addons/debug-server';
export declare function install(client: Client, request: Request): Promise<any>;
export declare function uninstall(client: Client, request: Request): Promise<any>;
export declare function upgrade(client: Client, request: Request): Promise<any>;
export declare function downgrade(client: Client, request: Request): Promise<any>;
