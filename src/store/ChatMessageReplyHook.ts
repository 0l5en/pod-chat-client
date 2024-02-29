import { useMemo } from "react";
import { ChatMessageReplyGroup } from "../types";
import { makeSelectMessageReplyGroups } from "./ChatMessageSelector";

export const useChatMessageReplyGroups = ({ chatId, messageId }: { chatId: string, messageId: string }) => {

    const selectMessageReplyGroups = useMemo(() => makeSelectMessageReplyGroups(), []);
    const chatMessageReplyGroups: ChatMessageReplyGroup[] = []; //useSelector((state: AppState) => selectMessageReplyGroups(state.chatMessageState, { chatId, messageId }));

    return { chatMessageReplyGroups };
}