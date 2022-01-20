// import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
// import { DataViewScreenSize } from '@pepperi-addons/papi-sdk';

// @Component({
//     selector: 'toolbar-actions',
//     templateUrl: './toolbar.component.html',
//     styleUrls: ['./toolbar.component.scss'],

// })
// export class ToolbarComponent implements OnInit {

//     @HostBinding('style.cursor') _cursor = 'inherit';

//     @Input() title = '';
//     @Input() hideIn: DataViewScreenSize[] = [];
    
//     private _isDraggable = false;
//     @Input()
//     set isDraggable(value: boolean) {
//         this._isDraggable = value;

//         this._cursor = value ? 'move' : 'inherit'
//     }
//     get isDraggable(): boolean {
//         return this._isDraggable;
//     }

//     @Input() showActions = true;

//     @Output() removeClick: EventEmitter<void> = new EventEmitter();
//     @Output() editClick: EventEmitter<void> = new EventEmitter();
//     @Output() hideInChange: EventEmitter<DataViewScreenSize[]> = new EventEmitter();
//     @Output() hideInMenuOpened: EventEmitter<void> = new EventEmitter();
//     @Output() hideInMenuClosed: EventEmitter<void> = new EventEmitter();

//     constructor() { }

//     ngOnInit(): void {
//     }

//     onRemoveClick() {
//         this.removeClick.emit();
//     }

//     onEditClick() {
//         this.editClick.emit();
//     }

//     onHideInChange(event: DataViewScreenSize[]) {
//         this.hideInChange.emit(event);
//     }

//     onHideInMenuOpened() {
//         this.hideInMenuOpened.emit();
//     }

//     onHideInMenuClosed() {
//         this.hideInMenuClosed.emit();
//     }
// }
