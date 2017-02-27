// File: drawable.ts
// Created by: CJ Dimaano
// Date created: February 13, 2017


import {
    PropertyChangedEventArgs,
    PropertyChangedEventEmitter,
    PropertyChangedEventListener
} from "./events";


export class Drawable {

    /**
     * _propertyChangedEmitter
     *   Event emitter for property changes.
     */
    private _propertyChangedEmitter: PropertyChangedEventEmitter<any>;

    constructor() {
        Object.defineProperties(this, {
            _propertyChangedEmitter: {
                enumerable: false,
                writable: false,
                value: new PropertyChangedEventEmitter<any>()
            }
        });
    }

    /**
     * addPropertyChangedListener
     *   Adds an event listener for property changed events.
     */
    addPropertyChangedListener(listener: PropertyChangedEventListener<any>) {
        this._propertyChangedEmitter.addListener(listener);
    }

    /**
     * removePropertyChangedListener
     *   Removes an event listener for property changed events.
     */
    removePropertyChangedListener(listener: PropertyChangedEventListener<any>) {
        this._propertyChangedEmitter.removeListener(listener);
    }

    /**
     * onPropertyChanged
     *   Emits the property changed event.
     */
    protected onPropertyChanged(key: keyof this, oldVal: any) {
        this._propertyChangedEmitter.emit(new PropertyChangedEventArgs<any>(
            this,
            key,
            oldVal,
            this[key]
        ));
    }

}