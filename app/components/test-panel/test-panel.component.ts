// File: test-panel.component.ts
// Created by: Daniel James
// Date created: December 8, 2016


import { Component , Input, Output} from "@angular/core";


@Component({
  selector: "sinap-test-panel",
  templateUrl: "./test-panel.component.html",
  styleUrls: [ "../../styles/bottom-panel.component.css" ]
})
export class TestPanelComponent {
	@Output() @Input() tests = [['001001', true, true],
					  ['001010', false, false],
					  ['101010101', true, false],
					  ['100100011', true, true]];
}
