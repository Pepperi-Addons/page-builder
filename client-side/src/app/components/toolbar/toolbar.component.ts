import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'addon-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

    @Input() title = '';
    @Input() showActionBtn = true;
    @Output() remove: EventEmitter<void> = new EventEmitter();
    @Output() edit: EventEmitter<void> = new EventEmitter();

    constructor() { }

    ngOnInit(): void {
    }

    delete(){
     this.remove.emit();
    }

}
