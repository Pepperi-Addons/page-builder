import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'sub-addon-3-editor',
    templateUrl: './sub-addon-3-editor.component.html',
    styleUrls: ['./sub-addon-3-editor.component.css']
})
export class SubAddon3EditorComponent implements OnInit {
    richHtml;
    inputTitle;
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    constructor(private translate: TranslateService) { }

    private getDefaultPageConfiguration() {
        const pageConfiguration = {
            Consume: {
                Filter: {
                    Resource: "transaction_lines",
                    Fields:  ["UnitsQuantity", "Item.TSABrand", "Transaction.Account.Type", "Transaction.Status"],
                },
                Context: {
                    Resource: "transactions"
                }
            },
            Produce: {
                Filters: [{
                    Resource: "transactions",
                    Fields:  ["UnitsQuantity", "Item.TSABrand", "Account.Type", "Status"],
                },
                {
                    Resource: "accounts",
                    Fields:  ["Name", "Type", "Status"],
                }],
                Context: {
                    Resource: "transaction_lines"
                }
            }
        };

        return pageConfiguration;
    }

    ngOnInit(): void {
        this.richHtml = "<h1><u>Rich Text Value Example</u></h1><h2><em style=' color: rgb(147, 200, 14);'>Pepperi Rich Text Value </em><u style='color: rgb(0, 102, 204);'>Example</u></h2><ol><li><strong><u>Pepperi Rich Text Value Example</u></strong></li><li>Pepperi Rich text [value] example</li></ol>";

        // Raise default event for set-page-configuration (if pageConfiguration not exist on host object).
        if (!this.hostObject || !this.hostObject.pageConfiguration) {
            this.hostEvents.emit({
                action: 'set-page-configuration',
                pageConfiguration: this.getDefaultPageConfiguration()
            });
        }
    }

    ngOnChanges(e: any): void {
        if (e?.message){
            this.inputTitle = e?.message;

        }
      
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
    }


}
