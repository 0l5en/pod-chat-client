import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from ".";
import { makeSelectMessageReplyGroups } from "./ChatMessageSelector";

export const useChatMessageReplyGroups = ({ chatId, messageId }: { chatId: string, messageId: string }) => {

    const selectMessageReplyGroups = useMemo(() => makeSelectMessageReplyGroups(), []);
    const chatMessageReplyGroups = useSelector((state: AppState) => selectMessageReplyGroups(state.chatMessageState, { chatId, messageId }));

    return { chatMessageReplyGroups };
}