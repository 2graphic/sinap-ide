/**
 * @file `events.ts`
 *   Created on February 7, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 */


import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";


// Types ///////////////////////////////////////////////////////////////////////


/**
 * `DrawableEvent`
 *
 *   The drawable event payload.
 */
export type DrawableEvent<D extends DrawableElement>
    = TypedCustomEvent<DrawableEventDetail<D>>;

/**
 * `MoveEdgeEvent`
 *
 *   The move edge event payload.
 */
export type MoveEdgeEvent
    = TypedCustomEvent<MoveEdgeEventDetail>;

/**
 * `SelectionChangedEvent`
 *
 *   The selection change event payload.
 */
export type SelectionChangedEvent
    = TypedCustomEvent<PropertyChangedEventDetail<Iterable<DrawableElement>>>;

/**
 * `PropertyChangedEvent`
 *
 *   The property changed event payload.
 */
export type PropertyChangedEvent<T>
    = TypedCustomEvent<PropertyChangedEventDetail<T>>;


// Classes /////////////////////////////////////////////////////////////////////


/**
 * `PropertyChangedEventDetail`
 *
 *   The property changed detail object of a custom event.
 */
export class PropertyChangedEventDetail<T> {
    constructor(
        public readonly source: any,
        public readonly key: PropertyKey,
        public readonly prev: T,
        public readonly curr: T
    ) { }
}

/**
 * `DrawableEventDetail`
 *
 *   The drawable detail object of a custom event.
 */
export class DrawableEventDetail<D extends DrawableElement> {
    constructor(
        public readonly source: any,
        public readonly drawables: D[],
        public readonly like?: D
    ) { }
}

/**
 * `MoveEdgeEventDetail`
 *
 *   The move edge detail object of a custom event.
 */
export class MoveEdgeEventDetail {
    constructor(
        public readonly source: any,
        public readonly original: DrawableEdge,
        public readonly replacement: DrawableEdge
    ) { }
}

/**
 * `TypedCustomEvent`
 *
 *   Wrapper around the `CustomEvent` class for providing type information on
 *   the `detail` field.
 */
export class TypedCustomEvent<T> extends CustomEvent {
    constructor(type: string, detail: T) {
        super(type, { detail: detail });
    }

    get detail(): T {
        return super.detail;
    }
}


// doclets /////////////////////////////////////////////////////////////////////


/**
 * Property changed event.
 *
 * @event Drawable#change
 * @type {PropertyChangedEventDetail}
 */

/**
 * Selection changed event.
 *
 * @event DrawableGraph#select
 * @type {PropertyChangedEventDetail}
 */

/**
 * Creating drawable event.
 *
 * @event DrawableGraph#creating
 * @type {DrawableEventDetail}
 */

/**
 * Created drawable event.
 *
 * @event DrawableGraph#created
 * @type {DrawableEventDetail}
 */

/**
 * Move edge event.
 *
 * @event DrawableGraph#moved
 * @type {MoveEdgeEventDetail}
 */

/**
 * Deleted drawable event.
 *
 * @event DrawableGraph#deleted
 * @type {DrawableEventDetail}
 */
