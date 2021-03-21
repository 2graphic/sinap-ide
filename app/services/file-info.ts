export interface FileInfo {
    readonly name: string;
    toString(): string;
    save(contents: string): Promise<void>;
    open(): Promise<string>;
}

export interface DirectoryInfo {
    readonly name: string;
    getFiles(suffix?: string): Promise<FileInfo[]>
}
