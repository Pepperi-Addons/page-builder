import { TranslateService } from '@ngx-translate/core';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

@Component({
    selector: 'sub-addon-2',
    templateUrl: './sub-addon-2.component.html',
    styleUrls: ['./sub-addon-2.component.scss']
})
export class SubAddon2Component implements OnInit, OnChanges {
    @ViewChild('filmStrip') filmStrip: any;

    private _hostObject: any;
    @Input()
    set hostObject(value: any) {
        this._hostObject = value;
        this.handleHostObjectChange();
    }
    get hostObject(): any {
        return this._hostObject;
    }

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    options: {key:string, value:string}[] = [];
    images = 'https://idpfiles.sandbox.pepperi.com/f389fd2e-4a31-4965-a21e-3a98b4553300/images/left-side-background.jpg;https://idpfiles.sandbox.pepperi.com/f389fd2e-4a31-4965-a21e-3a98b4553300/images/logo.svg';
    inputTitle = '';
    currIndex = 0;
    
    constructor(
        private translate: TranslateService,
        private cd: ChangeDetectorRef) { }

    private handleHostObjectChange() {

        if (this.hostObject?.filter) {
            alert(`Filter change in SubAddon2 with value ${JSON.stringify(this.hostObject?.filter)}`);
        }
    }

    ngOnInit(): void {
        this.options.push({key:'OPEN_DIALOG', value: 'Text 1' });
        this.options.push({key:'OPEN_DIALOG', value: 'Text 2' });
        this.images +=  ';' +this.hostObject?.configuration?.imageURL;
        this.hostEvents.emit({action: 'block-loaded'});
    }

    ngOnChanges(e: any): void { 
        if (this.filmStrip){
            this.filmStrip.currIndex = e?.index;
            this.filmStrip?.ngAfterViewInit();
        }
    }
}
