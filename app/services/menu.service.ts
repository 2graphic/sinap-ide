import { Injectable, NgZone } from '@angular/core';
import hotkeys from 'hotkeys-js';

export enum MenuEventAction {
    NEW_FILE,
    UNDO,
    REDO,
    CUT,
    COPY,
    PASTE,
    DELETE,
    SELECT_ALL,
    SAVE_FILE,
    SAVE_AS_FILE,
    OPEN_FILE,
    CLOSE,
    PREVIOUS_TAB,
    NEXT_TAB,
    MANAGE_PLUGINS,
    REFRESH_PLUGINS
}

export class MenuEvent {
    constructor(public readonly action: MenuEventAction, public readonly event: KeyboardEvent) { }
}

export interface MenuEventListener {
    menuEvent: (e: MenuEvent) => void;
}

const CMD = window.navigator.platform.indexOf('Mac') == 0 ? '⌘' : '⌃';

@Injectable()
export class MenuService {
    private eventListeners: MenuEventListener[] = [];

    constructor(private _ngZone: NgZone) {
        // TODO: Prevent users from incrementing the visual zoom (only regular zoom.)

        // Some of these combo's do not work in Chrome unless it's opened in application mode.
        // Maybe they will work as an installed PWA?
        hotkeys(`${CMD}+s`, this.dispatchEvent.bind(this, MenuEventAction.SAVE_FILE));
        hotkeys(`${CMD}+shift+s`, this.dispatchEvent.bind(this, MenuEventAction.SAVE_AS_FILE));
        hotkeys(`${CMD}+o`, this.dispatchEvent.bind(this, MenuEventAction.OPEN_FILE));
        hotkeys(`${CMD}+n`, this.dispatchEvent.bind(this, MenuEventAction.NEW_FILE));
        hotkeys(`${CMD}+x`, this.dispatchEvent.bind(this, MenuEventAction.CUT));
        hotkeys(`${CMD}+c`, this.dispatchEvent.bind(this, MenuEventAction.COPY));
        hotkeys(`${CMD}+v`, this.dispatchEvent.bind(this, MenuEventAction.PASTE));
        hotkeys(`${CMD}+a`, this.dispatchEvent.bind(this, MenuEventAction.SELECT_ALL));
        hotkeys(`${CMD}+w`, this.dispatchEvent.bind(this, MenuEventAction.CLOSE));
        hotkeys(`${CMD}+shift+left`, this.dispatchEvent.bind(this, MenuEventAction.PREVIOUS_TAB));
        hotkeys(`${CMD}+shift+right`, this.dispatchEvent.bind(this, MenuEventAction.NEXT_TAB));
        hotkeys(`${CMD}+z`, this.dispatchEvent.bind(this, MenuEventAction.UNDO));
        hotkeys(`${CMD}+shift+z,${CMD}+y`, this.dispatchEvent.bind(this, MenuEventAction.REDO));
        hotkeys(`del,backspace`, this.dispatchEvent.bind(this, MenuEventAction.DELETE));
    }

    private dispatchEvent(action: MenuEventAction, event: KeyboardEvent) {
        const menuEvent = new MenuEvent(action, event);
        this.eventListeners.forEach(l => l.menuEvent(menuEvent));
    }

    public addEventListener(obj: MenuEventListener) {
        if (this.eventListeners.indexOf(obj) < 0) {
            this.eventListeners.push(obj);
        }
    }

    public removeEventListener(obj: MenuEventListener) {
        let index = this.eventListeners.indexOf(obj);
        if (index >= 0) {
            this.eventListeners.splice(index, 1);
        }
    }
}

