// File: side-bar.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016


import { Component, Input } from "@angular/core";


@Component({
  moduleId: module.id,
  selector: "sinap-side-bar",
  templateUrl: "../html/side-bar.component.html",
  styleUrls: [ "../styles/side-bar.component.css" ]
})
export class SideBarComponent {
  @Input() icons: SideBarIcon[];

  setActive(icon:SideBarIcon) {
    this.icons.forEach((i) => {
      i.active = (i == icon);
    });
  }
}

export interface SideBarIcon {
  active: Boolean;
  path: String;
  name: String;
}