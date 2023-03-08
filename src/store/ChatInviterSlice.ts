import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AppState } from ".";
import { Chat, ChatInviterState } from "../types";
import { findChatByParticipantWebids } from "./AppStateUtils";
import { deleteInviter } from "./solid/ApplicationApi";
import { joinChat } from "./solid/Chat";

export const createChatForInviter = createAsyncThunk<Chat & { isNew: boolean }, { inviterId: string }, { state: AppState, rejectValue: string }>(
    'chatInviter/createChat',
    async ({ inviterId }, { rejectWithValue, getState }) => {
        try {
            const { dashboardState } = getState();
            if (!dashboardState.dashboard) {
                return rejectWithValue('dashboard is undefined');
            }

            const chatFound = findChatByParticipantWebids([inviterId], dashboardState.dashboard.chats);
            if (chatFound) {
                await deleteInviter();
                return { ...chatFound, isNew: false };
            }

            const newChat = await joinChat(dashboardState.dashboard.profile.id, [{ id: inviterId }], new Date(), dashboardState.dashboard.profile.storageId, dashboardState.dashboard.profile.privateTypeIndexId);
            await deleteInviter();
            return { ...newChat, isNew: true };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

export const declineChatForInviter = createAsyncThunk<void, void, { rejectValue: string }>(
    'chatInviter/declineChat',
    async (_, { rejectWithValue }) => {
        try {
            await deleteInviter();

        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

const initialState = (): ChatInviterState => ({ asyncState: { pending: false }, declined: false });

const slice = createSlice({
    name: 'chatInviter',
    initialState,
    reducers: {
        resetState: () => {
            return initialState();
        }
    },
    extraReducers(builder) {
        builder.addCase(createChatForInviter.pending, state => {
            state.asyncState.pending = true;
        }).addCase(createChatForInviter.fulfilled, (state, action) => {
            state.chatOfInviter = action.payload;
            state.asyncState.pending = false;
        }).addCase(createChatForInviter.rejected, (state, action) => {
            state.asyncState.error = action.payload;
            state.asyncState.pending = false;
        });

        builder.addCase(declineChatForInviter.pending, state => {
            state.asyncState.pending = true;
        }).addCase(declineChatForInviter.fulfilled, state => {
            state.declined = true;
            state.asyncState.pending = false;
        }).addCase(declineChatForInviter.rejected, (state, action) => {
            state.asyncState.error = action.payload;
            state.asyncState.pending = false;
        });
    },
});

export default slice.reducer;

export const { resetState } = slice.actions;

export const selectChatOfInviter = (state: ChatInviterState) => state.chatOfInviter;
export const selectChatOfInviterDeclined = (state: ChatInviterState) => state.declined;
export const selectPending = (state: ChatInviterState) => state.asyncState.pending;
export const selectError = (state: ChatInviterState) => state.asyncState.error; 