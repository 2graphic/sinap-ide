// File: events.ts
// Created by: CJ Dimaano
// Date created: February 7, 2017


export type Listener<A extends EventArgs> = (evt?: A) => void;

export type PropertyChangedEventListener<T> = Listener<PropertyChangedEventArgs<T>>;

export class EventArgs {
    constructor(public readonly source: any) { }
}

export class CancellableEventArgs extends EventArgs {
    constructor(source: any, public isCancelled: boolean = false) {
        super(source);
    }
}

export class PropertyChangedEventArgs<T> extends EventArgs {
    constructor(
        source: any,
        public readonly key: string,
        public readonly prev: T,
        public readonly curr: T
    ) {
        super(source);
    }
}

export class EventEmitter<A extends EventArgs, L extends Listener<A>> {
    protected listeners: Set<L>
    = new Set<L>();
    addListener(l: L) {
        this.listeners.add(l);
    }
    removeListener(l: L) {
        return this.listeners.delete(l);
    }
    emit(args: A) {
        this.listeners.forEach(v => v(args));
    }
}

export class CancellableEventEmitter<A extends CancellableEventArgs, L extends Listener<A>>
    extends EventEmitter<A, L> {
    emit(args: A) {
        for (const l of this.listeners) {
            l(args);
            if (args.isCancelled)
                return;
        }
    }
}

export class PropertyChangedEventEmitter<T>
    extends EventEmitter<
    PropertyChangedEventArgs<T>,
    Listener<PropertyChangedEventArgs<T>>
    > { };