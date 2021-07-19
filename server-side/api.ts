import MyService from './my.service'
import { Client, Request } from '@pepperi-addons/debug-server'
import { ATDMetaData, InstalledAddon} from '@pepperi-addons/papi-sdk';
import { Relation, RemoteModuleOptions } from '../metadata';

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function relations(client: Client, request: Request): Promise<{relations:RemoteModuleOptions[]}> {
    const service = new MyService(client);
    const addonsFields: Relation[] = await service.getRelations(request.body['RelationName']);
    const addonsUuids = [...new Set(addonsFields.filter( row => row.AddonUUID).map(obj => obj.AddonUUID))];
    const addonsPromises: Promise<any>[] = [];
    addonsUuids.forEach( (uuid: any) => addonsPromises.push(service.getInstalledAddon(uuid))); 
    const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);
    const menuEntries: RemoteModuleOptions[] = [];
    addonsFields.forEach( (field: Relation)=> {
        const entryAddon: InstalledAddon & any = addons.find( (addon: InstalledAddon) => addon?.Addon?.UUID === field?.AddonUUID);
        const menuEntry = createRelationEntry(field, entryAddon);
        menuEntries.push(menuEntry);
    });
    return { relations: menuEntries};
};


function createRelationEntry(field: Relation, entryAddon){
    const remoteEntryByType = (type, remoteName = 'remoteEntry') => {
 
        switch (type){
            case "NgComponent":

                if (field?.ComponentName == 'SubAddon4Component'){
                    const res = 'http://localhost:4404/sub_addon_4.js';
                    return res;
                }

                else if (field?.AddonRelativeURL){
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
    const remoteName = field?.AddonRelativeURL ? field.AddonRelativeURL : field?.Type === "NgComponent" ? toSnakeCase(field.ModuleName.toString().replace('Module','')) : '';
    const menuEntry: RemoteModuleOptions & any = {  
        type: field.Type,
        subType: field.SubType, 
        remoteName: remoteName,
        remoteEntry: remoteEntryByType(field?.Type, remoteName),
        componentName: field?.Type === "NgComponent" ? field?.ComponentName : "",
        exposedModule:  field?.Type === "NgComponent" ? "./" + field?.ModuleName : "",
        title: field?.Description.split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' '),
        uuid: field?.AddonUUID,
        key: `${field.Name}_${field.AddonUUID}_${field.RelationName}`,
        visibleEndpoint: field?.VisibilityRelativeURL,
        noModule: field?.Type === "NgComponent" && !(field?.ModuleName) ? true : false,
        update: false,
        addon: entryAddon,
        layout: { section: 0, block: 0}

    }
    return menuEntry;
}

const toSnakeCase = str => 
    str &&
    str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('_');




