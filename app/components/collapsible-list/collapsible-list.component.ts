// File: collapsible-list.component.ts
// Author: CJ Dimaano
// Date created: February 1, 2017


import { Component, Input } from "@angular/core";


@Component({
    selector: "sinap-collapsible-list",
    templateUrl: "collapsible-list.component.html",
    styleUrls: [
        "collapsible-list.component.css",
        "../../styles/side-panel.component.css"
    ]
})
export class CollapsibleListComponent {

    @Input()
    public items: any[] = [];

    @Input()
    public header: string = "header";

}
