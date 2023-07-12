import { InstalledAddon, NgComponentRelation, Page, PageLayout, ResourceDataConfiguration, ScreenSizeDataConfiguration } from "@pepperi-addons/papi-sdk";

// **********************************************************************************************
//                          Client & User events const
// **********************************************************************************************

export const CLIENT_ACTION_ON_CLIENT_PAGE_LOAD = 'OnClientPageLoad';
export const CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE = 'OnClientPageStateChange';

// **********************************************************************************************

export interface IPageView {
    Key: string;
    Name?: string;
    Description?: string;
    Blocks: PageBlockView[];
    Layout?: PageLayout;
}

export interface PageBlockView {
    Key: string;
    RelationData: { 
        Name: string;
        AddonUUID: string;
    }
    Configuration: ResourceDataConfiguration;
    ConfigurationPerScreenSize?: ScreenSizeDataConfiguration;    
}

export interface IAvailableBlockData {
    RelationName: string,
    RelationAddonUUID: string,
    RelationSchema?: any,
    PageRemoteLoaderOptions: {
        RemoteEntry: string, // "http://.../.../addon_block.js"
        ModuleName: string, // "WebComponents",
        ElementName: string, // "xxx-element-a6f4fd84-d539-41a5-9ff6-946bddebf4d1"
        EditorElementName?: string, // "xxx-editor-element-a6f4fd84-d539-41a5-9ff6-946bddebf4d1"
    }
}

export interface IPageClientEventResult {
    State: {
        PageParameters: {
            [key: string]: any;
        }
    };
    PageView: IPageView;
    AvailableBlocksData?: IAvailableBlockData[];
}

export interface BlockFile {
    name: string;
    url: string;    
}
export interface BlockFiles {
    AddonUUID: string;
    AddonVersion: string;
    Files: BlockFile[];
}
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
    pagesVariables?: any
}

export interface IBlockLoaderData {
    relation: NgComponentRelation, 
    addonPublicBaseURL: string,
    addonVersion?: string,
    addon?: InstalledAddon;
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

import homepage_blank from './template_pages/homepage_blank.json';
import homepage_gridy from './template_pages/homepage_gridy.json';

export const DEFAULT_PAGES_DATA = {
    "homepage_blank": homepage_blank,
    "homepage_gridy": homepage_gridy
}