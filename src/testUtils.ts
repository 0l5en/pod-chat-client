import { IndexedFormula, parse } from "rdflib";

export const prepareCache = (content: string, baseUri: string, cache: IndexedFormula): Promise<void> => {
    return new Promise(resolve => {
        parse(
            content,
            cache,
            baseUri,
            "text/turtle",
            resolve
        );
    });
}