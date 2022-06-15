import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div>Route is not exist.</div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: '',
        component: SettingsComponent,
        children: [
            {
                path: 'pages',
                loadChildren: () => import('../pages-manager/pages-manager.module').then(m => m.PagesManagerModule),
            },
            {
                path: 'pages/:page_key',
                loadChildren: () => import('../page-manager/page-manager.module').then(m => m.PageManagerModule)
            },
            // {
            //     path: 'layout',
            //     loadChildren: () => import('./layout/layout.module')
            //       .then(m => m.LayoutModule),
            //   },
            { path: '**', component: EmptyRouteComponent }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        // RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
    ],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }



