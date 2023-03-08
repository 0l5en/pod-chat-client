import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from ".";
import { makeSelectError, makeSelectModified, makeSelectPending } from "./SendMessageReplySlice";

export const useSendMessageReply = ({ messageId }: { messageId: string }) => {

    const selectPending = useMemo(() => makeSelectPending(), []);
    const selectError = useMemo(() => makeSelectError(), []);
    const selectModified = useMemo(() => makeSelectModified(), []);

    const pending = useSelector((state: AppState) => selectPending(state.sendMessageReplyState, messageId));
    const error = useSelector((state: AppState) => selectError(state.sendMessageReplyState, messageId));
    const modified = useSelector((state: AppState) => selectModified(state.sendMessageReplyState, messageId));

    return { pending, error, modified };
}