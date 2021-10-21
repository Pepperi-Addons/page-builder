import { Page } from "@pepperi-addons/papi-sdk";

export interface PageRowProjection {
    Key?: string,
    Name?: string,
    Description?: string,
    CreationDate?: string,
    ModificationDate?: string,
    Status: string
}

export const TempBlankPageData: Page = {
    // Regular ADAL fields
    "Hidden": false,
    "CreationDateTime": "2021-07-22T13:00:11.360Z",
    "ModificationDateTime": "2021-07-22T13:00:11.360Z",

    // Unique key - mandatory
    "Name": "MyTempPage",
    
    //  optional
    "Description": "My temp page",

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
  