import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, AppState } from ".";
import { Chat, Dashboard, DashboardState, NotificationType, SolidNotification } from "../types";
import { setParticipantReferences } from "./solid/Chat";
import { findChatIdByParticipantReference, loadDashboardContent } from "./solid/Dashboard";
import { acceptNotifications } from "./solid/Notification";
import { calculateSpaceUsage as calculateSolidSpaceUsage } from "./solid/Storage";

export const loadDashboard = createAsyncThunk<Dashboard, { profileId: string, onProgress: (progress: number) => void }, { rejectValue: string }>(
    "dashboard/load",
    async ({ profileId, onProgress }, { rejectWithValue }) => {
        try {
            return await loadDashboardContent(profileId, onProgress);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "" + error);
        }
    }
);

export const acceptSolidNotifications = createAsyncThunk<void, SolidNotification[], { rejectValue: string, state: AppState, dispatch: AppDispatch }>(
    'dashboard/notification/accept',
    async (notifications, { rejectWithValue, getState }) => {
        try {
            const state = getState();
            const dashboard = selectDashboard(state.dashboardState);
            if (dashboard && notifications.length > 0) {
                await acceptNotifications(notifications, dashboard.profile.storageId);
            }
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "" + error);
        }
    }
);

export const updateParticipantReferences = createAsyncThunk<void, { chatId: string, references: { participantChatId: string, participantId: string }[] }, { rejectValue: string, state: AppState }>(
    'dashboard/participantReference/update',
    async ({ chatId, references }, { rejectWithValue, getState }) => {
        try {
            const state = getState();
            const chat = makeSelectDashboardChat()(state.dashboardState, chatId);
            if (chat) {
                const referencesChanged = references.filter(reference => {
                    const participant = chat.participants.find(p => p.id === reference.participantId);
                    return participant && participant.chatId !== reference.participantChatId;
                });
                if (referencesChanged.length > 0) {
                    await setParticipantReferences(chatId, references);
                }
            }
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "" + error);
        }
    }
);

export const calculateSpaceUsage = createAsyncThunk<void, { storageId: string, onFileSize: (bytes: number) => void, onEnd: () => void }, { rejectValue: string }>(
    'dashboard/calculateSpaceUsage',
    async ({ storageId, onFileSize, onEnd }, { rejectWithValue }) => {
        try {
            await calculateSolidSpaceUsage(storageId, onFileSize);
            onEnd();
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "" + error);
        }
    }
);

const initialState: DashboardState = { asyncState: { pending: false } };

const slice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {
        addChat: (state, action: PayloadAction<Chat>) => {
            if (state.dashboard) {
                const chatFound = makeSelectDashboardChat()(state, action.payload.id);
                if (!chatFound) {
                    state.dashboard.chats.push(action.payload);
                    // set referenceId for notifications matching the new chat
                    state.dashboard.solidNotifications = state.dashboard.solidNotifications
                        .map(notification => {
                            const chatIdFoundByParticipantReference = findChatIdByParticipantReference(notification.targetId, notification.actorId);
                            if (chatIdFoundByParticipantReference) {
                                return { ...notification, referenceId: chatIdFoundByParticipantReference };
                            }
                            return notification;
                        })
                }
            }
        },
        removeChat: (state, action: PayloadAction<string>) => {
            if (state.dashboard) {
                state.dashboard.chats = state.dashboard.chats.filter(c => c.id !== action.payload);
            }
        },
        setNotifications: (state, action: PayloadAction<SolidNotification[]>) => {
            if (state.dashboard) {
                state.dashboard.solidNotifications = action.payload;
            }
        },
        setChatSearchFilter: (state, action: PayloadAction<string | undefined>) => {
            state.chatSearchFilter = action.payload;
        },
        resetInviter: state => {
            if (state.dashboard) {
                state.dashboard.inviter = undefined;
            }
        }
    },
    extraReducers: builder => {
        builder.addCase(loadDashboard.pending, state => {
            state.asyncState.pending = true;
            state.asyncState.error = undefined;
        }).addCase(loadDashboard.fulfilled, (state, action) => {
            state.asyncState.pending = false;
            state.dashboard = action.payload;
        }).addCase(loadDashboard.rejected, (state, action) => {
            state.asyncState.pending = false;
            state.asyncState.error = action.payload;
        });

        builder.addCase(acceptSolidNotifications.fulfilled, (state, action) => {
            if (state.dashboard) {
                const targetIds = action.meta.arg.map(n => n.targetId);
                state.dashboard.solidNotifications = state.dashboard.solidNotifications.filter(n => !targetIds.includes(n.targetId));
            }
        });

        builder.addCase(updateParticipantReferences.fulfilled, (state, action) => {
            const chat = makeSelectDashboardChat()(state, action.meta.arg.chatId);
            if (chat) {
                action.meta.arg.references.forEach(reference => {
                    const participant = chat.participants.find(p => p.id === reference.participantId);
                    if (participant && participant.chatId !== reference.participantChatId) {
                        participant.chatId = reference.participantChatId;
                    }
                });
            }
        });
    }
});

export default slice.reducer;
export const { addChat, removeChat, setNotifications, setChatSearchFilter, resetInviter } = slice.actions;

/*
 * Selectors
 */
const selectChatId = (_state: DashboardState, chatId?: string) => chatId;
export const selectPending = (state: DashboardState) => state.asyncState.pending;
export const selectError = (state: DashboardState) => state.asyncState.error;

export const selectDashboard = (state: DashboardState) => state.dashboard;
export const selectDashboardInviter = (state: DashboardState) => state.dashboard?.inviter;
export const selectChatSearchFilter = (state: DashboardState) => state.chatSearchFilter;
export const selectDashboardChats = createSelector(
    [selectDashboard, selectChatSearchFilter],
    (dashboard, chatSearchFilter) => dashboard ? dashboard.chats.filter(chat => chatSearchFilter ? chat.title.toLocaleLowerCase().startsWith(chatSearchFilter.toLocaleLowerCase()) : true).sort((c1, c2) => c2.created - c1.created) : []);
export const makeSelectDashboardChat = () => createSelector(
    [selectDashboard, selectChatId],
    (dashboard, chatId) => dashboard ? dashboard.chats.find(chat => chat.id === chatId) : undefined);

const selectNotifications = createSelector([selectDashboard], dashboard => dashboard ? dashboard.solidNotifications : []);
const selectChatNotifications = createSelector([selectNotifications], notifications => notifications.filter(n =>
    n.type === NotificationType.ChatMessageAdd || n.type === NotificationType.ChatMessageReplyAdd || n.type === NotificationType.ChatMessageReplyRemove)
);
const selectChatMessageAddNotifications = createSelector([selectNotifications], notifications => notifications.filter(n =>
    n.type === NotificationType.ChatMessageAdd)
);

export const makeSelectChatNotificationsForReferenceId = () => createSelector(
    [selectChatNotifications, selectChatId],
    (notifications, chatId) => notifications.filter(n => n.referenceId === chatId).sort((n1, n2) => n2.updated - n1.updated));
export const makeSelectChatMessageAddNotificationsForReferenceId = () => createSelector(
    [selectChatMessageAddNotifications, selectChatId],
    (notifications, chatId) => notifications.filter(n => n.referenceId === chatId).sort((n1, n2) => n2.updated - n1.updated));
export const makeSelectChatNotificationsForTargetId = () => createSelector(
    [selectChatNotifications, selectChatId],
    (notifications, chatId) => notifications.filter(n => n.targetId === chatId).sort((n1, n2) => n2.updated - n1.updated));

export const selectChatMessageAddNotificationGroups = createSelector(
    [selectChatMessageAddNotifications],
    notifications => {
        return notifications.reduce((acc, notification) => {
            const found = acc.find(n =>
                n.element.actorId === notification.actorId &&
                (n.element.referenceId && notification.referenceId
                    ? n.element.referenceId === notification.referenceId
                    : n.element.targetId === notification.targetId)
            );
            if (found) {
                found.count = found.count + 1
            } else {
                acc.push({ count: 1, element: notification });
            }
            return acc;
        }, [] as Array<{ count: number, element: SolidNotification }>);
    }
);

export const makeSelectParticipantChatIds = () => createSelector(
    [makeSelectDashboardChat()],
    chat => chat
        ? chat.participants.reduce((acc, participant) => participant.chatId ? [...acc, participant.chatId] : acc, [] as Array<string>)
        : []
);
