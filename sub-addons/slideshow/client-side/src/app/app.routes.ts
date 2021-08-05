import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SlideshowComponent } from './components/slideshow/slideshow.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div></div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: `:settings/:addon_uuid`,
        children: [
            {
                path: ':editor',
                component: SlideshowComponent
                // TODO: solve routing
                // loadChildren: () => import('./components/addon/index').then(m => m.SlideshowModule)
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



