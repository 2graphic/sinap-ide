// File: status-bar.component.ts
// Created by: Daniel James
// Date created: December 1, 2016


import { Component, Input } from "@angular/core";


@Component({
  selector: "sinap-status-bar",
  templateUrl: "./status-bar.component.html",
  styleUrls: [ "./status-bar.component.css" ]
})
export class StatusBarComponent {
    @Input() title: String;
    @Input() items: String[]; // For now we'll support displaying just custom strings.
}
