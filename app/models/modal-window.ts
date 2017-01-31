export interface ModalInfo {
    readonly id: Number;
    readonly kind: string;
    data: any;
}

/**
 * Theoretically if Electron isn't available we could create a ModalServiceProvider
 * and create a service that creates a modal popup in the browser instead of a new window.
 */
export interface ModalService {
    createModal(component: String): Promise<any>;
}