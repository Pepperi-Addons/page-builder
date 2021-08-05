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
        RelationName: "PageBlock",
        Name:"Slideshow",
        Description:"Slideshow",
        Type: "NgComponent",
        SubType: "NG11",
        AddonUUID: "",
        AddonRelativeURL: "slideshow",
        ComponentName: 'SlideshowComponent',
        ModuleName: 'SlideshowModule'
    }  
];