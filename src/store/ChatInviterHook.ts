import { useSelector } from "react-redux";
import { AppState } from ".";
import { selectChatOfInviter, selectChatOfInviterDeclined, selectError, selectPending } from "./ChatInviterSlice";

export const useChatOfInviter = () => {
    const chatOfInviter = useSelector((state: AppState) => selectChatOfInviter(state.chatInviterState));
    const chatOfInviterDeclined = useSelector((state: AppState) => selectChatOfInviterDeclined(state.chatInviterState));
    const pending = useSelector((state: AppState) => selectPending(state.chatInviterState));
    const error = useSelector((state: AppState) => selectError(state.chatInviterState));

    return { chatOfInviter, pending, error, chatOfInviterDeclined };
}