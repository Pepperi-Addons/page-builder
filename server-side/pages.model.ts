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

export interface IPagesVariable {
    Key: string,
    Value: string
}

export const DEFAULT_BLOCKS_NUMBER_LIMITATION = {
    key: 'BLOCKS_NUMBER_LIMITATION',
    softValue: 15,
    hardValue: 30
}

export const DEFAULT_BLOCKS_SIZE_LIMITATION = {
    key: 'BLOCKS_SIZE_LIMITATION',
    softValue: 150,
    hardValue: 300
}

export const DEFAULT_BLANK_PAGE_DATA: Page = {
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
            {
                "Key": "99dfdff5-d042-4f4b-94ec-1d4fb238adba",
                "Columns": [{}],
            }
        ],
    }
}
  