import { PageBuilderComponent } from './components/page-builder/page-builder.component';
import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AddonComponent } from './components/addon/addon.component';

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
            {
                path: '',
                // component: PageBuilderComponent
                // TODO: solve routing
                loadChildren: () => import('./components/page-builder/page-builder.module').then(m => m.PageBuilderModule)
            }
        ]
    },
    {
        path: `:settings/:addon_uuid`,
        children: [
            {
                path: 'page_builder',
                // component: PageBuilderComponent
                // TODO: solve routing
                loadChildren: () => import('./components/page-builder/page-builder.module').then(m => m.PageBuilderModule)
            }
        ]
    },
    {
        path: '**',
        component: EmptyRouteComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }



