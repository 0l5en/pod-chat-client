import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ChatDeleteState } from "../types";
import { deleteRecursive, removeFromTypeIndex } from "./solid/Chat";
import { currentContainerFromDoc, removeHashFromUrl } from "./solid/Constants";

const initialState: ChatDeleteState = { asyncState: { pending: false } };

const slice = createSlice({
    name: 'chatDelete',
    initialState,
    reducers: {
        resetState() {
            return { asyncState: { pending: false } };
        }
    },
    extraReducers(builder) {
        builder.addCase(chatDeleteSubmit.pending, state => {
            state.asyncState.pending = true;
            state.asyncState.error = undefined;
        }).addCase(chatDeleteSubmit.rejected, (state, action) => {
            state.asyncState.error = action.payload;
            state.asyncState.pending = false;
        }).addCase(chatDeleteSubmit.fulfilled, (state, action) => {
            state.chatDeleted = action.payload;
            state.asyncState.pending = false;
        })
    },
});

export default slice.reducer;
export const { resetState } = slice.actions;

/*
 * Async Thunks
 */

export const chatDeleteSubmit = createAsyncThunk<string, { chatId: string, privateTypeIndex: string, publicTypeIndex: string }, { rejectValue: string }>(
    'chatDelete/submit',
    async ({ chatId, privateTypeIndex, publicTypeIndex }, { rejectWithValue }) => {
        try {
            await deleteRecursive(currentContainerFromDoc(removeHashFromUrl(chatId)));
            await removeFromTypeIndex(chatId, privateTypeIndex);
            await removeFromTypeIndex(chatId, publicTypeIndex);
            return chatId;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

/*
 * Selectors
 */
export const selectPending = (state: ChatDeleteState) => state.asyncState.pending;
export const selectError = (state: ChatDeleteState) => state.asyncState.error;
export const selectChatDeleted = (state: ChatDeleteState) => state.chatDeleted;