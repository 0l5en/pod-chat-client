import { createSelector } from "@reduxjs/toolkit";
import { ChatMessageLocation, ChatMessageReplyGroup, ChatMessageState, isEndLocation, locationComparator, locationFromDate } from "../types";
import { removeHashFromUrl } from "./solid/Constants";
import { locationFromMessageResourceUrl } from "./solid/Message";

const selectChatId = (_state: ChatMessageState, chatId: string) => chatId;
const selectMessageSelector = (_state: ChatMessageState, messageSelector: { chatId: string, messageId: string }) => messageSelector;
const selectMessageReplySelector = (_state: ChatMessageState, messageReplySelector: { chatId: string, messageId: string }) => messageReplySelector;
const selectResourceSelector = (_state: ChatMessageState, resourceSelector: { chatId: string, searchResultChatId: string, location: ChatMessageLocation }) => resourceSelector;
const selectResults = (state: ChatMessageState) => state.results;


export const selectResultForChatId = createSelector(
    [selectChatId, selectResults],
    (chatId, results) => results.find(r => r.chatId === chatId)
);

export const selectLocation = createSelector(
    [selectResultForChatId],
    resultForChatId => resultForChatId ? resultForChatId.location : locationFromDate(new Date())
);

export const makeSelectHasResult = () => createSelector(
    [selectResultForChatId],
    resultForChatId => resultForChatId !== undefined
);

export const makeSelectMessages = () => createSelector(
    [selectResultForChatId],
    resultForChatId => resultForChatId
        ? [
            ...resultForChatId.searchResults
                .flatMap(sr => sr.resources)
                .filter(sr => locationComparator(sr.location, resultForChatId.location) > -1)
                .flatMap(result => result.messages)
        ].sort((m1, m2) => m2.created - m1.created)
        : []
);

export const makeSelectHasEndLocation = () => createSelector(
    [selectResultForChatId],
    resultForChatId => resultForChatId ? isEndLocation(resultForChatId.location) : false
);

export const makeSelectLoadResultPending = () => createSelector(
    [selectResultForChatId],
    resultForChatId => resultForChatId ? resultForChatId.asyncState.pending : false
);

export const makeSelectMessageReplyGroups = () => createSelector(
    [selectMessageReplySelector, selectResults],
    (replySelector, results) => {
        const replySelectorLocation = locationFromMessageResourceUrl(removeHashFromUrl(replySelector.messageId));
        return results
            .filter(result => result.chatId === replySelector.chatId)
            .flatMap(result => result.searchResults)
            .flatMap(searchResult => searchResult.resources)
            .filter(resource => locationComparator(resource.location, replySelectorLocation) === 0)
            .flatMap(resource => resource.replies)
            .filter(reply => reply.messageId === replySelector.messageId)
            .reduce((acc, reply) => {
                const found = acc.find(group => group.name === reply.name);
                if (found) {
                    if (!found.agents.includes(reply.agent)) {
                        found.agents.push(reply.agent);
                    }
                    return acc;
                }
                return [...acc, { name: reply.name, agents: [reply.agent] }];
            }, [] as Array<ChatMessageReplyGroup>)
            .sort((g1, g2) => g1.name.localeCompare(g2.name));
    }
);

export const makeSelectMessageResource = () => createSelector(
    [selectResourceSelector, selectResults],
    (resourceSelector, results) => results
        .filter(result => result.chatId === resourceSelector.chatId)
        .flatMap(result => result.searchResults)
        .filter(searchResult => searchResult.chatId === resourceSelector.searchResultChatId)
        .flatMap(searchResult => searchResult.resources)
        .filter(resource => locationComparator(resource.location, resourceSelector.location) === 0)
        .pop()
);

export const makeSelectMessage = () => createSelector(
    [selectMessageSelector, selectResults],
    (messageSelector, results) => results
        .filter(result => result.chatId === messageSelector.chatId)
        .flatMap(result => result.searchResults)
        .flatMap(searchResult => searchResult.resources)
        .flatMap(resources => resources.messages)
        .filter(message => message.id === messageSelector.messageId)
        .pop()
);