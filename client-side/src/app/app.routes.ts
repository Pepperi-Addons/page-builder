import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PagesManagerComponent } from './components/pages-manager/pages-manager.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div></div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: ``,
        children: [
            // {
            //     path: 'pages',
            //     loadChildren: () => import('./components/pages-manager/pages-manager.module').then(m => m.PagesManagerModule)
            // },
            {
                path: 'page_builder/:page_key',
                // component: PageBuilderComponent
                // TODO: solve routing
                loadChildren: () => import('./components/page-manager/page-manager.module').then(m => m.PageManagerModule)
            }
        ]
    },
    {
        path: '**',
        component: PagesManagerComponent
    }
];

@NgModule({
    imports: [
        // RouterModule.forChild(routes),
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }



