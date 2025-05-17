declare module 'xliff-parser' {
    type ParsedData = {
        resources: {
            [file: string]: {
                [id: string]: {
                    source: string;
                    target: string;
                };
            };
        };
    };

    const parser: (
        xml: string,
        callback: (err: Error | null, data: ParsedData) => void
    ) => void;

    export = parser;
}
