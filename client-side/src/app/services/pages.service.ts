import { CdkDragDrop, CdkDragEnd, CdkDragStart, copyArrayItem, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Injectable } from "@angular/core";
import { Params } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { PepGuid, PepHttpService, PepScreenSizeType, PepSessionService, PepUtilitiesService } from "@pepperi-addons/ngx-lib";
import { IBlockLoaderData, PepRemoteLoaderOptions, PepRemoteLoaderService } from "@pepperi-addons/ngx-lib/remote-loader";
import { IPepDraggableItem } from "@pepperi-addons/ngx-lib/draggable-items";
import { Page, PageBlock, NgComponentRelation, PageSection, PageSizeType, SplitType, PageSectionColumn, DataViewScreenSize,ResourceType, PageConfigurationParameterFilter, PageConfiguration, PageConfigurationParameterBase, PageConfigurationParameter } from "@pepperi-addons/papi-sdk";
import { Observable, BehaviorSubject } from 'rxjs';
import { NavigationService } from "./navigation.service";
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { UtilitiesService } from "./utilities.service";
import * as _ from 'lodash';
// import { WebComponentWrapperOptions } from "@angular-architects/module-federation-tools";

export type UiPageSizeType = PageSizeType | 'none';

export type PageRowStatusType = 'draft' | 'published';
export interface IPageRowModel {
    Key: string,
    Name: string,
    Description: string,
    CreationDate: string,
    ModificationDate: string,
    Published: boolean,
    Draft: boolean,
    // Status: PageRowStatusType,
}

interface IPageBuilderData {
    page: Page,
    availableBlocks: IBlockLoaderData[],
    pagesVariables: any
}

export type EditorType = 'page-builder' | 'section' | 'block';
export interface IEditor {
    id: string,
    title: string,
    type: EditorType,
    remoteModuleOptions?: PepRemoteLoaderOptions,
    loadElement?: boolean,
    hostObject?: any
}

export interface IPageEditor {
    id: string,
    pageName: string,
    pageDescription: string,
    maxWidth: number,
    horizontalSpacing?: PageSizeType,
    verticalSpacing?: PageSizeType,
    sectionsGap?: PageSizeType,
    columnsGap?: PageSizeType,
    roundedCorners?: PageSizeType,
}

export interface ISectionEditor {
    id: string,
    sectionName: string,
    split: SplitType,
    height: number,
    fillHeight: boolean
}

export interface IBlockEditor {
    id: string,
    configuration?: any,
}

export interface IBlockProgress {
    block: PageBlock;
    loaded: boolean;
    openEditorOnLoaded: boolean,
    priority: number;
}

interface IProducerFilterData {
    FieldType: string;
    ApiName: string
    Operation: string
    Values: string[]
}

interface IProducerFilter {
    // key: string;
    resource: ResourceType;
    filter: IProducerFilterData;
}

interface IProducerParameters {
    // key is the block key, value is string | IProduceFilter[]
    producerParametersMap: Map<string, string | IProducerFilter[]>;
}

export interface IPageBlockHostObject {
    configuration: any;
    configurationSource?: any;
    pageConfiguration?: PageConfiguration;
    pageParameters?: any;
    parameters?: any;
}

interface IMappingResource {
    ResourceApiNames: string[];
    SearchIn: string[]
}

@Injectable({
    providedIn: 'root',
})
export class PagesService {
    private readonly CONSUMERS_PRIORITY = 1;
    private readonly PRODUCERS_AND_CONSUMERS_PRIORITY = 2;
    private readonly PRODUCERS_PRIORITY = 3;
    private readonly SYSTEM_PARAMETER_KEY = 'SystemParameter';

    readonly BLOCKS_NUMBER_LIMITATION_OBJECT = {
        key: 'BLOCKS_NUMBER_LIMITATION',
        value: 15
    }

    readonly PAGE_SIZE_LIMITATION_OBJECT = {
        key: 'PAGE_SIZE_LIMITATION',
        value: 150
    }

    private _defaultSectionTitle = '';
    set defaultSectionTitle(value: string) {
        if (this._defaultSectionTitle === '') {
            this._defaultSectionTitle = value;
        }
    }

    private _editorsBreadCrumb = Array<IEditor>();

    // This subject is for the screen size change events.
    private _screenSizeSubject: BehaviorSubject<PepScreenSizeType> = new BehaviorSubject<PepScreenSizeType>(PepScreenSizeType.XL);
    get screenSizeChange$(): Observable<PepScreenSizeType> {
        return this._screenSizeSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for demostrate the container size (Usage only in edit mode).
    private _screenWidthSubject: BehaviorSubject<string> = new BehaviorSubject<string>('100%');
    get screenWidthChange$(): Observable<string> {
        return this._screenWidthSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load the current editor (Usage only in edit mode).
    private _editorSubject: BehaviorSubject<IEditor> = new BehaviorSubject<IEditor>(null);
    get editorChange$(): Observable<IEditor> {
        return this._editorSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load available blocks on the main editor (Usage only in edit mode).
    private _availableBlocksSubject: BehaviorSubject<NgComponentRelation[]> = new BehaviorSubject<NgComponentRelation[]>([]);
    get availableBlocksLoadedSubject$(): Observable<NgComponentRelation[]> {
        return this._availableBlocksSubject.asObservable().pipe(distinctUntilChanged());
    }

    // For load the blocks
    private _blocksRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();
    // For load the blocks editors
    private _blocksEditorsRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();

    // This is the sections subject (a pare from the page object)
    private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get sectionsChange$(): Observable<PageSection[]> {
        return this._sectionsSubject.asObservable();
    }

    // This subjects is for load the page blocks into map for better performance and order them by priorities.
    private _pageBlockProgressMap = new Map<string, IBlockProgress>();
    get pageBlockProgressMap(): ReadonlyMap<string, IBlockProgress> {
        return this._pageBlockProgressMap;
    }
    private _pageBlockProgressMapSubject = new BehaviorSubject<ReadonlyMap<string, IBlockProgress>>(this.pageBlockProgressMap);
    get pageBlockProgressMapChange$(): Observable<ReadonlyMap<string, IBlockProgress>> {
        return this._pageBlockProgressMapSubject.asObservable();
    }

    // This is for the current stage of the priority to know what to load in each step.
    private _currentBlocksPriority: number = this.CONSUMERS_PRIORITY;
    get currentBlocksPriority() {
        return this._currentBlocksPriority;
    }

    // This subject is for page block change.
    private _pageBlockSubject: BehaviorSubject<PageBlock> = new BehaviorSubject<PageBlock>(null);
    get pageBlockChange$(): Observable<PageBlock> {
        return this._pageBlockSubject.asObservable();
    }

    // This subject is for page change.
    private _pageSubject: BehaviorSubject<Page> = new BehaviorSubject<Page>(null);
    get pageLoad$(): Observable<Page> {
        return this._pageSubject.asObservable().pipe(distinctUntilChanged((prevPage, nextPage) => prevPage?.Key === nextPage?.Key));
    }
    get pageDataChange$(): Observable<Page> {
        return this._pageSubject.asObservable().pipe(filter(page => !!page));
    }

    // This map is for producers parameters by parameter key.
    private _producerParameterKeysMap = new Map<string, IProducerParameters>();

    // This subject is for consumers parameters change.
    private _consumerParametersMapSubject = new BehaviorSubject<Map<string, any>>(null);
    get consumerParametersMapChange$(): Observable<ReadonlyMap<string, any>> {
        return this._consumerParametersMapSubject.asObservable().pipe(distinctUntilChanged());
    }

    private _mappingsResourcesFields = new Map<string, IMappingResource>();

    // This subject is for edit mode when block is dragging now or not.
    private _draggingBlockKey: BehaviorSubject<string> = new BehaviorSubject('');
    get draggingBlockKey(): Observable<string> {
        return this._draggingBlockKey.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for edit mode when section is dragging now or not.
    private _draggingSectionKey: BehaviorSubject<string> = new BehaviorSubject('');
    get draggingSectionKey(): Observable<string> {
        return this._draggingSectionKey.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for lock or unlock the screen (Usage only in edit mode).
    private _lockScreenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    get lockScreenChange$(): Observable<boolean> {
        return this._lockScreenSubject.asObservable().pipe(distinctUntilChanged());
    }

    // Indicates if the pages should run on offline mode.
    public isOffline: boolean = false;

    constructor(
        private utilitiesService: UtilitiesService,
        private pepUtilitiesService: PepUtilitiesService,
        private translate: TranslateService,
        private sessionService: PepSessionService,
        private httpService: PepHttpService,
        private remoteLoaderService: PepRemoteLoaderService,
        private navigationService: NavigationService,
    ) {
        this.pageLoad$.subscribe((page: Page) => {
            this.loadDefaultEditor(page);
            this.notifySectionsChange(page?.Layout.Sections ?? []);
            this.loadBlocks(page);
        });

        this.pageBlockProgressMapChange$.subscribe((blocksProgress: ReadonlyMap<string, IBlockProgress>) => {
            let needToRebuildFilters = false;

            // Check that all pageProducersFiltersMap blocks keys exist in blocksProgress (if some block is removed we need to clear his filter).
            this._producerParameterKeysMap.forEach((value: IProducerParameters, parameterKey: string) => {
                value?.producerParametersMap.forEach((parameterValue: any, producerBlockKey: string) => {
                    // If the producer block key is not system and not exist in the blocks progress.
                    if (producerBlockKey !== this.SYSTEM_PARAMETER_KEY && !blocksProgress.has(producerBlockKey)) {
                        // Delete the producer data in the current parameter.
                        value.producerParametersMap.delete(producerBlockKey);
                        needToRebuildFilters = true;
                    }
                });
            });

            if (needToRebuildFilters) {
                this.buildConsumersParameters();
            }
        });

        // Set the mappings resources.
        this.createMappingsResourcesMap();
    }

    private createMappingsResourcesMap(): void {
        this._mappingsResourcesFields.set('accounts', {
            ResourceApiNames: ['Account', 'OriginAccount'],
            SearchIn: ['activities', 'transactions', 'transaction_lines']
        });

        this._mappingsResourcesFields.set('transactions', {
            ResourceApiNames: ['Transaction'],
            SearchIn: ['transaction_lines']
        });

        this._mappingsResourcesFields.set('items', {
            ResourceApiNames: ['Item'],
            SearchIn: ['transaction_lines']
        });
    }

    private loadBlocks(page: Page) {
        if (page) {
            // Some logic to load the blocks by priority (first none or Produce only, second Consume & Produce, third Consume only).
            if (page.Blocks) {
                page.Blocks.forEach(block => {
                    const isUIBlock = this.doesBlockExistInUI(block.Key);

                    if (isUIBlock) {
                        const bp = this.addBlockProgress(block);

                        // If the currentBlocksPriority is smaller then bp.priority set the bp.priority as the current.
                        if (this.currentBlocksPriority < bp.priority) {
                            // Set the current priority to start load all blocks by the current priority.
                            this._currentBlocksPriority = bp.priority;
                        }
                    } else {
                        // If this block is not declared on any section (not UI block) do nothing.
                    }
                });

                this.notifyBlockProgressMapChange();
            }
        }
    }

    private getBlockPriority(block: PageBlock): number {
        // first none or Produce only, second Consume & Produce, third Consume only
        let priority = this.PRODUCERS_PRIORITY;

        if (block.PageConfiguration?.Parameters.length > 0) {
            const isConsumeFilters = block.PageConfiguration.Parameters.some(param => param.Consume);
            const isProduceFilters = block.PageConfiguration.Parameters.some(param => param.Produce);

            if (isConsumeFilters) {
                if (isProduceFilters) {
                    priority = this.PRODUCERS_AND_CONSUMERS_PRIORITY;
                } else {
                    priority = this.CONSUMERS_PRIORITY;
                }
            }
        }

        return priority;
    }

    private setBlockAsLoadedAndCalculateCurrentPriority(blockKey: string) {
        const bpToUpdate = this._pageBlockProgressMap.get(blockKey);

        if (bpToUpdate && !bpToUpdate.loaded) {
            // Load editor only for the first time if openEditorOnLoaded is true.
            if (bpToUpdate.openEditorOnLoaded) {
                // setTimeout 0 for navigate on the UI thread.
                setTimeout(() => {
                    this.navigateToEditor('block', bpToUpdate.block.Key);

                    // unlock the screen.
                    this._lockScreenSubject.next(false);
                }, 0);
            }

            bpToUpdate.loaded = true;

            let allBlocksWithSamePriorityLoaded = true;

            this._pageBlockProgressMap.forEach(bp => {
                if (bp.priority === this.currentBlocksPriority && !bp.loaded) {
                    allBlocksWithSamePriorityLoaded = false;
                }
            });

            // Only if all blocks from the same priority are loaded then move on to the next priority.
            if (allBlocksWithSamePriorityLoaded) {
                // Start from the lowest priority and change to the higest priority if exist
                let nextPriority = this.CONSUMERS_PRIORITY;

                // Find the next priority to load.
                this._pageBlockProgressMap.forEach(bp => {
                    if (!bp.loaded && bp.priority > nextPriority) {
                        nextPriority = bp.priority;
                    }
                });

                // Set the next priority.
                if (this._currentBlocksPriority != nextPriority) {
                    this._currentBlocksPriority = nextPriority;

                    // If we move to the consumers priority
                    if (this._currentBlocksPriority === this.CONSUMERS_PRIORITY) {
                        this.buildConsumersParameters();
                    }
                }
            }

            this.notifyBlockProgressMapChange();
        }
    }

    // Check if the block key exist in layout -> sections -> columns (if shows in the UI).
    private doesBlockExistInUI(blockKey: string) {
        const page = this._pageSubject.getValue();

        for (let sectionIndex = 0; sectionIndex < page.Layout.Sections.length; sectionIndex++) {
            const section = page.Layout.Sections[sectionIndex];

            for (let columnIndex = 0; columnIndex < section.Columns.length; columnIndex++) {
                const column = section.Columns[columnIndex];

                if (column.BlockContainer?.BlockKey === blockKey) {
                    return true;
                }
            }
        }

        return false;
    }

    private addBlockProgress(block: PageBlock, openEditorOnLoaded: boolean = false): IBlockProgress {
        const priority = this.getBlockPriority(block);

        // Create block progress and add it to the map.
        const initialProgress: IBlockProgress = {
            loaded: false,
            openEditorOnLoaded,
            priority,
            block
        };

        this._pageBlockProgressMap.set(block.Key, initialProgress);

        return initialProgress;
    }

    private addPageBlock(block: PageBlock, openEditorOnLoaded: boolean) {
        // Add the block to the page blocks.
        const page = this._pageSubject.getValue();
        page.Blocks.push(block);
        this.notifyPageChange(page);

        // Add the block progress.
        this.addBlockProgress(block, openEditorOnLoaded);
        this.notifyBlockProgressMapChange();
    }

    private removePageBlock(blockId: string) {
        const page = this._pageSubject.getValue();
        const index = page.Blocks.findIndex(block => block.Key === blockId);

        if (index > -1) {
            page.Blocks.splice(index, 1);
            this.notifyPageChange(page);
        }
    }

    private removePageBlocks(blockIds: string[]) {
        if (blockIds.length > 0) {
            blockIds.forEach(blockId => {
                // Remove the block from the page blocks.
                this.removePageBlock(blockId)

                // Remove the block progress from the map.
                if (this._pageBlockProgressMap.has(blockId)) {
                    this._pageBlockProgressMap.delete(blockId);
                }
            });

            this.notifyBlockProgressMapChange();
        }
    }

    private removeAllBlocks() {
        const page = this._pageSubject.getValue();

        if (page) {
            page.Blocks = [];
            this.notifyPageChange(page);
        }

        this._pageBlockProgressMap.clear();
        this.notifyBlockProgressMapChange();
    }

    private notifyPageChange(page: Page) {
        this._pageSubject.next(page);
    }

    private notifySectionsChange(sections: PageSection[]) {
        const page = this._pageSubject.getValue();

        if (page) {
            page.Layout.Sections = sections;

            this._sectionsSubject.next(page.Layout.Sections);
            this.notifyPageChange(page);
        }
    }

    private notifyBlockChange(block: PageBlock) {
        // The blocks are saved by reference so we don't need to update the block property just notify that page is change (existing block in blocks).
        this._pageBlockSubject.next(block);
        const page = this._pageSubject.getValue();
        this.notifyPageChange(page);
    }

    private notifyEditorChange(editor: IEditor) {
        this._editorSubject.next(editor);
    }

    private notifyBlockProgressMapChange() {
        this._pageBlockProgressMapSubject.next(this.pageBlockProgressMap);
    }

    private getProducerFiltersByConsumerFilter(producerFilters: IProducerFilter[], consumerFilter: PageConfigurationParameterFilter): IProducerFilter[] {
        // Get the match filters by the resource and fields.
        let consumerFilters = [];

        if (producerFilters?.length > 0) {
            producerFilters.forEach(producerFilter => {
                // Search for exact match
                if (producerFilter.resource === consumerFilter.Resource && consumerFilter.Fields.some((apiName) => apiName === producerFilter.filter.ApiName)) {
                    consumerFilters.push(producerFilter);
                } else {
                    // Check if there is a match by the mapping.
                    if (this._mappingsResourcesFields.has(producerFilter.resource)) {
                        let mappingResource = this._mappingsResourcesFields.get(producerFilter.resource);

                        // If the consumer resource is in the mappingResource.SearchIn then look for match.
                        if (mappingResource.SearchIn.some((resourceToSearch) => resourceToSearch === consumerFilter.Resource)) {
                            // Go for all the resources.
                            for (let index = 0; index < mappingResource.ResourceApiNames.length; index++) {
                                // Declare the complex api name
                                const complexApiName = `${mappingResource.ResourceApiNames[index]}.${producerFilter.filter.ApiName}`;

                                // If the complex api name exist in the consumerFilter.Fields (even a part of it).
                                const filterFieldApiName = consumerFilter.Fields.find((apiName) => apiName.indexOf(complexApiName) >= 0);
                                if (filterFieldApiName) {
                                    // Copy the producer filter (by value) and change the API name to be like the consumer need to get.
                                    const tmpFilterToAdd = JSON.parse(JSON.stringify(producerFilter));
                                    tmpFilterToAdd.filter.ApiName = filterFieldApiName;
                                    consumerFilters.push(tmpFilterToAdd);
                                }
                            }
                        }
                    }
                }
            });
        }

        return consumerFilters;
    }

    private getConsumerFilter(producerFilters: IProducerFilter[]): any {
        let res = {};

        if (producerFilters.length === 1) {
            const produceFilter = producerFilters.pop();
            res = produceFilter.filter;
        } else if (producerFilters.length >= 2) {
            const rightFilter = producerFilters.pop();

            res['Operation'] = 'AND';
            res['RightNode'] = rightFilter.filter;

            // After pop (when we have exaclly 2 filters)
            if (producerFilters.length == 1) {
                const leftFilter = producerFilters.pop();
                res['LeftNode'] = leftFilter.filter;
            } else {
                res['LeftNode'] = this.getConsumerFilter(producerFilters);
            }
        }

        return res;
    }

    private isFilterValid(producerFilter: IProducerFilter): boolean {
        let res = true;

        if (producerFilter.hasOwnProperty('resource') &&
            producerFilter.hasOwnProperty('filter')) {

            if (!producerFilter.filter.hasOwnProperty('ApiName') ||
                !producerFilter.filter.hasOwnProperty('FieldType') ||
                !producerFilter.filter.hasOwnProperty('Operation') ||
                !producerFilter.filter.hasOwnProperty('Values')) {
                res = false;
            }
        } else {
            res = false;
        }

        return res;
    }

    private setProducerParameter(parameterKey: string, parameterValue: string | IProducerFilter[], blockKey: string = this.SYSTEM_PARAMETER_KEY) {
        // Create new producerParameters map if key isn't exists.
        if (!this._producerParameterKeysMap.has(parameterKey)) {
            this._producerParameterKeysMap.set(parameterKey, { producerParametersMap: new Map<string, any>() });
        }

        // Set the producer parameter value in _producerParameterKeysMap.
        this._producerParameterKeysMap.get(parameterKey).producerParametersMap.set(blockKey, parameterValue);
    }

    private canProducerRaiseFilter(filtersParameters: PageConfigurationParameterFilter[], producerFilter: IProducerFilter): boolean {
        let res = false;

        // Get the match filters that blockFilter.resource is equals producerFilters Resource.
        const matchProducerFilters = filtersParameters.filter(filter => filter.Resource === producerFilter.resource);

        if (matchProducerFilters && matchProducerFilters.length > 0) {
            // Check if the blockFilter.ApiName exist in the matchProducerFilters.Fields.
            for (let index = 0; index < matchProducerFilters.length; index++) {
                const filter = matchProducerFilters[index];

                if (filter.Fields.some(field => field === producerFilter.filter.ApiName)) {
                    res = true;
                    break;
                }
            }
        }

        return res;
    }

    // Build the consumer parameters map by the parameters keys and the producers filters.
    private buildConsumersParameters() {
        let consumersParametersMap = new Map<string, any>();

        // Run on all consumers.
        this.pageBlockProgressMap.forEach((blockProgress: IBlockProgress, key: string) => {
            const consumerParameters = blockProgress.block.PageConfiguration?.Parameters.filter(param => param.Consume) as PageConfigurationParameterBase[];

            if (consumerParameters?.length > 0) {
                let consumerParametersObject = {};

                // Go for all the consumer parameters
                for (let index = 0; index < consumerParameters.length; index++) {
                    const consumerParameter = consumerParameters[index];

                    if (consumerParameter.Type === 'String') {
                        // Add all parameters to this consumer.
                        if (consumerParameter.Key === '*') {
                            this._producerParameterKeysMap.forEach((value: IProducerParameters, parameterKey: string) => {
                                // Get the producer strings.
                                const producerStringMap = value.producerParametersMap;

                                // The last value will override (can be only one value for parameter key of type string).
                                producerStringMap?.forEach((value: string, key: string) => {
                                    consumerParametersObject[parameterKey] = value;
                                });
                            });
                        } else {
                            // Get the producer strings by the parameter key.
                            const producerStringMap = this._producerParameterKeysMap.get(consumerParameter.Key)?.producerParametersMap;

                            // The last value will override (can be only one value for parameter key of type string).
                            producerStringMap?.forEach((value: string, key: string) => {
                                consumerParametersObject[consumerParameter.Key] = value;
                            });
                        }
                    } else if (consumerParameter.Type === 'Filter') {
                        let consumerFilters: IProducerFilter[] = [];
                        // Get the producer filters by the parameter key.
                        const producerFiltersMap = this._producerParameterKeysMap.get(consumerParameter.Key)?.producerParametersMap;

                        // Check if resource exist in the producers filters.
                        producerFiltersMap?.forEach((value: IProducerFilter[], key: string) => {
                            let filtersByConsumerResource = this.getProducerFiltersByConsumerFilter(value, consumerParameter as PageConfigurationParameterFilter);

                            if (filtersByConsumerResource) {
                                consumerFilters.push(...filtersByConsumerResource);
                            }
                        });

                        // Build host object filter from consumerFilters ("Operation": "AND", "RightNode": { etc..)
                        if (consumerFilters.length > 0) {
                            consumerParametersObject[consumerParameter.Key] = this.getConsumerFilter(consumerFilters);
                        }
                    }
                }

                // Add the consumerParametersObject to the consumersParametersMap
                consumersParametersMap.set(blockProgress.block.Key, consumerParametersObject);
            }
        });

        this._consumerParametersMapSubject.next(consumersParametersMap);
    }

    private loadDefaultEditor(page: Page) {
        this._editorsBreadCrumb = new Array<IEditor>();

        if (page) {
            const pageEditor: IPageEditor = {
                id: page?.Key,
                pageName: page?.Name,
                pageDescription: page?.Description,
                maxWidth: page?.Layout.MaxWidth,
                verticalSpacing: page?.Layout.VerticalSpacing,
                horizontalSpacing: page?.Layout.HorizontalSpacing,
                sectionsGap: page?.Layout.SectionsGap,
                columnsGap: page?.Layout.ColumnsGap,
                // roundedCorners: page?.Layout.
            };

            this._editorsBreadCrumb.push({
                id: 'main',
                type : 'page-builder',
                title: page?.Name,
                hostObject: pageEditor
            });

            this.notifyEditorChange(this._editorsBreadCrumb[0]);
        } else {
            this.notifyEditorChange(null);
        }
    }

    private changeCurrentEditor() {
        if (this._editorsBreadCrumb.length > 0) {
            this.notifyEditorChange(this._editorsBreadCrumb[this._editorsBreadCrumb.length - 1]);
        }
    }

    private getEditor(editorType: EditorType, id: string): IEditor {
        // Build editor object.
        let editor: IEditor = null;

        if (editorType === 'section') {
            editor = this.getSectionEditor(id);
        } else if (editorType === 'block') {
            editor = this.getBlockEditor(id);
        }

        return editor;
    }

    private getMergedConfigurationData(block: PageBlock, configurationSource = false): any {
        // Copy the object data.
        let configurationData = JSON.parse(JSON.stringify(block.Configuration.Data));
        const currentScreenType = this.getScreenType(this._screenSizeSubject.getValue());

        // Get the configuration data by the current screen size (if exist then merge it up to Tablet and up to Landscape).
        if (currentScreenType !== 'Landscape' && block.ConfigurationPerScreenSize) {
            if (configurationSource) {
                if (currentScreenType === 'Phablet') {
                    configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Tablet);
                }
            } else {
                // Merge from Tablet
                configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Tablet);

                // If currentScreenType === 'Phablet' merge from mobile
                if (currentScreenType === 'Phablet') {
                    configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Mobile);
                }
            }
        }

        return configurationData;
    }

    private getEditorHostObject(block: PageBlock, addconfigurationSource = false): IPageBlockHostObject {

        let hostObject: IPageBlockHostObject = {
            configuration: this.getMergedConfigurationData(block)
        };

        // To let the block editor the option to know if to show reset (used for ConfigurationPerScreenSize).
        // with this property the editor can show the reset button if configuration property isn't equal to configurationSource property.
        if (addconfigurationSource) {
            let configurationSource = this.getMergedConfigurationData(block, true)
            hostObject.configurationSource = configurationSource;
        }

        // Add pageConfiguration if exist.
        if (block.PageConfiguration) {
            hostObject.pageConfiguration = block.PageConfiguration;
        }

        // Add all page parameters (if there is more then one parameter the last will override).
        const pageParameters: any = {};
        this._producerParameterKeysMap.forEach((value: IProducerParameters, parameterKey: string) => {
            value?.producerParametersMap.forEach((parameterValue: any, producerBlockKey: string) => {
                pageParameters[parameterKey] = parameterValue;
            });
        });
        hostObject.pageParameters = pageParameters;

        return hostObject;
    }

    private getSectionEditorTitle(section: PageSection, sectionIndex: number): string {
        return section.Name || `${this._defaultSectionTitle} ${sectionIndex + 1}`;
    }

    private getSectionEditor(sectionId: string): IEditor {
        // Get the current block.
        const sections = this._sectionsSubject.getValue();
        const sectionIndex = sections.findIndex(section => section.Key === sectionId);

        if (sectionIndex >= 0) {
            let section = sections[sectionIndex];
            const sectionEditor: ISectionEditor = {
                id: section.Key,
                sectionName: section.Name || '',
                split: section.Split || undefined,
                height: section.Height || 0,
                fillHeight: section.FillHeight ?? false
            }

            return {
                id: sectionId,
                type: 'section',
                title: this.getSectionEditorTitle(section, sectionIndex),
                hostObject: sectionEditor
            }
        } else {
            return null;
        }
    }

    private getSectionColumnById(sectionColumnId: string): PageSectionColumn {
        let currentColumn = null;

        // Get the section and column array by the pattern of the section column key.
        const sectionColumnPatternSeparator = this.getSectionColumnKey();
        const sectionColumnArr = sectionColumnId.split(sectionColumnPatternSeparator);

        if (sectionColumnArr.length === 2) {
            const sections = this._sectionsSubject.getValue();

            // Get the section id to get the section index.
            const sectionId = sectionColumnArr[0];
            const sectionIndex = sections.findIndex(section => section.Key === sectionId);
            // Get the column index.
            const columnIndex = this.pepUtilitiesService.coerceNumberProperty(sectionColumnArr[1], -1);
            if (sectionIndex >= 0 && columnIndex >= 0) {
                currentColumn = sections[sectionIndex].Columns[columnIndex];
            }
        }

        return currentColumn;
    }

    private getRemoteEntryByType(remoteBasePath: string, relation: NgComponentRelation) {
        // For devBlocks gets the remote entry from the query params.
        const devBlocks = this.navigationService.devBlocks;
        if (devBlocks.has(relation.ModuleName)) {
            return devBlocks.get(relation.ModuleName);
        } else if (devBlocks.has(relation.ComponentName)) {
            return devBlocks.get(relation.ComponentName);
        } else {
            return `${remoteBasePath}${relation.AddonRelativeURL}.js`;
        }
    }

    private getRemoteLoaderOptions(data: IBlockLoaderData, editor = false) {
        const remoteEntry = this.getRemoteEntryByType(data.addonPublicBaseURL, data.relation);
        const remoteLoaderOptions = this.remoteLoaderService.getRemoteLoaderOptions(data, remoteEntry);

        if (editor) {
            // If there is web component change the element to be the editor element, Else set the module & component to fit the editor.
            if (data.relation.ElementsModule?.length > 0) {
                remoteLoaderOptions.elementName = data.relation.EditorElementName;
            } else {
                remoteLoaderOptions.exposedModule = `./${data.relation.EditorModuleName}`;
                remoteLoaderOptions.componentName = data.relation.EditorComponentName;
            }
        }

        return remoteLoaderOptions;
    }

    private getBaseUrl(addonUUID: string): string {
        if (this.isOffline){
            return "http://localhost:8088/addon/api/50062e0c-9967-4ed4-9102-f2bc50602d41/addon-cpi";
        } else {
             // For devServer run server on localhost.
            if(this.navigationService.devServer) {
                return `http://localhost:4500/internal_api`;
            } else {
                const baseUrl = this.sessionService.getPapiBaseUrl();
                return `${baseUrl}/addons/api/${addonUUID}/internal_api`;
            }
        }

    }

    private setPagesVariables(pagesVariables: any) {
        Object.keys(pagesVariables).forEach(key => {
            const valueAsNumber = Number(pagesVariables[key]);

            if (!isNaN(valueAsNumber)) {
                if (key === this.BLOCKS_NUMBER_LIMITATION_OBJECT.key) {
                    this.BLOCKS_NUMBER_LIMITATION_OBJECT.value = valueAsNumber;
                } else if (key === this.PAGE_SIZE_LIMITATION_OBJECT.key) {
                    this.PAGE_SIZE_LIMITATION_OBJECT.value = valueAsNumber;
                }
            }
        })
    }

    private setQueryParameters(queryParameters: Params) {
        Object.keys(queryParameters).forEach(paramKey => {
            try {
                const paramValue = queryParameters[paramKey];
                this.setProducerParameter(paramKey, paramValue);
            } catch {
                // Do nothing, skip this param
            }
        });
    }

    private loadBlocksRemoteLoaderOptionsMap(availableBlocks: IBlockLoaderData[]) {
        this._blocksRemoteLoaderOptionsMap.clear();

        availableBlocks.forEach(data => {
            const relation: NgComponentRelation = data?.relation;
            const addonPublicBaseURL = data?.addonPublicBaseURL;

            if (relation && addonPublicBaseURL) {
                const key = this.getRemoteLoaderMapKey(relation);
                this._blocksRemoteLoaderOptionsMap.set(key, this.getRemoteLoaderOptions(data));
            }
        });
    }

    private loadBlocksEditorsRemoteLoaderOptionsMap(availableBlocks: IBlockLoaderData[]) {
        this._blocksEditorsRemoteLoaderOptionsMap.clear();

        availableBlocks.forEach(data => {
            const relation: NgComponentRelation = data?.relation;
            const addonPublicBaseURL = data?.addonPublicBaseURL;

            if (relation && addonPublicBaseURL) {
                const key = this.getRemoteLoaderMapKey(relation);
                this._blocksEditorsRemoteLoaderOptionsMap.set(key, this.getRemoteLoaderOptions(data, true));
            }
        });
    }

    private getRemoteLoaderMapKey(relation: NgComponentRelation): string {
        return `${relation.Name}_${relation.AddonUUID}`;
    }

    // Update the block configuration data by the propertyNamePath and set the field value (deep set).
    private updateConfigurationDataFieldValue(block: PageBlock, propertyNamePath: string, fieldValue: any) {
        this.setObjectPropertyValue(block.Configuration.Data, propertyNamePath, fieldValue);
    }

    // Update the block configuration per screen size according the current screen sizes and the saved values (deep set).
    private updateConfigurationPerScreenSizeFieldValue(block: PageBlock, propertyNamePath: string, fieldValue: any, currentScreenType: DataViewScreenSize) {
        if (block.ConfigurationPerScreenSize === undefined) {
            block.ConfigurationPerScreenSize = {};
        }

        let objectToUpdate;
        if (currentScreenType === 'Tablet') {
            if (block.ConfigurationPerScreenSize.Tablet === undefined) {
                block.ConfigurationPerScreenSize.Tablet = {};
            }

            objectToUpdate = block.ConfigurationPerScreenSize.Tablet;
        } else { // Phablet
            if (block.ConfigurationPerScreenSize.Mobile === undefined) {
                block.ConfigurationPerScreenSize.Mobile = {};
            }

            objectToUpdate = block.ConfigurationPerScreenSize.Mobile;
        }

        // Update the block configuration data by the propertyNamePath and set the field value.
        this.setObjectPropertyValue(objectToUpdate, propertyNamePath, fieldValue);
    }

    // Set the object field value by propertyNamePath (deep set).
    private setObjectPropertyValue(object: any, propertyNamePath: string, value: any): void {
        if (value !== undefined) {
            _.set(object, propertyNamePath, value);
        } else {
            _.unset(object, propertyNamePath);
        }
    }

    private searchFieldInSchemaFields(schemaFields: any, propertiesHierarchy: Array<string>): boolean {
        let canConfigurePerScreenSize = false;

        if (propertiesHierarchy.length > 0) {
            const startArrayCharIndex = propertiesHierarchy[0].indexOf('[');

            // If it's array then cut the index from the key else use the whole key.
            const currentFieldKey = (startArrayCharIndex === -1) ? propertiesHierarchy[0] : propertiesHierarchy[0].substring(0, startArrayCharIndex);
            const schemaField = schemaFields[currentFieldKey];

            if (schemaField) {
                const isObject = schemaField.Type === 'Object';
                const isArray = schemaField.Type === 'Array';

                // If it's object || array
                if (isObject || isArray) {
                    // If the field index is the last
                    if (propertiesHierarchy.length === 1) {
                        if (schemaField.ConfigurationPerScreenSize === true) {
                            canConfigurePerScreenSize = true;
                        }
                    } else { // Check in deepPropertyName (fields || items).
                        const fieldsObject = (isArray ? schemaField.Items?.Fields : schemaField.Fields) || null;

                        if (fieldsObject) {
                            propertiesHierarchy.shift(); // Remove the first element.
                            canConfigurePerScreenSize = this.searchFieldInSchemaFields(fieldsObject, propertiesHierarchy);
                        }
                    }
                } else {
                    if (propertiesHierarchy.length === 1) {
                        // We don't support resource.
                        if (schemaField.Type !== 'Resource') {
                            if (schemaField.ConfigurationPerScreenSize === true) {
                                canConfigurePerScreenSize = true;
                            }
                        }
                    }
                }
            }
        }

        return canConfigurePerScreenSize;
    }

    private validatePageConfigurationParametersOnCurrentBlock(parameterKeys: Map<string, PageConfigurationParameter>, parameter: PageConfigurationParameter) {
        // If the parameter key isn't exist insert it to the map, else, check the type if isn't the same then throw error.
        if (!parameterKeys.has(parameter.Key)) {
            parameterKeys.set(parameter.Key, parameter);
        } else {
            if (parameter.Type !== parameterKeys.get(parameter.Key)?.Type) {
                const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.TYPE_IS_DIFFERENT_FOR_THIS_KEY', { parameterKey: parameter.Key});
                throw new Error(msg);
            }
        }

        if (!parameter.Produce && !parameter.Consume) {
            const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.CONSUME_AND_PRODUCE_ARE_FALSE', { parameterKey: parameter.Key});
            throw new Error(msg);
        }
    }

    private validatePageConfigurationParametersOnPageBlocks(blockParameterKeys: Map<string, { block: PageBlock, parameter: PageConfigurationParameter }[]>, parameter: PageConfigurationParameter) {
        // If the parameter key isn't exist insert it to the map, else, check the type if isn't the same then throw error.
        if (blockParameterKeys.has(parameter.Key)) {
            const blockParameter = blockParameterKeys.get(parameter.Key)[0];

            if (parameter.Type !== blockParameter?.parameter?.Type) {
                const sections = this._sectionsSubject.getValue();

                // Find section and column index of the block to show this details to the user.
                let sectionName = '';
                let sectionIndex = -1;
                let columnIndex = -1;

                // Find the section index.
                for (sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
                    const section = sections[sectionIndex];

                    // Find the column index.
                    columnIndex = section.Columns.findIndex(column => column.BlockContainer?.BlockKey === blockParameter.block.Key);
                    if (columnIndex > -1) {
                        sectionName = section.Name;
                        break;
                    }
                }

                const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.TYPE_IS_DIFFERENT_FOR_THIS_KEY_IN_OTHER_BLOCKS', {
                    section: sectionName || (sectionIndex + 1),
                    column: columnIndex + 1,
                    parameterKey: parameter.Key,
                    parameterType: blockParameter?.parameter?.Type,
                });

                throw new Error(msg);
            }
        }
    }

    private validatePageConfigurationData(blockKey: string, pageConfiguration: PageConfiguration) {
        // Take all blocks except the given one for check if the new data is valid.
        const blocks = this._pageSubject.getValue().Blocks.filter(block => block.Key !== blockKey);

        // go for all the existing parameters.
        const blockParameterKeys = new Map<string, { block: PageBlock, parameter: PageConfigurationParameter }[]>();
        for (let blockIndex = 0; blockIndex < blocks?.length; blockIndex++) {
            const block = blocks[blockIndex];

            if (block?.PageConfiguration) {
                for (let parameterIndex = 0; parameterIndex < block.PageConfiguration.Parameters?.length; parameterIndex++) {
                    const parameter = block.PageConfiguration.Parameters[parameterIndex];

                    // If the parameter key isn't exist insert it to the map,
                    // else, it's should be with the same Type so add the other blocks and parameters to the array in the map.
                    if (!blockParameterKeys.has(parameter.Key)) {
                        blockParameterKeys.set(parameter.Key, [{block, parameter}]);
                    } else {
                        const arr = blockParameterKeys.get(parameter.Key);
                        arr.push({block, parameter});
                        blockParameterKeys.set(parameter.Key, arr);
                    }
                }
            }
        }

        const parameterKeys = new Map<string, PageConfigurationParameter>();

        // Validate the pageConfiguration parameters.
        for (let parameterIndex = 0; parameterIndex < pageConfiguration?.Parameters?.length; parameterIndex++) {
            const parameter = pageConfiguration.Parameters[parameterIndex];

            // Validate the parameters on the pageConfiguration input.
            this.validatePageConfigurationParametersOnCurrentBlock(parameterKeys, parameter);

            // Validate the parameters from pageConfiguration input on the other page blocks.
            this.validatePageConfigurationParametersOnPageBlocks(blockParameterKeys, parameter);
        }
    }

    private changeCursorOnDragStart() {
        document.body.classList.add('inheritCursors');
        document.body.style.cursor = 'grabbing';
    }

    private changeCursorOnDragEnd() {
        document.body.classList.remove('inheritCursors');
        document.body.style.cursor = 'unset';
    }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/

    getBlockEditor(blockId: string): IEditor {
        let res = null;
        const blockProgress = this._pageBlockProgressMap.get(blockId);

        if (blockProgress) {
            const block = blockProgress?.block;

            const key = this.getRemoteLoaderMapKey(blockProgress?.block.Relation);
            const remoteLoaderOptions = this._blocksEditorsRemoteLoaderOptionsMap.get(key);
            
            if (block && remoteLoaderOptions) {
                // If there is schema then support ConfigurationPerScreenSize
                const hostObject = this.getEditorHostObject(block, blockProgress.block.Relation.Schema !== null);
    
                // remoteLoaderOptions.type = 'module';
                res = {
                    id: blockId,
                    type: 'block',
                    title: block.Relation.Name,
                    remoteModuleOptions: remoteLoaderOptions,
                    loadElement: remoteLoaderOptions.elementName?.length > 0,
                    hostObject: JSON.parse(JSON.stringify(hostObject))
                }
            }
        }

        return res;
    }

    getBlocksRemoteLoaderOptions(relation: NgComponentRelation) {
        const key = this.getRemoteLoaderMapKey(relation);
        const remoteLoaderOptions: PepRemoteLoaderOptions = this._blocksRemoteLoaderOptionsMap.get(key);

        // remoteLoaderOptions.type = 'module';

        return remoteLoaderOptions;
    }

    getBlockHostObject(block: PageBlock): IPageBlockHostObject {
        let hostObject = this.getEditorHostObject(block);

        // Add parameters.
        hostObject.parameters = this._consumerParametersMapSubject.getValue()?.get(block.Key) || null;

        return hostObject;
    }

    getScreenType(size: PepScreenSizeType): DataViewScreenSize {
        const screenType: DataViewScreenSize =
            size < PepScreenSizeType.MD ? 'Landscape' :
            (size === PepScreenSizeType.MD || size === PepScreenSizeType.SM ? 'Tablet' : 'Phablet');

        return screenType;
    }

    getSectionColumnKey(sectionKey: string = '', index: string = '') {
        return `${sectionKey}_column_${index}`;
    }

    navigateToEditor(editorType: EditorType, id: string): boolean {
        let success = false;

        // Cannot navigate into 'page-builder' because this is first and const in the editorsBreadCrumbs.
        if (editorType !== 'page-builder' && id?.length > 0) {
            // Check which editor we have now
            const currentEditor = this._editorsBreadCrumb[this._editorsBreadCrumb.length - 1];

            // Only if it's another editor.
            if(currentEditor.id !== id) {
                if (currentEditor.type !== 'page-builder') {
                    // Always pop the last and insert the current.
                    this._editorsBreadCrumb.pop();
                }

                let editor = this.getEditor(editorType, id);

                if (editor) {
                    this._editorsBreadCrumb.push(editor);
                    this.changeCurrentEditor();
                    success = true;
                } else {
                    success = false;
                }
            }
        }

        return success;
    }

    navigateBackFromEditor() {
        // Keep the page builder editor.
        if (this._editorsBreadCrumb.length > 1) {
            // Maybe we want to compare the last editor for validation ?
            const lastEditor = this._editorsBreadCrumb.pop();
            this.changeCurrentEditor();
        }
    }

    updatePageFromEditor(pageData: IPageEditor) {
        // Update editor title
        const currentEditor = this._editorSubject.getValue();
        if (currentEditor.type === 'page-builder' && currentEditor.id === 'main') {
            currentEditor.title = pageData.pageName;
            this.notifyEditorChange(currentEditor);
        }

        const currentPage = this._pageSubject.getValue();

        if (currentPage) {
            currentPage.Name = pageData.pageName;
            currentPage.Description = pageData.pageDescription;
            currentPage.Layout.MaxWidth = pageData.maxWidth;
            currentPage.Layout.HorizontalSpacing = pageData.horizontalSpacing;
            currentPage.Layout.VerticalSpacing = pageData.verticalSpacing;
            currentPage.Layout.SectionsGap = pageData.sectionsGap;
            currentPage.Layout.ColumnsGap = pageData.columnsGap;
            // currentPage.Layout.RoundedCorners = pageData.roundedCorners;

            this.notifyPageChange(currentPage);
        }
    }

    updateSectionFromEditor(sectionData: ISectionEditor) {
        const sections = this._sectionsSubject.getValue();
        const sectionIndex = sections.findIndex(section => section.Key === sectionData.id);

        // Update section details.
        if (sectionIndex >= 0) {
            const currentSection = sections[sectionIndex];
            currentSection.Name = sectionData.sectionName;
            currentSection.Split = sectionData.split;
            currentSection.Height = sectionData.height;
            currentSection.FillHeight = sectionData.fillHeight;

            // Get the new columns number from currentSection.Split, if its undefined put a default 1.
            const newColumnsLength = currentSection.Split?.split(' ').length || 1;
            if (newColumnsLength > currentSection.Columns.length) {
                while (newColumnsLength > currentSection.Columns.length) {
                    currentSection.Columns.push({});
                }
            } else if (newColumnsLength < currentSection.Columns.length) {
                const blocksIdsToRemove = [];
                while (newColumnsLength < currentSection.Columns.length) {
                    const colunm = currentSection.Columns.pop();
                    // If there is block in this column delete it.
                    if (colunm.BlockContainer) {
                        blocksIdsToRemove.push(colunm.BlockContainer.BlockKey);
                    }
                }

                this.removePageBlocks(blocksIdsToRemove);
            }

            // Update editor title
            const currentEditor = this._editorSubject.getValue();
            if (currentEditor.type === 'section' && currentEditor.id === currentSection.Key) {
                currentEditor.title = this.getSectionEditorTitle(currentSection, sectionIndex);
                this.notifyEditorChange(currentEditor);
            }

            // Update sections change.
            this.notifySectionsChange(sections);
        }
    }

    addSection(section: PageSection = null) {
        // Create new section
        if (!section) {
            section = {
                Key: PepGuid.newGuid(),
                Columns: [{}], // Add empty section column
                Hide: []
            }
        }

        // Add the new section to page layout.
        const sections = this._pageSubject.getValue().Layout.Sections;
        sections.push(section);
        this.notifySectionsChange(sections);
    }

    removeSection(sectionId: string) {
        const sections = this._sectionsSubject.getValue();
        const index = sections.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            // Get the blocks id's to remove.
            const blocksIds = sections[index].Columns.map(column => column?.BlockContainer?.BlockKey);

            // Remove the blocks by ids.
            this.removePageBlocks(blocksIds)

            // Remove section.
            sections.splice(index, 1);
            this.notifySectionsChange(sections);
        }
    }

    hideSection(sectionId: string, hideIn: DataViewScreenSize[]) {
        const sections = this._sectionsSubject.getValue();
        const index = sections.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            sections[index].Hide = hideIn;
            this.notifySectionsChange(sections);
        }
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        const sections = this._sectionsSubject.getValue();
        moveItemInArray(sections, event.previousIndex, event.currentIndex);
        this.notifySectionsChange(sections);
    }

    onSectionDragStart(event: CdkDragStart) {
        this.changeCursorOnDragStart();
        this._draggingSectionKey.next(event.source.data);
    }

    onSectionDragEnd(event: CdkDragEnd) {
        this.changeCursorOnDragEnd();
        this._draggingSectionKey.next('');
    }

    removeBlock(blockId: string) {
        // Remove the block.
        this.removePageBlocks([blockId]);

        // Remove the block from section column.
        const sections = this._sectionsSubject.getValue();

        for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
            const section = sections[sectionIndex];

            // Remove the block container.
            const columnIndex = section.Columns.findIndex(column => column.BlockContainer?.BlockKey === blockId);
            if (columnIndex > -1) {
                delete section.Columns[columnIndex].BlockContainer;
                this.notifySectionsChange(sections);

                return;
            }
        }
    }

    hideBlock(sectionId: string, blockId: string, hideIn: DataViewScreenSize[]) {
        const sections = this._sectionsSubject.getValue();

        const index = sections.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            const columnIndex = sections[index].Columns.findIndex(column => column.BlockContainer?.BlockKey === blockId);
            if (columnIndex > -1) {
                sections[index].Columns[columnIndex].BlockContainer.Hide = hideIn;
                this.notifySectionsChange(sections);
            }
        }
    }

    onBlockDropped(event: CdkDragDrop<any[]>, sectionId: string) {
        if (event.previousContainer.id === 'availableBlocks') {
            // Check that the blocks number are less then the limit.
            const page = this._pageSubject.getValue();

            // Validate if blocks number allow.
            if (page.Blocks.length >= this.BLOCKS_NUMBER_LIMITATION_OBJECT.value) {
                this.utilitiesService.showDialogMsg(this.translate.instant('MESSAGES.BLOCKS_COUNT_LIMIT_MESSAGE'));
            } else {
                // Get the block relation (previousContainer.data is IPepDraggableItem and inside we have AvailableBlock object).
                const draggableItem: IPepDraggableItem = event.previousContainer.data[event.previousIndex] as IPepDraggableItem;

                if (draggableItem) {
                    // lock the screen untill the editor will be loaded.
                    this._lockScreenSubject.next(true);

                    // Create new block from the relation (previousContainer.data.relation is AvailableBlock object).
                    const relation: NgComponentRelation = draggableItem.data.relation;

                    let block: PageBlock = {
                        Key: PepGuid.newGuid(),
                        Relation: relation,
                        Configuration: {
                            Resource: relation.Name,
                            AddonUUID: relation.AddonUUID,
                            Data: {}
                        },
                    }

                    // Get the column.
                    const currentColumn = this.getSectionColumnById(event.container.id);

                    // Set the block key in the section block only if there is a blank column.
                    if (currentColumn && !currentColumn.BlockContainer) {
                        currentColumn.BlockContainer = {
                            BlockKey: block.Key
                        };

                        // Add the block to the page blocks and navigate to block editor when the block will loaded.
                        this.addPageBlock(block, true);
                    }
                } else {
                    console.log("draggableItem is not a IPepDraggableItem type");
                }
            }
        } else {
            // If the block moved between columns in the same section or between different sections but not in the same column.
            if (event.container.id !== event.previousContainer.id) {
                // Get the column.
                const currentColumn = this.getSectionColumnById(event.container.id);
                // Get the previous column.
                const previuosColumn = this.getSectionColumnById(event.previousContainer.id);

                currentColumn.BlockContainer = previuosColumn.BlockContainer;
                delete previuosColumn.BlockContainer;

                // Raise block progress change to update the subject.
                this.notifyBlockProgressMapChange();
            }
        }
    }

    onBlockDragStart(event: CdkDragStart) {
        this.changeCursorOnDragStart();
        // Take the block key if exist, else take the available block key (relation key).
        const blockKey = event.source.data?.BlockKey || event.source.data?.Key;
        this._draggingBlockKey.next(blockKey);
    }

    onBlockDragEnd(event: CdkDragEnd) {
        this.changeCursorOnDragEnd();
        this._draggingBlockKey.next('');
    }

    updateBlockLoaded(blockKey: string) {
        this.setBlockAsLoadedAndCalculateCurrentPriority(blockKey);
    }

    updateBlockConfiguration(blockKey: string, configuration: any) {
        const blockProgress = this.pageBlockProgressMap.get(blockKey);

        if (blockProgress) {
            blockProgress.block.Configuration.Data = configuration;
            this.notifyBlockChange(blockProgress.block);
        }
    }

    updateBlockConfigurationField(blockKey: string, fieldKey: string, fieldValue: any) {
        const blockProgress = this.pageBlockProgressMap.get(blockKey);

        try {
            if (blockProgress) {
                const currentScreenType = this.getScreenType(this._screenSizeSubject.getValue());

                // If it's Landscape mode then set the field to the regular (Configuration -> Data -> field hierarchy).
                if (currentScreenType === 'Landscape') {
                    // Update confuguration data only if the value is not undefined (cannot reset the root).
                    if (fieldValue !== undefined) {
                        this.updateConfigurationDataFieldValue(blockProgress.block, fieldKey, fieldValue);
                        this.notifyBlockChange(blockProgress.block);
                    }
                } else {
                    const schema = blockProgress.block.Relation.Schema;
                    let canConfigurePerScreenSize = false;

                    if (schema?.Fields) {
                        const propertiesHierarchy = fieldKey.split('.');
                        canConfigurePerScreenSize = this.searchFieldInSchemaFields(schema?.Fields, propertiesHierarchy);
                    }

                    // Update
                    if (canConfigurePerScreenSize) {
                        this.updateConfigurationPerScreenSizeFieldValue(blockProgress.block, fieldKey, fieldValue, currentScreenType);
                    } else {
                        // Update confuguration data.
                        this.updateConfigurationDataFieldValue(blockProgress.block, fieldKey, fieldValue);
                    }

                    this.notifyBlockChange(blockProgress.block);
                }
            }
        } catch (err) {
            // TODO: Show msg
            console.log(`set-configuration-field is failed with error: ${err}`);
        }
    }

    updateBlockPageConfiguration(blockKey: string, pageConfiguration: PageConfiguration) {
        const blockProgress = this.pageBlockProgressMap.get(blockKey);

        if (blockProgress) {
            try {
                // Validate the block page configuration data, if validation failed an error will be thrown.
                this.validatePageConfigurationData(blockKey, pageConfiguration);

                blockProgress.block.PageConfiguration = pageConfiguration;
                this.notifyBlockChange(blockProgress.block);

                // Calculate all filters by the updated page configuration.
                this.buildConsumersParameters();
            } catch (err) {
                // Go back from block editor.
                this.navigateBackFromEditor();

                // Remove the block and show message.
                const title = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.BLOCK_HAS_REMOVED');
                this.utilitiesService.showDialogMsg(err.message, title);
                this.removeBlock(blockProgress.block.Key);
            }
        }
    }

    setBlockParameter(blockKey: string, event: { key: string, value: any }) {
        const blockProgress = this.pageBlockProgressMap.get(blockKey);

        // Only if this block parameter is declared as producer.
        if (blockProgress?.block?.PageConfiguration?.Parameters.length > 0) {
            const params = blockProgress?.block?.PageConfiguration?.Parameters.filter(param => param.Key === event.key && param.Produce === true);

            // If the key exist in parameters.
            if (params?.length > 0) {
                let canUpdateParameter = true;

                // Check if can raise this filter type parameter (for type 'String' there is no validation).
                if (params[0].Type === 'Filter') {
                    // Get the filters as PageConfigurationParameterFilter
                    const filtersParameters = params as PageConfigurationParameterFilter[];

                    // Check if this producer can raise those filters.
                    const producerFilters = event.value as IProducerFilter[];

                    if (producerFilters?.length > 0) {
                        for (let index = 0; index < producerFilters.length; index++) {
                            const producerFilter = producerFilters[index];

                            // Validate filter properties.
                            const isFilterValid = this.isFilterValid(producerFilter);

                            if (isFilterValid) {
                                canUpdateParameter = this.canProducerRaiseFilter(filtersParameters, producerFilter);

                                if (!canUpdateParameter) {
                                    // Write error to the console "You cannot raise this filter (not declared)."
                                    console.error('One or more from the raised filters are not declared in the block -> pageConfiguration -> parameters array.');
                                    break;
                                }
                            } else {
                                canUpdateParameter = false;
                                console.error('One or more from the raised filters are not valid as pepperi filter object.');
                                break;
                            }
                        }
                    } else {
                        canUpdateParameter = false;
                        console.error('The raised value is not valid, the value should be array of resource and filter objects.');
                    }
                }

                // Only if can update parameter
                if (canUpdateParameter) {
                    // Set the producer parameter value in _producerParameterKeysMap.
                    this.setProducerParameter(event.key, event.value, blockKey);

                    // Raise the filters change only if this block has loaded AND the currentBlocksPriority is CONSUMERS_PRIORITY (consumers stage)
                    // because in case that the block isn't loaded we will raise the event once when all the blocks are ready.
                    if (blockProgress.loaded && this.currentBlocksPriority === this.CONSUMERS_PRIORITY) {
                        this.buildConsumersParameters();
                    }
                }
            } else {
                console.error('The raised parameter is not declared in the block -> pageConfiguration -> parameters array as producer');
            }
        }
    }

    doesColumnContainBlock(sectionId: string, columnIndex: number): boolean {
        let res = false;
        const section = this._sectionsSubject.getValue().find(section => section.Key === sectionId);

        if (section && columnIndex >= 0 && section.Columns.length > columnIndex) {
            res = !!section.Columns[columnIndex].BlockContainer;
        }

        return res;
    }

    setScreenWidth(value: string) {
        let width = this.pepUtilitiesService.coerceNumberProperty(value, 0);
        if (width === 0) {
            this._screenWidthSubject.next('100%');
            this._screenSizeSubject.next(PepScreenSizeType.XL);
        } else {
            this._screenWidthSubject.next(`${width}px`);

            // Change the size according the width.
            if (width >= 1920) {
                this._screenSizeSubject.next(PepScreenSizeType.XL);
            } else if (width >= 1280 && width < 1920) {
                this._screenSizeSubject.next(PepScreenSizeType.LG);
            } else if (width >= 960 && width < 1280) {
                this._screenSizeSubject.next(PepScreenSizeType.MD);
            } else if (width >= 600 && width < 960) {
                this._screenSizeSubject.next(PepScreenSizeType.SM);
            } else if (width < 600) {
                this._screenSizeSubject.next(PepScreenSizeType.XS);
            }
        }
    }

    emitEvent(event: any) {
        const eventData = {
            detail: event,
        };

        const customEvent = new CustomEvent('emit-event', eventData);
        window.dispatchEvent(customEvent);
    }

    /**************************************************************************************/
    /*                            CPI & Server side calls.
    /**************************************************************************************/

    // Get the pages (distinct with the drafts)
    getPages(addonUUID: string, options: any): Observable<IPageRowModel[]> {
        // Get the pages from the server.
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/get_pages_data?${options}`);
    }

    createNewPage(addonUUID: string, templateFileName: any, totalPages: number = 0): Observable<Page> {
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/create_page?templateFileName=${templateFileName}&pageNum=${totalPages+1}`);
    }

    // Delete the page
    deletePage(addonUUID: string, pageKey: string): Observable<any> {
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/remove_page?key=${pageKey}`);
    }

    loadPageBuilder(addonUUID: string, pageKey: string, editable: boolean, queryParameters: Params): void {
        //  If is't not edit mode get the page from the CPI side.
        const baseUrl = this.getBaseUrl(addonUUID);

        if (!editable) {
            // Get the page (sections and the blocks data) from the server.
            let pageDataURL = `${baseUrl}/get_page_data?key=${pageKey}`;
            this.httpService.getHttpCall(pageDataURL)
            .subscribe((res: IPageBuilderData) => {
                if (res && res.page && res.availableBlocks) {
                    // Load the blocks remote loader options.
                    this.loadBlocksRemoteLoaderOptionsMap(res.availableBlocks);

                    // Load the page.
                    this.notifyPageChange(res.page);
                }
            });
        } else { // If is't edit mode get the data of the page and the relations from the Server side.
            // Get the page (sections and the blocks data) from the server.
            this.httpService.getHttpCall(`${baseUrl}/get_page_builder_data?key=${pageKey}`)
                .subscribe((res: IPageBuilderData) => {
                    if (res && res.page && res.availableBlocks && res.pagesVariables) {
                        // Load the available blocks.
                        const availableBlocks: NgComponentRelation[] = [];

                        res.availableBlocks.forEach(data => {
                            availableBlocks.push(data?.relation);
                        });

                        this._availableBlocksSubject.next(availableBlocks);

                        // Set the pages variables into the service variables.
                        this.setPagesVariables(res.pagesVariables);

                        // Load the blocks remote loader options.
                        this.loadBlocksRemoteLoaderOptionsMap(res.availableBlocks);

                        // Load the blocks editors remote loader options.
                        this.loadBlocksEditorsRemoteLoaderOptionsMap(res.availableBlocks);

                        // Load the page.
                        this.notifyPageChange(res.page);
                    }
            });
        }

        // Set the query parameters on the producer parameter map as system parameters.
        this.setQueryParameters(queryParameters);
    }

    unloadPageBuilder() {
        this.notifySectionsChange([]);
        this.removeAllBlocks()
        this.notifyPageChange(null);
    }

    // Restore the page to tha last publish
    restoreToLastPublish(addonUUID: string): Observable<Page> {
        const page = this._pageSubject.getValue();
        const baseUrl = this.getBaseUrl(addonUUID);

        return this.httpService.getHttpCall(`${baseUrl}/restore_to_last_publish?key=${page.Key}`);
    }

    // Save the current page in drafts.
    saveCurrentPage(addonUUID: string): Observable<Page> {
        const page: Page = this._pageSubject.getValue();
        const body = JSON.stringify(page);
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.postHttpCall(`${baseUrl}/save_draft_page`, body);
    }

    // Publish the current page.
    publishCurrentPage(addonUUID: string): Observable<Page> {
        const page: Page = this._pageSubject.getValue();
        const body = JSON.stringify(page);
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.postHttpCall(`${baseUrl}/publish_page`, body);
    }
}
