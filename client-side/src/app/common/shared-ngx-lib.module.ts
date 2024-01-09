import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';

import { PepAddressModule } from '@pepperi-addons/ngx-lib/address';
import { PepAttachmentModule } from '@pepperi-addons/ngx-lib/attachment';
import { PepBreadCrumbsModule } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepCarouselModule } from '@pepperi-addons/ngx-lib/carousel';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepChipsModule } from '@pepperi-addons/ngx-lib/chips';
import { PepColorModule } from '@pepperi-addons/ngx-lib/color';
import { PepDateModule } from '@pepperi-addons/ngx-lib/date';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';
import { PepFieldTitleModule } from '@pepperi-addons/ngx-lib/field-title';
import { PepFilesUploaderModule } from '@pepperi-addons/ngx-lib/files-uploader';
import { PepFormModule } from '@pepperi-addons/ngx-lib/form';
import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';
import { PepIconModule } from '@pepperi-addons/ngx-lib/icon';
import { PepImageModule } from '@pepperi-addons/ngx-lib/image';
import { PepImagesFilmstripModule } from '@pepperi-addons/ngx-lib/images-filmstrip';
import { PepLinkModule } from '@pepperi-addons/ngx-lib/link';
import { PepListModule } from '@pepperi-addons/ngx-lib/list';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepProfileDataViewsListModule } from '@pepperi-addons/ngx-lib/profile-data-views-list';
import { PepQuantitySelectorModule } from '@pepperi-addons/ngx-lib/quantity-selector';
import { PepQueryBuilderModule } from '@pepperi-addons/ngx-lib/query-builder';
import { PepRemoteLoaderModule } from '@pepperi-addons/ngx-lib/remote-loader';
import { PepRichHtmlTextareaModule } from '@pepperi-addons/ngx-lib/rich-html-textarea';
import { PepSearchModule } from '@pepperi-addons/ngx-lib/search';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepSelectPanelModule } from '@pepperi-addons/ngx-lib/select-panel';
import { PepSeparatorModule } from '@pepperi-addons/ngx-lib/separator';
import { PepSideBarModule } from '@pepperi-addons/ngx-lib/side-bar';
import { PepSignatureModule } from '@pepperi-addons/ngx-lib/signature';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepSkeletonLoaderModule } from '@pepperi-addons/ngx-lib/skeleton-loader';
import { PepSliderModule } from '@pepperi-addons/ngx-lib/slider';
import { PepSmartFiltersModule } from '@pepperi-addons/ngx-lib/smart-filters';
import { PepSnackBarModule } from '@pepperi-addons/ngx-lib/snack-bar';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTextboxIconModule } from '@pepperi-addons/ngx-lib/textbox-icon';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { config } from './addon.config';

const pepComponentsModules = [
    PepAddressModule,
    PepAttachmentModule,
    PepBreadCrumbsModule,
    PepButtonModule,
    PepCarouselModule,
    PepCheckboxModule,
    PepChipsModule,
    PepColorModule,
    PepDateModule,
    PepDialogModule,
    PepDraggableItemsModule,
    PepFieldTitleModule,
    PepFilesUploaderModule,
    PepFormModule,
    PepGroupButtonsModule,
    PepIconModule,
    PepImageModule,
    PepImagesFilmstripModule,
    PepLinkModule,
    PepListModule,
    PepMenuModule,
    PepPageLayoutModule,
    PepProfileDataViewsListModule,
    PepQuantitySelectorModule,
    PepQueryBuilderModule,
    PepRemoteLoaderModule,
    PepRichHtmlTextareaModule,
    PepSearchModule,
    PepSelectModule,
    PepSelectPanelModule,
    PepSeparatorModule,
    PepSideBarModule,
    PepSignatureModule,
    PepSizeDetectorModule,
    PepSkeletonLoaderModule,
    PepSliderModule,
    PepSmartFiltersModule,
    PepSnackBarModule,
    PepTextareaModule,
    PepTextboxModule,
    PepTextboxIconModule,
    PepTopBarModule,
];

@NgModule({
    declarations: [
    ],
    imports: [
        CommonModule,
        PepNgxLibModule,
        pepComponentsModules,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        })
    ],
    exports: [
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
    ]
})
export class SharedPepNgxLibModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
