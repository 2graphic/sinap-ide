import { NgModule }      from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule }   from '@angular/forms';

import { REPLComponent } from "./repl.component";


@NgModule({
  imports:      [
    BrowserModule,
    FormsModule
  ],
  declarations: [
    REPLComponent
  ],
  bootstrap:    [ REPLComponent ]
})
export class REPLModule { }