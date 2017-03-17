/**
 * @file `drawable.ts`
 *   Created on February 13, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @see {@link https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html}
 */


import { TypedCustomEvent, PropertyChangedEventDetail } from "./events";


/**
 * `Drawable`
 *
 *   Provides `EventTarget` implementation for drawables.
 *
 * @implements {EventTarget}
 */
export class Drawable implements EventTarget {
    constructor() {
        Object.defineProperties(this, {
            eventListenerMap: {
                enumerable: false,
                writable: false,
                value: new Map<string, EventListener[]>()
            },
            changeListener: {
                enumerable: false,
                writable: true,
                value: null
            },
            onchange: {
                enumerable: false,
                get: () => this.changeListener,
                set: (value: EventListener | null) => {
                    if (!this.eventListenerMap.has("change"))
                        this.eventListenerMap.set("change", []);
                    const listeners = this.eventListenerMap.get("change") !;
                    if (value)
                        this.eventListenerMap.set(
                            "change",
                            [value, ...listeners]
                        );
                    else
                        this.eventListenerMap.set(
                            "change",
                            listeners.filter(v => v !== this.changeListener)
                        );
                    this.changeListener = value;
                }
            }
        });
    }

    /**
     * `eventListenerMap`
     *
     *   The map of event listeners.
     */
    private eventListenerMap: Map<string, EventListener[]>;

    /**
     * `changeListener`
     *
     *   The registered onchange listener.
     */
    private changeListener: EventListener | null;

    /**
     * `onchange`
     *
     *   Gets or sets the registered change event listener.
     */
    onchange: EventListener | null;

    /**
     * `addEventListener`
     *
     *   Adds an event listener to the specified event type.
     */
    addEventListener(type: string, listener: EventListener) {
        if (!this.eventListenerMap.has(type))
            this.eventListenerMap.set(type, []);
        const listeners = this.eventListenerMap.get(type) !;
        if (listeners.findIndex(v => v === listener) < 0)
            listeners.push(listener);
    }

    /**
     * `removeEventListener`
     *
     *   Removes an event listener from the specified event type.
     */
    removeEventListener(type: string, listener: EventListener) {
        const listeners = this.eventListenerMap.get(type);
        if (listeners)
            this.eventListenerMap.set(
                type,
                listeners.filter(v => v !== listener)
            );
    }

    /**
     * `dispatchEvent`
     *
     *   Dispatches an event.
     */
    dispatchEvent(evt: Event) {
        const listeners = this.eventListenerMap.get(evt.type);
        if (listeners) {
            for (const listener of listeners) {
                listener(evt);
                if (evt.defaultPrevented)
                    return false;
            }
        }
        return true;
    }

    /**
     * `onPropertyChanged`
     *
     *   Emits the property changed event.
     *
     * @protected
     */
    protected onPropertyChanged(key: keyof this, oldVal: any) {
        this.dispatchEvent(
            new TypedCustomEvent(
                "change",
                new PropertyChangedEventDetail<any>(
                    this,
                    key,
                    oldVal,
                    this[key]
                )
            )
        );
    }

}