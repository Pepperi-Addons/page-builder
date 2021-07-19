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
        "Name":"SubAddon4Component",
        "Description":"SubAddon4",
        "Type": "NgComponent",
        "SubType": "NG11",
        "AddonUUID": "43265507-7ac4-44ab-8270-d3cf9b2608b4",
        "AddonRelativeURL": "sub_addon_4",
        "ComponentName": "SubAddon4Component",
        "ModuleName": "SubAddon4Module"
    }  
];
