import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from ".";
import { makeSelectChatWrapperById, makeSelectParticipantsHavingReadAccess, makeSelectParticipantsHavingReadAccessPending } from "./ChatSettingsSlice";

export const useParticipantsHavingReadAccess = ({ chatId }: { chatId: string }) => {
    const selectParticipantsHavingReadAccess = useMemo(() => makeSelectParticipantsHavingReadAccess(), []);
    const selectParticipantsHavingReadAccessPending = useMemo(() => makeSelectParticipantsHavingReadAccessPending(), []);
    const participantsHavingReadAccess = useSelector((state: AppState) => selectParticipantsHavingReadAccess(state.chatOfParticipantState, { chatId }));
    const participantsHavingReadAccessPending = useSelector((state: AppState) => selectParticipantsHavingReadAccessPending(state.chatOfParticipantState, { chatId }));
    return { participantsHavingReadAccess, participantsHavingReadAccessPending };
}

export const useChatOfParticipant = ({ chatId, chatOfParticipantId }: { chatId: string, chatOfParticipantId: string }) => {

    const selectChatWrapperById = useMemo(() => makeSelectChatWrapperById(), []);
    const chatWrapper = useSelector((state: AppState) => selectChatWrapperById(state.chatOfParticipantState, { chatId, chatOfParticipantId }));
    return { chatWrapper };

}