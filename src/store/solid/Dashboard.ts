import { AS, DCTERMS, LDP, POSIX, RDF } from "@inrupt/vocab-common-rdf";
import { Chat, Dashboard, NotificationType, Profile, SolidNotification } from "../../types";
import { deleteInviter, loadInviter } from "./ApplicationApi";
import { loadChat } from "./Chat";
import { DC_ELEMENTS, FLOW, PIM_MEETING, PODCHAT, removeHashFromUrl, SOLID_TERMS, STORAGE_APP_BASE, STORAGE_NOTIFICATIONS_PROCESSED, STORAGE_RSA_PRIV_KEY } from "./Constants";
import { prepareRsaKeyPair } from "./Crypto";
import { acceptNotifications } from "./Notification";
import { loadProfile, loadProfileWrapper } from "./Profile";
import rdfStore, { dateAsNumberFromQuadObject, extractObject, extractObjectLastValue } from './RdfStore';

export const loadDashboardContent = async (profileId: string, onProgress: (progress: number) => void): Promise<Dashboard> => {

    // load profile
    const profile: Profile = await loadProfile(profileId);
    onProgress(10);

    // create resource for notifications processed if not exist already
    await rdfStore.fetcher.createIfNotExists(rdfStore.cache.sym(profile.storageId + STORAGE_APP_BASE + STORAGE_NOTIFICATIONS_PROCESSED));

    // prepare RSA-Keypair to sign and verify messages
    const rsaPrivateKeyResourceUrl = profile.storageId + STORAGE_APP_BASE + STORAGE_RSA_PRIV_KEY;
    await rdfStore.fetcher.createIfNotExists(rdfStore.cache.sym(rsaPrivateKeyResourceUrl));
    await prepareRsaKeyPair(profile.id, rsaPrivateKeyResourceUrl);
    onProgress(30);

    const chats = await chatsFromTypeIndex(profileId, profile.privateTypeIndexId);
    onProgress(50);

    const chatNotifications = await notificationsFromProfileInbox({ profile, onProgress });
    const dashboard: Dashboard = { profile, chats, solidNotifications: chatNotifications, spaceUsage: { asyncState: { pending: false } } };

    // check if called via invitation link
    const inviter = await loadInviter();
    if (inviter !== '') {
        if (inviter === profileId || chats.filter(chat => chat.participants.length === 1 && chat.participants[0].id === inviter).pop()) {
            // delete invitor from backend
            await deleteInviter();
        } else {
            // update dashboard with valid profile of inviter
            const inviterProfileWrapper = await loadProfileWrapper(inviter);
            if (inviterProfileWrapper.result) {
                dashboard.inviter = inviterProfileWrapper.result;
            }
        }
    }

    return dashboard;
}

export const calculateSpaceUsage = async (containerId: string): Promise<number> => {
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
                    return [...acc, { subject: containedId.value, size: Number(size.value) }]
                }

                return acc;
            }, [] as Array<{ subject: string, size?: number }>);

        // descent into child container's
        const childResults = await Promise.all(children.reduce((acc, child) => child.size ? acc : [...acc, calculateSpaceUsage(child.subject)], [] as Array<Promise<number>>));


        // summarise results
        return childResults.reduce((acc, childResult) => acc + childResult, children.reduce((acc, child) => child.size ? acc + child.size : acc, 0));
    } catch (error) {
        return 0;
    }
}

export const notificationsFromProfileInbox = async ({ profile, onProgress, force = false }: { profile: Profile, onProgress?: (progress: number) => void, force?: boolean }): Promise<SolidNotification[]> => {

    const resourceUrlNotificationsProcessed = profile.storageId + STORAGE_APP_BASE + STORAGE_NOTIFICATIONS_PROCESSED;

    // fetch inbox and processed notifications in parallel
    await Promise.all([rdfStore.fetcher.load([profile.inboxId], { force }), rdfStore.fetcher.load(resourceUrlNotificationsProcessed)]);
    if (onProgress) {
        onProgress(80);
    }

    // select unprocessed notification ids
    const notificationsUnprocessed = rdfStore.cache.each(
        rdfStore.cache.sym(profile.inboxId),
        rdfStore.cache.sym(LDP.contains),
        undefined,
        rdfStore.cache.sym(profile.inboxId)
    ).filter(containedId => rdfStore.cache.holds(
        rdfStore.cache.sym(containedId.value),
        rdfStore.cache.sym(RDF.type),
        rdfStore.cache.sym('http://www.w3.org/ns/iana/media-types/text/turtle#Resource'),
        rdfStore.cache.sym(profile.inboxId))
        && !rdfStore.cache.any(
            rdfStore.cache.sym(containedId.value),
            rdfStore.cache.sym(DCTERMS.modified),
            undefined,
            rdfStore.cache.sym(resourceUrlNotificationsProcessed)
        )
    );

    const results = await Promise.all(notificationsUnprocessed.map(notificationId => loadNotification(profile, notificationId.value)));

    if (onProgress) {
        onProgress(100);
    }

    return results.reduce((acc, value) => value.result ? [...acc, value.result] : acc, [] as Array<SolidNotification>);
}

export const participantIdsFromChat = (authProfileId: string, participantChatId: string) => {
    const graph = rdfStore.cache.sym(removeHashFromUrl(participantChatId));
    return rdfStore.cache.each(
        rdfStore.cache.sym(participantChatId),
        rdfStore.cache.sym(FLOW.participation),
        undefined,
        graph
    ).flatMap(participationId =>
        rdfStore.cache.each(
            rdfStore.cache.sym(participationId.value),
            rdfStore.cache.sym(FLOW.participant),
            undefined,
            graph
        )
    ).map(
        participantId => participantId.value
    ).filter(
        participantProfileId => participantProfileId !== authProfileId
    );
};

export const findChatIdByParticipantReference = (notificationTarget: string, notificationActor: string): string | undefined => {
    return rdfStore.cache.each(
        undefined,
        rdfStore.cache.sym(DCTERMS.references),
        rdfStore.cache.sym(notificationTarget)
    ).filter(participationId => rdfStore.cache.holds(
        rdfStore.cache.sym(participationId.value),
        rdfStore.cache.sym(FLOW.participant),
        rdfStore.cache.sym(notificationActor),
        rdfStore.cache.sym(removeHashFromUrl(participationId.value)),
    )).map(participationId => rdfStore.cache.any(
        undefined,
        rdfStore.cache.sym(FLOW.participation),
        rdfStore.cache.sym(participationId.value),
        rdfStore.cache.sym(removeHashFromUrl(participationId.value))
    )).reduce((acc, chatId) =>
        chatId ? [...acc, chatId.value] : acc, [] as Array<string>
    ).pop();
};

const chatsFromTypeIndex = async (profileId: string, typeIndex: string): Promise<Chat[]> => {

    await rdfStore.fetcher.load(typeIndex);

    const results = await Promise.all(
        rdfStore.cache.each(
            undefined,
            rdfStore.cache.sym(SOLID_TERMS.forClass),
            rdfStore.cache.sym(PIM_MEETING.LongChat),
            rdfStore.cache.sym(typeIndex)
        ).flatMap(id =>
            rdfStore.cache.each(
                rdfStore.cache.sym(id.value),
                rdfStore.cache.sym(SOLID_TERMS.instance),
                undefined,
                rdfStore.cache.sym(typeIndex)
            ).map(node =>
                loadChatWrapper(node.value, profileId)
            )
        )
    );
    return results.reduce((acc, value) => value.result ? [...acc, value.result] : acc, [] as Array<Chat>);
}

const loadChatWrapper = async (chatId: string, ownerId: string): Promise<{ result?: Chat, error?: string }> => {
    try {
        const chat = await loadChat(ownerId, chatId);
        // TODO only fetch a maximum of participants 3 or 5 etc.
        const profiles = (await Promise.all(chat.participants.map(participant => loadProfileWrapper(participant.id))))
            .reduce((acc, profileWrapper) => profileWrapper.result ? [...acc, profileWrapper.result] : acc, [] as Profile[]);

        if (profiles.length === 0) {
            return { error: 'no valid participant found for chat: ' + chatId };
        }

        const chatTitle = profiles.reduce((acc, profile, index) => index === 0 ? acc + profile.name : acc + ', ' + profile.name, '');

        return {
            result: {
                ...chat,
                title: chatTitle,
                participants: chat.participants.filter(p => profiles.find(profile => profile.id === p.id) !== undefined)
            }
        };
    } catch (error) {
        return { error: error instanceof Error ? error.message : error + '' }
    }
}

const loadNotification = async (profile: Profile, notificationId: string): Promise<{ error?: string; result?: SolidNotification }> => {
    try {
        await rdfStore.fetcher.load(notificationId);

        const notification = getChatMessageNotification(notificationId, AS.Add, PODCHAT.LongChatMessage)
            || getChatMessageNotification(notificationId, AS.Add, PODCHAT.LongChatMessageReply)
            || getChatMessageNotification(notificationId, AS.Remove, PODCHAT.LongChatMessageReply);

        if (notification) {

            // always resolve notification target
            const chatIdFoundByParticipants = await findChatIdByParticipants(profile, notification.targetId);
            if (chatIdFoundByParticipants.error) {
                // unprocessable notification target - accept notification for deletion
                await acceptNotifications([notification], profile.storageId);
                return { error: chatIdFoundByParticipants.error };
            }

            const chatIdFoundByParticipantReference = findChatIdByParticipantReference(notification.targetId, notification.actorId);
            if (chatIdFoundByParticipantReference) {
                // found chatId for participant reference
                return { result: { ...notification, referenceId: chatIdFoundByParticipantReference } };
            }

            if (chatIdFoundByParticipants.result) {
                // found chatId for equal participants
                return { result: { ...notification, referenceId: chatIdFoundByParticipants.result } };
            }

            // cannot find any chatId, a new chat invitation was sent
            return { result: notification };
        }
        return { error: 'skipping unknown notification: ' + notificationId + ' ...no matching type or context found.' };

    } catch (error) {
        return { error: error instanceof Error ? error.message : error + '' }
    }
}

const findChatIdByParticipants = async (profile: Profile, notificationTarget: string, force?: boolean): Promise<{ result?: string, error?: string }> => {
    const resourceUrl = removeHashFromUrl(notificationTarget);
    const graph = rdfStore.cache.sym(resourceUrl);
    try {
        await rdfStore.fetcher.load(resourceUrl, { force });
        const notificationChatParticipants = rdfStore.cache.each(
            rdfStore.cache.sym(notificationTarget),
            rdfStore.cache.sym(FLOW.participation),
            undefined,
            graph
        ).flatMap(participationId =>
            rdfStore.cache.each(
                rdfStore.cache.sym(participationId.value),
                rdfStore.cache.sym(FLOW.participant),
                undefined,
                graph
            )
        ).map(participantId => participantId.value);

        return {
            result: rdfStore.cache.each(
                undefined,
                rdfStore.cache.sym(DC_ELEMENTS.author),
                rdfStore.cache.sym(profile.id)
            ).filter(chatId =>
                rdfStore.cache.holds(
                    rdfStore.cache.sym(chatId.value),
                    rdfStore.cache.sym(RDF.type),
                    rdfStore.cache.sym(PIM_MEETING.LongChat),
                    rdfStore.cache.sym(removeHashFromUrl(chatId.value))
                )
            ).filter(chatId => {
                const chatParticipants = rdfStore.cache.each(
                    rdfStore.cache.sym(chatId.value),
                    rdfStore.cache.sym(FLOW.participation),
                    undefined,
                    rdfStore.cache.sym(removeHashFromUrl(chatId.value))
                ).flatMap(participationId =>
                    rdfStore.cache.each(
                        rdfStore.cache.sym(participationId.value),
                        rdfStore.cache.sym(FLOW.participant),
                        undefined,
                        rdfStore.cache.sym(removeHashFromUrl(chatId.value))
                    )
                );
                return chatParticipants.length === notificationChatParticipants.length &&
                    chatParticipants.filter(p => notificationChatParticipants.includes(p.value)).length === chatParticipants.length
            }).map(chatId =>
                chatId.value
            ).pop()
        };
    } catch (error) {
        return { error: 'cannot load notification target:' + (error instanceof Error ? error.message : '') };
    }


}

function getChatMessageNotification(notificationId: string, rdfType: string, context: string) {

    const notificationType = (): NotificationType => {
        if (rdfType === AS.Add) {
            if (context === PODCHAT.LongChatMessage) {
                return NotificationType.ChatMessageAdd;
            }
            if (context === PODCHAT.LongChatMessageReply) {
                return NotificationType.ChatMessageReplyAdd;
            }
        }

        if (rdfType === AS.Remove) {
            if (context === PODCHAT.LongChatMessageReply) {
                return NotificationType.ChatMessageReplyRemove;
            }
        }

        return NotificationType.Unknown;
    };

    return rdfStore.cache.each(
        undefined,
        rdfStore.cache.sym(RDF.type),
        rdfStore.cache.sym(rdfType),
        rdfStore.cache.sym(notificationId)
    ).filter(s => rdfStore.cache.holds(
        rdfStore.cache.sym(s.value),
        rdfStore.cache.sym(AS.context),
        rdfStore.cache.sym(context),
        rdfStore.cache.sym(notificationId)
    )
    ).reduce((acc, s) => {
        const objectId = extractObjectLastValue(rdfStore, s.value, notificationId, rdfStore.cache.sym(AS.object));
        const targetId = extractObjectLastValue(rdfStore, s.value, notificationId, rdfStore.cache.sym(AS.target));
        const actorId = extractObjectLastValue(rdfStore, s.value, notificationId, rdfStore.cache.sym(AS.actor));
        const updated = extractObject(rdfStore, s.value, notificationId, rdfStore.cache.sym(AS.updated))
            .map(n => dateAsNumberFromQuadObject(n) || 0)
            .pop() || 0;
        if (objectId && targetId && actorId && updated > 0) {
            return [...acc, { id: notificationId, objectId, targetId, actorId, type: notificationType(), updated }];
        }
        return acc;
    }, [] as Array<SolidNotification>
    ).pop();
}

/**
 * Format bytes as human-readable text.
 * 
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 * 
 * @return Formatted string.
 */
export function humanFileSize(bytes: number, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}
