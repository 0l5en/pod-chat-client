import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from ".";
import { ChatMessageReplySendState, ChatMessageResource, Profile } from "../types";
import { makeSelectProfileWrapperById } from "./ProfileSlice";
import { removeHashFromUrl } from "./solid/Constants";
import { createMessageReply, loadChatMessageResource, sendMessageReply } from "./solid/Message";
import { sendAddLongChatMessageReplyNotification, sendRemoveLongChatMessageReplyNotification } from "./solid/Notification";

export const sendMessageReplySubmit = createAsyncThunk<ChatMessageResource, { authorId: string, chatId: string, participationIds: string[], replyName: string, messageId: string }, { state: AppState, rejectValue: string }>(
    'sendMessageReply/submit',
    async ({ authorId, chatId, participationIds, replyName, messageId }, { getState, rejectWithValue }) => {
        try {

            // create new message reply and write to pod
            const now = new Date();
            const { location, replyId, isAdd } = await sendMessageReply(createMessageReply(chatId, messageId, authorId, replyName));
            const resourceUrl = removeHashFromUrl(replyId);

            // post notification to participant inboxes
            const profileState = getState().profileState;
            await Promise.all(
                participationIds
                    .map(participationId => makeSelectProfileWrapperById()(profileState, participationId))
                    .reduce((acc, profileWrapper) => profileWrapper && profileWrapper.profile ? [...acc, profileWrapper.profile] : acc, [] as Array<Profile>)
                    .map(profile => isAdd
                        ? sendAddLongChatMessageReplyNotification(chatId, replyId, authorId, profile.inboxId, now)
                        : sendRemoveLongChatMessageReplyNotification(chatId, replyId, authorId, profile.inboxId, now))
            );

            // return current state of chat message resource
            const resource = await loadChatMessageResource(chatId, resourceUrl);
            return { ...resource, location };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

const initialState = (): ChatMessageReplySendState => ({ replies: [] });

const slice = createSlice({
    name: 'sendMessageReply',
    initialState,
    reducers: {
        resetState(state, action: PayloadAction<string>) {
            return { replies: [...state.replies.filter(reply => reply.messageId !== action.payload)] };
        }
    },
    extraReducers(builder) {
        builder.addCase(sendMessageReplySubmit.pending, (state, action) => {
            const reply = makeSelectReply()(state, action.meta.arg.messageId);
            if (reply) {
                reply.asyncState.pending = true;
                reply.asyncState.error = undefined;
            } else {
                state.replies.push({ messageId: action.meta.arg.messageId, asyncState: { pending: true } });
            }
        }).addCase(sendMessageReplySubmit.fulfilled, (state, action) => {
            const reply = makeSelectReply()(state, action.meta.arg.messageId);
            if (reply) {
                reply.modified = action.payload;
                reply.asyncState.pending = false;
            }
        }).addCase(sendMessageReplySubmit.rejected, (state, action) => {
            const reply = makeSelectReply()(state, action.meta.arg.messageId);
            if (reply) {
                reply.asyncState.error = action.payload;
                reply.asyncState.pending = false;
            }
        });
    },
});

export default slice.reducer;
export const { resetState } = slice.actions;

/*
 * Selectors
 */
const selectMessageId = (state_: ChatMessageReplySendState, messageId: string) => messageId;
const selectReplies = (state: ChatMessageReplySendState) => state.replies;
const makeSelectReply = () => createSelector(
    [selectMessageId, selectReplies],
    (messageId, replies) => replies.find(reply => reply.messageId === messageId)
);

export const makeSelectPending = () => createSelector(
    [makeSelectReply()],
    reply => reply ? reply.asyncState.pending : false
);
export const makeSelectError = () => createSelector(
    [makeSelectReply()],
    reply => reply ? reply.asyncState.error : undefined
);
export const makeSelectModified = () => createSelector(
    [makeSelectReply()],
    reply => reply ? reply.modified : undefined
);