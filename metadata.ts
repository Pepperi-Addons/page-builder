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
        Type: "Navigate",
        SubType: "PageBuilder",
        AddonUUID: "f93658be-17b6-4c92-9df3-4e6c7151e038",
        AddonRelativeURL: "sub_addon_2",
        ComponentName: 'SubAddon1Component',
        ModuleName: 'SubAddon1Module'
    },
    {
        RelationName: "PageComponent",
        Name:"SubAddon2",
        Description:"SubAddon2",
        Type: "NgComponent",
        SubType: "NG11",
        AddonUUID: "951ab333-9af6-4636-b90b-04508ba070cc",
        AddonRelativeURL: 'sub_addon_2',
        ComponentName: 'SubAddon2Component',
        ModuleName: 'SubAddon2Module'
    }      
  
];
