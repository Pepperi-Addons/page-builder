import { Component, OnInit } from '@angular/core';
@Component({
    selector: 'addon-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(
    ) {
        
    }

    ngOnInit() {
        // this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(res => {
        //     const queryParams = this.route.snapshot.queryParams;
        //     this.showEditor = queryParams?.edit === "true" ?? false;
        // });
    }
}
