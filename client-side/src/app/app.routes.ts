import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PagesManagerComponent } from './components/pages-manager/pages-manager.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div>Route is not exist.</div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    // {
    //     path: `settings/:addonUUID`,
    //     children: [
    //         {
    //             path: '**',
    //             loadChildren: () => import('./components/pages-manager/pages-manager.module').then(m => m.PagesManagerModule)
    //         },
    //     ]
    // },
    // {
    //     path: `addons/:addonUUID`,
    //     children: [
    //        {
    //             path: '',
    //             loadChildren: () => import('./components/page-manager/page-manager.module').then(m => m.PageManagerModule)
    //         }
    //     ]
    // },
    { path: '**', component: EmptyRouteComponent }
];

@NgModule({
    imports: [
        // RouterModule.forChild(routes),
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }



