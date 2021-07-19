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
        Name:"SubAddon1",
        Description:"SubAddon1",
        Type: "NgComponent",
        SubType: "NG11",
        AddonUUID: "",
        AddonRelativeURL: "sub_addon_1",
        ComponentName: 'SubAddon1Component',
        ModuleName: 'SubAddon1Module'
    }  
];
