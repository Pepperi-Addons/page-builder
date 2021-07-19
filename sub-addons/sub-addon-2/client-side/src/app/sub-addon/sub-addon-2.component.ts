import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'sub-addon-2',
  templateUrl: './sub-addon-2.component.html',
  styleUrls: ['./sub-addon-2.component.css']
})
export class SubAddon2Component implements OnInit {
  options: {key:string, value:string}[] = [];
  @Input() hostObject: any;
  @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
    this.options.push({key:'OPEN_DIALOG', value: 'Text 1' });
    this.options.push({key:'OPEN_DIALOG', value: 'Text 2' });
    this.hostEvents.emit({action: 'addon-loaded'});
  }

}
