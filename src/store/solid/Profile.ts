import { ACL, FOAF, LDP, VCARD } from "@inrupt/vocab-common-rdf";
import { blankNode } from "rdflib";
import { Profile } from "../../types";
import { PIM_SPACE, removeHashFromUrl, SOLID_TERMS } from "./Constants";
import rdfStore, { extractObjectLastValue } from "./RdfStore";

export const loadProfileWrapper = async (profileId: string, force?: boolean): Promise<{ result?: Profile; error?: string }> => {
    try {
        const profile = await loadProfile(profileId, force);
        return { result: profile };
    } catch (error) {
        return { error: error instanceof Error ? error.message : error + '' };
    }
}


export const loadProfile = async (profileId: string, force: boolean = false): Promise<Profile> => {
    const resourceUrl = removeHashFromUrl(profileId);
    await rdfStore.fetcher.load(resourceUrl, { force });
    return getProfile(profileId, resourceUrl);
}

const getProfile = (profileId: string, resourceUrl: string): Profile => {

    const profileName = getName(profileId, resourceUrl);

    if (!profileName) {
        throw new Error('invalid profile data: no value found for name.');
    }

    const applicationReadAccessPermitted = isApplicationAccessPermitted(profileId, resourceUrl, ACL.Read);
    const applicationControlAccessPermitted = isApplicationAccessPermitted(profileId, resourceUrl, ACL.Control);

    const storageId = extractObjectLastValue(rdfStore, profileId, resourceUrl, rdfStore.cache.sym(PIM_SPACE.storage));
    if (!storageId) {
        throw new Error("invalid profile data: no value found for storage.");
    }

    const privateTypeIndexId = extractObjectLastValue(rdfStore, profileId, resourceUrl, rdfStore.cache.sym(SOLID_TERMS.privateTypeIndex));
    if (!privateTypeIndexId) {
        throw new Error("invalid profile data: no value found for privateTypeIndex.");
    }

    const publicTypeIndexId = extractObjectLastValue(rdfStore, profileId, resourceUrl, rdfStore.cache.sym(SOLID_TERMS.publicTypeIndex));
    if (!publicTypeIndexId) {
        throw new Error("invalid profile data: no value found for publicTypeIndex.");
    }

    const inboxId = extractObjectLastValue(rdfStore, profileId, resourceUrl, rdfStore.cache.sym(LDP.inbox));
    if (!inboxId) {
        throw new Error("invalid profile data: no value found for inbox.");
    }

    const profile: Profile = {
        id: profileId,
        name: profileName,
        inboxId,
        storageId,
        privateTypeIndexId,
        publicTypeIndexId,
        applicationReadAccessPermitted,
        applicationControlAccessPermitted
    };


    const profileImage = getImage(profileId, resourceUrl);
    if (profileImage) {
        profile.image = profileImage;
    }
    return profile;

}

function getName(webid: string, resourceUrl: string) {
    return extractObjectLastValue(rdfStore, webid, resourceUrl, rdfStore.cache.sym(VCARD.fn))
        || extractObjectLastValue(rdfStore, webid, resourceUrl, rdfStore.cache.sym(FOAF.name))
        || new URL(resourceUrl).host.substring(0, resourceUrl.indexOf('.'));
}

function getImage(webid: string, resourceUrl: string): string | undefined {
    return extractObjectLastValue(rdfStore, webid, resourceUrl, rdfStore.cache.sym(VCARD.hasPhoto))
        || extractObjectLastValue(rdfStore, webid, resourceUrl, rdfStore.cache.sym(FOAF.img));
}

function isApplicationAccessPermitted(webid: string, resourceUrl: string, access: string): boolean {
    const graph = rdfStore.cache.sym(resourceUrl);
    return rdfStore.cache
        .each(rdfStore.cache.sym(webid), rdfStore.cache.sym('http://www.w3.org/ns/auth/acl#trustedApp'), undefined, graph)
        .filter(blankNodeId => rdfStore.cache.holds(blankNode(blankNodeId.value), rdfStore.cache.sym(ACL.origin), rdfStore.cache.sym(window.location.origin), graph))
        .filter(blankNodeId => rdfStore.cache.holds(blankNode(blankNodeId.value), rdfStore.cache.sym(ACL.mode), rdfStore.cache.sym(access), graph))
        .length > 0;
}