import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AppState } from ".";
import { ChatMessageResource, ChatMessageSendState, locationFromDate, Profile } from "../types";
import { makeSelectProfileWrapperById } from "./ProfileSlice";
import { removeHashFromUrl, STORAGE_APP_BASE, STORAGE_RSA_PRIV_KEY } from "./solid/Constants";
import { signMessage } from "./solid/Crypto";
import { loadChatMessageResource, sendMessage } from "./solid/Message";
import { sendAddLongChatMessageNotification } from "./solid/Notification";

export const sendMessageSubmit = createAsyncThunk<ChatMessageResource, { authorId: string, chatId: string, participationIds: string[], content: string }, { state: AppState, rejectValue: string }>(
    'sendMessage/submit',
    async ({ authorId, chatId, content, participationIds }, { getState, rejectWithValue }) => {
        try {
            let signature: string | undefined = undefined;
            const dashboardState = getState().dashboardState;
            if (dashboardState.dashboard?.profile) {
                signature = await signMessage(dashboardState.dashboard.profile.storageId + STORAGE_APP_BASE + STORAGE_RSA_PRIV_KEY, content);
            }

            // create new message and write to chat with matching chatId
            const now = new Date();
            const messageId = await sendMessage(authorId, chatId, content, now, signature);

            // post notification to participant inboxes
            const profileState = getState().profileState;
            await Promise.all(
                participationIds
                    .map(participationId => makeSelectProfileWrapperById()(profileState, participationId))
                    .reduce((acc, profileWrapper) => profileWrapper && profileWrapper.profile ? [...acc, profileWrapper.profile] : acc, [] as Array<Profile>)
                    .map(profile => sendAddLongChatMessageNotification(chatId, messageId, authorId, profile.inboxId, now))
            );

            // return current state of chat message resource
            const location = locationFromDate(now);
            const result = await loadChatMessageResource(chatId, removeHashFromUrl(messageId));
            return { ...result, location };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

const initialState = (): ChatMessageSendState => ({ asyncState: { pending: false } });

const slice = createSlice({
    name: 'sendMessage',
    initialState,
    reducers: {
        resetState() {
            return initialState();
        }
    },
    extraReducers: builder => {
        builder.addCase(sendMessageSubmit.pending, state => {
            state.asyncState.pending = true;
            state.asyncState.error = undefined;
        }).addCase(sendMessageSubmit.fulfilled, (state, action) => {
            state.modified = action.payload;
            state.asyncState.pending = false;
        }).addCase(sendMessageSubmit.rejected, (state, action) => {
            state.asyncState.error = action.payload;
            state.asyncState.pending = false;
        });
    }
});

export default slice.reducer;
export const { resetState } = slice.actions;

/*
 * Selectors
 */

export const selectPending = (state: ChatMessageSendState) => state.asyncState.pending;
export const selectError = (state: ChatMessageSendState) => state.asyncState.error;
export const selectModified = (state: ChatMessageSendState) => state.modified;