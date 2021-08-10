import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'toolbar-actions',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],

})
export class ToolbarComponent implements OnInit {

    @HostBinding('style.cursor') _cursor = 'inherit';

    @Input() title = '';
    
    private _isDraggable = false;
    @Input()
    set isDraggable(value: boolean) {
        this._isDraggable = value;

        this._cursor = value ? 'move' : 'inherit'
    }
    get isDraggable(): boolean {
        return this._isDraggable;
    }

    @Input() showActions = true;

    @Output() remove: EventEmitter<void> = new EventEmitter();
    @Output() edit: EventEmitter<void> = new EventEmitter();

    constructor() { }

    ngOnInit(): void {
    }

    onRemoveClick() {
        this.remove.emit();
    }

    onEditClick() {
        this.edit.emit();
    }

}
