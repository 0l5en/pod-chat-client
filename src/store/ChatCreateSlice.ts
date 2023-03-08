import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from ".";
import { Chat, ChatCreateState, Dashboard, Profile } from "../types";
import { findChatByParticipantWebids } from "./AppStateUtils";
import { createChat } from "./solid/Chat";

const initialState: ChatCreateState = { profiles: [], asyncState: { pending: false } };

const slice = createSlice({
    name: 'chatCreate',
    initialState,
    reducers: {
        addProfile: (state, action: PayloadAction<Profile>) => {
            if (!state.profiles.find(p => p.id === action.payload.id)) {
                state.profiles.push(action.payload);
            }
        },
        removeProfile: (state, action: PayloadAction<string>) => {
            if (state.profiles.find(p => p.id === action.payload)) {
                state.profiles = state.profiles.filter(profile => profile.id !== action.payload);
            }
        },
        resetState: () => {
            return { profiles: [], asyncState: { pending: false } };
        }
    },
    extraReducers: builder => {
        builder.addCase(chatCreateSubmit.pending, state => {
            state.asyncState.pending = true;
            state.asyncState.error = undefined;
        }).addCase(chatCreateSubmit.rejected, (state, action) => {
            state.asyncState.error = action.payload;
            state.asyncState.pending = false;
        }).addCase(chatCreateSubmit.fulfilled, (state, action) => {
            state.chatCreated = action.payload;
            state.asyncState.pending = false;
        })
    }
});

export default slice.reducer;
export const { addProfile, removeProfile, resetState } = slice.actions;

/*
 * Async Thunks
 */
export const chatCreateSubmit = createAsyncThunk<Chat & { isNew: boolean }, { dashboard: Dashboard }, { rejectValue: string, state: AppState }>(
    'chatCreate/submit',
    async ({ dashboard }, { rejectWithValue, getState }) => {
        try {
            const state = getState().chatCreateState;
            const participantIds = state.profiles.map(p => p.id);
            const chatFound = findChatByParticipantWebids(participantIds, dashboard.chats);
            if (chatFound) {
                return { ...chatFound, isNew: false };
            }

            const newChat = await createChat(dashboard.profile.id, participantIds, new Date(), dashboard.profile.storageId, dashboard.profile.privateTypeIndexId);
            const chatTitle = state.profiles.reduce((acc, profile, index) => index === 0 ? acc + profile.name : acc + ', ' + profile.name, '')
            return { ...newChat, title: chatTitle, isNew: true };

        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

/*
 * Selectors
 */

export const selectProfileIds = (state: ChatCreateState) => state.profiles.map(p => p.id);
export const selectChatCreated = (state: ChatCreateState) => state.chatCreated;
export const selectPending = (state: ChatCreateState) => state.asyncState.pending;
export const selectError = (state: ChatCreateState) => state.asyncState.error;

