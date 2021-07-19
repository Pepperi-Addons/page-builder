import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { PepNgxLibModule  } from '@pepperi-addons/ngx-lib';
import { PageBuilderComponent} from './index';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';

import { SectionModule } from '../section/section.module'
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';


@NgModule({
    declarations: [
        PageBuilderComponent

    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepAddonLoaderModule,
        //// When not using module as sub-addon please remark this for not loading twice resources
        MatCardModule,
        SectionModule,
        PepPageLayoutModule,
        PepSelectModule,
        PepTextboxModule


        //// Example for importing tree-shakeable @pepperi-addons/ngx-lib components to a module



    ],
    exports:[PageBuilderComponent],
    providers: [

    ]
})
export class PageBuilderModule {
    constructor(
      ) {


    }
}
