import { Directive, ElementRef, Input, HostListener, SimpleChanges } from '@angular/core';
import { PropertiedEntityLists, PropertiedEntity } from "../components/properties-panel/properties-panel.component"
import { FormsModule } from '@angular/forms';

@Directive({
	selector: '[snpBind]',
	// host: {'[ngModel]': 'selectedElement'},
})
export class BindingDirective {
	
	@Input("snpBind") selectedElement: PropertiedEntity;
	@Input() group: keyof PropertiedEntityLists;
	@Input() key: string;

	@HostListener("change") onModelChange(){
		this.selectedElement[this.group].set(this.key, this.el.nativeElement.value)
	}

	ngOnChanges(changes: SimpleChanges) {
		console.log(changes)
  	}


    constructor(private el: ElementRef) {
    }
}
