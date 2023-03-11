import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { AppState, useAppDispatch } from ".";
import {
    calculateSpaceUsage as calculateSolidSpaceUsage,
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
    selectPending
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
    const [summ, setSumm] = useState(0);
    const [end, setEnd] = useState(false);
    const dispatch = useAppDispatch();
    const { dashboard } = useDashboard();
    const summHumanReadable = useMemo(() => humanFileSize(summ), [summ]);
    const addFileSize = (bytes: number) => { setSumm((s) => s + bytes); };
    const calculateSpaceUsage = () => {
        if (dashboard) {
            dispatch(calculateSolidSpaceUsage({ storageId: dashboard.profile.storageId, onFileSize: addFileSize, onEnd: () => setEnd(true) }));
        }
    };
    return { summHumanReadable, calculateSpaceUsage, dashboard, end };
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

/**
 * Format bytes as human-readable text.
 * 
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 * 
 * @return Formatted string.
 */
function humanFileSize(bytes: number, si = false, dp = 1) {
    if (bytes === 0) {
        return '';
    }

    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}