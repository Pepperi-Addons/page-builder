import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';

// import { Component } from '@angular/core';
// // Important for single spa
// @Component({
//     selector: 'app-empty-route',
//     template: '<div>Route (settings) is not exist settings.</div>',
// })
// export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: ':settingsSectionName/:addonUUID/:slugName',
        // component: SettingsComponent,
        children: [
            {
                path: ':page_key',
                loadChildren: () => import('../page-manager/page-manager.module').then(m => m.PageManagerModule)
            },
            {
                path: '**',
                loadChildren: () => import('../pages-manager/pages-manager.module').then(m => m.PagesManagerModule),
            }
            // { path: '**', component: EmptyRouteComponent }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }



