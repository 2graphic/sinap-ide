// File: collapsible-list.component.ts
// Created by: CJ Dimaano
// Date created: February 1, 2017
//
// Resources:
// http://stackoverflow.com/questions/40811809/add-component-dynamically-inside-an-ngif
// http://blog.rangle.io/dynamically-creating-components-with-angular-2/
//
// TODO:
// - Figure out a way to handle custom list items. E.g. a list item that is a
//   collapsible list component.


import { Component, Input, Output, EventEmitter, ChangeDetectorRef, Inject } from "@angular/core";


@Component({
    selector: "sinap-collapsible-list",
    templateUrl: "./collapsible-list.component.html",
    styleUrls: ["./collapsible-list.component.scss"]
})
export class CollapsibleListComponent {

    constructor( @Inject(ChangeDetectorRef) private changeDetectorRef: ChangeDetectorRef) { };

    public isExpanded: boolean = true;
    public selectedIndex: number = -1;

    @Input()
    items: any[] = [];

    @Input()
    text: string = "";

    @Input()
    tooltip: string | null;

    @Output()
    selectedIndexChanged = new EventEmitter<CollapsibleListComponent>();

    private toggleList() {
        this.isExpanded = !this.isExpanded;

        // TODO: I have no idea why this is neccessary...
        this.changeDetectorRef.detectChanges();
    }

    private clickItem(e: MouseEvent) {
        this.selectedIndex = parseInt((e.target as Element).id);
        this.selectedIndexChanged.emit(this);
    }

}
