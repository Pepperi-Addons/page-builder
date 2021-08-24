import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router'

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
            this.router.navigateByUrl('/');
        }
    }
    navigateToPage(id: number){
        //let addonUUID = this.route.snapshot.params.addon_uuid;
        this.router.navigate(['./page_builder/50062e0c-9967-4ed4-9102-f2bc50602d41?dev=true&edit=true'], {
            relativeTo: this.route,
            queryParamsHandling: 'merge'
        });
    }
}
