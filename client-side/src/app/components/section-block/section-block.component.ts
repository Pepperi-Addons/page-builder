import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CdkDragEnd, CdkDragEnter, CdkDragExit, CdkDragStart } from '@angular/cdk/drag-drop';
import { IPageBlockHostObject, PagesService } from '../../services/pages.service';
import { DataViewScreenSize, PageBlock, PageConfiguration, PageBlockContainer } from '@pepperi-addons/papi-sdk';
import { PepRemoteLoaderOptions } from '@pepperi-addons/ngx-lib/remote-loader';
import { IPageState, PageBlockView } from 'shared';

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
    
    private _pageBlock: PageBlockView;
    @Input()
    set pageBlock(value: PageBlockView) {
        this._pageBlock = value;
        this.setRemotePathOptions();
        this.setHostObject();
    }
    get pageBlock(): PageBlockView {
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
        const isNotFirstTime = this._screenType?.length > 0;
        this._screenType = value;
        this.setIfHideForCurrentScreenType();

        if (isNotFirstTime) {
            this.setConfigurationOnScreenSizeChanged();
        }
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

    private _state = {};

    protected remoteLoaderOptions: PepRemoteLoaderOptions;
    
    onBlockHostEventsCallback: (event: CustomEvent) => void;

    constructor(
        private pagesService: PagesService
    ) {
        this.onBlockHostEventsCallback = (event: CustomEvent) => {
            this.onBlockHostEvents(event.detail);
        }
    }
    
    private setRemotePathOptions() {
        const options = this.pagesService.getBlocksRemoteLoaderOptions(this.pageBlock.RelationData.Name, this.pageBlock.RelationData.AddonUUID);
        this.remoteLoaderOptions = options;
    }

    private setConfigurationOnScreenSizeChanged() {
        const bp = this.pagesService.pageBlockProgressMap.get(this.pageBlock.Key);

        // If this is new code (handle screen size change with callback function and not change the host object).
        if (bp.registerScreenSizeChangeCallback) {
            const data: { state: any, configuration: any } = {
                state: this._state,
                configuration: this.pagesService.getMergedConfigurationData(this.pageBlock)
            };

            bp.registerScreenSizeChangeCallback(data);
        } else {
            // This is for support old blocks.
            this.setHostObject();
        }
    }

    private setHostObject(): void {
        this._hostObject = this.pagesService.getBlockHostObject(this.pageBlock);
    }

    private setIfHideForCurrentScreenType(): void {
        this.hideForCurrentScreenType = this.blockContainer ? 
            this.pagesService.getIsHidden(this.blockContainer.Hide, this.screenType) : false;
    }

    ngOnInit(): void {
        // When block change call to his callback if declared, Else override the host object.
        this.pagesService.pageBlockChange$.subscribe((pageBlockKey: string) => {
            if (this.pageBlock.Key === pageBlockKey) {
                const bp = this.pagesService.pageBlockProgressMap.get(this.pageBlock.Key);
                
                if (bp?.registerStateChangeCallback) {
                    const data: { state: any, configuration: any } = {
                        state: this._state,
                        configuration: bp.blockLastChanges.Configuration
                    };

                    bp.registerStateChangeCallback(data);
                } else { 
                    // This is for support old blocks.
                    this._pageBlock = bp.block;
                    this.setHostObject();
                }
            }
        });

        // Update the changed state
        this.pagesService.pageStateChange$.subscribe((state: IPageState) => {
            if (state?.BlocksState.hasOwnProperty(this.pageBlock.Key)) {
                this._state = state.BlocksState[this.pageBlock.Key];
            }
        });
    }

    onEditBlockClick() {
        this.pagesService.navigateToEditor('block', this.pageBlock.Key);
    }

    onRemoveBlockClick() {
        this.pagesService.removeBlockFromSection(this.pageBlock.Key);
    }

    onHideBlockChange(hideIn: DataViewScreenSize[]) {
        this.pagesService.hideBlock(this.sectionKey, this.pageBlock.Key, hideIn);
        this.setIfHideForCurrentScreenType();
    }

    onBlockHostEvents(event: any) {
    
        // Implement blocks events.
        switch(event.action) {
            // // *** Deprecated ***
            // case 'set-parameter':
            //     this.pagesService.setBlockParameter(this.pageBlock.Key, event);
            //     break;
            // // *** Deprecated ***
            // case 'set-parameters':
            //     this.pagesService.setBlockParameters(this.pageBlock.Key, event);
            //     break;
            case 'state-change':
                // In runtime (or preview mode).
                if (!this.editable) {
                    this.pagesService.onBlockStateChange(this.pageBlock.Key, event);
                }
                break;
            case 'buton-click':
                // In runtime (or preview mode).
                if (!this.editable) {
                    this.pagesService.onBlockButtonClick(this.pageBlock.Key, event);
                }
                break;
            case 'register-state-change':
                this.pagesService.onRegisterStateChange(this.pageBlock.Key, event);
                break;
            case 'register-screen-size-change':
                this.pagesService.onRegisterScreenSizeChange(this.pageBlock.Key, event);
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
