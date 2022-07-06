import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HideInComponent } from './hide-in.component'
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepIconModule } from '@pepperi-addons/ngx-lib/icon';
import { TranslateLoader, TranslateModule, TranslateStore } from '@ngx-translate/core';
// import { PepAddonService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';

@NgModule({
    declarations: [HideInComponent],
    imports: [
        CommonModule,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        MatBadgeModule,
        MatCheckboxModule,
        PepButtonModule,
        PepCheckboxModule,
        PepIconModule,
        TranslateModule.forChild()
        // ({
        //     loader: {
        //         provide: TranslateLoader,
        //         useFactory: (addonService: PepAddonService) => 
        //             PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib']),
        //         deps: [PepAddonService]
        //     }, isolate: false
        // }),
    ],
    exports: [HideInComponent]
})
export class HideInModule { }
