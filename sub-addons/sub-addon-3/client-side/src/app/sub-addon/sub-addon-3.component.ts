import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'sub-addon-3',
    templateUrl: './sub-addon-3.component.html',
    styleUrls: ['./sub-addon-3.component.css']
})
export class SubAddon3Component implements OnInit {
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

    countTest = 0;

    constructor(private translate: TranslateService) { }

    private handleHostObjectChange() {
        if (this.hostObject?.filter) {
            alert(`Filter change in SubAddon3 with value ${JSON.stringify(this.hostObject?.filter)}`);
        }
    }

    ngOnInit(): void {
        this.hostEvents.emit({action: 'block-loaded'});
    }

    onBtnClick(event) {
        this.hostEvents.emit({
            action: 'set-filters',
            filters: [
                {
                    // a unique key to later update this filter with
                    key: this.countTest < 2 ? '123' : (this.countTest < 8 ? '456' : '789'),
                    // what resource the filter field is.
                    resource: 'accounts',
                    // a JSON filter. One layer, complex (AND OR) operations not allowed
                    filter: {
                        FieldType: "String",
                        ApiName: "Type",
                        Operation: "IsEqual",
                        Values: ["Customer"]
                    }
                }
            ]});

        this.countTest++;
    }
}
