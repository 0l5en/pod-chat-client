import { AnyAction, Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";

export enum NotificationType {
    ChatMessageAdd = "ChatMessageAdd",
    ChatMessageReplyAdd = "ChatMessageReplyAdd",
    ChatMessageReplyRemove = "ChatMessageReplyRemove",
    Unknown = "Unknown"
}

export enum FeedbackType {
    SUCCESS = 'SUCCESS',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export type AppMiddleware<S, E extends AnyAction> =
    (api: Dispatch<E> extends Dispatch<AnyAction> ? MiddlewareAPI<Dispatch<E>, S> : never) =>
        (next: Dispatch<E>) =>
            (action: E) => ReturnType<Dispatch<E>>

export type DashboardState = {
    asyncState: AsyncState;
    dashboard?: Dashboard;
    chatSearchFilter?: string;
}

export type Dashboard = {
    profile: Profile;
    chats: Chat[];
    solidNotifications: SolidNotification[];
    inviter?: Profile;
}

export type ProfilesState = {
    profiles: Array<{
        id: string;
        asyncState: AsyncState;
        profile?: Profile;
    }>
}

export type Profile = {
    id: string;
    name: string;
    inboxId: string;
    storageId: string;
    privateTypeIndexId: string;
    publicTypeIndexId: string;
    applicationReadAccessPermitted: boolean;
    applicationControlAccessPermitted: boolean;
    image?: string;
}

export type Inbox = {
    id: string;
    notifications: Notification[];
}

export type Participant = {
    id: string;
    chatId?: string;
}

export type Chat = {
    id: string;
    title: string;
    participants: Participant[];
    created: number;
}

export type ChatSettings = {
    chatId: string;
    participantsHavingReadAccess?: string[];
    participantsHavingReadAccessPending: boolean;
    chats: Array<{
        id: string;
        asyncState: AsyncState;
        chat?: Chat;
    }>;
}

export type ChatSettingsSate = {
    settings: ChatSettings[];
}

export type SolidNotification = {
    id: string;
    targetId: string;
    objectId: string;
    actorId: string;
    type: NotificationType;
    referenceId?: string;
    updated: number;
}

export type ChatMessage = {
    id: string;
    created: number;
    content: string;
    maker: string;
    verificationStatus: 'NOT_VERIFIED' | 'VERIFYING' | 'TRUSTED' | 'INVALID_SIGNATURE' | 'NO_SIGNATURE' | 'ERROR';
}

export type ChatMessageLocation = {
    year: number;
    month: number;
    day: number;
}

export type ChatMessageReply = {
    id: string;
    name: string;
    agent: string;
    messageId: string;
}

export type ChatMessageReplyGroup = {
    name: string;
    agents: string[];
}

export const addDay = (selector: ChatMessageLocation, days: number): ChatMessageLocation => {
    const dateValue = new Date();
    dateValue.setUTCFullYear(selector.year, selector.month - 1, selector.day);
    dateValue.setUTCDate(selector.day + days);
    return locationFromDate(dateValue);
};

export const locationFromDate = (dateValue: Date): ChatMessageLocation => {
    return { year: dateValue.getUTCFullYear(), month: dateValue.getUTCMonth() + 1, day: dateValue.getUTCDate() };
}

export const locationComparator = (l1: ChatMessageLocation, l2: ChatMessageLocation): number => {
    if (l1.year === l2.year) {
        if (l1.month === l2.month) {
            if (l1.day === l2.day) {
                return 0;
            } else if (l1.day < l2.day) {
                return -1;
            }
            return 1;
        } else if (l1.month < l2.month) {
            return -1;
        }
        return 1;
    } else if (l1.year < l2.year) {
        return -1;
    }
    return 1;
}

export const isEndLocation = (location: ChatMessageLocation) => {
    return location.year === 0 && location.month === 0 && location.day === 0;
}

export type ChatMessageResource = {
    location: ChatMessageLocation;
    messages: ChatMessage[];
    replies: ChatMessageReply[];
}

export type ChatMessageSearchResult = {
    chatId: string;
    resources: ChatMessageResource[]
}

export type ChatMessageResult = {
    chatId: string;
    searchResults: Array<ChatMessageSearchResult>;
    location: ChatMessageLocation;
    asyncState: AsyncState;
}

export type ChatMessageState = {
    results: Array<ChatMessageResult>;
    sendMessageAsyncState: AsyncState;
}

export type ChatCreateState = {
    profiles: Profile[];
    chatCreated?: Chat & { isNew: boolean };
    asyncState: AsyncState;
}

/**
 * Used to create a new Chat in the pod of the authenticated user
 * using an existent Chat to build the new Chat from  
 */
export type ChatInvitationState = {
    invitation?: {
        authProfileId: string;
        participantId: string;
        participantChatId: string;
        asyncState: AsyncState;
        chatOfInvitation?: Chat & { isNew: boolean, isJoined: boolean };
    }
}

/**
 * Used to create a new Chat in the pod of the authenticated user.
 * In Contrast to ChatInvitationState this state will be used to build
 * the new Chat with the inviter obtained from a sharing link as 
 * its only participant. A sharing link does not contain a link to a chat resource 
 * so their is no Chat to build the new Chat from.
 */
export type ChatInviterState = {
    asyncState: AsyncState;
    chatOfInviter?: Chat & { isNew: boolean };
    declined: boolean;
}

export type ChatDeleteState = {
    asyncState: AsyncState;
    chatDeleted?: string;
}

export type ChatMessageSendState = {
    asyncState: AsyncState;
    modified?: ChatMessageResource;
}

export type ChatMessageReplySendState = {
    replies: Array<{
        messageId: string;
        asyncState: AsyncState;
        modified?: ChatMessageResource;
    }>
}

export type ChatMessageAnswerState = {
    answer?: ChatMessage;
}

export type AsyncState = {
    pending: boolean,
    error?: string,
}

export type ConnectActionPayload = {
    profile: Profile;
}

export interface RegistrationResult {
    statusCode: number;
    message: string;
}

export type RegistrationPayload = {
    username: string;
    email: string;
    password: string;
    podProviderUrl: string;
};

export interface LoadInviterResponse {
    inviter: string
}