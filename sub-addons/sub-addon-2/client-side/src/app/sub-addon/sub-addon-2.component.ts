import { propsSubject } from '@pepperi-addons/ngx-remote-loader';
import { hostObject } from './../../../../../../client-side/src/app/components/page-builder/page-builder.model';
import { TranslateService } from '@ngx-translate/core';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'sub-addon-2',
  templateUrl: './sub-addon-2.component.html',
  styleUrls: ['./sub-addon-2.component.css']
})
export class SubAddon2Component implements OnInit {
  options: {key:string, value:string}[] = [];
  @Input() hostObject: any;
  @ViewChild('filmStrip') filmStrip: any;
  inputTitle = '';
  currIndex = 0;
  @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
  images = 'https://idpfiles.sandbox.pepperi.com/f389fd2e-4a31-4965-a21e-3a98b4553300/images/left-side-background.jpg;https://idpfiles.sandbox.pepperi.com/f389fd2e-4a31-4965-a21e-3a98b4553300/images/logo.svg';
  constructor(private translate: TranslateService,
    private cd: ChangeDetectorRef
    ) { }

  ngOnInit(): void {
    this.options.push({key:'OPEN_DIALOG', value: 'Text 1' });
    this.options.push({key:'OPEN_DIALOG', value: 'Text 2' });
    this.hostEvents.emit({action: 'addon-loaded'});
    this.images = this.hostObject.configuration?.imageURL + ';' + this.images;
    
    propsSubject.subscribe(res =>{});
     

  }

  ngOnChanges(e: any): void { 
    if (this.filmStrip){
      this.filmStrip.currIndex = e?.index;
      this.filmStrip?.ngAfterViewInit();
    }
   


    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
    //Add '${implements OnChanges}' to the class.
  }

}
