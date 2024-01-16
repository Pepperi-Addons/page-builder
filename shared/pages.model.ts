import { InstalledAddon, Page, PageLayout, SchemeFieldType, ScreenSizeDataConfiguration } from "@pepperi-addons/papi-sdk";

// **********************************************************************************************
//                          Client & User events const
// **********************************************************************************************

// This event is for editor only.
export const CLIENT_ACTION_ON_CLIENT_PAGE_BLOCK_LOAD = 'OnClientPageBlockLoad';

export const CLIENT_ACTION_ON_CLIENT_PAGE_LOAD = 'OnClientPageLoad';
export const CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE = 'OnClientPageStateChange';
export const CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK = 'OnClientPageButttonClick';

// **********************************************************************************************

export const PAGES_TABLE_NAME = 'Pages';

export interface IPageState {
    PageParameters: {
        [key: string]: any;
    },
    BlocksState: {
        // [block key]: state value
        [key: string]: any;
    }
}

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
    Configuration: any;
    ConfigurationPerScreenSize?: ScreenSizeDataConfiguration;    
}

export interface IAvailableBlockData {
    RelationTitle: string,
    RelationAvailable: boolean;
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
    State: IPageState;
    PageView: IPageView;
    AvailableBlocksData?: IAvailableBlockData[];
}

export interface IBlockEndpointResult {
    State: any; // This is the block state
    Configuration: any; // This is the configuration data.
    ConfigurationPerScreenSize: any; // This is the configuration data per screen size.
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
    Key?: string;
    Name?: string;
    Description?: string;
    CreationDate?: string;
    ModificationDate?: string;
    Published: boolean;
    IsDirty: boolean;
}

export interface IPageBuilderData {
    page: Page, 
    availableBlocks: IBlockLoaderData[]
    pagesVariables?: any
}

export interface IBlockLoaderData {
    relation: any, 
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

interface IParamemeter {
    Key: string;
    Type: SchemeFieldType;
    DefaultValue: any;
}
export const SYSTEM_PARAMETERS: IParamemeter[] = [
    { Key: 'AccountUUID', Type: 'String', DefaultValue: '' }
];

import homepage_blank from './template_pages/homepage_blank.json';
import homepage_gridy from './template_pages/homepage_gridy.json';

export const DEFAULT_PAGES_DATA = {
    "homepage_blank": homepage_blank,
    "homepage_gridy": homepage_gridy
}