import { useSelector } from "react-redux";
import { AppState } from ".";
import { selectChatDeleted, selectError, selectPending } from "./ChatDeleteSlice";

export const useChatDelete = () => {
    const pending = useSelector((state: AppState) => selectPending(state.chatDeleteState));
    const error = useSelector((state: AppState) => selectError(state.chatDeleteState));
    const chatDeleted = useSelector((state: AppState) => selectChatDeleted(state.chatDeleteState));

    return { pending, error, chatDeleted };
}