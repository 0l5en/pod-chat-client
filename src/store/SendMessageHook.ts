import { useSelector } from "react-redux";
import { AppState } from ".";
import { selectError, selectModified, selectPending } from "./SendMessageSlice";

export const useSendMessage = () => {

    const pending = useSelector((state: AppState) => selectPending(state.sendMessageState));
    const error = useSelector((state: AppState) => selectError(state.sendMessageState));
    const modified = useSelector((state: AppState) => selectModified(state.sendMessageState));

    return { pending, error, modified };
}