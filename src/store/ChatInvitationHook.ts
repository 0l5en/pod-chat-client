import { useSelector } from "react-redux";
import { AppState } from ".";
import { selectChatOfInvitation, selectError, selectParticipantChatId, selectPending } from "./ChatInvitationSlice";

export const useChatInvitation = () => {
    const pending = useSelector((state: AppState) => selectPending(state.chatInvitationState));
    const error = useSelector((state: AppState) => selectError(state.chatInvitationState));
    const chatOfInvitation = useSelector((state: AppState) => selectChatOfInvitation(state.chatInvitationState));
    const participantChatId = useSelector((state: AppState) => selectParticipantChatId(state.chatInvitationState));

    return { pending, error, chatOfInvitation, participantChatId };
}