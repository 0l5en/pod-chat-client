import { fail } from 'assert';
import { graph, IndexedFormula } from 'rdflib';
import { expect, vi } from 'vitest';
import { prepareCache } from '../../testUtils';
import { chatIdFromIdValue, idValueFromChatId, loadChat, loadParticipantsHavingReadAccess, toggleParticipantHasReadAccess } from './Chat';
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

describe('Chat', () => {

    afterEach(() => {
        rdfStore.cache = graph();
        vi.restoreAllMocks();
    });

    describe('idValueFromChatId', () => {
        it('should extract the id value from a given webid', () => {
            const idValue = idValueFromChatId('https://me.pod.provider/pod-chat.com/1234/index.ttl#this');
            expect(idValue).toBe('1234');
        });
    });

    describe('chatIdFromIdValue', () => {
        it('should produce a webid for a chat from the given id value', () => {
            const webidOfChat = chatIdFromIdValue("https://me.pod.provider/", "1234");
            expect(webidOfChat).toBe('https://me.pod.provider/pod-chat.com/1234/index.ttl#this');
        });
    });

    describe('loadChat', () => {
        it('should load the expected chat resource', async () => {
            await prepareCache(CHAT_WITH_BOB_RESOURCE_CONTENT, testUrlAlice.chatResource, rdfStore.cache);
            const result = await loadChat(testUrlAlice.owner, testUrlAlice.chatId);
            expect(result).toStrictEqual({
                created: 1657951820620,
                id: testUrlAlice.chatId,
                participants: [{
                    chatId: undefined,
                    id: testUrlBob.owner,
                }],
                title: "Chat Channel",
            });
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should throw error for chat with no other participants', async () => {
            await prepareCache(CHAT_WITH_NO_OTHER_PARTICIPANTS_RESOURCE_CONTENT, testUrlAlice.chatResource, rdfStore.cache);
            try {
                const result = await loadChat(testUrlAlice.owner, testUrlAlice.chatId);
                fail("shoul throw an error for invalid chat resource");
            } catch (error) {
                expect(error).instanceOf(Error);
                expect((error as Error).message).toBe("invalid chat data: no other participants found.");
            }
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should throw error for chat with no title', async () => {
            await prepareCache(CHAT_WITH_NO_TITLE_RESOURCE_CONTENT, testUrlAlice.chatResource, rdfStore.cache);
            try {
                const result = await loadChat(testUrlAlice.owner, testUrlAlice.chatId);
                fail("shoul throw an error for invalid chat resource");
            } catch (error) {
                expect(error).instanceOf(Error);
                expect((error as Error).message).toBe("invalid chat data: no title found.");
            }
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should throw error for chat with no created date', async () => {
            await prepareCache(CHAT_WITH_NO_CREATED_DATE_RESOURCE_CONTENT, testUrlAlice.chatResource, rdfStore.cache);
            try {
                const result = await loadChat(testUrlAlice.owner, testUrlAlice.chatId);
                fail("shoul throw an error for invalid chat resource");
            } catch (error) {
                expect(error).instanceOf(Error);
                expect((error as Error).message).toBe("invalid chat data: no created found.");
            }
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should throw error for chat with invalid created date', async () => {
            await prepareCache(CHAT_WITH_INVALID_CREATED_DATE_RESOURCE_CONTENT, testUrlAlice.chatResource, rdfStore.cache);
            try {
                const result = await loadChat(testUrlAlice.owner, testUrlAlice.chatId);
                fail("shoul throw an error for invalid chat resource");
            } catch (error) {
                expect(error).instanceOf(Error);
                expect((error as Error).message).toBe("invalid chat data: created is not a datetime literal.");
            }
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });
    });

    describe('loadParticipantsHavingReadAccess', () => {
        it('should return 2 participants', async () => {
            await prepareCache(CHAT_ACL_HAS_READ_ACCESS_FOR_BOB_RESOURCE_CONTENT, testUrlAlice.chatRootAcl, rdfStore.cache);
            const result = await loadParticipantsHavingReadAccess(testUrlAlice.chatId);
            expect(result).toStrictEqual([
                testUrlAlice.owner,
                testUrlBob.owner
            ]);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });
        it('should return no participant', async () => {
            await prepareCache(CHAT_ACL_HAS_READ_ACCESS_FOR_BOB_RESOURCE_CONTENT, testUrlBob.chatRootAcl, rdfStore.cache);
            const result = await loadParticipantsHavingReadAccess(testUrlAlice.chatId);
            expect(result).toHaveLength(0);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });
    });

    describe('toggleParticipantHasReadAccess', () => {
        it('should remove read access for bob', async () => {
            await prepareCache(CHAT_ACL_HAS_READ_ACCESS_FOR_BOB_RESOURCE_CONTENT, testUrlAlice.chatRootAcl, rdfStore.cache);
            const result = await toggleParticipantHasReadAccess(testUrlAlice.chatId, testUrlBob.owner);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(1);
            expect(result).toBe(false);
        });
        it('should add read access for bob', async () => {
            await prepareCache(CHAT_ACL_HAS_NO_READ_ACCESS_FOR_BOB_RESOURCE_CONTENT, testUrlAlice.chatRootAcl, rdfStore.cache);
            const result = await toggleParticipantHasReadAccess(testUrlAlice.chatId, testUrlBob.owner);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(1);
            expect(result).toBe(true);
        });
        it('should throw error if no tripple with Read-Mode exist', async () => {
            await prepareCache(CHAT_ACL_HAS_NO_READ_MODE_RESOURCE_CONTENT, testUrlAlice.chatRootAcl, rdfStore.cache);
            try {
                const result = await toggleParticipantHasReadAccess(testUrlAlice.chatId, testUrlBob.owner);
            } catch (error) {
                expect(error).instanceOf(Error);
                expect((error as Error).message).toBe("cannot add read access: no readonly rule exists in acl");
            }
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });
    });
});

type TestUrl = {
    base: string;
    owner: string;
    chatRoot: string;
    chatRootAcl: string;
    chatResource: string;
    chatId: string;
}

const createTestUrl = (base: string): TestUrl => {
    const owner = base + "profile/card#me";
    const chatRoot = base + "chats/1/";
    const chatRootAcl = chatRoot + ".acl";
    const chatResource = chatRoot + "index.ttl";
    const chatId = chatResource + "#this";
    return {
        base,
        owner,
        chatRoot,
        chatRootAcl,
        chatResource,
        chatId
    };
};


const testUrlAlice = createTestUrl("https://alice.pod/");
const testUrlBob = createTestUrl("https://bob.pod/");

const CHAT_WITH_BOB_RESOURCE_CONTENT = `
@prefix : <#>.
@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.
@prefix dc: <http://purl.org/dc/elements/1.1/>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: </profile/card#>.
@prefix d: <https://bob.pod/profile/card#>.

:id1
    cal:dtstart "2022-07-16T06:42:27Z"^^xsd:dateTime;
    wf:participant c:me.
:id2
    cal:dtstart "2022-07-16T06:42:28Z"^^xsd:dateTime;
    wf:participant d:me.
:this
    a meeting:LongChat;
    dc:author c:me;
    dc:created "2022-07-16T06:10:20.620Z"^^xsd:dateTime;
    dc:title "Chat Channel";
    wf:participation :id1, :id2;
    ui:sharedPreferences :SharedPreferences.
`;

const CHAT_WITH_NO_OTHER_PARTICIPANTS_RESOURCE_CONTENT = `
@prefix : <#>.
@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.
@prefix dc: <http://purl.org/dc/elements/1.1/>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: </profile/card#>.

:id1
    cal:dtstart "2022-07-16T06:42:27Z"^^xsd:dateTime;
    wf:participant c:me.
:this
    a meeting:LongChat;
    dc:author c:me;
    dc:created "2022-07-16T06:10:20.620Z"^^xsd:dateTime;
    dc:title "Chat Channel";
    wf:participation :id1;
    ui:sharedPreferences :SharedPreferences.
`;

const CHAT_WITH_NO_TITLE_RESOURCE_CONTENT = `
@prefix : <#>.
@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.
@prefix dc: <http://purl.org/dc/elements/1.1/>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: </profile/card#>.
@prefix d: <https://bob.pod/profile/card#>.

:id1
    cal:dtstart "2022-07-16T06:42:27Z"^^xsd:dateTime;
    wf:participant c:me.
:id2
    cal:dtstart "2022-07-16T06:42:28Z"^^xsd:dateTime;
    wf:participant d:me.
:this
    a meeting:LongChat;
    dc:author c:me;
    dc:created "2022-07-16T06:10:20.620Z"^^xsd:dateTime;
    wf:participation :id1, :id2;
    ui:sharedPreferences :SharedPreferences.
`;

const CHAT_WITH_NO_CREATED_DATE_RESOURCE_CONTENT = `
@prefix : <#>.
@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.
@prefix dc: <http://purl.org/dc/elements/1.1/>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: </profile/card#>.
@prefix d: <https://bob.pod/profile/card#>.

:id1
    cal:dtstart "2022-07-16T06:42:27Z"^^xsd:dateTime;
    wf:participant c:me.
:id2
    cal:dtstart "2022-07-16T06:42:28Z"^^xsd:dateTime;
    wf:participant d:me.
:this
    a meeting:LongChat;
    dc:author c:me;
    dc:title "Chat Channel";
    wf:participation :id1, :id2;
    ui:sharedPreferences :SharedPreferences.
`;

const CHAT_WITH_INVALID_CREATED_DATE_RESOURCE_CONTENT = `
@prefix : <#>.
@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.
@prefix dc: <http://purl.org/dc/elements/1.1/>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: </profile/card#>.
@prefix d: <https://bob.pod/profile/card#>.

:id1
    cal:dtstart "2022-07-16T06:42:27Z"^^xsd:dateTime;
    wf:participant c:me.
:id2
    cal:dtstart "2022-07-16T06:42:28Z"^^xsd:dateTime;
    wf:participant d:me.
:this
    a meeting:LongChat;
    dc:author c:me;
    dc:created "invalid date value";
    dc:title "Chat Channel";
    wf:participation :id1, :id2;
    ui:sharedPreferences :SharedPreferences.
`;

const CHAT_ACL_HAS_READ_ACCESS_FOR_BOB_RESOURCE_CONTENT = `
<#ControlReadWrite> a <http://www.w3.org/ns/auth/acl#Authorization>;
    <http://www.w3.org/ns/auth/acl#accessTo> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#default> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Control>, <http://www.w3.org/ns/auth/acl#Write>, <http://www.w3.org/ns/auth/acl#Read>;
    <http://www.w3.org/ns/auth/acl#agent> <https://alice.pod/profile/card#me>.
<#Read> a <http://www.w3.org/ns/auth/acl#Authorization>;
    <http://www.w3.org/ns/auth/acl#accessTo> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#default> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Read>;
    <http://www.w3.org/ns/auth/acl#agent> <https://bob.pod/profile/card#me>.
`;

const CHAT_ACL_HAS_NO_READ_ACCESS_FOR_BOB_RESOURCE_CONTENT = `
<#ControlReadWrite> a <http://www.w3.org/ns/auth/acl#Authorization>;
    <http://www.w3.org/ns/auth/acl#accessTo> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#default> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Control>, <http://www.w3.org/ns/auth/acl#Write>, <http://www.w3.org/ns/auth/acl#Read>;
    <http://www.w3.org/ns/auth/acl#agent> <https://alice.pod/profile/card#me>.
<#Read> a <http://www.w3.org/ns/auth/acl#Authorization>;
    <http://www.w3.org/ns/auth/acl#accessTo> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#default> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Read>.
`;

const CHAT_ACL_HAS_NO_READ_MODE_RESOURCE_CONTENT = `
<#ControlReadWrite> a <http://www.w3.org/ns/auth/acl#Authorization>;
    <http://www.w3.org/ns/auth/acl#accessTo> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#default> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Control>;
    <http://www.w3.org/ns/auth/acl#agent> <https://alice.pod/profile/card#me>.
`;

const prepareCacheWithChatResource = async () => {
    await prepareCache(CHAT_WITH_BOB_RESOURCE_CONTENT, testUrlAlice.chatResource, rdfStore.cache);
};