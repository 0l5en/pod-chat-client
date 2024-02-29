import { ACL, DCTERMS, ICAL, LDP, RDF } from "@inrupt/vocab-common-rdf";
import { Statement, lit, quad } from "rdflib";
import * as uuid from "uuid";
import { Chat, Participant } from "../../types";
import {
    DC_ELEMENTS, FLOW,
    PIM_MEETING,
    SOLID_TERMS,
    STORAGE_APP_BASE,
    STORAGE_LONG_CHAT_RESOURCE_NAME,
    currentContainerFromDoc,
    removeHashFromUrl
} from "./Constants";
import rdfStore, { dateAsNumberFromQuadObject, extractObject, extractObjectLastValue, literalFromDate } from './RdfStore';

export const loadChat = async (ownerId: string, chatId: string, force: boolean = false): Promise<Chat> => {
    const chatResourceUrl = removeHashFromUrl(chatId);
    await rdfStore.fetcher.load(chatResourceUrl, { force });
    const chat = getChat(ownerId, chatId, chatResourceUrl);
    return chat;
}

export const loadParticipantsHavingReadAccess = async (chatId: string): Promise<string[]> => {

    const chatContainerResourceUrl = currentContainerFromDoc(removeHashFromUrl(chatId));
    const aclResourceUrl = chatContainerResourceUrl + '.acl';
    await rdfStore.fetcher.load(aclResourceUrl);
    return getParticipantsHavingReadAccess(aclResourceUrl);
}

export const toggleParticipantHasReadAccess = async (chatId: string, participantId: string): Promise<boolean> => {
    const chatContainerResourceUrl = currentContainerFromDoc(removeHashFromUrl(chatId));
    const aclResourceUrl = chatContainerResourceUrl + '.acl';
    await rdfStore.fetcher.load(aclResourceUrl, { force: true });

    const graph = rdfStore.cache.sym(aclResourceUrl);
    const participantsHavingReadAccess = getParticipantsHavingReadAccess(aclResourceUrl);

    // remove read access for participant
    if (participantsHavingReadAccess.includes(participantId)) {
        const del: any[] = [];
        rdfStore.cache.each(undefined, rdfStore.cache.sym(ACL.mode), rdfStore.cache.sym(ACL.Read), graph)
            .filter(aclId => rdfStore.cache.each(rdfStore.cache.sym(aclId.value), rdfStore.cache.sym(ACL.mode), undefined, graph).length === 1)
            .forEach(aclId => {
                del.push(quad(aclId, rdfStore.cache.sym(ACL.agent), rdfStore.cache.sym(participantId), graph));
            });
        await rdfStore.updateManager.update(del, []);
        return false;
    }
    // add read access for participant
    const aclId = rdfStore.cache.each(undefined, rdfStore.cache.sym(ACL.mode), rdfStore.cache.sym(ACL.Read), graph)
        .filter(aclId => rdfStore.cache.each(rdfStore.cache.sym(aclId.value), rdfStore.cache.sym(ACL.mode), undefined, graph).length === 1)
        .pop();
    if (aclId) {
        await rdfStore.updateManager.update([], [quad(aclId, rdfStore.cache.sym(ACL.agent), rdfStore.cache.sym(participantId), graph)]);
    } else {
        throw new Error('cannot add read access: no readonly rule exists in acl');
    }
    return true;
}

export const deleteRecursive = async (resourceUrl: string): Promise<void> => {

    await rdfStore.fetcher.load(resourceUrl, { force: true });

    const graph = rdfStore.cache.sym(resourceUrl);
    const containedIds = rdfStore.cache.each(
        rdfStore.cache.sym(resourceUrl),
        rdfStore.cache.sym(LDP.contains),
        undefined,
        graph);
    const subContainer = containedIds.filter(containedId => rdfStore.cache.holds(
        rdfStore.cache.sym(containedId.value),
        rdfStore.cache.sym(RDF.type),
        rdfStore.cache.sym(LDP.Container),
        graph));
    const resources = containedIds.filter(containedId => !rdfStore.cache.holds(
        rdfStore.cache.sym(containedId.value),
        rdfStore.cache.sym(RDF.type),
        rdfStore.cache.sym(LDP.Container),
        graph));

    const subContainerPromises = subContainer.map(c => deleteRecursive(c.value));
    await Promise.all(subContainerPromises);

    const resourcePromises = resources.map(r => rdfStore.fetcher.webOperation('DELETE', r.value));
    await Promise.all(resourcePromises);
    resources.forEach(r => {
        try {
            rdfStore.cache.removeDocument(rdfStore.cache.sym(r.value))
        } catch (error) {
            console.warn("cannot remove document: " + r.value, error);

        }
    });

    await rdfStore.fetcher.webOperation('DELETE', resourceUrl);
    try {
        rdfStore.cache.removeDocument(rdfStore.cache.sym(resourceUrl));
    } catch (error) {
        console.warn("cannot remove document: " + resourceUrl, error);
    }
}

export const removeFromTypeIndex = async (chatId: string, typeIndex: string): Promise<void> => {
    await rdfStore.fetcher.load(typeIndex);

    const del: any[] = [];
    const graph = rdfStore.cache.sym(typeIndex);
    rdfStore.cache.each(undefined, rdfStore.cache.sym(SOLID_TERMS.forClass), rdfStore.cache.sym(PIM_MEETING.LongChat), graph)
        .filter(id => rdfStore.cache.holds(rdfStore.cache.sym(id.value), rdfStore.cache.sym(SOLID_TERMS.instance), rdfStore.cache.sym(chatId), graph))
        .forEach(id => del.push(quad(id, rdfStore.cache.sym(SOLID_TERMS.instance), rdfStore.cache.sym(chatId), graph)));

    await rdfStore.updateManager.update(del, []);
}

export const createChat = async (authorWebid: string, otherWebids: string[], now: Date, storage: string, privateTypeIndex: string): Promise<Chat> => {

    const chatResourceUrl = chatDatasetUrlNew(storage);
    const chatId = rdfStore.cache.sym(chatResourceUrl + '#this');
    const chatTitle = 'Chat Channel';
    const ins: any[] = [];
    const graph = rdfStore.cache.sym(chatResourceUrl);

    ins.push(quad(chatId, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(PIM_MEETING.LongChat), graph));
    ins.push(quad(chatId, rdfStore.cache.sym(DC_ELEMENTS.author), rdfStore.cache.sym(authorWebid), graph));
    ins.push(quad(chatId, rdfStore.cache.sym(DC_ELEMENTS.created), literalFromDate(now), graph));
    ins.push(quad(chatId, rdfStore.cache.sym(DC_ELEMENTS.title), lit(chatTitle), graph));
    [authorWebid, ...otherWebids].forEach(profileId => {
        const participationId = rdfStore.cache.sym(chatResourceUrl + '#' + uuid.v4());
        ins.push(quad(participationId, rdfStore.cache.sym(ICAL.dtstart), literalFromDate(now), graph));
        ins.push(quad(participationId, rdfStore.cache.sym(FLOW.participant), rdfStore.cache.sym(profileId), graph));
        ins.push(quad(chatId, rdfStore.cache.sym(FLOW.participation), participationId, graph))
    });

    await rdfStore.updateManager.update([], ins);
    await createAclDatasetForChatContainer(chatResourceUrl, authorWebid, otherWebids);
    await updateTypeIndex(chatId.value, privateTypeIndex);

    return { id: chatId.value, title: chatTitle, participants: otherWebids.map(profileId => ({ id: profileId })), created: now.getTime() };
}

export const joinChat = async (authorWebid: string, participants: Participant[], now: Date, storage: string, privateTypeIndex: string): Promise<Chat> => {
    const chatResourceUrl = chatDatasetUrlNew(storage);
    const chatId = rdfStore.cache.sym(chatResourceUrl + '#this');
    const chatTitle = 'Chat Channel';
    const ins: any[] = [];
    const graph = rdfStore.cache.sym(chatResourceUrl);

    ins.push(quad(chatId, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(PIM_MEETING.LongChat), graph));
    ins.push(quad(chatId, rdfStore.cache.sym(DC_ELEMENTS.author), rdfStore.cache.sym(authorWebid), graph));
    ins.push(quad(chatId, rdfStore.cache.sym(DC_ELEMENTS.created), literalFromDate(now), graph));
    ins.push(quad(chatId, rdfStore.cache.sym(DC_ELEMENTS.title), lit(chatTitle), graph));

    const authorParticipationId = rdfStore.cache.sym(chatResourceUrl + '#' + uuid.v4());
    ins.push(quad(authorParticipationId, rdfStore.cache.sym(ICAL.dtstart), literalFromDate(now), graph));
    ins.push(quad(authorParticipationId, rdfStore.cache.sym(FLOW.participant), rdfStore.cache.sym(authorWebid), graph));
    ins.push(quad(chatId, rdfStore.cache.sym(FLOW.participation), authorParticipationId, graph));


    [...participants].forEach(participant => {
        const participationId = rdfStore.cache.sym(chatResourceUrl + '#' + uuid.v4());
        ins.push(quad(participationId, rdfStore.cache.sym(ICAL.dtstart), literalFromDate(now), graph));
        ins.push(quad(participationId, rdfStore.cache.sym(FLOW.participant), rdfStore.cache.sym(participant.id), graph));
        if (participant.chatId) {
            ins.push(quad(participationId, rdfStore.cache.sym(DCTERMS.references), rdfStore.cache.sym(participant.chatId), graph));
        }
        ins.push(quad(chatId, rdfStore.cache.sym(FLOW.participation), participationId, graph))
    });

    await rdfStore.updateManager.update([], ins);
    await createAclDatasetForChatContainer(chatResourceUrl, authorWebid, participants.map(p => p.id));
    await updateTypeIndex(chatId.value, privateTypeIndex);

    return { id: chatId.value, title: chatTitle, participants: [...participants], created: now.getTime() };
}

export const setParticipantReferences = async (chatId: string, references: { participantId: string, participantChatId: string }[]) => {
    const graph = rdfStore.cache.sym(removeHashFromUrl(chatId));
    const del: Statement[] = [];
    const ins: Statement[] = [];
    references.forEach(reference => {
        rdfStore.cache.each(
            undefined,
            rdfStore.cache.sym(FLOW.participant),
            rdfStore.cache.sym(reference.participantId),
            graph
        ).forEach(participationId => {
            del.push(...rdfStore.cache.statementsMatching(rdfStore.cache.sym(participationId.value), rdfStore.cache.sym(DCTERMS.references), undefined, graph));
            ins.push(quad(rdfStore.cache.sym(participationId.value), rdfStore.cache.sym(DCTERMS.references), rdfStore.cache.sym(reference.participantChatId), graph));
        });
    });
    await rdfStore.updateManager.update(del, ins);
}

const getChat = (ownerId: string, chatId: string, chatResourceUrl: string): Chat => {

    const otherParticipants = rdfStore.cache.each(rdfStore.cache.sym(chatId), rdfStore.cache.sym(FLOW.participation), undefined, rdfStore.cache.sym(chatResourceUrl))
        .map(participationId => {
            const id = extractObjectLastValue(rdfStore, participationId.value, chatResourceUrl, rdfStore.cache.sym(FLOW.participant));
            if (id && id !== ownerId) {
                const chatId = extractObjectLastValue(rdfStore, participationId.value, chatResourceUrl, rdfStore.cache.sym(DCTERMS.references));
                return { id, chatId };
            }
            return undefined;
        })
        .reduce((acc, value) => value ? [...acc, value] : acc, [] as Array<Participant>)
        .sort((s1, s2) => s1.id.localeCompare(s2.id));

    if (otherParticipants.length === 0) {
        throw new Error('invalid chat data: no other participants found.');
    }

    const title = extractObjectLastValue(rdfStore, chatId, chatResourceUrl, rdfStore.cache.sym(DC_ELEMENTS.title));
    if (!title) {
        throw new Error('invalid chat data: no title found.');
    }

    const createdNode = extractObject(rdfStore, chatId, chatResourceUrl, rdfStore.cache.sym(DC_ELEMENTS.created)).pop();
    if (!createdNode) {
        throw new Error('invalid chat data: no created found.');
    }
    const created = dateAsNumberFromQuadObject(createdNode);
    if (!created) {
        throw new Error('invalid chat data: created is not a datetime literal.');
    }

    return { id: chatId, participants: otherParticipants, title, created };
}

const chatDatasetUrlNew = (storage: string) => {
    return storage + STORAGE_APP_BASE + uuid.v4() + '/' + STORAGE_LONG_CHAT_RESOURCE_NAME;
}

const createAclDatasetForChatContainer = async (chatResourceUrl: string, authorId: string, participationIds: string[]) => {

    const chatContainerResourceUrl = currentContainerFromDoc(chatResourceUrl);
    const aclResourceUrl = chatContainerResourceUrl + '.acl';
    const ins: any[] = [];

    aclForChatContainer(
        ins, 'ControlReadWrite', chatContainerResourceUrl, aclResourceUrl, [authorId], [ACL.Control, ACL.Write, ACL.Read]);

    aclForChatContainer(
        ins, 'Read', chatContainerResourceUrl, aclResourceUrl, participationIds, [ACL.Read]);

    rdfStore.updateManager.update([], ins);
};

const aclForChatContainer = (ins: any[], aclName: string, chatContainerResourceUrl: string, aclResourceUrl: string, agents: Array<string>, modes: string[]): void => {
    const graph = rdfStore.cache.sym(aclResourceUrl);
    const aclId = rdfStore.cache.sym(aclResourceUrl + '#' + aclName);
    ins.push(quad(aclId, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(ACL.Authorization), graph));
    ins.push(quad(aclId, rdfStore.cache.sym(ACL.accessTo), rdfStore.cache.sym(chatContainerResourceUrl), graph));
    ins.push(quad(aclId, rdfStore.cache.sym(ACL.default), rdfStore.cache.sym(chatContainerResourceUrl), graph));
    modes.forEach(mode => {
        ins.push(quad(aclId, rdfStore.cache.sym(ACL.mode), rdfStore.cache.sym(mode), graph));
    });
    agents.forEach(agent => {
        ins.push(quad(aclId, rdfStore.cache.sym(ACL.agent), rdfStore.cache.sym(agent), graph));
    });
}

const updateTypeIndex = async (chatId: string, typeIndex: string) => {
    await rdfStore.fetcher.load(typeIndex);
    const graph = rdfStore.cache.sym(typeIndex);
    const ins = [];
    let id = rdfStore.cache.each(undefined, rdfStore.cache.sym(SOLID_TERMS.forClass), rdfStore.cache.sym(PIM_MEETING.LongChat), graph)
        .pop();
    if (!id) {
        id = rdfStore.cache.sym(typeIndex + '#' + uuid.v4());
        ins.push(quad(id, rdfStore.cache.sym(SOLID_TERMS.forClass), rdfStore.cache.sym(PIM_MEETING.LongChat), graph));
    }
    ins.push(quad(id, rdfStore.cache.sym(SOLID_TERMS.instance), rdfStore.cache.sym(chatId), graph));
    await rdfStore.updateManager.update([], ins);
}

const getParticipantsHavingReadAccess = (aclResourceUrl: string): string[] => {
    const graph = rdfStore.cache.sym(aclResourceUrl);
    return rdfStore.cache.each(undefined, rdfStore.cache.sym(ACL.mode), rdfStore.cache.sym(ACL.Read), graph)
        .flatMap(aclId => rdfStore.cache.each(rdfStore.cache.sym(aclId.value), rdfStore.cache.sym(ACL.agent), undefined, graph))
        .map(node => node.value);
} 
