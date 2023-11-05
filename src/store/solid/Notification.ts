import { AS, DCTERMS, RDF } from "@inrupt/vocab-common-rdf";
import { graph, quad, serialize, Statement } from "rdflib";
import { v4 } from "uuid";
import { SolidNotification } from "../../types";
import { PODCHAT, STORAGE_APP_BASE, STORAGE_NOTIFICATIONS_CLEANUP_BATCH_SIZE, STORAGE_NOTIFICATIONS_PROCESSED } from "./Constants";
import rdfStore, { compareDateLiteralNodes, literalFromDate } from "./RdfStore";

export const sendAddLongChatMessageNotification = async (chatId: string, messageId: string, actorId: string, participationInbox: string, now: Date) => {
    await sendNotification(AS.Add, PODCHAT.LongChatMessage, chatId, messageId, actorId, participationInbox, now);
}

export const sendAddLongChatMessageReplyNotification = async (chatId: string, replyId: string, actorId: string, participationInbox: string, now: Date) => {
    await sendNotification(AS.Add, PODCHAT.LongChatMessageReply, chatId, replyId, actorId, participationInbox, now);
}

export const sendRemoveLongChatMessageReplyNotification = async (chatId: string, replyId: string, actorId: string, participationInbox: string, now: Date) => {
    await sendNotification(AS.Remove, PODCHAT.LongChatMessageReply, chatId, replyId, actorId, participationInbox, now);
}

const sendNotification = async (rdfType: string, context: string, targetId: string, objectId: string, actorId: string, participationInbox: string, now: Date): Promise<void> => {

    const notificationIns: Array<any> = [];
    const notificationSubj = rdfStore.cache.sym(participationInbox + v4() + ".ttl");

    notificationIns.push(quad(notificationSubj, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(rdfType), notificationSubj));
    notificationIns.push(quad(notificationSubj, rdfStore.cache.sym(AS.context), rdfStore.cache.sym(context), notificationSubj));
    notificationIns.push(quad(notificationSubj, rdfStore.cache.sym(AS.actor), rdfStore.cache.sym(actorId), notificationSubj));
    notificationIns.push(quad(notificationSubj, rdfStore.cache.sym(AS.object), rdfStore.cache.sym(objectId), notificationSubj));
    notificationIns.push(quad(notificationSubj, rdfStore.cache.sym(AS.target), rdfStore.cache.sym(targetId), notificationSubj));
    notificationIns.push(quad(notificationSubj, rdfStore.cache.sym(AS.updated), literalFromDate(now), notificationSubj));

    const tmpStore = graph();
    tmpStore.add(notificationIns);

    const doc = notificationSubj.doc();
    const docValue = doc.value;
    const rdfCnt = serialize(doc, tmpStore, docValue);
    if (rdfCnt) {
        const result = await rdfStore.fetcher.webOperation("POST", participationInbox, {
            data: rdfCnt,
            contentType: "text/turtle"
        });
        if (!result.ok) {
            throw new Error("cannot post data to:" + docValue);
        }
    } else {
        throw new Error("cannot serialize notification");
    }
}

export const acceptNotifications = async (notifications: SolidNotification[], profileStorageId: string): Promise<void> => {
    const notificationsProcessedResourceUrl = profileStorageId + STORAGE_APP_BASE + STORAGE_NOTIFICATIONS_PROCESSED;
    try {
        await rdfStore.fetcher.load(notificationsProcessedResourceUrl, { force: true });
        const del: any[] = [];
        const ins: any[] = [];
        const now = new Date();
        const graph = rdfStore.cache.sym(notificationsProcessedResourceUrl);
        notifications.forEach(notification => {
            del.push(...rdfStore.cache.each(rdfStore.cache.sym(notification.id), rdfStore.cache.sym(DCTERMS.modified), undefined, graph)
                .map(node =>
                    quad(rdfStore.cache.sym(notification.id), rdfStore.cache.sym(DCTERMS.modified), node, graph)));
            ins.push(quad(rdfStore.cache.sym(notification.id), rdfStore.cache.sym(DCTERMS.modified), literalFromDate(now), graph));
        });
        await rdfStore.updateManager.update(del, ins);
    } catch (error) {
        // silently ignore
        console.warn('cannot patch resource at ' + notificationsProcessedResourceUrl + ': ', error instanceof Error ? error.message : error + '');
    }
}

export const cleanupNotifications = async (profileStorageId: string): Promise<void> => {
    try {
        const notificationsProcessedResourceUrl = profileStorageId + STORAGE_APP_BASE + STORAGE_NOTIFICATIONS_PROCESSED;
        await rdfStore.fetcher.load(notificationsProcessedResourceUrl, { force: true });

        // select all distinct processed notification statements ordered by modified descending
        const notificationsToCleanup = rdfStore.cache.statementsMatching(undefined, rdfStore.cache.sym(DCTERMS.modified), undefined, rdfStore.cache.sym(notificationsProcessedResourceUrl))
            .sort((s1, s2) => compareDateLiteralNodes(s1.object, s2.object))
            .reduce((acc, s) => acc.findIndex(sf => sf.subject.value === s.subject.value) === -1 ? [...acc, s] : acc, [] as Statement[]);

        // cleanup only the first batch of items
        if (notificationsToCleanup.length > 0) {
            const notificationsToCleanupBatch = notificationsToCleanup.slice(0, Math.min(notificationsToCleanup.length, STORAGE_NOTIFICATIONS_CLEANUP_BATCH_SIZE));
            const del: Statement[] = [];
            for (var i = 0; i < notificationsToCleanupBatch.length; i++) {
                const notificationToCleanup = notificationsToCleanupBatch[i];
                try {
                    // delete resource, cleanup cache and update deletions for processed notifications
                    await rdfStore.fetcher.webOperation('DELETE', notificationToCleanup.subject.value);
                    del.push(notificationToCleanup);
                } catch (error) {
                    // update deletions for processed notifications
                    console.error('cannot delete notification at ' + notificationToCleanup.subject.value, error);
                    del.push(notificationToCleanup);
                }
            }

            // write deletions for processed notifications
            await rdfStore.updateManager.update(del, []);
        }

    } catch (error) {
        console.error('cannot cleanup notifications', error);
    }
}