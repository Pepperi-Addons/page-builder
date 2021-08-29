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

    private _devServer = false;
    get devServer(): boolean {
        return this._devServer;
    }

    private _devBlocks: Map<string, string>; // Map<Component name, Host name>
    get devBlocks(): Map<string, string> {
        return this._devBlocks;
    }

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            this.history.push(event.urlAfterRedirects);
        });

        this.loadDevBlocks();
        this._devServer = this.route.snapshot.queryParams['devServer'] === 'true';
        this._addonUUID = this.route.snapshot.firstChild.params['addonUUID']; // || config.AddonUUID; 
    }

    private loadDevBlocks() {
        try {
            const devBlocksAsJSON = JSON.parse(this.route.snapshot.queryParams['devBlocks']);
            this._devBlocks = new Map(devBlocksAsJSON);
        } catch(err) {
            this._devBlocks = new Map<string, string>();
        }
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
