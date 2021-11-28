import { NgComponentRelation, Page } from "@pepperi-addons/papi-sdk";

export interface PageRowProjection {
    Key?: string,
    Name?: string,
    Description?: string,
    CreationDate?: string,
    ModificationDate?: string,
    Status: string
}

export interface IPageBuilderData {
    page: Page, 
    availableBlocks: IAvailableBlockData[]
}

export interface IAvailableBlockData {
    relation: NgComponentRelation, 
    addonPublicBaseURL: string
    // addon: InstalledAddon 
}

export const TempBlankPageData: Page = {
    // Regular ADAL fields
    // "Hidden": false,
    // "CreationDateTime": "2021-07-22T13:00:11.360Z",
    // "ModificationDateTime": "2021-07-22T13:00:11.360Z",

    // Unique key - mandatory
    "Name": "My page",
    
    //  optional
    "Description": "Description of my page",

    // A list of the blocks on the page
    // We might want to move the actual data of each block to a seperate internal resource
    "Blocks": [
    ],

    // A list of sections in the page
    "Layout": {
        "Sections": [
        ],
    }
}
  