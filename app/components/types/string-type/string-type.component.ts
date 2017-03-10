// // File: string-type.component.ts
// // Created by: Daniel James
// // Date created: February 22, 2017
// //

// import { Component, Input, ViewChild, ElementRef } from "@angular/core";
// import { CoreValue, PluginTypeEnvironment } from "sinap-core";

// @Component({
//     selector: "sinap-string-type",
//     templateUrl: "./string-type.component.html",
//     styleUrls: ["./string-type.component.scss"]
// })
// export class StringTypeComponent {
//     @Input() value: CoreValue<PluginTypeEnvironment>;
//     @Input() readonly: boolean = true;
//     @Input() disabled: boolean = false;

//     @ViewChild('input') input: ElementRef;

//     focus() {
//         if (this.input) {
//             this.input.nativeElement.focus();
//         }
//     }
// }
