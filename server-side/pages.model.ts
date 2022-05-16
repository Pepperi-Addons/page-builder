import { NgComponentRelation, Page } from "@pepperi-addons/papi-sdk";

export interface PageRowProjection {
    Key?: string,
    Name?: string,
    Description?: string,
    CreationDate?: string,
    ModificationDate?: string,
    Published: boolean,
    Draft: boolean,
    // Status: string
}

export interface IPageBuilderData {
    page: Page, 
    availableBlocks: IBlockLoaderData[]
    pagesVariables: any
}

export interface IBlockLoaderData {
    relation: NgComponentRelation, 
    addonPublicBaseURL: string
}

export const DEFAULT_BLOCKS_NUMBER_LIMITATION = {
    key: 'BLOCKS_NUMBER_LIMITATION',
    softValue: 15,
    hardValue: 30
}

export const DEFAULT_PAGE_SIZE_LIMITATION = {
    key: 'PAGE_SIZE_LIMITATION',
    softValue: 150,
    hardValue: 300
}

export const PAGES_NUBER_LIMITATION = 100;

export const DEFAULT_BLANK_PAGE_DATA: Page = {
    // Regular ADAL fields
    // "Hidden": false,
    // "CreationDateTime": "2021-07-22T13:00:11.360Z",
    // "ModificationDateTime": "2021-07-22T13:00:11.360Z",

    // Unique key - mandatory
    "Name": "Page",
    
    //  optional
    "Description": "Description of page",

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

// const PageSchema = {
//     Key: { Type: "String"},
//     Name: { Type: "String"},
//     Description: { Type: "String"},
//     Blocks: {
//         Type: "Array",
//         Items: {
//             Type: "Object",
//             Fields: {
//                 Configuration: {
//                     Type: "ContainedDynamicResource"
//                 }
//             }
//         }
//     },
//     Layout: { 
//         Type: "Object",
//         Fields: {
//             Sections: {
//                 Type: "Array",
//                 Items: {
//                     Type: "Object",
//                     Fields: {
//                         Key: { Type: "String"},
//                         Name: { Type: "String"},
//                         Height: { Type: "String"},
//                         Split: { Type: "String"},
//                         Columns: {
//                             Type: "Array",
//                             Items: {
//                                 Type: "Object",
//                                 Fields: {
//                                     BlockContainer: {
//                                         Type: "Object",
//                                         Fields: {
//                                             BlockKey: { Type: "String"},
//                                             Hide: { 
//                                                 Type: "Array",
//                                                 Items: {
//                                                     Type: "String"
//                                                 }
//                                             },
//                                         }
//                                     }
//                                 }
//                             }
//                         },
//                         Hide: { 
//                             Type: "Array",
//                             Items: {
//                                 Type: "String"
//                             }
//                         },
//                     }
//                 }
//             },
//             SectionsGap: { Type: "String"},
//             CoulmnsGap: { Type: "String"},
//             HorizontalSpacing: { Type: "String"},
//             VerticalSpacing: { Type: "String"},
//             MaxWidth: { Type: "String"},
//         }
//     },
// }