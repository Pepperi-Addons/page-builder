import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CdkDragEnd, CdkDragEnter, CdkDragExit, CdkDragStart } from '@angular/cdk/drag-drop';
import { IPageBlockHostObject, PagesService } from '../../services/pages.service';
import { DataViewScreenSize, PageBlock, PageConfiguration, PageBlockContainer } from '@pepperi-addons/papi-sdk';
import { PepRemoteLoaderOptions } from '@pepperi-addons/ngx-lib/remote-loader';
import { PepPluginOptions } from '@pepperi-addons/ngx-lib/plugin';

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
    
    private _hostObject: IPageBlockHostObject;
    get hostObject() {
        return this._hostObject;
    }

    remotePathOptions: PepPluginOptions;

    constructor(
        private pagesService: PagesService
    ) { }
    
    private setRemotePathOptions() {
        this.remotePathOptions = this.pagesService.getBlocksRemoteLoaderOptions(this.pageBlock.Relation);
    }

    private setHostObject(): void {
        if (this.pageBlock && this.screenType) {
            this._hostObject = this.pagesService.getBlockHostObject(this.pageBlock);
        }
    }

    private setIfHideForCurrentScreenType(): void {
        let isHidden = false;

        if (this.screenType && this.blockContainer?.Hide) {
            isHidden = this.blockContainer.Hide.some(hideIn => hideIn === this.screenType);
        }

        this.hideForCurrentScreenType = isHidden;
    }

    ngOnInit(): void {
        this.pagesService.pageBlockChange$.subscribe((pageBlock: PageBlock) => {
            if (pageBlock && this.pageBlock.Key === pageBlock.Key) {
                this.pageBlock = pageBlock;
            }
        });

        this.pagesService.consumerParametersMapChange$.subscribe((map: Map<string, any>) => {
            if (!map) return;

            // Only if this block is consumer than set hostObject (cause some parameter was change).
            const blockIsConsumeParameters = this.pageBlock?.PageConfiguration?.Parameters.some(param => param.Consume);
            
            if (blockIsConsumeParameters) {
                const currentParameters = map?.get(this.pageBlock.Key);

                // Check that the updated filter is not equals to the old one.
                const oldParametersAsString = JSON.stringify(this.hostObject.parameters || {});
                const newParametersAsString = JSON.stringify(currentParameters || {});

                if (newParametersAsString !== oldParametersAsString) {
                    // Set the whole host object cause if we want that the hostObject will update we need to change the reference.
                    this.setHostObject();
                }
            }
        });
    }

    onEditBlockClick() {
        this.pagesService.navigateToEditor('block', this.pageBlock.Key);
    }

    onRemoveBlockClick() {
        this.pagesService.removeBlock(this.pageBlock.Key);
    }

    onHideBlockChange(hideIn: DataViewScreenSize[]) {
        this.pagesService.hideBlock(this.sectionKey, this.pageBlock.Key, hideIn);
        this.setIfHideForCurrentScreenType();
    }

    onBlockHostEvents(event: any) {
        // Implement blocks events.
        switch(event.action) {
            case 'set-parameter':
                this.pagesService.setBlockParameter(this.pageBlock.Key, event);
                break;
            case 'emit-event':
                this.pagesService.emitEvent(event);
                break;
        }
    }

    onBlockLoad(event: any) {
        this.pagesService.updateBlockLoaded(this.pageBlock.Key);
    }

    onDragStart(event: CdkDragStart) {
        this.pagesService.onBlockDragStart(event);
    }

    onDragEnd(event: CdkDragEnd) {
        this.pagesService.onBlockDragEnd(event);
    }

    onDragExited(event: CdkDragExit) {
        this.dragExited.emit(event);
    }

    onDragEntered(event: CdkDragEnter) {
        this.dragEntered.emit(event);
    }
}
