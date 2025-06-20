import { ValueTransformer } from "typeorm";

export class JsonColumnTransformer implements ValueTransformer {
    to(value: any): string | null {
        if (value === null || typeof value === 'undefined') {
            return null;
        }
        return JSON.stringify(value);
    }

    from(value: string): any {
        if (value === null || typeof value === 'undefined') {
            return value;
        }

        try {
            return JSON.parse(value)
        }
        catch (e) {
            console.error("eroereoreor")
            return {}
        }
    }
}
