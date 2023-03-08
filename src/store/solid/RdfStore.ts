import { fetch as solidFetch } from "@inrupt/solid-client-authn-browser";
import { Fetcher, isLiteral, Literal, Node, Store, UpdateManager } from "rdflib";
import { ObjectType, PredicateType } from "rdflib/lib/types";
import { XML_SCHEMA } from "./Constants";
const rdf = require('rdflib');

export type RdfStore = {
    cache: Store,
    fetcher: Fetcher,
    updateManager: UpdateManager
}

const create = (): RdfStore => {
    const cache = rdf.graph();
    const fetcher = new rdf.Fetcher(cache, { fetch: solidFetch });
    const updater = new rdf.UpdateManager(cache);

    return { cache, fetcher, updateManager: updater };
}

const instance: RdfStore = create();

export const reset = () => {
    instance.cache = rdf.graph();
    instance.fetcher = new rdf.Fetcher(instance.cache, { fetch: solidFetch });
    instance.updateManager = new rdf.UpdateManager(instance.cache);
}

export function extractObject({ cache }: RdfStore, webid: string, resourceUrl: string, predicate: PredicateType): Array<Node> {
    return cache.each(cache.sym(webid), predicate, undefined, cache.sym(resourceUrl));
}
export function extractObjectLastValue(rdfStore: RdfStore, webid: string, resourceUrl: string, predicate: PredicateType): string | undefined {
    return extractObject(rdfStore, webid, resourceUrl, predicate).map(q => q.value).pop();
}
export const literalFromDateAsNumber = (dateAsNumber: number): Literal => {
    return Literal.fromDate(new Date(dateAsNumber));
}
export const literalFromDate = (date: Date): Literal => {
    return Literal.fromDate(date);
}
export const dateAsNumberFromQuadObject = (quad: Node) => {
    if (isLiteral(quad)) {
        const lit: Literal = quad as Literal;
        if (lit.datatype.value === XML_SCHEMA.dateTime) {
            return new Date(Date.parse(lit.value)).getTime();
        }
    }
}

export const compareDateLiteralNodes = (node1: ObjectType, node2: ObjectType) => {
    const dateNum1 = dateAsNumberFromQuadObject(node1);
    const dateNum2 = dateAsNumberFromQuadObject(node2);

    if (dateNum1) {
        if (dateNum2) {
            return dateNum1 - dateNum2;
        }
        return 1;
    } else {
        if (dateNum2) {
            return -1;
        }
        return 0;
    }
}

export default instance;