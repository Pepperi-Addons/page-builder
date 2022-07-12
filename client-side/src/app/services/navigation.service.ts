import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { filter } from 'rxjs/operators';
import { config } from '../components/addon.config';

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
        private route: ActivatedRoute
    ) {
        // Get the addonUUID from the root config.
        this._addonUUID = config.AddonUUID;
        this._devServer = this.route.snapshot.queryParamMap.get('devServer') === 'true';
        
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            this.history.push(event.urlAfterRedirects);
        });

        this.loadDevBlocks();
    }

    private loadDevBlocks() {
        try {
            const devBlocksAsJSON = JSON.parse(this.route.snapshot.queryParamMap.get('devBlocks'));
            this._devBlocks = new Map(devBlocksAsJSON);
        } catch(err) {
            this._devBlocks = new Map<string, string>();
        }
    }

    back(): void {
        // this.router['data']['showSidebar'] = true;

        this.history.pop();
        if (this.history.length > 0) {
            // this.location.back(); // not working.
            this.router.navigateByUrl(this.history.pop());
        } else {
            // this.router.navigate([`./settings/${this.addonUUID}/pages`], {
            this.router.navigate([`./settings_block/Pages`], {
                relativeTo: this.route,
                queryParamsHandling: 'merge'
            });
        }
    }

    navigateToPage(pageKey: string){
        // this.router['data'] = { showSidebar: false};
        // this.router.navigate([`./addons/${this.addonUUID}/pages/${pageKey}`], {
        this.router.navigate([`./block/Pages/${pageKey}`], {
            relativeTo: this.route,
            queryParamsHandling: 'merge'
        });
    }
}
