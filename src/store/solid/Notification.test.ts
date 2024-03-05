import { graph, IndexedFormula } from 'rdflib';
import { Mock } from 'vitest';
import { prepareCache } from '../../testUtils';
import { NotificationType } from '../../types';
import { STORAGE_APP_BASE, STORAGE_NOTIFICATIONS_CLEANUP_BATCH_SIZE, STORAGE_NOTIFICATIONS_PROCESSED } from './Constants';
import { acceptNotifications, cleanupNotifications, sendAddLongChatMessageNotification, sendAddLongChatMessageReplyNotification, sendRemoveLongChatMessageReplyNotification } from './Notification';
import rdfStore from './RdfStore';

vi.mock('./RdfStore', async (importOriginal) => {
    const mod = await importOriginal<{ cache: IndexedFormula }>();
    return {
        ...mod,
        default: {
            fetcher: {
                webOperation: vi.fn(),
                load: vi.fn()
            },
            cache: graph(),
            updateManager: {
                update: vi.fn()
            }
        },
    };
});

const testDate = new Date(Date.UTC(2022, 0, 1));
const chatId = "https://bob.pod/chats/1/index.ttl#this";
const targetId = "https://bob.pod/chats/1/2022/01/01/chat.ttl#42";
const actorId = "https://bob.pod/profile/card#me";
const participationInbox = "https://alice.pod/inbox/";
const notificationsProcessedResource = "https://bob.pod/" + STORAGE_APP_BASE + STORAGE_NOTIFICATIONS_PROCESSED;

describe('Notification', () => {

    afterEach(() => {
        rdfStore.cache = graph();
        vi.restoreAllMocks();
    });

    describe('sendAddLongChatMessageNotification', () => {
        it('should throw an error for invalid chatId', async () => {
            await expect(() => sendAddLongChatMessageNotification('invalid', targetId, actorId, participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid messageid', async () => {
            await expect(() => sendAddLongChatMessageNotification(chatId, 'invalid', actorId, participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid actorId', async () => {
            await expect(() => sendAddLongChatMessageNotification(chatId, targetId, 'invalid', participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid participantInbox', async () => {
            await expect(() => sendAddLongChatMessageNotification(chatId, targetId, actorId, 'invalid', testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should do a post web operation with the expected content', async () => {
            const webOperationMock = rdfStore.fetcher.webOperation as Mock<any[], any>;
            webOperationMock.mockResolvedValue({ ok: true });
            await sendAddLongChatMessageNotification(chatId, targetId, actorId, participationInbox, testDate);
            expect(webOperationMock).toBeCalledTimes(1);
            if (webOperationMock.mock.lastCall) {
                expect(webOperationMock.mock.lastCall[0]).toBe('POST');
                expect(webOperationMock.mock.lastCall[1]).toBe(participationInbox);
                expect(webOperationMock.mock.lastCall[2]).toStrictEqual({
                    contentType: 'text/turtle',
                    data: createNotificationTurtle('Add', 'LongChatMessage')
                });
            }
        });
    });

    describe('sendAddLongChatMessageReplyNotification', () => {
        it('should throw an error for invalid chatId', async () => {
            await expect(() => sendAddLongChatMessageReplyNotification('invalid', targetId, actorId, participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid replyid', async () => {
            await expect(() => sendAddLongChatMessageReplyNotification(chatId, 'invalid', actorId, participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid actorId', async () => {
            await expect(() => sendAddLongChatMessageReplyNotification(chatId, targetId, 'invalid', participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid participantInbox', async () => {
            await expect(() => sendAddLongChatMessageReplyNotification(chatId, targetId, actorId, 'invalid', testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should do a post web operation with the expected content', async () => {
            const webOperationMock = rdfStore.fetcher.webOperation as Mock<any[], any>;
            webOperationMock.mockResolvedValue({ ok: true });
            await sendAddLongChatMessageReplyNotification(chatId, targetId, actorId, participationInbox, testDate);
            expect(webOperationMock).toBeCalledTimes(1);
            if (webOperationMock.mock.lastCall) {
                expect(webOperationMock.mock.lastCall[0]).toBe('POST');
                expect(webOperationMock.mock.lastCall[1]).toBe(participationInbox);
                expect(webOperationMock.mock.lastCall[2]).toStrictEqual({
                    contentType: 'text/turtle',
                    data: createNotificationTurtle('Add', 'LongChatMessageReply')
                });
            }
        });
    });

    describe('sendRemoveLongChatMessageReplyNotification', () => {
        it('should throw an error for invalid chatId', async () => {
            await expect(() => sendRemoveLongChatMessageReplyNotification('invalid', targetId, actorId, participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid replyid', async () => {
            await expect(() => sendRemoveLongChatMessageReplyNotification(chatId, 'invalid', actorId, participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid actorId', async () => {
            await expect(() => sendRemoveLongChatMessageReplyNotification(chatId, targetId, 'invalid', participationInbox, testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });
        it('should throw an error for invalid participantInbox', async () => {
            await expect(() => sendRemoveLongChatMessageReplyNotification(chatId, targetId, actorId, 'invalid', testDate)).rejects.toThrowError();
            verifyNoMockInteraction();
        });

        it('should do a post web operation with the expected content', async () => {
            const webOperationMock = rdfStore.fetcher.webOperation as Mock<any[], any>;
            webOperationMock.mockResolvedValue({ ok: true });
            await sendRemoveLongChatMessageReplyNotification(chatId, targetId, actorId, participationInbox, testDate);
            expect(webOperationMock).toBeCalledTimes(1);
            if (webOperationMock.mock.lastCall) {
                expect(webOperationMock.mock.lastCall[0]).toBe('POST');
                expect(webOperationMock.mock.lastCall[1]).toBe(participationInbox);
                expect(webOperationMock.mock.lastCall[2]).toStrictEqual({
                    contentType: 'text/turtle',
                    data: createNotificationTurtle('Remove', 'LongChatMessageReply')
                });
            }
        });
    });

    describe('acceptNotifications', () => {
        it('should call update manager to insert one triple', async () => {
            const fetcherLoadMock = rdfStore.fetcher.load as Mock<any[], any>;
            const updateManagerUpdateMock = rdfStore.updateManager.update as Mock<any[], any>;

            await prepareCache(createNotificationsProcessed(1), "https://bob.pod/", rdfStore.cache);
            await acceptNotifications([{
                ...createNotification(2),
                id: "https://bob.pod/inbox/1.ttl",
            }], "https://bob.pod/");

            expect(fetcherLoadMock).toBeCalledTimes(1);
            if (fetcherLoadMock.mock.lastCall) {
                expect(fetcherLoadMock.mock.lastCall[0]).toBe(notificationsProcessedResource);
                expect(fetcherLoadMock.mock.lastCall[1]).toStrictEqual({ force: true });
            }

            expect(updateManagerUpdateMock).toBeCalledTimes(1);
            if (updateManagerUpdateMock.mock.lastCall) {
                expect(updateManagerUpdateMock.mock.lastCall[0]).toHaveLength(0);
                expect(updateManagerUpdateMock.mock.lastCall[1]).toHaveLength(1);
            }
        });

        it('should call update manager to delete and insert one triple', async () => {
            const fetcherLoadMock = rdfStore.fetcher.load as Mock<any[], any>;
            const updateManagerUpdateMock = rdfStore.updateManager.update as Mock<any[], any>;

            await prepareCache(createNotificationsProcessed(1), notificationsProcessedResource, rdfStore.cache);
            await acceptNotifications([createNotification(1)], "https://bob.pod/");

            expect(fetcherLoadMock).toBeCalledTimes(1);
            if (fetcherLoadMock.mock.lastCall) {
                expect(fetcherLoadMock.mock.lastCall[0]).toBe(notificationsProcessedResource);
                expect(fetcherLoadMock.mock.lastCall[1]).toStrictEqual({ force: true });
            }

            expect(updateManagerUpdateMock).toBeCalledTimes(1);
            if (updateManagerUpdateMock.mock.lastCall) {
                expect(updateManagerUpdateMock.mock.lastCall[0]).toHaveLength(1);
                expect(updateManagerUpdateMock.mock.lastCall[1]).toHaveLength(1);
            }
        });

        it('should silently ignore fetch error', async () => {
            const fetcherLoadMock = rdfStore.fetcher.load as Mock<any[], any>;
            fetcherLoadMock.mockRejectedValue("fetch test error");
            const updateManagerUpdateMock = rdfStore.updateManager.update as Mock<any[], any>;


            await prepareCache(createNotificationsProcessed(1), notificationsProcessedResource, rdfStore.cache);
            await acceptNotifications([createNotification(1)], "https://bob.pod/");

            expect(fetcherLoadMock).toBeCalledTimes(1);
            if (fetcherLoadMock.mock.lastCall) {
                expect(fetcherLoadMock.mock.lastCall[0]).toBe(notificationsProcessedResource);
                expect(fetcherLoadMock.mock.lastCall[1]).toStrictEqual({ force: true });
            }

            expect(updateManagerUpdateMock).toBeCalledTimes(0);
        });

        it('should silently ignore update error', async () => {
            const fetcherLoadMock = rdfStore.fetcher.load as Mock<any[], any>;
            const updateManagerUpdateMock = rdfStore.updateManager.update as Mock<any[], any>;
            updateManagerUpdateMock.mockRejectedValue("update test error");

            await prepareCache(createNotificationsProcessed(1), notificationsProcessedResource, rdfStore.cache);
            await acceptNotifications([createNotification(1)], "https://bob.pod/");

            expect(fetcherLoadMock).toBeCalledTimes(1);
            if (fetcherLoadMock.mock.lastCall) {
                expect(fetcherLoadMock.mock.lastCall[0]).toBe(notificationsProcessedResource);
                expect(fetcherLoadMock.mock.lastCall[1]).toStrictEqual({ force: true });
            }

            expect(updateManagerUpdateMock).toBeCalledTimes(1);
            if (updateManagerUpdateMock.mock.lastCall) {
                expect(updateManagerUpdateMock.mock.lastCall[0]).toHaveLength(1);
                expect(updateManagerUpdateMock.mock.lastCall[1]).toHaveLength(1);
            }
        });
    });

    describe('cleanupNotifications', () => {
        it('should silently ignore fetch error', async () => {
            const fetcherLoadMock = rdfStore.fetcher.load as Mock<any[], any>;
            fetcherLoadMock.mockRejectedValue("fetch test error");
            await cleanupNotifications("https://bob.pod/");

            expect(fetcherLoadMock).toBeCalledTimes(1);
            if (fetcherLoadMock.mock.lastCall) {
                expect(fetcherLoadMock.mock.lastCall[0]).toBe(notificationsProcessedResource);
                expect(fetcherLoadMock.mock.lastCall[1]).toStrictEqual({ force: true });
            }

            expect(rdfStore.updateManager.update).toBeCalledTimes(0);
        });

        it('should cleanup one chunk of notifications', async () => {
            const fetcherLoadMock = rdfStore.fetcher.load as Mock<any[], any>;
            fetcherLoadMock.mockImplementationOnce(async () => {
                await prepareCache(createNotificationsProcessed(1), notificationsProcessedResource, rdfStore.cache);
            });
            await cleanupNotifications("https://bob.pod/");

            expect(fetcherLoadMock).toBeCalledTimes(1);
            if (fetcherLoadMock.mock.lastCall) {
                expect(fetcherLoadMock.mock.lastCall[0]).toBe(notificationsProcessedResource);
                expect(fetcherLoadMock.mock.lastCall[1]).toStrictEqual({ force: true });
            }

            expect(rdfStore.updateManager.update).toBeCalledTimes(1);
        });

        it('should cleanup two chunks of notifications', async () => {

            const fetcherLoadMock = rdfStore.fetcher.load as Mock<any[], any>;
            const updateManagerUpdateMock = rdfStore.updateManager.update as Mock<any[], any>;

            fetcherLoadMock.mockImplementationOnce(async () => {
                await prepareCache(createNotificationsProcessed(STORAGE_NOTIFICATIONS_CLEANUP_BATCH_SIZE + 1), notificationsProcessedResource, rdfStore.cache);
            });

            await cleanupNotifications("https://bob.pod/");

            expect(fetcherLoadMock).toBeCalledTimes(1);
            if (fetcherLoadMock.mock.lastCall) {
                expect(fetcherLoadMock.mock.lastCall[0]).toBe(notificationsProcessedResource);
                expect(fetcherLoadMock.mock.lastCall[1]).toStrictEqual({ force: true });
            }

            expect(updateManagerUpdateMock).toBeCalledTimes(1);
            if (updateManagerUpdateMock.mock.lastCall) {
                expect(updateManagerUpdateMock.mock.lastCall[0]).toHaveLength(100);
                expect(updateManagerUpdateMock.mock.lastCall[1]).toHaveLength(0);
            }
        });
    });
});

const verifyNoMockInteraction = () => {
    expect(rdfStore.fetcher.webOperation).toBeCalledTimes(0);
}

const createNotification = (id: number) => ({
    id: "https://bob.pod/inbox/" + id + ".ttl",
    actorId: "https://alice.pod/profiel/card#me",
    objectId: "https://alice.pod/" + STORAGE_APP_BASE + "1/2022/01/01/chat.ttl#msg-1",
    targetId: "https://alice.pod/" + STORAGE_APP_BASE + "1/index.ttl#this",
    type: NotificationType.ChatMessageAdd,
    updated: 1
});

const createNotificationTurtle = (notificationType: 'Add' | 'Remove', context: 'LongChatMessage' | 'LongChatMessageReply') => `@prefix : <#>.
@prefix as: <https://www.w3.org/ns/activitystreams#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: <https://bob.pod/profile/card#>.
@prefix www: <https://www.pod-chat.com/>.
@prefix ch: <https://bob.pod/chats/1/2022/01/01/chat.ttl#>.
@prefix ind: <https://bob.pod/chats/1/index.ttl#>.

<>
    a as:${notificationType};
    as:actor c:me;
    as:context www:${context};
    as:object ch:42;
    as:target ind:this;
    as:updated "2022-01-01T00:00:00Z"^^xsd:dateTime.
`

const createNotificationsProcessed = (amount: number) => `@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

` + createNotificationProcessed(amount);

const createNotificationProcessed = (amount: number) => {
    let result = '';
    for (var i = 0; i < amount; i++) {
        result += `
<https://bob.pod/inbox/${i + 1}.ttl>
dct:modified "2022-01-01T00:00:00Z"^^xsd:dateTime.`;
    }
    return result;
} 
