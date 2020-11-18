import { Database } from 'sqlite';
export declare class Anki2 {
    static connect(colPath: string): Promise<Anki2>;
    db: Database;
    colPath: string;
    private constructor();
    find(where?: string, postfix?: string): Promise<{
        deck: string;
        values: string[];
        keys: string[];
        css: string | null;
        qfmt: string;
        afmt: string | null;
        template: string;
        model: string;
    }[]>;
    finalize(): Promise<void>;
    cleanup(): Promise<void>;
}
export declare class Apkg {
    static connect(filePath: string): Promise<Apkg>;
    filePath: string;
    dir: string;
    anki2: Anki2;
    private constructor();
    finalize(overwrite?: boolean): Promise<void>;
    /**
     * You will lose any unsaved data.
     *
     * Use #finalize to save data.
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map