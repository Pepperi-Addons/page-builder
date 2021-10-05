import { TranslateService } from '@ngx-translate/core';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

@Component({
    selector: 'sub-addon-2',
    templateUrl: './sub-addon-2.component.html',
    styleUrls: ['./sub-addon-2.component.scss']
})
export class SubAddon2Component implements OnInit {
    @ViewChild('filmStrip') filmStrip: any;

    @Input() hostObject: any;

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    options: {key:string, value:string}[] = [];
    images = 'https://idpfiles.sandbox.pepperi.com/f389fd2e-4a31-4965-a21e-3a98b4553300/images/left-side-background.jpg;https://idpfiles.sandbox.pepperi.com/f389fd2e-4a31-4965-a21e-3a98b4553300/images/logo.svg';
    inputTitle = '';
    currIndex = 0;
    
    constructor(private translate: TranslateService, private cd: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.options.push({key:'OPEN_DIALOG', value: 'Text 1' });
        this.options.push({key:'OPEN_DIALOG', value: 'Text 2' });
        this.hostEvents.emit({action: 'block-loaded'});
        this.images +=  ';' +this.hostObject?.Configuration?.imageURL;
    }

    ngOnChanges(e: any): void { 
        if (this.filmStrip){
            this.filmStrip.currIndex = e?.index;
            this.filmStrip?.ngAfterViewInit();
        }
    }
}
