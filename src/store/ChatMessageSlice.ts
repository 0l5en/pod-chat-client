import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from ".";
import { addDay, ChatMessage, ChatMessageResource, ChatMessageResult, ChatMessageSearchResult, ChatMessageState, locationComparator, locationFromDate, SolidNotification } from "../types";
import { makeSelectMessage, makeSelectMessageResource, selectLocation, selectResultForChatId } from "./ChatMessageSelector";
import { removeHashFromUrl } from "./solid/Constants";
import { createChatMessageResource, getChatMessageResource, loadChatMessageResource, loadMessagesForChats, locationFromMessageResourceUrl, verifyChatMessage as verifySolidChatMessage } from "./solid/Message";

const initialState: ChatMessageState = {
    results: [],
    sendMessageAsyncState: { pending: false }
};

const slice = createSlice({
    name: 'chatMessage',
    initialState,
    reducers: {
        syncChatMessageResource(state, action: PayloadAction<ChatMessageResource & { chatId: string, searchResultChatId: string }>) {
            const resultCurrent = selectResultForChatId(state, action.payload.chatId);
            if (resultCurrent) {
                const searchResultCurrent = resultCurrent.searchResults.find(sr => sr.chatId === action.payload.searchResultChatId);
                if (searchResultCurrent) {
                    const locationCurrent = searchResultCurrent.resources.find(resource => locationComparator(resource.location, action.payload.location) === 0);
                    if (locationCurrent) {
                        locationCurrent.messages = action.payload.messages;
                        locationCurrent.replies = action.payload.replies;
                    } else {
                        searchResultCurrent.resources.push({
                            location: action.payload.location,
                            messages: action.payload.messages,
                            replies: action.payload.replies
                        });
                    }
                } else {
                    resultCurrent.searchResults.push({
                        chatId: action.payload.searchResultChatId,
                        resources: [{
                            location: action.payload.location,
                            messages: action.payload.messages,
                            replies: action.payload.replies
                        }]
                    });
                }
            } else {
                state.results.push({
                    asyncState: { pending: false },
                    chatId: action.payload.chatId,
                    location: action.payload.location,
                    searchResults: [{
                        chatId: action.payload.searchResultChatId,
                        resources: [{
                            location: action.payload.location,
                            messages: action.payload.messages,
                            replies: action.payload.replies
                        }]
                    }]
                });
            }
        }
    },
    extraReducers: builder => {

        /*
         * Reducer completeChatMessageAddNotifications 
         */

        builder.addCase(completeChatMessageAddNotifications.pending, (state, action) => {
            completeChatMessageAddNotificationsPending(state, action.meta.arg.chatId);
        }).addCase(completeChatMessageAddNotifications.fulfilled, (state, action) => {
            completeChatMessageAddNotificationsFullfilled(state, action.meta.arg.chatId, action.payload);
        }).addCase(completeChatMessageAddNotifications.rejected, (state, action) => {
            completeChatMessageAddNotificationsRejected(state, action.meta.arg.chatId);
        })

        /*
         * Reducer loadNextResult 
         */

        builder.addCase(loadNextResult.pending, (state, action) => {
            loadNextResultPending(state, action.meta.arg.chatId);
        }).addCase(loadNextResult.fulfilled, (state, action) => {
            loadNextResultFullfilled(state, action.meta.arg.chatId, action.payload);
        }).addCase(loadNextResult.rejected, (state, action) => {
            loadNextResultRejected(state, action.meta.arg.chatId, action.payload);
        });

        /*
         * Reducer verifyChatMessage
         */
        const selectMessage = makeSelectMessage();
        builder.addCase(verifyChatMessage.pending, (state, action) => {
            const message = selectMessage(state, action.meta.arg);
            if (message) {
                message.verificationStatus = 'VERIFYING';
            }
        }).addCase(verifyChatMessage.fulfilled, (state, action) => {
            const message = selectMessage(state, action.meta.arg);
            if (message) {
                message.verificationStatus = action.payload.verificationStatus;
            }
        }).addCase(verifyChatMessage.rejected, (state, action) => {
            const message = selectMessage(state, action.meta.arg);
            if (message) {
                message.verificationStatus = 'ERROR';
            }
        })
    }
});

export default slice.reducer;
export const { syncChatMessageResource } = slice.actions;

/*
 * AsyncThunks
 */

export const loadNextResult = createAsyncThunk<ChatMessageSearchResult[], { chatId: string, chatIdsToLoad: Array<string> }, { state: AppState, rejectValue: string }>(
    'chatMessage/NextResult/load',
    async ({ chatId, chatIdsToLoad }, { rejectWithValue, getState }) => {
        try {
            const state: AppState = getState();
            const result = selectResultForChatId(state.chatMessageState, chatId);
            const locationToLoad = selectLocation(state.chatMessageState, chatId);
            if (result) {
                // map searchResults to contain only resources with lower or equal location compared to locationToLoad
                // remove all search results with empty resources
                const searchResultsToIgnore = result.searchResults
                    .map(sr => ({
                        chatId: sr.chatId,
                        resources: [...sr.resources.filter(l => locationComparator(l.location, locationToLoad) < 1)]
                    }))
                    .filter(sr => sr.resources.length > 0);
                const filteredChatIdsToLoad = chatIdsToLoad.filter(chatId => searchResultsToIgnore.findIndex(searchResult => searchResult.chatId === chatId) < 0);
                const searchResultsLoaded = await loadMessagesForChats(filteredChatIdsToLoad, locationToLoad);
                return [...searchResultsToIgnore, ...searchResultsLoaded];
            }
            return await loadMessagesForChats(chatIdsToLoad, locationToLoad);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

export const completeChatMessageAddNotifications = createAsyncThunk<ChatMessageSearchResult[], { chatId: string, notifications: SolidNotification[] }, { rejectValue: string, state: AppState }>(
    'chatMessage/notifications/complete',
    async ({ chatId, notifications }, { rejectWithValue, getState }) => {
        try {
            const state = getState().chatMessageState;
            const result: ChatMessageSearchResult[] = [];
            for (var i = 0; i < notifications.length; i++) {
                const notification = notifications[i];
                const chatMessageResourceUrl = removeHashFromUrl(notification.objectId);
                const location = locationFromMessageResourceUrl(chatMessageResourceUrl);
                const locationYesterday = addDay(locationFromDate(new Date()), -1);
                const resource = makeSelectMessageResource()(state, { chatId, searchResultChatId: notification.targetId, location });
                let newResource = getChatMessageResource(notification.targetId, location, result);
                if (!newResource && (resource || locationComparator(location, locationYesterday) > -1)) {
                    const messageResource = await loadChatMessageResource(notification.targetId, chatMessageResourceUrl, true);
                    newResource = createChatMessageResource(notification.targetId, location, result);
                    newResource.messages = messageResource.messages;
                    newResource.replies = messageResource.replies;
                }
            }
            return result;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

export const verifyChatMessage = createAsyncThunk<ChatMessage, { chatId: string, messageId: string }, { rejectValue: string, state: AppState }>(
    'chatMessage/verifyMessage',
    async ({ chatId, messageId }, { getState, rejectWithValue }) => {
        try {
            const state = getState().chatMessageState;
            const message = makeSelectMessage()(state, { chatId, messageId });
            if (message) {
                return await verifySolidChatMessage(message);
            }
            return rejectWithValue('no message found for verification');
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

/*
 * Utils
 */

function loadNextResultPending(state: ChatMessageState, chatId: string) {
    const resultCurrent = selectResultForChatId(state, chatId);
    if (resultCurrent) {
        resultCurrent.asyncState.pending = true;
        resultCurrent.location = addDay(resultCurrent.location, -1);
        resultCurrent.asyncState.error = undefined;
    } else {
        state.results.push({
            chatId: chatId,
            searchResults: [],
            asyncState: { pending: true },
            location: selectLocation(state, chatId)
        });
    }
}

function completeChatMessageAddNotificationsPending(state: ChatMessageState, chatId: string) {
    const resultCurrent = selectResultForChatId(state, chatId);
    if (resultCurrent) {
        resultCurrent.asyncState.error = undefined;
    }
}

function loadNextResultRejected(state: ChatMessageState, chatId: string, error?: string) {
    const resultCurrent = selectResultForChatId(state, chatId);
    if (resultCurrent) {
        resultCurrent.asyncState.error = error;
        resultCurrent.asyncState.pending = false;
    }
}

function completeChatMessageAddNotificationsRejected(state: ChatMessageState, chatId: string, error?: string) {
    const resultCurrent = selectResultForChatId(state, chatId);
    if (resultCurrent) {
        resultCurrent.asyncState.error = error;
    }
}

function loadNextResultFullfilled(state: ChatMessageState, chatId: string, searchResults: ChatMessageSearchResult[]) {
    const resultCurrent = selectResultForChatId(state, chatId);
    if (resultCurrent) {
        syncSearchResults(searchResults, resultCurrent);
        // update location with recent location
        const recentLocation = searchResults.flatMap(r => r.resources).sort((s1, s2) => locationComparator(s1.location, s2.location)).map(s => s.location).pop();
        if (recentLocation) {
            resultCurrent.location = recentLocation;
        }
        resultCurrent.asyncState.pending = false;
    }
}

function completeChatMessageAddNotificationsFullfilled(state: ChatMessageState, chatId: string, searchResults: ChatMessageSearchResult[]) {
    const resultCurrent = selectResultForChatId(state, chatId);
    if (resultCurrent) {
        syncSearchResults(searchResults, resultCurrent);
    }
}

function syncSearchResults(searchResults: ChatMessageSearchResult[], resultCurrent: ChatMessageResult) {
    searchResults.forEach(searchResult => {
        const searchResultCurrent = resultCurrent.searchResults.find(searchResultCurrent => searchResultCurrent.chatId === searchResult.chatId);
        if (searchResultCurrent) {
            searchResult.resources.forEach(resource => {
                const resourceCurrent = searchResultCurrent.resources.find(resourceCurrent => locationComparator(resource.location, resourceCurrent.location) === 0);
                if (resourceCurrent) {
                    resourceCurrent.messages = [...resource.messages];
                    resourceCurrent.replies = [...resource.replies];
                } else {
                    searchResultCurrent.resources.push(resource);
                }
            });
        } else {
            resultCurrent.searchResults.push(searchResult);
        }
    });
}

