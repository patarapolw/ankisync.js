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
interface INote extends IDefault {
    findNotes: {
        payload: {
            query: string;
        };
        result: string[];
    };
    notesInfo: {
        payload: {
            notes: string[];
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
            note: {
                deckName: string;
                modelName: string;
                fields: Record<string, string>;
            };
        };
        result: string[];
    };
}
declare type IAnkiconnect = IModel & INote;
export declare const ankiconnect: {
    api: import("axios").AxiosInstance;
    invoke<K extends string | number>(action: K, params?: IAnkiconnect[K]["payload"], version?: number): Promise<IAnkiconnect[K]["result"]>;
};
export {};
//# sourceMappingURL=ankiconnect.d.ts.map