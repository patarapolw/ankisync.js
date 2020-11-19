interface IDefault {
    [k: string]: {
        payload?: unknown;
        result: unknown;
    };
}
interface IModel extends IDefault {
    modelNamesAndIds: {
        result: {
            [modelName: string]: number;
        };
    };
}
interface IAddNote {
    deckName: string;
    modelName: string;
    fields: Record<string, string>;
    options?: {
        allowDuplicate?: boolean;
        duplicateScope?: string;
        duplicateScopeOptions?: {
            deckName?: string;
            checkChildren?: boolean;
        };
    };
    tags?: string[];
    audio?: {
        url: string;
        filename: string;
        skipHash?: string;
        fields: string[];
    }[];
}
interface INote extends IDefault {
    findNotes: {
        payload: {
            query: string;
        };
        result: number[];
    };
    notesInfo: {
        payload: {
            notes: number[];
        };
        result: {
            fields: Record<string, {
                ord: number;
                value: string;
            }>;
        }[];
    };
    addNote: {
        payload: {
            note: IAddNote;
        };
        result: number;
    };
    addNotes: {
        payload: {
            note: IAddNote[];
        };
        result: number[];
    };
    addTags: {
        payload: {
            notes: number[];
            tags: string;
        };
        result: null;
    };
}
declare type IAnkiconnect = IModel & INote;
export declare const ankiconnect: {
    api: import("axios").AxiosInstance;
    invoke<K extends string | number>(action: K, params?: IAnkiconnect[K]["payload"], version?: number): Promise<IAnkiconnect[K]["result"]>;
};
export {};
//# sourceMappingURL=ankiconnect.d.ts.map