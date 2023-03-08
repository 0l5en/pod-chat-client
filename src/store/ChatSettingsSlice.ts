import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { Chat, ChatSettingsSate } from "../types";
import { loadChat, loadParticipantsHavingReadAccess, toggleParticipantHasReadAccess } from "./solid/Chat";

const initialState: ChatSettingsSate = { settings: [] };

const slice = createSlice({
    name: 'chatSettings',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(chatOfParticipantLoad.pending, (state, action) => {

            const settings = makeSelectChatSettingsForChatId()(state, { chatId: action.meta.arg.chatId });
            if (!settings) {
                state.settings.push({ chatId: action.meta.arg.chatId, chats: [], participantsHavingReadAccessPending: false });
            }

            const chatWrapper = makeSelectChatWrapperById()(state, action.meta.arg);
            if (chatWrapper) {
                chatWrapper.asyncState.pending = true;
                chatWrapper.asyncState.error = undefined;
            } else {
                const settingsForChatWrapper = makeSelectChatSettingsForChatId()(state, action.meta.arg);
                if (settingsForChatWrapper) {
                    settingsForChatWrapper.chats = [...settingsForChatWrapper.chats, { id: action.meta.arg.chatOfParticipantId, asyncState: { pending: true } }];
                }
            }
        }).addCase(chatOfParticipantLoad.rejected, (state, action) => {
            const chatWrapper = makeSelectChatWrapperById()(state, action.meta.arg);
            if (chatWrapper) {
                chatWrapper.asyncState.error = action.payload;
                chatWrapper.asyncState.pending = false;
            }
        }).addCase(chatOfParticipantLoad.fulfilled, (state, action) => {
            const chatWrapper = makeSelectChatWrapperById()(state, action.meta.arg);
            if (chatWrapper) {
                chatWrapper.chat = action.payload;
                chatWrapper.asyncState.pending = false;
            }
        });

        builder.addCase(participantsHavingReadAccessLoad.pending, (state, action) => {
            const settings = makeSelectChatSettingsForChatId()(state, { chatId: action.meta.arg });
            if (settings) {
                settings.participantsHavingReadAccessPending = true;
            } else {
                state.settings.push({ chatId: action.meta.arg, chats: [], participantsHavingReadAccessPending: true });
            }
        }).addCase(participantsHavingReadAccessLoad.fulfilled, (state, action) => {
            const settings = makeSelectChatSettingsForChatId()(state, { chatId: action.meta.arg });
            if (settings) {
                settings.participantsHavingReadAccess = action.payload;
                settings.participantsHavingReadAccessPending = false;
            }
        }).addCase(participantsHavingReadAccessLoad.rejected, (state, action) => {
            const settings = makeSelectChatSettingsForChatId()(state, { chatId: action.meta.arg });
            if (settings) {
                settings.participantsHavingReadAccessPending = false;
            }
        });

        builder.addCase(toggleParticipantHasReadAccessLoad.pending, (state, action) => {
            const settings = makeSelectChatSettingsForChatId()(state, action.meta.arg);
            if (settings) {
                settings.participantsHavingReadAccessPending = true
                if (settings.participantsHavingReadAccess) {
                    if (settings.participantsHavingReadAccess.includes(action.meta.arg.participantId)) {
                        settings.participantsHavingReadAccess = settings.participantsHavingReadAccess.filter(p => p !== action.meta.arg.participantId);
                    } else {
                        settings.participantsHavingReadAccess.push(action.meta.arg.participantId);
                    }
                }
            }

        }).addCase(toggleParticipantHasReadAccessLoad.rejected, (state, action) => {
            const settings = makeSelectChatSettingsForChatId()(state, action.meta.arg);
            if (settings) {
                if (settings.participantsHavingReadAccess) {
                    if (settings.participantsHavingReadAccess.includes(action.meta.arg.participantId)) {
                        settings.participantsHavingReadAccess = settings.participantsHavingReadAccess.filter(p => p !== action.meta.arg.participantId);
                    } else {
                        settings.participantsHavingReadAccess.push(action.meta.arg.participantId);
                    }
                }
                settings.participantsHavingReadAccessPending = false;
            }
        }).addCase(toggleParticipantHasReadAccessLoad.fulfilled, (state, action) => {
            const settings = makeSelectChatSettingsForChatId()(state, action.meta.arg);
            if (settings) {
                settings.participantsHavingReadAccessPending = false;
            }
        });
    }
});

export default slice.reducer;

/*
 * Async Thunks
 */

export const chatOfParticipantLoad = createAsyncThunk<Chat, { chatId: string, chatOfParticipantId: string, participantId: string }, { rejectValue: string }>(
    'chatSettings/chatOfParticipant/load',
    async ({ chatOfParticipantId, participantId }, { rejectWithValue }) => {
        try {
            return await loadChat(participantId, chatOfParticipantId);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

export const participantsHavingReadAccessLoad = createAsyncThunk<string[], string, { rejectValue: string }>(
    'chatSettings/participantsHavingReadAccess/load',
    async (chatId, { rejectWithValue }) => {
        try {
            return await loadParticipantsHavingReadAccess(chatId);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

export const toggleParticipantHasReadAccessLoad = createAsyncThunk<boolean, { chatId: string, participantId: string }, { rejectValue: string }>(
    'chatSettings/toggleParticipantHasReadAccess/load',
    async ({ chatId, participantId }, { rejectWithValue }) => {
        try {
            return await toggleParticipantHasReadAccess(chatId, participantId);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

/*
 * Selectors
 */

const selectChatId = (_state: ChatSettingsSate, selector: { chatId: string, chatOfParticipantId?: string }) => selector;
const selectChatSettings = (state: ChatSettingsSate) => state.settings;

const makeSelectChatSettingsForChatId = () => createSelector(
    [selectChatSettings, selectChatId],
    (settings, { chatId }) => {
        return settings.find(s => s.chatId === chatId);
    }
);

export const makeSelectParticipantsHavingReadAccess = () => createSelector(
    [makeSelectChatSettingsForChatId()],
    (settingsForChatId) => settingsForChatId ? settingsForChatId.participantsHavingReadAccess : undefined
);

export const makeSelectParticipantsHavingReadAccessPending = () => createSelector(
    [makeSelectChatSettingsForChatId()],
    settingsForChatId => settingsForChatId ? settingsForChatId.participantsHavingReadAccessPending : false
);

export const makeSelectChatWrapperById = () => createSelector(
    [makeSelectChatSettingsForChatId(), (_state, args: { chatId: string, chatOfParticipantId?: string }) => args],
    (settingsForChatId, { chatOfParticipantId }) => settingsForChatId ? settingsForChatId.chats.find(c => c.id === chatOfParticipantId) : undefined
);