// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit } from "@angular/core";
import { MenuService, MenuDelegate } from "./menu.service"


@Component({
  moduleId: module.id,
  selector: "sinap-main",
  templateUrl: "../html/main.component.html",
  providers: [MenuService]
})
export class MainComponent implements OnInit, MenuDelegate {
  constructor(private menu: MenuService) {}

  newFile() {
    console.log("New file.");
  }

  ngOnInit(): void {
    this.menu.setDelegate(this);
  }
}
