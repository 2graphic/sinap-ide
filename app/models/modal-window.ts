// File: modal-window.ts
// Created by: Daniel James
// Date created: January 30, 2017
//
// Defines what it means to be a ModalService.
// Theoretically if Electron isn't available we could create a ModalServiceProvider
// and create a service that creates a modal popup in the browser instead of in a new window.
//

export interface ModalInfo {
    readonly id: number;
    readonly selector: string;
    data: any;
}

export interface ModalService {
    createModal(selector: string): [ModalInfo, Promise<any>];
    closeModal(modal: ModalInfo, data: any | null): void;
}