// File: new-file.module.ts
// Created by: Daniel James
// Date created: January 17, 2017
//
// Module for the new file window. 
//


import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { FormsModule } from '@angular/forms';
import { NewFileComponent } from './components/new-file/new-file.component'

@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        NewFileComponent,
    ],
    bootstrap: [NewFileComponent]
})
export class NewFileModule { }
