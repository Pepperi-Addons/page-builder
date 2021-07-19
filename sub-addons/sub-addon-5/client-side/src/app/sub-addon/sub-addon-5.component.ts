import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UIControl, ObjectsDataRow } from '@pepperi-addons/ngx-lib';

@Component({
  selector: 'sub-addon-5',
  templateUrl: './sub-addon-5.component.html',
  styleUrls: ['./sub-addon-5.component.css']
})
export class SubAddon5Component implements OnInit {
  options: {key:string, value:string}[] = [];
  items;
  uiControl;
  @Input() hostObject: any;
  @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
  constructor(private translate: TranslateService) { }

  ngOnInit(): void {

    this.hostEvents.emit({action: 'addon-loaded'});

  }

}
