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

    private getDefaultPageConfiguration() {
        // const pageConfiguration = {
        //     Consume: {
        //         Filter: {
        //             Resource: "transaction_lines",
        //             Fields:  ["UnitsQuantity", "Item.TSABrand", "Transaction.Account.Type", "Transaction.Status"],
        //         },
        //         Context: {
        //             Resource: "transactions"
        //         }
        //     },
        //     Produce: {
        //         Filters: [{
        //             Resource: "transactions",
        //             Fields:  ["Account.Type", "Status"],
        //         }],
        //         Context: {
        //             Resource: "transaction_lines"
        //         }
        //     }
        // };

        const pageConfiguration = {
            Parameters: [
                {
                    "Key": "MyFilter1",
                    "Type": "Filter",
                    "Mandatory": false,
                    "Consume": true,
                    "Produce": false,
                    "Resource": "transaction_lines",
                    "Fields":  ["UnitsQuantity", "Item.TSABrand", "Transaction.Account.Type", "Transaction.Status"]
                },
                {
                    "Key": "MyFilter2",
                    "Type": "Filter",
                    "Mandatory": false,
                    "Consume": false,
                    "Produce": true,
                    "Resource": "accounts",
                    Fields:  ["Name", "Type", "Status"],
                }
            ]
        };

        return pageConfiguration;
    }

    ngOnInit(): void {
        // Raise default event for set-page-configuration (if pageConfiguration not exist on host object).
        if (!this.hostObject || !this.hostObject.pageConfiguration) {
            this.hostEvents.emit({
                action: 'set-page-configuration',
                pageConfiguration: this.getDefaultPageConfiguration()
            });
        }
    }

    ngOnChanges(e: any): void { 
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
    }

}
