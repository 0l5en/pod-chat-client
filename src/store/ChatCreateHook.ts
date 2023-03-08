import { useSelector } from "react-redux";
import { AppState } from ".";
import { selectChatCreated, selectError, selectPending, selectProfileIds } from "./ChatCreateSlice";

export const useChatCreate = () => {

    const profileIds = useSelector((state: AppState) => selectProfileIds(state.chatCreateState));
    const chatCreated = useSelector((state: AppState) => selectChatCreated(state.chatCreateState));
    const pending = useSelector((state: AppState) => selectPending(state.chatCreateState));
    const error = useSelector((state: AppState) => selectError(state.chatCreateState));

    return { profileIds, chatCreated, pending, error };
}