// File: modal-window.module.ts
// Created by: Daniel James
// Date created: January 17, 2017
//
// Module for the new file window.
//


import { NgModule } from "@angular/core";
import { BrowserModule, Title } from "@angular/platform-browser";

import { FormsModule } from '@angular/forms';
import { NewFileComponent } from './../components/new-file/new-file.component';
import { CollapsibleListComponent } from './../components/collapsible-list/collapsible-list.component';
import { DynamicComponent } from './components/dynamic-component/dynamic-component.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        NewFileComponent,
        CollapsibleListComponent,
        DynamicComponent,
    ],
    providers: [
        Title
    ],
    bootstrap: [DynamicComponent]
})
export class ModalWindowModule { }
