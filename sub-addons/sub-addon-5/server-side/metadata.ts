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
        RelationName: "PageComponent",
        Name:"SubAddon5",
        Description:"SubAddon5",
        Type: "NgComponent",
        SubType: "NG11",
        AddonUUID: "",
        AddonRelativeURL: "sub_addon_5",
        ComponentName: 'SubAddon5Component',
        ModuleName: 'SubAddon5Module'
    }  
];
