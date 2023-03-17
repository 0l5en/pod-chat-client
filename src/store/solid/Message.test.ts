import { graph, IndexedFormula, parse } from 'rdflib';
import { expect, Mock, vi } from 'vitest';
import { ChatMessage, ChatMessageLocation, ChatMessageReply, ChatMessageResource, ChatMessageSearchResult } from '../../types';
import { createChatMessageResource, createMessage, createMessageReply, getChatMessageResource, loadChatMessageResource, loadMessagesForChats, locationFromMessageResourceUrl, sendMessage, sendMessageReply, verifyChatMessage } from "./Message";
import rdfStore from './RdfStore';

vi.mock('./RdfStore', async (importOriginal) => {
    const mod = await importOriginal<{ cache: IndexedFormula }>();
    return {
        ...mod,
        default: {
            fetcher: {
                load: vi.fn()
            },
            cache: graph(),
            updateManager: {
                update: vi.fn()
            }
        },
    };
});

describe('Message', () => {

    afterEach(() => {
        rdfStore.cache = graph();
        vi.restoreAllMocks();
    });

    describe('createMessage', () => {
        it('should create the expected message', () => {
            const testDate = new Date(Date.UTC(2022, 0, 1));
            const { content, created, id, maker, verificationStatus } = createMessage(testUrlBob.chatId, testUrlBob.maker, 'content', testDate);
            expect(content).toBe('content');
            expect(created).toBe(testDate.getTime());
            expect(id.startsWith(testUrlBob.messageResource + '#')).toBeTruthy();
            expect(maker).toBe(testUrlBob.maker);
            expect(verificationStatus).toBe('NOT_VERIFIED');
        });
    });

    describe('createMessageReply', () => {
        it('should create the expected message reply', () => {
            const { agent, chatId, id, messageId, name } = createMessageReply(testUrlBob.chatId, testUrlAlice.messageId, testUrlBob.maker, "name");
            expect(chatId).toBe(testUrlBob.chatId);
            expect(id.startsWith(testUrlBob.messageResource + '#')).toBeTruthy();
            expect(agent).toBe(testUrlBob.maker);
            expect(messageId).toBe(testUrlAlice.messageId);
            expect(name).toBe('name');
        });
    });

    describe('locationFromMessageResourceUrl', () => {
        it('should create expected location for valid url with hash', () => {
            const location = locationFromMessageResourceUrl(testUrlBob.messageId);
            expect(location.day).toEqual(1);
            expect(location.month).toEqual(1);
            expect(location.year).toEqual(2022);
        });
    });

    describe('sendMessageReply', () => {
        it('should throw an error for invalid chatId', async () => {
            await expect(() => sendMessageReply({ chatId: 'invalid', ...createTestReply() })).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should throw an error for invalid messageId', async () => {
            await expect(() => sendMessageReply({ chatId: testUrlBob.chatId, ...createTestReply(), messageId: 'invalid' })).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should throw an error for invalid agent', async () => {
            await expect(() => sendMessageReply({ chatId: testUrlBob.chatId, ...createTestReply(), agent: 'invalid' })).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should remove a reply', async () => {
            await prepareCache(MESSAGE_RESOURCE_CONTENT, testUrlBob.messageResource);
            const result = await sendMessageReply({ chatId: testUrlBob.chatId, ...createTestReply() });
            expect(result).toStrictEqual({
                isAdd: false,
                location: {
                    day: 1,
                    month: 1,
                    year: 2022
                },
                replyId: testUrlBob.messageResource + '#rpl-1'
            });

            const updateMock = rdfStore.updateManager.update as Mock<any[], any>;
            expect(updateMock).toBeCalledTimes(1);
            if (updateMock.mock.lastCall) {
                expect(updateMock.mock.lastCall[0]).toHaveLength(4);
                expect(updateMock.mock.lastCall[1]).toHaveLength(0);
            }
        });

        it('should add a reply', async () => {
            await prepareCache(MESSAGE_RESOURCE_CONTENT, testUrlBob.messageResource);
            const result = await sendMessageReply({
                chatId: testUrlBob.chatId,
                ...createTestReply(),
                messageId: testUrlAlice.messageResource + '#other-msg-from-alice'
            });
            expect(result).toStrictEqual({
                isAdd: true,
                location: {
                    day: 1,
                    month: 1,
                    year: 2022
                },
                replyId: testUrlBob.messageResource + '#rpl-1'
            });

            const updateMock = rdfStore.updateManager.update as Mock<any[], any>;
            expect(updateMock).toBeCalledTimes(1);
            if (updateMock.mock.lastCall) {
                expect(updateMock.mock.lastCall[0]).toHaveLength(0);
                expect(updateMock.mock.lastCall[1]).toHaveLength(4);
            }
        });
    });

    describe('sendMessage', () => {
        it('should throw an error for invalid messageId', async () => {
            await expect(() => sendMessage(testUrlBob.chatId, { ...createTestMessage(testUrlBob), id: 'invalid' })).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should throw an error for invalid makerId', async () => {
            await expect(() => sendMessage(testUrlBob.chatId, { ...createTestMessage(testUrlBob), maker: 'invalid' })).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should throw an error for invalid chatId', async () => {
            await expect(() => sendMessage("chatid", { ...createTestMessage(testUrlBob), maker: 'invalid' })).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should invoke the update manager with extected inserts without signature', async () => {
            await sendMessage(testUrlBob.chatId, createTestMessage(testUrlBob));

            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            const updateMock = rdfStore.updateManager.update as Mock<any[], any>;
            expect(updateMock).toBeCalledTimes(1);
            if (updateMock.mock.lastCall) {
                expect(updateMock.mock.lastCall[0]).toHaveLength(0);
                expect(updateMock.mock.lastCall[1]).toHaveLength(4);
            }

        });

        it('should invoke the update manager with expected inserts with signature', async () => {
            await sendMessage(testUrlBob.chatId, createTestMessage(testUrlBob), "signature");

            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            const updateMock = rdfStore.updateManager.update as Mock<any[], any>;
            expect(updateMock).toBeCalledTimes(1);
            if (updateMock.mock.lastCall) {
                expect(updateMock.mock.lastCall[0]).toHaveLength(0);
                expect(updateMock.mock.lastCall[1]).toHaveLength(5);
            }
        });
    });

    describe('loadChatMessageResource', () => {
        it('should throw an error for invalid resourceUrl', async () => {
            await expect(() => loadChatMessageResource(testUrlBob.chatId, "invalid")).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should throw an error for invalid chatId', async () => {
            await expect(() => loadChatMessageResource("invalid", testUrlBob.messageResource)).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should return empty result for empty cache', async () => {
            const result = await loadChatMessageResource(testUrlBob.chatId, testUrlBob.messageResource);

            expect(result.messages).toHaveLength(0);
            expect(result.replies).toHaveLength(0);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should return the expected result', async () => {
            await prepareCache(MESSAGE_RESOURCE_CONTENT, testUrlBob.messageResource);
            const result = await loadChatMessageResource(testUrlBob.chatId, testUrlBob.messageResource);

            expect(result.messages).toHaveLength(1);
            expect(result.messages[0]).toStrictEqual(createTestMessage(testUrlBob));
            expect(result.replies).toHaveLength(1);
            expect(result.replies[0]).toStrictEqual(createTestReply());
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should clear the cache for message resource on force', async () => {
            await prepareCache(MESSAGE_RESOURCE_CONTENT, testUrlBob.messageResource);
            const result = await loadChatMessageResource(testUrlBob.chatId, testUrlBob.messageResource, true);

            expect(result.messages).toHaveLength(0);
            expect(result.replies).toHaveLength(0);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });
    });

    describe('loadMessagesForChats', () => {
        it('should return end location for invalid chat id', async () => {
            await prepareCacheWithMessage();
            const result = await loadMessagesForChats(['invalid'], { day: 1, month: 1, year: 2022 });
            verifyEndResult('invalid', result);
            verifyNoMockInteraction();
        });

        it('should return empty result for empty chat ids', async () => {
            await prepareCacheWithMessage();
            const result = await loadMessagesForChats([], { day: 1, month: 1, year: 2022 });
            expect(result).toEqual([]);
            verifyNoMockInteraction();
        });

        it('should return the expected result for equal date', async () => {
            await prepareCacheWithMessage();
            const result = await loadMessagesForChats([testUrlBob.chatId, testUrlAlice.chatId], { day: 1, month: 1, year: 2022 });
            expect(result).toStrictEqual(expectedMessagesResult);
            expect(rdfStore.fetcher.load).toBeCalledTimes(10);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should return the expected result for one day after', async () => {
            await prepareCacheWithMessage();
            const result = await loadMessagesForChats([testUrlBob.chatId, testUrlAlice.chatId], { day: 2, month: 1, year: 2022 });
            expect(result).toStrictEqual(expectedMessagesResult);
            expect(rdfStore.fetcher.load).toBeCalledTimes(12);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should return end location for one day before', async () => {
            await prepareCacheWithMessage();
            const result = await loadMessagesForChats([testUrlBob.chatId], { day: 31, month: 12, year: 2021 });
            verifyEndResult(testUrlBob.chatId, result);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });
    });

    describe('getChatMessageResource', () => {
        it('should return the expected result', () => {
            const location: ChatMessageLocation = { day: 1, month: 1, year: 2022 };
            const chatMessageResource: ChatMessageResource = { location, messages: [], replies: [] };
            const testData: ChatMessageSearchResult[] = [{
                chatId: testUrlBob.chatId,
                resources: [chatMessageResource]
            }];
            const result = getChatMessageResource(testUrlBob.chatId, location, testData);
            expect(result).toStrictEqual(chatMessageResource);
        });
    });

    describe('createChatMessageResource', () => {
        it('should create a new search result', () => {
            const location: ChatMessageLocation = { day: 1, month: 1, year: 2022 };
            const chatMessageResource: ChatMessageResource = { location, messages: [], replies: [] };
            const testData: ChatMessageSearchResult[] = [];
            const result = createChatMessageResource(testUrlBob.chatId, location, testData);
            expect(result).toStrictEqual(chatMessageResource);
            expect(testData).toStrictEqual([{
                chatId: testUrlBob.chatId,
                resources: [chatMessageResource]
            }]);
        });

        it('should create a new message resource', () => {
            const location: ChatMessageLocation = { day: 1, month: 1, year: 2022 };
            const chatMessageResource: ChatMessageResource = { location, messages: [], replies: [] };
            const testData: ChatMessageSearchResult[] = [{
                chatId: testUrlBob.chatId,
                resources: []
            }];
            const result = createChatMessageResource(testUrlBob.chatId, location, testData);
            expect(result).toStrictEqual(chatMessageResource);
            expect(testData).toStrictEqual([{
                chatId: testUrlBob.chatId,
                resources: [chatMessageResource]
            }]);
        });

        it('should create nothing', () => {
            const location: ChatMessageLocation = { day: 1, month: 1, year: 2022 };
            const chatMessageResource: ChatMessageResource = { location, messages: [], replies: [] };
            const testData: ChatMessageSearchResult[] = [{
                chatId: testUrlBob.chatId,
                resources: [chatMessageResource]
            }];
            const result = createChatMessageResource(testUrlBob.chatId, location, testData);
            expect(result).toStrictEqual(chatMessageResource);
            expect(testData).toStrictEqual([{
                chatId: testUrlBob.chatId,
                resources: [chatMessageResource]
            }]);
        });
    });

    describe('verifyChatMessage', () => {
        it('should find that there is no signature', async () => {
            await prepareCache(MESSAGE_RESOURCE_CONTENT_NO_SIGNATURE, testUrlBob.messageResource);
            const result = await verifyChatMessage({ ...createTestMessage(testUrlBob) });
            expect(result).toStrictEqual({ ...createTestMessage(testUrlBob), verificationStatus: 'NO_SIGNATURE' });
        });

        it('should recognize an invalid signature using w3id proof of the message', async () => {
            await prepareCache(MESSAGE_RESOURCE_CONTENT, testUrlBob.messageResource);
            const result = await verifyChatMessage(createTestMessage(testUrlBob));
            expect(result).toStrictEqual({ ...createTestMessage(testUrlBob), verificationStatus: 'INVALID_SIGNATURE' });
        });

        it('should recognize an invalid signature using podchat signature of the message', async () => {
            await prepareCache(MESSAGE_RESOURCE_CONTENT_DEPRECATED_SIGNATURE, testUrlBob.messageResource);
            const result = await verifyChatMessage(createTestMessage(testUrlBob));
            expect(result).toStrictEqual({ ...createTestMessage(testUrlBob), verificationStatus: 'INVALID_SIGNATURE' });
        });
    });
});

const verifyEndResult = (chatId: string, result: ChatMessageSearchResult[]) => {
    expect(result).toStrictEqual([{
        chatId,
        resources: [{
            location: { year: 0, month: 0, day: 0 },
            messages: [],
            replies: []
        }]
    }]);
}

const verifyNoMockInteraction = () => {
    expect(rdfStore.fetcher.load).toBeCalledTimes(0);
    expect(rdfStore.updateManager.update).toBeCalledTimes(0);
}

type TestUrl = {
    storage: string;
    maker: string;
    chatRoot: string;
    chatResource: string;
    chatId: string;
    yearContainer: string;
    monthContainer: string;
    dayContainer: string;
    messageResource: string;
    messageId: string;
}

const createTestUrl = (storage: string): TestUrl => {
    const maker = storage + "profile/card#me";
    const chatRoot = storage + "chats/1/";
    const chatResource = chatRoot + "index.ttl";
    const chatId = chatResource + "#this";
    const yearContainer = chatRoot + '2022/';
    const monthContainer = yearContainer + '01/'
    const dayContainer = monthContainer + '01/';
    const messageResource = dayContainer + "chat.ttl";
    const messageId = messageResource + "#msg-1";
    return {
        storage,
        maker,
        chatRoot,
        chatResource,
        chatId,
        yearContainer,
        monthContainer,
        dayContainer,
        messageResource,
        messageId,
    };
};

const testUrlBob = createTestUrl("https://bob.pod/");
const testUrlAlice = createTestUrl("https://alice.pod/");

const MESSAGE_RESOURCE_CONTENT = `
@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix sioc: <http://rdfs.org/sioc/ns#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix schema: <http://schema.org/>.
@prefix w3id: <https://w3id.org/security#>.
@prefix c: </profile/card#>.
@prefix ind: <../../../index.ttl#>.
@prefix ch: <https://alice.pod/chats/1/2022/01/01/chat.ttl#>.

:msg-1
    dct:created "2022-01-01T00:00:00Z"^^xsd:dateTime;
    sioc:content "Zeitloses Design w\u00fcrde ich sagen.";
    w3id:proof "abcdef";
    foaf:maker c:me .
    
:rpl-1
    a schema:ReactAction;
    schema:agent c:me;
    schema:name "\ud83d\udc4d";
    schema:target ch:msg-1 .

ind:this wf:message :msg-1 .
`;

const MESSAGE_RESOURCE_CONTENT_DEPRECATED_SIGNATURE = `
@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix sioc: <http://rdfs.org/sioc/ns#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix schema: <http://schema.org/>.
@prefix podchat: <https://www.pod-chat.com/>.
@prefix c: </profile/card#>.
@prefix ind: <../../../index.ttl#>.
@prefix ch: <https://alice.pod/chats/1/2022/01/01/chat.ttl#>.

:msg-1
    dct:created "2022-01-01T00:00:00Z"^^xsd:dateTime;
    sioc:content "Zeitloses Design w\u00fcrde ich sagen.";
    podchat:signature "abcdef";
    foaf:maker c:me .
    
:rpl-1
    a schema:ReactAction;
    schema:agent c:me;
    schema:name "\ud83d\udc4d";
    schema:target ch:msg-1 .

ind:this wf:message :msg-1 .
`;

const MESSAGE_RESOURCE_CONTENT_NO_SIGNATURE = `
@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix sioc: <http://rdfs.org/sioc/ns#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix schema: <http://schema.org/>.
@prefix c: </profile/card#>.
@prefix ind: <../../../index.ttl#>.
@prefix ch: <https://alice.pod/chats/1/2022/01/01/chat.ttl#>.

:msg-1
    dct:created "2022-01-01T00:00:00Z"^^xsd:dateTime;
    sioc:content "Zeitloses Design w\u00fcrde ich sagen.";
    foaf:maker c:me .
    
:rpl-1
    a schema:ReactAction;
    schema:agent c:me;
    schema:name "\ud83d\udc4d";
    schema:target ch:msg-1 .

ind:this wf:message :msg-1 .
`;

const CHAT_CONTAINER_CONTENT = `
@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix stat: <http://www.w3.org/ns/posix/stat#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix n0: <>.
@prefix n1: <2022/>.
@prefix tur: <http://www.w3.org/ns/iana/media-types/text/turtle#>.

n0:
    a ldp:BasicContainer, ldp:Container;
    dct:modified "2023-01-08T18:10:55Z"^^xsd:dateTime;
    ldp:contains n1:, <index.ttl>;
    stat:mtime 1673201455.107;
    stat:size 4096 .
n1:
    a ldp:BasicContainer, ldp:Container, ldp:Resource;
    dct:modified "2022-10-01T18:56:39Z"^^xsd:dateTime;
    stat:mtime 1664650599.915;
    stat:size 4096
`;

const YEAR_CONTAINER_CONTENT = `
@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix stat: <http://www.w3.org/ns/posix/stat#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix n0: <>.
@prefix n1: <01/>.

n0:
    a ldp:BasicContainer, ldp:Container;
    dct:modified "2022-10-01T18:56:39Z"^^xsd:dateTime;
    ldp:contains n1:;
    stat:mtime 1664650599.915;
    stat:size 4096 .
n1:
    a ldp:BasicContainer, ldp:Container, ldp:Resource;
    dct:modified "2022-01-02T20:14:58Z"^^xsd:dateTime;
    stat:mtime 1641154498.342;
    stat:size 4096 .
`
const MONTH_CONTAINER_CONTENT = `
@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix stat: <http://www.w3.org/ns/posix/stat#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix n0: <>.
@prefix n1: <01/>.
@prefix n2: <02/>.

n0:
    a ldp:BasicContainer, ldp:Container;
    dct:modified "2022-01-02T20:14:58Z"^^xsd:dateTime;
    ldp:contains n1:, n2:;
    stat:mtime 1641154498.342;
    stat:size 4096 .
n1:
    a ldp:BasicContainer, ldp:Container, ldp:Resource;
    dct:modified "2022-01-01T23:11:22Z"^^xsd:dateTime;
    stat:mtime 1641078682.6;
    stat:size 4096 .
n2:
    a ldp:BasicContainer, ldp:Container, ldp:Resource;
    dct:modified "2022-01-01T23:11:22Z"^^xsd:dateTime;
    stat:mtime 1641078682.6;
    stat:size 4096 .
`

const DAY_CONTAINER_CONTENT = `
@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix stat: <http://www.w3.org/ns/posix/stat#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix n0: <>.
@prefix tur: <http://www.w3.org/ns/iana/media-types/text/turtle#>.

n0:
    a ldp:BasicContainer, ldp:Container;
    dct:modified "2022-01-01T23:11:22Z"^^xsd:dateTime;
    ldp:contains <chat.ttl>;
    stat:mtime 1641078682.6;
    stat:size 4096 .
<chat.ttl>
    a tur:Resource, ldp:Resource;
    dct:modified "2022-01-01T23:13:30Z"^^xsd:dateTime;
    stat:mtime 1641078810.591;
    stat:size 735 .
`

const createTestMessage = (testUrl: TestUrl): ChatMessage => ({
    id: testUrl.messageId,
    content: 'Zeitloses Design würde ich sagen.',
    maker: testUrl.maker,
    created: 1640995200000,
    verificationStatus: 'NOT_VERIFIED'
});

const createTestReply = (): ChatMessageReply => ({
    id: testUrlBob.messageResource + '#rpl-1',
    messageId: "https://alice.pod/chats/1/2022/01/01/chat.ttl#msg-1",
    agent: testUrlBob.maker,
    name: "👍"
});

const expectedMessagesResult = [{
    chatId: testUrlBob.chatId,
    resources: [{
        location: { day: 1, month: 1, year: 2022 },
        messages: [createTestMessage(testUrlBob)],
        replies: [createTestReply(),]
    }]
},
{
    chatId: testUrlAlice.chatId,
    resources: [{
        location: { day: 1, month: 1, year: 2022 },
        messages: [createTestMessage(testUrlAlice)],
        replies: [{
            id: testUrlAlice.messageResource + '#rpl-1',
            messageId: testUrlAlice.messageId,
            agent: testUrlAlice.maker,
            name: "👍"
        }]
    }]
}]

const prepareCache = (content: string, baseUri: string): Promise<void> => {
    return new Promise(resolve => {
        parse(
            content,
            rdfStore.cache,
            baseUri,
            "text/turtle",
            resolve
        );
    });
}

const prepareCacheWithMessage = async () => {
    await prepareCache(CHAT_CONTAINER_CONTENT, testUrlBob.chatRoot);
    await prepareCache(YEAR_CONTAINER_CONTENT, testUrlBob.yearContainer);
    await prepareCache(MONTH_CONTAINER_CONTENT, testUrlBob.monthContainer);
    await prepareCache(DAY_CONTAINER_CONTENT, testUrlBob.dayContainer);
    await prepareCache(MESSAGE_RESOURCE_CONTENT, testUrlBob.messageResource);

    await prepareCache(CHAT_CONTAINER_CONTENT, testUrlAlice.chatRoot);
    await prepareCache(YEAR_CONTAINER_CONTENT, testUrlAlice.yearContainer);
    await prepareCache(MONTH_CONTAINER_CONTENT, testUrlAlice.monthContainer);
    await prepareCache(DAY_CONTAINER_CONTENT, testUrlAlice.dayContainer);
    await prepareCache(MESSAGE_RESOURCE_CONTENT, testUrlAlice.messageResource);
}