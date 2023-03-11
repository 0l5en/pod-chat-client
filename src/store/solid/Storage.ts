import { LDP, POSIX, RDF } from "@inrupt/vocab-common-rdf";
import rdfStore from './RdfStore';


export const calculateSpaceUsage = async (containerId: string, onFileSize: (bytes: number) => void): Promise<void> => {
    try {
        const container = rdfStore.cache.sym(containerId);
        const containes = rdfStore.cache.sym(LDP.contains);

        await rdfStore.fetcher.load(containerId);

        // collect values from children
        const children = rdfStore.cache.each(container, containes, undefined, container)
            .reduce((acc, containedId) => {
                if (rdfStore.cache.holds(containedId, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(LDP.Container), container)) {
                    return [...acc, { subject: containedId.value }];
                }
                const size = rdfStore.cache.any(rdfStore.cache.sym(containedId.value), rdfStore.cache.sym(POSIX.size), undefined, container);
                if (size && !isNaN(+Number(size.value))) {
                    return [...acc, { subject: containedId.value, size: Number(size.value) }];
                }

                return acc;
            }, [] as Array<{ subject: string; size?: number; }>);

        // descent into child container's in sequence
        for (let child of children) {
            if (child.size) {
                onFileSize(child.size);
            } else {
                await calculateSpaceUsage(child.subject, onFileSize);
            }
        }
    } catch (error) {
        // TODO handle error
    }
};
