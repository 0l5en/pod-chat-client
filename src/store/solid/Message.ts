import { DCTERMS, FOAF, LDP, RDF, SIOC } from "@inrupt/vocab-common-rdf";
import { literal, Statement } from "rdflib";
import * as uuid from "uuid";
import { ChatMessage, ChatMessageLocation, ChatMessageReply, ChatMessageResource, ChatMessageSearchResult, locationComparator } from "../../types";
import { currentContainerFromDoc, FLOW, PODCHAT, removeHashFromUrl, SCHEMA, STORAGE_LONG_CHAT_RESOURCE_NAME, W3ID_SECURITY } from "./Constants";
import { buildMessageVerificationStr, verifyMessage } from "./Crypto";
import rdfStore, { dateAsNumberFromQuadObject, extractObject, extractObjectLastValue, literalFromDateAsNumber } from "./RdfStore";
const rdf = require('rdflib');

export const sendMessageReply = async (chatId: string, messageId: string, name: string, agent: string): Promise<{ location: ChatMessageLocation; replyId: string, isAdd: boolean }> => {
    const location = locationFromMessageResourceUrl(removeHashFromUrl(messageId));
    const resourceUrl = createChatMessageResourceForLocation(chatId, location);
    const graph = rdfStore.cache.sym(resourceUrl);

    const firstMatch = rdfStore.cache.each(undefined, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(SCHEMA.ReactAction), graph)
        .filter(node => rdfStore.cache.holds(rdfStore.cache.sym(node.value), rdfStore.cache.sym(SCHEMA.name), rdf.literal(name), graph))
        .filter(node => rdfStore.cache.holds(rdfStore.cache.sym(node.value), rdfStore.cache.sym(SCHEMA.agent), rdfStore.cache.sym(agent), graph))
        .filter(node => rdfStore.cache.holds(rdfStore.cache.sym(node.value), rdfStore.cache.sym(SCHEMA.target), rdfStore.cache.sym(messageId), graph))
        .pop();

    // remove reply 
    if (firstMatch) {
        const del: Statement[] = [];
        del.push(...rdfStore.cache.statementsMatching(rdfStore.cache.sym(firstMatch.value), undefined, undefined, graph));
        await rdfStore.updateManager.update(del, []);
        return { location, replyId: firstMatch.value, isAdd: false };
    }

    // add reply
    const ins: Statement[] = [];
    const replyId = rdfStore.cache.sym(resourceUrl + '#' + generateReplyId());
    ins.push(rdf.quad(replyId, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(SCHEMA.ReactAction), graph));
    ins.push(rdf.quad(replyId, rdfStore.cache.sym(SCHEMA.name), rdf.literal(name), graph));
    ins.push(rdf.quad(replyId, rdfStore.cache.sym(SCHEMA.agent), rdfStore.cache.sym(agent), graph));
    ins.push(rdf.quad(replyId, rdfStore.cache.sym(SCHEMA.target), rdfStore.cache.sym(messageId), graph));
    await rdfStore.updateManager.update([], ins);

    return { location, replyId: replyId.value, isAdd: true };
}

export const createMessage = (chatId: string, makerId: string, content: string, now: Date): ChatMessage => {
    const resourceUrl = createChatMessagesResourceUrlForToday(chatId);
    const messageId = generateMessageId();
    const messageWebId = resourceUrl + '#' + messageId;

    return { id: messageWebId, created: now.getTime(), maker: makerId, content, verificationStatus: "NOT_VERIFIED" };
}


export const sendMessage = async (chatId: string, message: ChatMessage, signature?: string): Promise<void> => {
    const resourceUrl = removeHashFromUrl(message.id);
    const ins: any[] = [];

    try {
        await rdfStore.fetcher.load(resourceUrl, { force: true });
    } catch (error) {
        // no message resource exist
    }

    const graph = rdfStore.cache.sym(resourceUrl);
    const messageSubject = rdfStore.cache.sym(message.id);

    ins.push(rdf.quad(messageSubject, rdfStore.cache.sym(DCTERMS.created), literalFromDateAsNumber(message.created), graph));
    ins.push(rdf.quad(messageSubject, rdfStore.cache.sym(SIOC.content), rdf.literal(message.content), graph));
    ins.push(rdf.quad(messageSubject, rdfStore.cache.sym(FOAF.maker), rdfStore.cache.sym(message.maker), graph));
    if (signature) {
        ins.push(rdf.quad(messageSubject, rdfStore.cache.sym(W3ID_SECURITY.proof), literal(signature), graph));
    }

    ins.push(rdf.quad(rdfStore.cache.sym(chatId), rdfStore.cache.sym(FLOW.message), messageSubject, graph));


    await rdfStore.updateManager.update([], ins);
}

export const loadChatMessageResource = async (chatId: string, resourceUrl: string, force?: boolean): Promise<{ messages: ChatMessage[]; replies: ChatMessageReply[] }> => {
    try {
        if (force === true) {
            rdfStore.cache.removeDocument(rdfStore.cache.sym(resourceUrl));
        }
        await rdfStore.fetcher.load(resourceUrl, { force });

        // select messages from rdfStore
        const messages = rdfStore.cache.each(rdfStore.cache.sym(chatId), rdfStore.cache.sym(FLOW.message), undefined, rdfStore.cache.sym(resourceUrl))
            .reduce((acc, messageId) => {
                const content = extractObjectLastValue(rdfStore, messageId.value, resourceUrl, rdfStore.cache.sym(SIOC.content));
                const created = extractObject(rdfStore, messageId.value, resourceUrl, rdfStore.cache.sym(DCTERMS.created))
                    .map(n => dateAsNumberFromQuadObject(n) || 0)
                    .pop();
                const maker = extractObjectLastValue(rdfStore, messageId.value, resourceUrl, rdfStore.cache.sym(FOAF.maker));
                if (content && created && maker) {
                    const message: ChatMessage = { id: messageId.value, content, created, maker, verificationStatus: 'NOT_VERIFIED' };
                    return [...acc, message];
                }
                return acc;
            }, [] as Array<ChatMessage>);

        // select message replies from rdfStore
        const replies = rdfStore.cache.each(undefined, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(SCHEMA.ReactAction), rdfStore.cache.sym(resourceUrl))
            .reduce((acc, replyId) => {
                const name = extractObjectLastValue(rdfStore, replyId.value, resourceUrl, rdfStore.cache.sym(SCHEMA.name));
                const agent = extractObjectLastValue(rdfStore, replyId.value, resourceUrl, rdfStore.cache.sym(SCHEMA.agent));
                const messageId = extractObjectLastValue(rdfStore, replyId.value, resourceUrl, rdfStore.cache.sym(SCHEMA.target));

                if (name && agent && messageId) {
                    return [...acc, { id: replyId.value, name, agent, messageId }]
                }

                return acc;
            }, [] as Array<ChatMessageReply>);

        return { messages, replies };
    } catch (error) {
        console.warn('cannot load messages from ' + resourceUrl, error);
    }
    return { messages: [], replies: [] };
};

export const loadMessagesForChats = async (chatIds: string[], location: ChatMessageLocation): Promise<ChatMessageSearchResult[]> => {
    // fetch messages for all longChats in parallel
    const result = await Promise.all(
        chatIds.map(chatId => {
            const indexOfChatResource = chatId.indexOf(STORAGE_LONG_CHAT_RESOURCE_NAME);
            if (indexOfChatResource > -1) {
                return traverseSolidLongChatMessageContainers(
                    chatId,
                    0,
                    location,
                    { ...location },
                    chatId.substring(0, indexOfChatResource)
                );
            } else {
                return new Promise<ChatMessageSearchResult>((resolve) => resolve(createEndResult(chatId)));
            }
        }));


    return result;
};

export const createChatMessagesResourceUrlForToday = (chatId: string) => {
    const resourceUrl = currentContainerFromDoc(removeHashFromUrl(chatId));
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    return resourceUrl + year + "/" + padMonthOrDay(month) + "/" + padMonthOrDay(day) + "/chat.ttl";
};

export const createChatMessageResourceForLocation = (chatId: string, location: ChatMessageLocation) => {
    const resourceUrl = currentContainerFromDoc(removeHashFromUrl(chatId));
    return resourceUrl + location.year + "/" + padMonthOrDay(location.month) + "/" + padMonthOrDay(location.day) + "/chat.ttl";
}

export const locationFromMessageResourceUrl = (messageResourceUrl: string): ChatMessageLocation => {
    const pathComponents = messageResourceUrl.split('/');

    const day = '/' + pathComponents[pathComponents.length - 2] + '/';
    const month = '/' + pathComponents[pathComponents.length - 3] + '/';
    const year = '/' + pathComponents[pathComponents.length - 4] + '/';

    return {
        day: numberFromContainerUrl(day),
        month: numberFromContainerUrl(month),
        year: numberFromContainerUrl(year)
    }
}

export const getChatMessageResource = (chatId: string, location: ChatMessageLocation, result: ChatMessageSearchResult[]): ChatMessageResource | undefined => {
    const found = result.find(chatMessageSearchResult => chatMessageSearchResult.chatId === chatId);
    if (found) {
        return found.resources.find(l => locationComparator(l.location, location) === 0);
    }
    return undefined;
};

export const createChatMessageResource = (chatId: string, location: ChatMessageLocation, result: ChatMessageSearchResult[]): ChatMessageResource => {
    const newLocationFound: ChatMessageResource = { location, messages: [], replies: [] };
    const found = result.find(chatMessageSearchResult => chatMessageSearchResult.chatId === chatId);
    if (found) {
        const locationFound = found.resources.find(l => locationComparator(l.location, location) === 0);
        if (locationFound) {
            return locationFound;
        } else {
            found.resources.push(newLocationFound);
            return newLocationFound;
        }
    } else {
        const newResult: ChatMessageSearchResult = { chatId, resources: [newLocationFound] }
        result.push(newResult);
        return newLocationFound;
    }
}

export const verifyChatMessage = async (message: ChatMessage): Promise<ChatMessage> => {
    const w3idSignature = extractObjectLastValue(rdfStore, message.id, removeHashFromUrl(message.id), rdfStore.cache.sym(W3ID_SECURITY.proof));
    if (!w3idSignature) {
        // Fallback for deprecated verification method that uses a native predicate for signature
        return await verifyPodchatSignature(message);
    }
    try {
        const messageVerificationStr = buildMessageVerificationStr(message);
        console.log('verify message ', { messageId: message.id, messageVerificationStr });
        const trusted = await verifyMessage(message.maker, buildMessageVerificationStr(message), w3idSignature);
        return { ...message, verificationStatus: trusted === true ? 'TRUSTED' : 'INVALID_SIGNATURE' };
    } catch (error) {
        return { ...message, verificationStatus: 'ERROR' };
    }
};

/*
 * Deprecated verification method that uses a native predicate for signature
 */
const verifyPodchatSignature = async (message: ChatMessage): Promise<ChatMessage> => {
    const podchatSignature = extractObjectLastValue(rdfStore, message.id, removeHashFromUrl(message.id), rdfStore.cache.sym(PODCHAT.signature));
    if (!podchatSignature) {
        return { ...message, verificationStatus: 'NO_SIGNATURE' };
    }
    try {
        const messageVerificationStr = buildMessageVerificationStr(message);
        console.log('verify message deprecated: ', { messageId: message.id, messageVerificationStr });
        const trusted = await verifyMessage(message.maker, message.content, podchatSignature);
        return { ...message, verificationStatus: trusted === true ? 'TRUSTED' : 'INVALID_SIGNATURE' };
    } catch (error) {
        return { ...message, verificationStatus: 'ERROR' };
    }
}

const padMonthOrDay = (num: number) => {
    var s = "0" + num;
    return s.substring(s.length - 2, s.length);
}

const loadTurtleResources = async (resourceUrl: string): Promise<string[]> => {
    await rdfStore.fetcher.load(resourceUrl);
    return rdfStore.cache.each(rdfStore.cache.sym(resourceUrl), rdfStore.cache.sym(LDP.contains), undefined, rdfStore.cache.sym(resourceUrl))
        .filter(contained => rdfStore.cache.each(rdfStore.cache.sym(contained.value), rdfStore.cache.sym(RDF.type), undefined, rdfStore.cache.sym(resourceUrl))
            .filter(containedType => containedType.value === 'http://www.w3.org/ns/iana/media-types/text/turtle#Resource').length > 0)
        .map(contained => contained.value);
}

const loadSubContainer = async (resourceUrl: string): Promise<string[]> => {
    await rdfStore.fetcher.load(resourceUrl);
    return rdfStore.cache.each(rdfStore.cache.sym(resourceUrl), rdfStore.cache.sym(LDP.contains), undefined, rdfStore.cache.sym(resourceUrl))
        .filter(contained => rdfStore.cache.each(rdfStore.cache.sym(contained.value), rdfStore.cache.sym(RDF.type), undefined, rdfStore.cache.sym(resourceUrl))
            .filter(containedType => containedType.value === LDP.Container).length > 0)
        .map(contained => contained.value);
}

const createEndResult = (chatId: string): ChatMessageSearchResult => {
    return {
        chatId,
        resources: [{ location: createEndLocation(), messages: [], replies: [] }]
    };
}

const createEndLocation = (): ChatMessageLocation => {
    return {
        year: 0,
        month: 0,
        day: 0
    }
}

const numberFromContainerUrl = (containerUrl: string): number => {
    const containerUrlWithoutTrailingSlash = containerUrl.substring(0, containerUrl.length - 1);
    const numberString = containerUrlWithoutTrailingSlash.substring(containerUrlWithoutTrailingSlash.lastIndexOf("/") + 1);
    const numberWithoutLeadingZeroString = numberString.startsWith("0") ? numberString.substring(1) : numberString;
    return +numberWithoutLeadingZeroString;
};

const traverseSolidLongChatMessageContainers = async (chatId: string, depth: number, startLocation: ChatMessageLocation, currentLocation: ChatMessageLocation, resourceUrl: string): Promise<ChatMessageSearchResult> => {
    // chatContainer[0]/year[1]/month[2]/day[3]/message.ttl[4]
    try {
        if (depth === 4) {
            const messageResource = await loadChatMessageResource(chatId, resourceUrl);
            return { chatId, resources: [{ location: currentLocation, messages: messageResource.messages, replies: messageResource.replies }] };
        }

        if (depth === 3) {
            currentLocation.day = numberFromContainerUrl(resourceUrl);
            if (currentLocation.month === startLocation.month && currentLocation.day > startLocation.day) {
                return createEndResult(chatId);
            }
        }

        if (depth === 2) {
            currentLocation.month = numberFromContainerUrl(resourceUrl);
            if (currentLocation.year === startLocation.year && currentLocation.month > startLocation.month) {
                return createEndResult(chatId);
            }
        }
        if (depth === 1) {
            currentLocation.year = numberFromContainerUrl(resourceUrl);
            if (currentLocation.year > startLocation.year) {
                return createEndResult(chatId);
            }
        }

        const resourceUrls = (depth === 3)
            ? await loadTurtleResources(resourceUrl)
            : (await loadSubContainer(resourceUrl)).sort((r1, r2) => numberFromContainerUrl(r2) - numberFromContainerUrl(r1));


        for (let index = 0; index < resourceUrls.length; index++) {
            const resourceUrl = resourceUrls[index];
            const result = await traverseSolidLongChatMessageContainers(chatId, depth + 1, startLocation, currentLocation, resourceUrl);
            const location = result.resources.find(l => locationComparator(currentLocation, l.location) === 0);
            // return on first result with messages or replies
            if (location && (location.messages.length > 0 || location.replies.length > 0)) {
                return result;
            }
        }

        return createEndResult(chatId);
    } catch (error) {
        return createEndResult(chatId);
    }
};

const generateMessageId = () => {
    return "msg-" + uuid.v4();
}

const generateReplyId = () => {
    return "rpl-" + uuid.v4();
}