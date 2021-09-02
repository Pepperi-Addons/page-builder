import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'sub-addon-2-editor',
    templateUrl: './sub-addon-2-editor.component.html',
    styleUrls: ['./sub-addon-2-editor.component.scss']
})
export class SubAddon2EditorComponent implements OnInit {
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    inputTitle = '';
    currIndex = 0;
    
    constructor(private translate: TranslateService) { }

    ngOnInit(): void {
        this.hostEvents.emit({action: 'addon-loaded'});
    }

    ngOnChanges(e: any): void { 
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
    }

}
