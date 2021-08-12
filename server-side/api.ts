import { PagesService } from './pages.service'
import { Client, Request } from '@pepperi-addons/debug-server'
import { ATDMetaData, InstalledAddon, Relation} from '@pepperi-addons/papi-sdk';
// import { RemoteModuleOptions } from '@pepperi-addons/ngx-remote-loader';
import { Configuration, RemoteModuleOptions } from './pages.model';

export async function pages(client: Client, request: Request): Promise<any> {
    const service = new PagesService(client);
        
    if (request.method === 'POST') {
        service.upsertPage(request.body);
    } else if (request.method === 'GET') {
        service.getPage(request.query);
    } else {
        throw new Error(`Method ${request.method} is not supported.`);
    }
}

export async function init_page(client: Client, request: Request): Promise<any> {
    return getPage(client, request);
};

async function getPage(client: Client, request: Request) {
    const service = new PagesService(client);
    const addonsFields: Relation[] = await service.getRelations(request.body['RelationName']);
    const addonsUuids = [...new Set(addonsFields.filter( row => row.AddonUUID).map(obj => obj.AddonUUID))];
    const addonsPromises: Promise<any>[] = [];
    addonsUuids.forEach( (uuid: any) => addonsPromises.push(service.getInstalledAddon(uuid))); 
    const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);
    const menuEntries: RemoteModuleOptions[] = [];
    
    addonsFields.forEach((field: Relation) => {
        const entryAddon: InstalledAddon & any = addons.find( (addon: InstalledAddon) => addon?.Addon?.UUID === field?.AddonUUID);
        const menuEntry = createRelationEntry(field, entryAddon);
        menuEntries.push(menuEntry);
    });

    addonsFields.forEach((field: Relation) => {
        const entryAddon: InstalledAddon & any = addons.find( (addon: InstalledAddon) => addon?.Addon?.UUID === field?.AddonUUID);
        const menuEntry = createRelationEntry(field, entryAddon, true);
        menuEntries.push(menuEntry);
    });

    return { relations: menuEntries};
}

function createRelationEntry(field: Relation, entryAddon, dupplicate = false) {
    const remoteEntryByType = (type, remoteName = 'remoteEntry') => {
 
        switch (type){
            case "NgComponent":
                // // HACK FOR LOCALHOST PLEASE REMOVE
                // if (field?.ComponentName == 'SlideshowComponent'){
                //     const res = 'http://localhost:4401/slideshow.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon2Component'){
                //     const res = 'http://localhost:4402/sub_addon_2.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon3Component'){
                //     const res = 'http://localhost:4403/sub_addon_3.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon4Component'){
                //     const res = 'http://localhost:4404/sub_addon_4.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon5Component'){
                //     const res = 'http://localhost:4405/sub_addon_5.js';
                //     return res;
                // }
                // else
                // // END OF HACK 
                if (field?.AddonRelativeURL) {
                    return entryAddon?.PublicBaseURL +  field?.AddonRelativeURL + '.js';
                }
                else {
                    return entryAddon?.PublicBaseURL +  remoteName + '.js';
                }
                break;
            default:
                return field?.AddonRelativeURL;
                break;
        }
    }

    const remoteName = field?.AddonRelativeURL ? field.AddonRelativeURL : field?.Type === "NgComponent" ? toSnakeCase(field.ModuleName?.toString().replace('Module','')) : '';
    const obj = Configuration;
    const menuEntry: RemoteModuleOptions & any = {  
        type: field.Type,
        subType: field.SubType, 
        remoteName: remoteName,
        remoteEntry: remoteEntryByType(field?.Type, remoteName),
        componentName: field?.Type === "NgComponent" ? field?.ComponentName : "",
        exposedModule:  field?.Type === "NgComponent" ? "./" + field?.ModuleName : "",
        title: dupplicate ? 'dupplicate' : '' + `${field?.Description}`,
        uuid: field?.AddonUUID,
        key: `${field.Name}_${field.AddonUUID}_${field.RelationName}`,
        visibleEndpoint: field?.VisibilityRelativeURL,
        addon: entryAddon,
        layout: { section: 0, block: 0},
        editorComponentName: field?.Type === "NgComponent" ? field?.EditorModuleName : "",
        editorModuleName: field?.Type === "NgComponent" ? "./" + field?.EditorComponentName : "",

    }

    return {...obj, ...menuEntry};
}

const toSnakeCase = str => 
    str &&
    str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('_');




