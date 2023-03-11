import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from ".";
import {
    makeSelectChatMessageAddNotificationsForReferenceId,
    makeSelectChatNotificationsForReferenceId,
    makeSelectChatNotificationsForTargetId,
    makeSelectDashboardChat,
    makeSelectParticipantChatIds,
    selectChatMessageAddNotificationGroups,
    selectChatSearchFilter,
    selectDashboard,
    selectDashboardChats,
    selectDashboardInviter,
    selectError,
    selectPending,
    selectSpaceUsageCounterBytes,
    selectSpaceUsageCounterError,
    selectSpaceUsageCounterPending
} from "./DashboardSlice";

export const useDashboard = () => {
    const pending = useSelector((state: AppState) => selectPending(state.dashboardState));
    const error = useSelector((state: AppState) => selectError(state.dashboardState));
    const dashboard = useSelector((state: AppState) => selectDashboard(state.dashboardState));
    const chats = useSelector((state: AppState) => selectDashboardChats(state.dashboardState));
    const chatMessageAddNotificationGroups = useSelector((state: AppState) => selectChatMessageAddNotificationGroups(state.dashboardState));
    const chatSearchFilter = useSelector((state: AppState) => selectChatSearchFilter(state.dashboardState));
    const dashboardInviter = useSelector((state: AppState) => selectDashboardInviter(state.dashboardState));

    return { pending, error, dashboard, chats, chatMessageAddNotificationGroups, chatSearchFilter, dashboardInviter };
}

export const useSpaceUsageCounter = () => {
    const pending = useSelector((state: AppState) => selectSpaceUsageCounterPending(state.dashboardState));
    const error = useSelector((state: AppState) => selectSpaceUsageCounterError(state.dashboardState));
    const bytes = useSelector((state: AppState) => selectSpaceUsageCounterBytes(state.dashboardState));

    return { pending, error, bytes };
}

export const useChat = ({ chatId }: { chatId: string }) => {

    const selectParticipantChatIds = useMemo(() => makeSelectParticipantChatIds(), []);
    const selectChatNotificationsForReferenceId = useMemo(() => makeSelectChatNotificationsForReferenceId(), []);
    const selectChatMessageAddNotificationsForReferenceId = useMemo(() => makeSelectChatMessageAddNotificationsForReferenceId(), []);
    const selectChat = useMemo(() => makeSelectDashboardChat(), []);
    const participantChatIds = useSelector((state: AppState) => selectParticipantChatIds(state.dashboardState, chatId));
    const chatNotificationsForReferenceId = useSelector((state: AppState) => selectChatNotificationsForReferenceId(state.dashboardState, chatId));
    const chatMessageAddNotificationsForReferenceId = useSelector((state: AppState) => selectChatMessageAddNotificationsForReferenceId(state.dashboardState, chatId));
    const chat = useSelector((state: AppState) => selectChat(state.dashboardState, chatId));

    return { chat, participantChatIds, chatNotificationsForReferenceId, chatMessageAddNotificationsForReferenceId };
}

export const useNotifications = ({ chatId }: { chatId?: string }) => {
    const selectChatNotificationsForTargetId = useMemo(() => makeSelectChatNotificationsForTargetId(), []);
    const chatNotificationsForTargetId = useSelector((state: AppState) => selectChatNotificationsForTargetId(state.dashboardState, chatId));
    return { chatNotificationsForTargetId };
}