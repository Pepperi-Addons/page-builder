import { Injectable, ViewContainerRef } from "@angular/core";
import { PepRemoteLoaderService } from "@pepperi-addons/ngx-lib/remote-loader";
import { NavigationService } from "./navigation.service";

@Injectable()
export class DIMXService {
    private dimxFunctions: { 
        DIMXImport: (options: any) => void, 
        DIMXExport: (options: any) => void 
    } = null;

    constructor(
        private remoteLoaderService: PepRemoteLoaderService,
        private navigationService: NavigationService,
    ) {
    }

    register(viewContainerRef: ViewContainerRef, onDIMXProcessDoneCallback: (dimxEvent: any) => void) {
        const dimxHostObject = {
            DIMXAddonUUID: this.navigationService.addonUUID,
            DIMXResource: 'PagesDrafts'
        };

        this.remoteLoaderService.loadAddonBlockInContainer({
            container: viewContainerRef,
            name: 'DIMX',
            hostObject: dimxHostObject,
            hostEventsCallback: (event: any) => {
                if (event.action === 'DIMXFunctionsRegister') {
                    this.dimxFunctions = event.value;
                } else if (event.action === 'DIMXProcessDone') {
                    onDIMXProcessDoneCallback(event.value);
                } else {
                    console.error('Unknown event action: ' + event.action);
                }
            }
        });
    }

    import() {
        if (typeof(this.dimxFunctions?.DIMXImport) === 'function') {
            this.dimxFunctions.DIMXImport({
                OwnerID: this.navigationService.addonUUID,
            });
        } else {
            console.error('DIMXImport function not found, are you registered?');
        }
    }

    export(pageKey: string, pageName: string) {
        if (typeof(this.dimxFunctions?.DIMXExport) === 'function') {
            this.dimxFunctions.DIMXExport({ 
                DIMXExportFormat: 'json',
                DIMXExportIncludeDeleted: true,
                DIMXExportFileName: pageName || `page_${pageKey}`,
                DIMXExportWhere: 'Key="' + pageKey + '"'
            });
        } else {
            console.error('DIMXExport function not found, are you registered?');
        }
    }
}