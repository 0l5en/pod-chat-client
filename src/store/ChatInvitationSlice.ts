import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from ".";
import { Chat, ChatInvitationState, Profile } from "../types";
import { findChatByParticipantWebids } from "./AppStateUtils";
import { joinChat, loadChat } from "./solid/Chat";

const initialState = (): ChatInvitationState => ({});

const slice = createSlice({
    name: 'chatInvitation',
    initialState,
    reducers: {
        setInvitation: (state, action: PayloadAction<{ authProfileId: string, participantId: string, participantChatId: string }>) => {
            state.invitation = {
                authProfileId: action.payload.authProfileId,
                participantId: action.payload.participantId,
                participantChatId: action.payload.participantChatId,
                asyncState: { pending: false },
            };
        },
        resetState: () => {
            return initialState();
        }
    },
    extraReducers: builder => {
        builder.addCase(loadChatOfInvitation.pending, state => {
            if (state.invitation) {
                state.invitation.asyncState.pending = true;
                state.invitation.asyncState.error = undefined;
            }
        }).addCase(loadChatOfInvitation.fulfilled, (state, action) => {
            if (state.invitation) {
                state.invitation.asyncState.pending = false;
                state.invitation.chatOfInvitation = { ...action.payload, isNew: false, isJoined: false };
            }
        }).addCase(loadChatOfInvitation.rejected, (state, action) => {
            if (state.invitation) {
                state.invitation.asyncState.pending = false;
                state.invitation.asyncState.error = action.payload;
            }
        });

        builder.addCase(joinChatOfInvitation.pending, state => {
            if (state.invitation) {
                state.invitation.asyncState.pending = true;
                state.invitation.asyncState.error = undefined;
            }
        }).addCase(joinChatOfInvitation.fulfilled, (state, action) => {
            if (state.invitation) {
                state.invitation.asyncState.pending = false;
                state.invitation.chatOfInvitation = { ...action.payload, isJoined: true };
            }
        }).addCase(joinChatOfInvitation.rejected, (state, action) => {
            if (state.invitation) {
                state.invitation.asyncState.pending = false;
                state.invitation.asyncState.error = action.payload;
            }
        });
    }
});

export default slice.reducer;
export const { setInvitation, resetState } = slice.actions;

/*
 *  Async Thunks
 */

export const loadChatOfInvitation = createAsyncThunk<Chat, void, { state: AppState, rejectValue: string }>(
    'chatInvitation/loadChatOfParticipant',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { chatInvitationState: state } = getState();
            if (!state.invitation) {
                return rejectWithValue('chat invitation is undefined');
            }
            const result = await loadChat(state.invitation.authProfileId, state.invitation.participantChatId);
            result.participants = result.participants
                .map(p => state.invitation && p.id === state.invitation.participantId ? { ...p, chatId: state.invitation.participantChatId } : p);
            return result;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

export const joinChatOfInvitation = createAsyncThunk<Chat & { isNew: boolean }, Profile, { state: AppState, rejectValue: string }>(
    'chatInvitation/joinChat',
    async (authProfile, { getState, rejectWithValue }) => {
        try {
            const { chatInvitationState, dashboardState } = getState();
            if (!dashboardState.dashboard) {
                return rejectWithValue('dashboard is undefined');
            }

            const invitationChat = selectChatOfInvitation(chatInvitationState);
            if (!invitationChat) {
                return rejectWithValue('invitationChat is undefined');
            }

            const chatFound = findChatByParticipantWebids([...invitationChat.participants.map(p => p.id)], dashboardState.dashboard.chats);
            if (chatFound) {
                return { ...chatFound, isNew: false };
            }

            const newChat = await joinChat(authProfile.id, invitationChat.participants, new Date(), authProfile.storageId, authProfile.privateTypeIndexId);
            return { ...newChat, isNew: true };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);


/*
 *  Selectors
 */
const selectInvitation = (state: ChatInvitationState) => state.invitation;
export const selectAuthProfileId = (state: ChatInvitationState): string | undefined => state.invitation?.authProfileId;
export const selectParticipantChatId = (state: ChatInvitationState): string | undefined => state.invitation?.participantChatId;
export const selectPending = createSelector([selectInvitation], invitation => invitation ? invitation.asyncState.pending : false);
export const selectError = createSelector([selectInvitation], invitation => invitation?.asyncState.error);
export const selectChatOfInvitation = createSelector([selectInvitation], invitation => invitation?.chatOfInvitation);