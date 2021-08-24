import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router'
import { config } from '../components/addon.config';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private history: string[] = []

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.history.push(event.urlAfterRedirects);
            }
        });
    }

    back(): void {
        this.history.pop()
        if (this.history.length > 0) {
            this.location.back();
        } else {
            this.router.navigate([`./settings/${config.AddonUUID}`], {
                relativeTo: this.route,
                queryParamsHandling: 'merge'
            });
        }
    }
    navigateToPage(pageKey: string){
        //let addonUUID = this.route.snapshot.params.addon_uuid;
        this.router.navigate([`./page_builder/${pageKey}`], {
            relativeTo: this.route,
            queryParamsHandling: 'merge'
        });
    }
}
