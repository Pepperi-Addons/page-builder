import { Component, Injectable, Input, OnInit } from '@angular/core';


@Component({
  selector: 'pep-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss']
})

export class SectionComponent implements OnInit {
  
  @Input() sectionColumnArray = new Array(3); 

  constructor() { }

  ngOnInit(): void {
  }
}
