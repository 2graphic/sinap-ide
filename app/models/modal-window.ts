export interface ModalInfo {
    readonly id: number;
    readonly kind: string;
    data: any;
}

/**
 * Theoretically if Electron isn't available we could create a ModalServiceProvider
 * and create a service that creates a modal popup in the browser instead of a new window.
 */
export interface ModalService {
    createModal(component: string): Promise<any>;
    // TODO: Creating a modal interface that createModal returns instead? This could have a .close() method and other useful attributes.
}