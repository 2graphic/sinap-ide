// File: events.ts
// Created by: CJ Dimaano
// Date created: February 7, 2017


import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";


export type DrawableEvent<D extends DrawableElement>
    = TypedCustomEvent<DrawableEventDetail<D>>;

export type MoveEdgeEvent
    = TypedCustomEvent<MoveEdgeEventDetail>;

export type SelectionChangedEvent
    = TypedCustomEvent<PropertyChangedEventDetail<Iterable<DrawableElement>>>;

export type PropertyChangedEvent<T>
    = TypedCustomEvent<PropertyChangedEventDetail<T>>;


export class PropertyChangedEventDetail<T> {
    constructor(
        public readonly source: any,
        public readonly key: PropertyKey,
        public readonly prev: T,
        public readonly curr: T
    ) { }
}

export class DrawableEventDetail<D extends DrawableElement> {
    constructor(
        public readonly source: any,
        public readonly drawables: D[],
        public readonly like?: D
    ) { }
}

export class MoveEdgeEventDetail {
    constructor(
        public readonly source: any,
        public readonly original: DrawableEdge,
        public readonly replacement: DrawableEdge
    ) { }
}

export class TypedCustomEvent<T> extends CustomEvent {
    constructor(type: string, detail: T) {
        super(type, { detail: detail });
    }

    get detail(): T {
        return super.detail;
    }
}
