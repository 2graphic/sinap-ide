// File: status-bar.component.ts
// Created by: Daniel James
// Date created: December 1, 2016


import { Component, Input } from "@angular/core";


@Component({
    selector: "sinap-status-bar",
    templateUrl: "./status-bar.component.html",
    styleUrls: ["./status-bar.component.scss"]
})
export class StatusBarComponent {
    @Input() info: StatusBarInfo | undefined;
}

export interface StatusBarInfo {
    title: string;
    items: string[];
}
