import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

@Injectable({ providedIn: 'root' })
export class UtilitiesService {
    
    constructor(
        private translate: TranslateService,
        private dialogService: PepDialogService,
        ) {
        //
    }

    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    mergeDeep(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
      
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, { [key]: {} });
                    }

                    this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
      
        return this.mergeDeep(target, ...sources);
    }

    showDialogMsg(message: string, title: string = '') {
        title = title.length > 0 ? title: this.translate.instant('MESSAGES.TITLE_NOTICE');

        const data = new PepDialogData({
            title: title,
            content: message,
        });
        this.dialogService.openDefaultDialog(data);
    }
}
