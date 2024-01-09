import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { A11yModule } from '@angular/cdk/a11y';
import { BidiModule } from '@angular/cdk/bidi';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule} from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';

const angularCdkModules = [
    A11yModule,
    BidiModule,
    CdkStepperModule,
    CdkTableModule,
    CdkTreeModule,
    DragDropModule,
    OverlayModule,
    ScrollingModule,
];

@NgModule({
    declarations: [
    ],
    imports: [
        CommonModule,
        angularCdkModules,
    ],
    exports: [
    ],
    providers: [
        // When loading this module from route we need to add this here (because only this module is loading).
    ]
})
export class SharedAngularCdkModule {
    
}
