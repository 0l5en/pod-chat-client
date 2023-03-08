import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage, ChatMessageAnswerState } from "../types";

const initialState: ChatMessageAnswerState = {};

const slice = createSlice({
    name: 'chatMessageAnswer',
    initialState,
    reducers: {
        setMessageAnswer(state, action: PayloadAction<{ answer?: ChatMessage }>) {
            state.answer = action.payload.answer;
        }
    }
});

export default slice.reducer;
export const { setMessageAnswer } = slice.actions;

/*
 * Selectors
 */

export const selectAnswer = (state: ChatMessageAnswerState) => state.answer;
export const selectAnswerContent = createSelector([selectAnswer], answer => {
    if (answer) {
        const words = answer.content.split(' ');
        let isAnswer = false;
        return words.filter(word => {
            const wordTrimmed = word.trim();
            if (wordTrimmed === "'''") {
                isAnswer = !isAnswer;
                return false;
            }
            return !isAnswer;
        }).map((word, index) => index === 0 ? word.trim() : ' ' + word.trim())
            .reduce((acc, word) => acc + word, '');
    }
    return undefined;
});