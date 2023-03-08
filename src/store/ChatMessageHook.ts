import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from ".";
import { makeSelectHasEndLocation, makeSelectHasResult, makeSelectLoadResultPending, makeSelectMessages } from "./ChatMessageSelector";

export const useChatMessage = ({ chatId }: { chatId: string }) => {

    const selectHasResult = useMemo(makeSelectHasResult, []);
    const hasResult = useSelector((state: AppState) => selectHasResult(state.chatMessageState, chatId));

    const selectMessages = useMemo(makeSelectMessages, []);
    const messages = useSelector((state: AppState) => selectMessages(state.chatMessageState, chatId));

    const selectHasEndLocation = useMemo(makeSelectHasEndLocation, []);
    const hasEndLocation = useSelector((state: AppState) => selectHasEndLocation(state.chatMessageState, chatId));

    const selectLoadResultPending = useMemo(makeSelectLoadResultPending, []);
    const loadResultPending = useSelector((state: AppState) => selectLoadResultPending(state.chatMessageState, chatId));

    return { hasResult, messages, hasEndLocation, loadResultPending };
}