import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CdkDragEnd, CdkDragEnter, CdkDragExit, CdkDragStart } from '@angular/cdk/drag-drop';
import { PagesService } from 'src/app/services/pages.service';
import { DataViewScreenSize, PageBlock, PageConfiguration, PageBlockContainer } from '@pepperi-addons/papi-sdk';
import { PepRemoteLoaderOptions } from '@pepperi-addons/ngx-remote-loader';

interface IHostObject {
    configuration: any;
    pageConfiguration?: PageConfiguration;
    // pageType?: any;
    context?: any;
    filter?: any;
}
@Component({
    selector: 'section-block',
    templateUrl: './section-block.component.html',
    styleUrls: ['./section-block.component.scss', './section-block.component.theme.scss']
})
export class SectionBlockComponent implements OnInit {
    
    @Input() sectionKey: string;
    @Input() sectionHeight: string;
    @Input() isMainEditorState = false;
    @Input() editable = false;
    @Input() active = false;
    
    private _pageBlock: PageBlock;
    @Input()
    set pageBlock(value: PageBlock) {
        this._pageBlock = value;
        this.setRemotePathOptions();
        this.setHostObject();
    }
    get pageBlock(): PageBlock {
        return this._pageBlock;
    }

    private _blockContainer: PageBlockContainer;
    @Input()
    set blockContainer(value: PageBlockContainer) {
        this._blockContainer = value;
        this.setIfHideForCurrentScreenType();
    }
    get blockContainer(): PageBlockContainer {
        return this._blockContainer;
    }

    private _screenType: DataViewScreenSize;
    @Input()
    set screenType(value: DataViewScreenSize) {
        this._screenType = value;
        this.setIfHideForCurrentScreenType();
        this.setHostObject();
    }
    get screenType(): DataViewScreenSize {
        return this._screenType;
    }
    
    @Output() dragExited: EventEmitter<CdkDragExit> = new EventEmitter();
    @Output() dragEntered: EventEmitter<CdkDragEnter> = new EventEmitter();

    hideForCurrentScreenType = false;
    
    private _hostObject: IHostObject;
    get hostObject() {
        return this._hostObject;
    }

    remotePathOptions: PepRemoteLoaderOptions;

    constructor(
        private pageBuilderService: PagesService
    ) { }
    
    private setRemotePathOptions() {
        this.remotePathOptions = this.pageBuilderService.getBlocksRemoteLoaderOptions(this.pageBlock.Relation);
    }

    private setHostObject(): void {
        this._hostObject = this.pageBuilderService.getBlockHostObject(this.pageBlock
            // , this.screenType
            );
    }

    private setIfHideForCurrentScreenType(): void {
        let isHidden = false;

        if (this.blockContainer.Hide) {
            isHidden = this.blockContainer.Hide.some(hideIn => hideIn === this.screenType);
        }

        this.hideForCurrentScreenType = isHidden;
    }

    ngOnInit(): void {
        this.pageBuilderService.onPageBlockChange$.subscribe((pageBlock: PageBlock) => {
            if (pageBlock && this.pageBlock.Key === pageBlock.Key) {
                this.pageBlock = pageBlock;
            }
        });

        this.pageBuilderService.pageConsumersFiltersMapChange$.subscribe((map: Map<string, any>) => {
            // Only if this block is consumer than set hostObject filter (cause some filter was change).
            const blockIsConsumeFilters = this.pageBlock.PageConfiguration.Parameters.some(param => param.Consume && param.Type === 'Filter');
            // TODO: Remove this
            // if (this.pageBlock.PageConfiguration?.Consume) {
            if (blockIsConsumeFilters) {
                const currentFilter = map?.get(this.pageBlock.Key);

                // Check that the updated filter is not equals to the old one.
                const oldFilterAsString = JSON.stringify(this.hostObject.filter || {});
                const newFilterAsString = JSON.stringify(currentFilter || {});

                if (newFilterAsString !== oldFilterAsString) {
                    // Set the whole host object cause if we want that the hostObject will update we need to change the reference.
                    this.setHostObject();
                }
            }
        });
    }

    onEditBlockClick() {
        this.pageBuilderService.navigateToEditor('block', this.pageBlock.Key);
    }

    onRemoveBlockClick() {
        this.pageBuilderService.onRemoveBlock(this.sectionKey, this.pageBlock.Key);
    }

    onHideBlockChange(hideIn: DataViewScreenSize[]) {
        this.pageBuilderService.hideBlock(this.sectionKey, this.pageBlock.Key, hideIn);
        this.setIfHideForCurrentScreenType();
    }

    onBlockHostEvents(event) {
        // TODO: Implement all other events.
        switch(event.action){
            case 'block-loaded':
                this.pageBuilderService.updateBlockLoaded(this.pageBlock.Key);
                break;
            // case 'set-filters':
            //     this.pageBuilderService.updateBlockFilters(this.pageBlock.Key, event.filters);
            //     break;
            case 'set-parameter':
                this.pageBuilderService.setBlockParameter(this.pageBlock.Key, event);

                break;
            // case 'emit-event':
            //     break;
        }
    }

    onDragStart(event: CdkDragStart) {
        this.pageBuilderService.onBlockDragStart(event);
    }

    onDragEnd(event: CdkDragEnd) {
        this.pageBuilderService.onBlockDragEnd(event);
    }

    onDragExited(event: CdkDragExit) {
        this.dragExited.emit(event);
    }

    onDragEntered(event: CdkDragEnter) {
        this.dragEntered.emit(event);
    }
}
