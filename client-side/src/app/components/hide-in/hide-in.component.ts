import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataViewScreenSize } from '@pepperi-addons/papi-sdk';

interface hideInItem {
    key: DataViewScreenSize,
    text: string,
    selected: boolean
}

@Component({
    selector: 'hide-in',
    templateUrl: './hide-in.component.html',
    styleUrls: ['./hide-in.component.scss'],
})
export class HideInComponent implements OnInit {
    @Input() hideIn: DataViewScreenSize[] = [];

    @Output() hideInChange: EventEmitter<DataViewScreenSize[]> = new EventEmitter();
    @Output() menuOpened: EventEmitter<void> = new EventEmitter();
    @Output() menuClosed: EventEmitter<void> = new EventEmitter();

    menuItems: Array<hideInItem>;

    constructor(
        private translate: TranslateService,
    ) { }

    async ngOnInit() {
        // Get the first translation for load all translations.
        const desktopTitle = await this.translate.get('PAGE_MANAGER.DESKTOP').toPromise();

        this.menuItems = [
            { key: 'Landscape', text: desktopTitle, selected: this.hideIn?.some(hideIn => hideIn === 'Landscape') },
            { key: 'Tablet', text: this.translate.instant('PAGE_MANAGER.TABLET'), selected: this.hideIn?.some(hideIn => hideIn === 'Tablet') },
            { key: 'Phablet', text: this.translate.instant('PAGE_MANAGER.MOBILE'), selected: this.hideIn?.some(hideIn => hideIn === 'Phablet') }
        ];
    }

    onItemClick(event: any, menuItem: hideInItem) {
        menuItem.selected = !menuItem.selected;

        const hideIn = this.menuItems.filter(item => item.selected).map(item => item.key);
        this.hideInChange.emit(hideIn);

        event.stopPropagation();
        
        return false;
    }

    onMenuOpened() {
        this.menuOpened.emit();
    }

    onMenuClosed() {
        this.menuClosed.emit();
    }
}
