import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs/operators';
// import { config } from '../components/addon.config';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private history: string[] = []

    private _addonUUID = '';
    get addonUUID(): string {
        return this._addonUUID;
    }

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) {
        // this.router.events.subscribe((event) => {
        //     if (event instanceof NavigationEnd) {
        //         this.history.push(event.urlAfterRedirects);
        //     }
        // });
        this._addonUUID = this.route.snapshot.firstChild.params['addonUUID']; // || config.AddonUUID; 

        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            this.history.push(event.urlAfterRedirects);
        });
    }

    back(): void {
        this.history.pop();
        if (this.history.length > 0) {
            // this.location.back(); // not working.
            this.router.navigateByUrl(this.history.pop());
        } else {
            this.router.navigate([`./settings/${this.addonUUID}/pages`], {
                relativeTo: this.route,
                queryParamsHandling: 'merge'
            });
        }
    }
    navigateToPage(pageKey: string){
        this.router.navigate([`./addons/${this.addonUUID}/pages/${pageKey}`], {
            relativeTo: this.route,
            queryParamsHandling: 'merge'
        });
    }
}
