import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

interface groupButtonArray {
    key: string; 
    value: string;
}

@Component({
    selector: 'slide',
    templateUrl: './slide.component.html',
    styleUrls: ['./slide.component.scss']
})
export class SlideComponent implements OnInit {
    
    @Input() id: string;
    @Input() title: string;
    @Input() isDraggable = false;
    @Input() showActions = true;

    @Output() removeClick: EventEmitter<void> = new EventEmitter();
    @Output() editClick: EventEmitter<any> = new EventEmitter();

    constructor(
        private translate: TranslateService
        // private utilitiesService: PepUtilitiesService
    ) { 

    }

    ngOnInit(): void {
    
    }

    onRemoveClick() {
        this.removeClick.emit();
    }

    onEditClick() {
        this.editClick.emit({type: 'slide', id: this.id});
    }

    // onHideInChange(event: DataViewScreenSize[]) {
    //     this.hideInChange.emit(event);
    // }
}
