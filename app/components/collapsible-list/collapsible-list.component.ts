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


import { Component, Input, Output, EventEmitter } from "@angular/core";


@Component({
    selector: "sinap-collapsible-list",
    templateUrl: "collapsible-list.component.html",
    styleUrls: [
        "collapsible-list.component.css",
        "../../styles/side-panel.component.css"
    ]
})
export class CollapsibleListComponent {

    private _isExpanded: boolean = true;
    private _selectedIndex: number = -1;

    @Input()
    items: any[] = [];

    @Input()
    text: string = "";

    @Input()
    tooltip: string | null;

    @Output()
    selectedIndexChanged = new EventEmitter();

    get selectedIndex() {
        return this._selectedIndex;
    }

    set selectedIndex(value: number) {
        this._selectedIndex = value;
        this.selectedIndexChanged.emit(this);
    }

    get isExpanded() {
        return this._isExpanded;
    }

    set isExpanded(value: boolean) {
        this._isExpanded = value;
    }

    private toggleList() {
        this.isExpanded = !this.isExpanded;
    }

    private clickItem(e: MouseEvent) {
        this.selectedIndex = parseInt((e.target as Element).id);
    }

}