import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PepNgxCompositeLibModule } from '@pepperi-addons/ngx-composite-lib';

import { PepColorSettingsModule } from '@pepperi-addons/ngx-composite-lib/color-settings';
import { PepDataViewBuilderModule } from '@pepperi-addons/ngx-composite-lib/data-view-builder';
import { PepFileStatusPanelModule } from '@pepperi-addons/ngx-composite-lib/file-status-panel';
import { PepFlowPickerButtonModule } from '@pepperi-addons/ngx-composite-lib/flow-picker-button';
import { PepGenericFormModule } from '@pepperi-addons/ngx-composite-lib/generic-form';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepGroupButtonsSettingsModule } from '@pepperi-addons/ngx-composite-lib/group-buttons-settings';
import { PepIconPickerModule } from '@pepperi-addons/ngx-composite-lib/icon-picker';
import { PepManageParametersModule } from '@pepperi-addons/ngx-composite-lib/manage-parameters';
import { PepShadowSettingsModule } from '@pepperi-addons/ngx-composite-lib/shadow-settings';

const pepComponentsModules = [
    PepColorSettingsModule,
    PepDataViewBuilderModule,
    PepFileStatusPanelModule,
    PepFlowPickerButtonModule,
    PepGenericFormModule,
    PepGenericListModule,
    PepGroupButtonsSettingsModule,
    PepIconPickerModule,
    PepManageParametersModule,
    PepShadowSettingsModule,
];

@NgModule({
    declarations: [
    ],
    imports: [
        CommonModule,
        PepNgxCompositeLibModule,
        pepComponentsModules,
    ],
    exports: [
    ],
    providers: [
    ]
})
export class SharedPepNgxCompositeLibModule {
    // Do nothing.
}
