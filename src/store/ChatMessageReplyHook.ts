import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from ".";
import { makeSelectMessageReplyGroups } from "./ChatMessageSelector";

export const useChatMessageReplyGroups = ({ chatId, messageId }: { chatId: string, messageId: string }) => {

    const selectMessageReplyGroups = useMemo(() => makeSelectMessageReplyGroups(), []);
    // FIXME next uncommented line produces a warning
    // Selector unknown returned a different result when called with the same parameters. This can lead to unnecessary rerenders.
    // Selectors that return a new reference (such as an object or an array) should be memoized 
    const chatMessageReplyGroups = useSelector((state: AppState) => selectMessageReplyGroups(state.chatMessageState, { chatId, messageId }));

    return { chatMessageReplyGroups };
}