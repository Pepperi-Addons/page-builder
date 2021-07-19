export interface Relation {
    RelationName: string;
    AddonUUID: string;
    Name: string;
    Description: string;
    Type: "AddonAPI" | "NgComponent" | "Navigate";
    [key:string]:string | boolean | number;
}


export interface RemoteModuleOptions{
    addonData?: object;
    componentName: string;
    exposedModule?: string;
    remoteEntry?: string;
    remoteName: string;
    update?: boolean;
    noModule?: boolean;
    title: string;
    visibleEndpoint?: string;
    type: string | string[];
    subType: string | string[];
    uuid: string;
    addon?: object;
}

export const PageComponentRelations: Relation[]  =[
    {
        "RelationName": "PageComponent",
        "Name":"SubAddon3Component",
        "Description":"SubAddon3",
        "Type": "NgComponent",
        "SubType": "NG11",
        "AddonUUID": "db36ded0-a1c0-4c73-a140-3a736dc3ae6e",
        "AddonRelativeURL": "sub_addon_3",
        "ComponentName": "SubAddon3Component",
        "ModuleName": "SubAddon3Module"
    }  
];
