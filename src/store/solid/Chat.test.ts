import { fail } from 'assert';
import { graph, IndexedFormula, Statement } from 'rdflib';
import { GraphType, ObjectType, PredicateType, SubjectType } from 'rdflib/lib/types';
import * as uuid from "uuid";
import { expect, Mock, vi } from 'vitest';
import { prepareCache } from '../../testUtils';
import { chatIdFromIdValue, createChat, deleteRecursive, idValueFromChatId, joinChat, loadChat, loadParticipantsHavingReadAccess, removeFromTypeIndex, setParticipantReferences, toggleParticipantHasReadAccess } from './Chat';
import { STORAGE_APP_BASE, STORAGE_LONG_CHAT_RESOURCE_NAME } from './Constants';
import rdfStore from './RdfStore';

vi.mock('./RdfStore', async (importOriginal) => {
    const mod = await importOriginal<{ cache: IndexedFormula }>();
    return {
        ...mod,
        default: {
            fetcher: {
                load: vi.fn(),
                webOperation: vi.fn()
            },
            cache: graph(),
            updateManager: {
                update: vi.fn()
            }
        },
    };
});

vi.mock('uuid', async () => {
    return {
        v4: vi.fn()
    }
})

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
            await prepareCache(CHAT_WITH_BOB, testUrlAlice.chatResource, rdfStore.cache);
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
            await prepareCache(CHAT_WITH_NO_OTHER_PARTICIPANTS, testUrlAlice.chatResource, rdfStore.cache);
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
            await prepareCache(CHAT_WITH_NO_TITLE, testUrlAlice.chatResource, rdfStore.cache);
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
            await prepareCache(CHAT_WITH_NO_CREATED_DATE, testUrlAlice.chatResource, rdfStore.cache);
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
            await prepareCache(CHAT_WITH_INVALID_CREATED_DATE, testUrlAlice.chatResource, rdfStore.cache);
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
            await prepareCache(CHAT_ACL_HAS_READ_ACCESS_FOR_BOB, testUrlAlice.chatRootAcl, rdfStore.cache);
            const result = await loadParticipantsHavingReadAccess(testUrlAlice.chatId);
            expect(result).toStrictEqual([
                testUrlAlice.owner,
                testUrlBob.owner
            ]);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });
        it('should return no participant', async () => {
            await prepareCache(CHAT_ACL_HAS_READ_ACCESS_FOR_BOB, testUrlBob.chatRootAcl, rdfStore.cache);
            const result = await loadParticipantsHavingReadAccess(testUrlAlice.chatId);
            expect(result).toHaveLength(0);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });
    });

    describe('toggleParticipantHasReadAccess', () => {
        it('should remove read access for bob', async () => {
            await prepareCache(CHAT_ACL_HAS_READ_ACCESS_FOR_BOB, testUrlAlice.chatRootAcl, rdfStore.cache);
            const result = await toggleParticipantHasReadAccess(testUrlAlice.chatId, testUrlBob.owner);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(1);
            expect(result).toBe(false);
        });
        it('should add read access for bob', async () => {
            await prepareCache(CHAT_ACL_HAS_NO_READ_ACCESS_FOR_BOB, testUrlAlice.chatRootAcl, rdfStore.cache);
            const result = await toggleParticipantHasReadAccess(testUrlAlice.chatId, testUrlBob.owner);
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(rdfStore.updateManager.update).toBeCalledTimes(1);
            expect(result).toBe(true);
        });
        it('should throw error if no tripple with Read-Mode exist', async () => {
            await prepareCache(CHAT_ACL_HAS_NO_READ_MODE, testUrlAlice.chatRootAcl, rdfStore.cache);
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

    describe('deleteRecursive', () => {
        it('should delete recursive', async () => {
            await prepareCache(ROOT_CONTAINER, 'https://alice.pod/rootContainer/', rdfStore.cache);
            await prepareCache(SUB_CONTAINER, 'https://alice.pod/rootContainer/subContainer/', rdfStore.cache);
            await deleteRecursive('https://alice.pod/rootContainer/');
            expect(rdfStore.fetcher.webOperation).toHaveBeenCalledWith('DELETE', 'https://alice.pod/rootContainer/subContainer/resourceOfSubContainer.ttl');
            expect(rdfStore.fetcher.webOperation).toHaveBeenCalledWith('DELETE', 'https://alice.pod/rootContainer/subContainer/');
            expect(rdfStore.fetcher.webOperation).toHaveBeenCalledWith('DELETE', 'https://alice.pod/rootContainer/resourceOfRootContainer.ttl');
            expect(rdfStore.fetcher.webOperation).toHaveBeenCalledWith('DELETE', 'https://alice.pod/rootContainer/');
            expect(rdfStore.cache.length).toBe(0);
        });
    });

    describe('removeFromTypeIndex', () => {
        it('should remove chatFirst instance from type index', async () => {
            await prepareCache(TYPE_INDEX, 'https://alice.pod/settings/privateTypeIndex.ttl', rdfStore.cache);

            let delStmtsCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];
            let insStmtsCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];
            const updateMock = rdfStore.updateManager.update as Mock;
            updateMock.mockImplementationOnce((del, ins) => {
                delStmtsCaptured = del;
                insStmtsCaptured = ins;
            });
            await removeFromTypeIndex('https://alice.pod/chats/1/index.ttl#this', 'https://alice.pod/settings/privateTypeIndex.ttl');

            expect(insStmtsCaptured).toHaveLength(0);
            expect(delStmtsCaptured).toHaveLength(1);
            verifyStatement(
                delStmtsCaptured[0],
                {
                    graph: 'https://alice.pod/settings/privateTypeIndex.ttl',
                    subject: 'https://alice.pod/settings/privateTypeIndex.ttl#uuid-v4-mock',
                    predicate: 'http://www.w3.org/ns/solid/terms#instance',
                    object: 'https://alice.pod/chats/1/index.ttl#this'

                }
            );
            expect(rdfStore.fetcher.load).toBeCalledTimes(1);
            expect(updateMock).toBeCalledTimes(1);
        });
    });

    describe('create/join Chat', () => {
        const uuidMockValue = 'uuid-v4-mock';
        const expectedGraph = testUrlAlice.base + STORAGE_APP_BASE + uuidMockValue + '/' + STORAGE_LONG_CHAT_RESOURCE_NAME;
        const expectedGraphAcl = testUrlAlice.base + STORAGE_APP_BASE + uuidMockValue + '/.acl';
        const expectedChatSubject = expectedGraph + '#this';
        const expectedTypeIndexSubject = testUrlAlice.privateTypeIndex + '#' + uuidMockValue;
        const expectedParticipationSubject = expectedGraph + '#' + uuidMockValue;
        const now: Date = new Date('1995-12-17T03:24:00');

        let delStmtsChatCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];
        let insStmtsChatCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];
        let delStmtsChatAclCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];
        let insStmtsChatAclCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];
        let delStmtsTypeIndexCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];
        let insStmtsTypeIndexCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];

        beforeEach(() => {
            const updateMock = rdfStore.updateManager.update as Mock;
            updateMock
                .mockImplementationOnce((del, ins) => {
                    delStmtsChatCaptured = del;
                    insStmtsChatCaptured = ins;
                })
                .mockImplementationOnce((del, ins) => {
                    delStmtsChatAclCaptured = del;
                    insStmtsChatAclCaptured = ins;
                })
                .mockImplementationOnce((del, ins) => {
                    delStmtsTypeIndexCaptured = del;
                    insStmtsTypeIndexCaptured = ins;
                });

            const uuidV4Mock = uuid.v4 as Mock;
            uuidV4Mock.mockImplementation(() => uuidMockValue);
        });

        afterEach(() => {
            expect(delStmtsChatCaptured).toHaveLength(0);
            expect(delStmtsChatAclCaptured).toHaveLength(0);
            expect(delStmtsTypeIndexCaptured).toHaveLength(0);
        });

        it('should create a new chat with a new type index', async () => {
            await createChat(testUrlAlice.owner, [testUrlBob.owner], now, testUrlAlice.base, testUrlAlice.privateTypeIndex);

            verifyChatInsStatements(insStmtsChatCaptured, expectedGraph, testUrlAlice.owner, expectedChatSubject, expectedParticipationSubject);
            verifyChatAclInsStatements(insStmtsChatAclCaptured, expectedGraphAcl, testUrlAlice.owner, testUrlBob.owner);
            verifyTypeIndexInsStatements(insStmtsTypeIndexCaptured, testUrlAlice.privateTypeIndex, expectedTypeIndexSubject, expectedChatSubject, true);
        });

        it('should create a new chat and extend the existing type index', async () => {
            await prepareCache(TYPE_INDEX, testUrlAlice.privateTypeIndex, rdfStore.cache);
            await createChat(testUrlAlice.owner, [testUrlBob.owner], now, testUrlAlice.base, testUrlAlice.privateTypeIndex);

            verifyChatInsStatements(insStmtsChatCaptured, expectedGraph, testUrlAlice.owner, expectedChatSubject, expectedParticipationSubject);
            verifyChatAclInsStatements(insStmtsChatAclCaptured, expectedGraphAcl, testUrlAlice.owner, testUrlBob.owner);
            verifyTypeIndexInsStatements(insStmtsTypeIndexCaptured, testUrlAlice.privateTypeIndex, expectedTypeIndexSubject, expectedChatSubject, false);
        });

        it('should join a new chat with participant having no chat reference', async () => {
            await joinChat(testUrlAlice.owner, [{ id: testUrlBob.owner }], now, testUrlAlice.base, testUrlAlice.privateTypeIndex);
            verifyChatInsStatements(insStmtsChatCaptured, expectedGraph, testUrlAlice.owner, expectedChatSubject, expectedParticipationSubject);
            verifyChatAclInsStatements(insStmtsChatAclCaptured, expectedGraphAcl, testUrlAlice.owner, testUrlBob.owner);
            verifyTypeIndexInsStatements(insStmtsTypeIndexCaptured, testUrlAlice.privateTypeIndex, expectedTypeIndexSubject, expectedChatSubject, true);
        });

        it('should join a new chat with participant having a chat reference', async () => {
            await joinChat(testUrlAlice.owner, [{ id: testUrlBob.owner, chatId: testUrlBob.chatId }], now, testUrlAlice.base, testUrlAlice.privateTypeIndex);
            verifyChatInsStatements(insStmtsChatCaptured, expectedGraph, testUrlAlice.owner, expectedChatSubject, expectedParticipationSubject, testUrlBob.chatId);
            verifyChatAclInsStatements(insStmtsChatAclCaptured, expectedGraphAcl, testUrlAlice.owner, testUrlBob.owner);
            verifyTypeIndexInsStatements(insStmtsTypeIndexCaptured, testUrlAlice.privateTypeIndex, expectedTypeIndexSubject, expectedChatSubject, true);
        });
    });

    describe('setParticipantReferences', () => {
        let delStmtsChatCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];
        let insStmtsChatCaptured: Statement<SubjectType, PredicateType, ObjectType, GraphType>[] = [];

        beforeEach(() => {
            const updateMock = rdfStore.updateManager.update as Mock;
            updateMock
                .mockImplementationOnce((del, ins) => {
                    delStmtsChatCaptured = del;
                    insStmtsChatCaptured = ins;
                });
        });

        it('should insert a new reference', async () => {

            await prepareCache(CHAT_WITH_BOB, testUrlAlice.chatResource, rdfStore.cache);
            await setParticipantReferences(testUrlAlice.chatId, [{ participantId: testUrlBob.owner, participantChatId: testUrlBob.chatId }]);

            expect(delStmtsChatCaptured).toHaveLength(0);
            expect(insStmtsChatCaptured).toHaveLength(1);

            verifyStatement(
                insStmtsChatCaptured[0],
                {
                    graph: 'https://alice.pod/chats/1/index.ttl',
                    subject: 'https://alice.pod/chats/1/index.ttl#id2',
                    predicate: 'http://purl.org/dc/terms/references',
                    object: 'https://bob.pod/chats/1/index.ttl#this'

                }
            );

        });

        it('should insert a new reference', async () => {

            await prepareCache(CHAT_WITH_BOB_HAVING_CHAT_REFERENCE, testUrlAlice.chatResource, rdfStore.cache);
            await setParticipantReferences(testUrlAlice.chatId, [{ participantId: testUrlBob.owner, participantChatId: testUrlBob.chatId }]);

            expect(delStmtsChatCaptured).toHaveLength(1);
            expect(insStmtsChatCaptured).toHaveLength(1);

            verifyStatement(
                delStmtsChatCaptured[0],
                {
                    graph: 'https://alice.pod/chats/1/index.ttl',
                    subject: 'https://alice.pod/chats/1/index.ttl#id2',
                    predicate: 'http://purl.org/dc/terms/references',
                    object: 'https://bob.pod/chats/1/index.ttl#this'

                }
            );

            verifyStatement(
                insStmtsChatCaptured[0],
                {
                    graph: 'https://alice.pod/chats/1/index.ttl',
                    subject: 'https://alice.pod/chats/1/index.ttl#id2',
                    predicate: 'http://purl.org/dc/terms/references',
                    object: 'https://bob.pod/chats/1/index.ttl#this'

                }
            );
        });
    });
});

const verifyStatement =
    (
        stmt: Statement<SubjectType, PredicateType, ObjectType, GraphType>,
        values: { graph: string, subject: string, predicate: string, object: string }
    ) => {
        expect(stmt.graph.value).toBe(values.graph);
        expect(stmt.subject.value).toBe(values.subject);
        expect(stmt.predicate.value).toBe(values.predicate);
        expect(stmt.object.value).toBe(values.object);
    }

const verifyChatInsStatements =
    (
        stmts: Statement<SubjectType, PredicateType, ObjectType, GraphType>[],
        expectedGraph: string,
        expectedChatAuthor: string,
        expectedChatSubject: string,
        expectedParticipationSubject: string,
        participantChatReference?: string
    ) => {
        expect(stmts).toHaveLength(participantChatReference ? 11 : 10);
        verifyStatement(
            stmts[0],
            {
                graph: expectedGraph,
                subject: expectedChatSubject,
                predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                object: 'http://www.w3.org/ns/pim/meeting#LongChat'

            }
        );
        verifyStatement(
            stmts[1],
            {
                graph: expectedGraph,
                subject: expectedChatSubject,
                predicate: 'http://purl.org/dc/elements/1.1/author',
                object: expectedChatAuthor

            }
        );
        verifyStatement(
            stmts[2],
            {
                graph: expectedGraph,
                subject: expectedChatSubject,
                predicate: 'http://purl.org/dc/elements/1.1/created',
                object: '1995-12-17T02:24:00Z'

            }
        );
        verifyStatement(
            stmts[3],
            {
                graph: expectedGraph,
                subject: expectedChatSubject,
                predicate: 'http://purl.org/dc/elements/1.1/title',
                object: 'Chat Channel'

            }
        );
        verifyStatement(
            stmts[4],
            {
                graph: expectedGraph,
                subject: expectedParticipationSubject,
                predicate: 'https://www.w3.org/2002/12/cal/ical#dtstart',
                object: '1995-12-17T02:24:00Z'

            }
        );
        verifyStatement(
            stmts[5],
            {
                graph: expectedGraph,
                subject: expectedParticipationSubject,
                predicate: 'http://www.w3.org/2005/01/wf/flow#participant',
                object: 'https://alice.pod/profile/card#me'

            }
        );
        verifyStatement(
            stmts[6],
            {
                graph: expectedGraph,
                subject: expectedChatSubject,
                predicate: 'http://www.w3.org/2005/01/wf/flow#participation',
                object: expectedParticipationSubject

            }
        );
        verifyStatement(
            stmts[7],
            {
                graph: expectedGraph,
                subject: expectedParticipationSubject,
                predicate: 'https://www.w3.org/2002/12/cal/ical#dtstart',
                object: '1995-12-17T02:24:00Z'

            }
        );
        verifyStatement(
            stmts[8],
            {
                graph: expectedGraph,
                subject: expectedParticipationSubject,
                predicate: 'http://www.w3.org/2005/01/wf/flow#participant',
                object: 'https://bob.pod/profile/card#me'

            }
        );
        if (participantChatReference) {
            verifyStatement(
                stmts[9],
                {
                    graph: expectedGraph,
                    subject: expectedParticipationSubject,
                    predicate: 'http://purl.org/dc/terms/references',
                    object: participantChatReference

                }
            );
            verifyStatement(
                stmts[10],
                {
                    graph: expectedGraph,
                    subject: expectedChatSubject,
                    predicate: 'http://www.w3.org/2005/01/wf/flow#participation',
                    object: expectedParticipationSubject

                }
            );
        } else {
            verifyStatement(
                stmts[9],
                {
                    graph: expectedGraph,
                    subject: expectedChatSubject,
                    predicate: 'http://www.w3.org/2005/01/wf/flow#participation',
                    object: expectedParticipationSubject

                }
            );
        }
    }

const verifyChatAclInsStatements =
    (
        stmts: Statement<SubjectType, PredicateType, ObjectType, GraphType>[],
        expectedGraph: string,
        expectedChatOwner: string,
        expectedChatParticipant: string
    ) => {
        expect(stmts).toHaveLength(12);
        verifyStatement(
            stmts[0],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#ControlReadWrite',
                predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                object: 'http://www.w3.org/ns/auth/acl#Authorization'

            }
        );
        verifyStatement(
            stmts[1],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#ControlReadWrite',
                predicate: 'http://www.w3.org/ns/auth/acl#accessTo',
                object: expectedGraph.substring(0, expectedGraph.length - 4)
            }
        );
        verifyStatement(
            stmts[2],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#ControlReadWrite',
                predicate: 'http://www.w3.org/ns/auth/acl#default',
                object: expectedGraph.substring(0, expectedGraph.length - 4)
            }
        );
        verifyStatement(
            stmts[3],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#ControlReadWrite',
                predicate: 'http://www.w3.org/ns/auth/acl#mode',
                object: 'http://www.w3.org/ns/auth/acl#Control'
            }
        );
        verifyStatement(
            stmts[4],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#ControlReadWrite',
                predicate: 'http://www.w3.org/ns/auth/acl#mode',
                object: 'http://www.w3.org/ns/auth/acl#Write'
            }
        );
        verifyStatement(
            stmts[5],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#ControlReadWrite',
                predicate: 'http://www.w3.org/ns/auth/acl#mode',
                object: 'http://www.w3.org/ns/auth/acl#Read'
            }
        );
        verifyStatement(
            stmts[6],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#ControlReadWrite',
                predicate: 'http://www.w3.org/ns/auth/acl#agent',
                object: expectedChatOwner

            }
        );
        verifyStatement(
            stmts[7],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#Read',
                predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                object: 'http://www.w3.org/ns/auth/acl#Authorization'

            }
        );
        verifyStatement(
            stmts[8],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#Read',
                predicate: 'http://www.w3.org/ns/auth/acl#accessTo',
                object: expectedGraph.substring(0, expectedGraph.length - 4)

            }
        );
        verifyStatement(
            stmts[9],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#Read',
                predicate: 'http://www.w3.org/ns/auth/acl#default',
                object: expectedGraph.substring(0, expectedGraph.length - 4)

            }
        );
        verifyStatement(
            stmts[10],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#Read',
                predicate: 'http://www.w3.org/ns/auth/acl#mode',
                object: 'http://www.w3.org/ns/auth/acl#Read'

            }
        );
        verifyStatement(
            stmts[11],
            {
                graph: expectedGraph,
                subject: expectedGraph + '#Read',
                predicate: 'http://www.w3.org/ns/auth/acl#agent',
                object: expectedChatParticipant

            }
        );
    };

const verifyTypeIndexInsStatements =
    (
        stmts: Statement<SubjectType, PredicateType, ObjectType, GraphType>[],
        expectedGraph: string,
        expectedSubject: string,
        expectedChatSubject: string,
        shouldCreateNew: boolean
    ) => {
        expect(stmts).toHaveLength(shouldCreateNew ? 2 : 1);

        if (shouldCreateNew) {
            verifyStatement(
                stmts[0],
                {
                    graph: expectedGraph,
                    subject: expectedSubject,
                    predicate: 'http://www.w3.org/ns/solid/terms#forClass',
                    object: 'http://www.w3.org/ns/pim/meeting#LongChat'

                }
            );
            verifyStatement(
                stmts[1],
                {
                    graph: expectedGraph,
                    subject: expectedSubject,
                    predicate: 'http://www.w3.org/ns/solid/terms#instance',
                    object: expectedChatSubject

                }
            );
        } else {
            verifyStatement(
                stmts[0],
                {
                    graph: expectedGraph,
                    subject: expectedSubject,
                    predicate: 'http://www.w3.org/ns/solid/terms#instance',
                    object: expectedChatSubject

                }
            );
        }
    }

type TestUrl = {
    base: string;
    owner: string;
    privateTypeIndex: string;
    chatRoot: string;
    chatRootAcl: string;
    chatResource: string;
    chatId: string;
}

const createTestUrl = (base: string): TestUrl => {
    const owner = base + "profile/card#me";
    const privateTypeIndex = base + "settings/privateTypeIndex.ttl";
    const chatRoot = base + "chats/1/";
    const chatRootAcl = chatRoot + ".acl";
    const chatResource = chatRoot + "index.ttl";
    const chatId = chatResource + "#this";
    return {
        base,
        owner,
        privateTypeIndex,
        chatRoot,
        chatRootAcl,
        chatResource,
        chatId
    };
};


const testUrlAlice = createTestUrl("https://alice.pod/");
const testUrlBob = createTestUrl("https://bob.pod/");

const CHAT_WITH_BOB = `
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

const CHAT_WITH_BOB_HAVING_CHAT_REFERENCE = `
@prefix : <#>.
@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.
@prefix dc: <http://purl.org/dc/elements/1.1/>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: </profile/card#>.
@prefix d: <https://bob.pod/profile/card#>.
@prefix r: <http://purl.org/dc/terms/>.
@prefix rc: <https://bob.pod/chats/1/index.ttl#>.

:id1
    cal:dtstart "2022-07-16T06:42:27Z"^^xsd:dateTime;
    wf:participant c:me.
:id2
    cal:dtstart "2022-07-16T06:42:28Z"^^xsd:dateTime;
    r:references rc:this;
    wf:participant d:me.
:this
    a meeting:LongChat;
    dc:author c:me;
    dc:created "2022-07-16T06:10:20.620Z"^^xsd:dateTime;
    dc:title "Chat Channel";
    wf:participation :id1, :id2;
    ui:sharedPreferences :SharedPreferences.
`;

const CHAT_WITH_NO_OTHER_PARTICIPANTS = `
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

const CHAT_WITH_NO_TITLE = `
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

const CHAT_WITH_NO_CREATED_DATE = `
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

const CHAT_WITH_INVALID_CREATED_DATE = `
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

const CHAT_ACL_HAS_READ_ACCESS_FOR_BOB = `
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

const CHAT_ACL_HAS_NO_READ_ACCESS_FOR_BOB = `
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

const CHAT_ACL_HAS_NO_READ_MODE = `
<#ControlReadWrite> a <http://www.w3.org/ns/auth/acl#Authorization>;
    <http://www.w3.org/ns/auth/acl#accessTo> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#default> <https://alice.pod/chats/1/>;
    <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Control>;
    <http://www.w3.org/ns/auth/acl#agent> <https://alice.pod/profile/card#me>.
`;

const ROOT_CONTAINER = `
@prefix dct: <http://purl.org/dc/terms/>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix stat: <http://www.w3.org/ns/posix/stat#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix tur: <http://www.w3.org/ns/iana/media-types/text/turtle#>.

<> a ldp:BasicContainer, ldp:Container;
    dct:modified "2023-03-31T19:59:07Z"^^xsd:dateTime;
    ldp:contains <subContainer/>, <resourceOfRootContainer.ttl>;
    stat:mtime 1680292747.666;
    stat:size 4096.
<subContainer/> a ldp:BasicContainer, ldp:Container, ldp:Resource;
    dct:modified "2023-01-23T21:37:34Z"^^xsd:dateTime;
    stat:mtime 1674509854.919;
    stat:size 4096.
<resourceOfRootContainer.ttl>
    a tur:Resource, ldp:Resource;
    dct:modified "2023-03-04T21:07:51Z"^^xsd:dateTime;
    stat:mtime 1677964071.328;
    stat:size 3323.
`

const SUB_CONTAINER = `
@prefix dct: <http://purl.org/dc/terms/>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix stat: <http://www.w3.org/ns/posix/stat#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix tur: <http://www.w3.org/ns/iana/media-types/text/turtle#>.

<> a ldp:BasicContainer, ldp:Container;
    dct:modified "2023-03-31T19:59:07Z"^^xsd:dateTime;
    ldp:contains <resourceOfSubContainer.ttl>;
    stat:mtime 1680292747.666;
    stat:size 4096.
<resourceOfRootContainer.ttl>
    a tur:Resource, ldp:Resource;
    dct:modified "2023-03-04T21:07:51Z"^^xsd:dateTime;
    stat:mtime 1677964071.328;
    stat:size 3323.
`

const TYPE_INDEX = `
@prefix : <#>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix terms: <https://www.w3.org/ns/solid/terms#>.
@prefix chatFirst: </chats/1/index.ttl#>.
@prefix chatSecond: </chats/2/index.ttl#>.

<> a terms:TypeIndex, terms:UnlistedDocument.

:uuid-v4-mock
    a solid:TypeRegistration;
    solid:forClass meeting:LongChat;
    solid:instance
        chatFirst:this, chatSecond:this.

`
