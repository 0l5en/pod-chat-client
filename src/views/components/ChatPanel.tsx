import { useEffect, useMemo, useRef } from "react";
import { Button } from "react-bootstrap";
import { FaCog } from "react-icons/fa";
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../store";
import { useChatMessage } from "../../store/ChatMessageHook";
import { completeChatMessageAddNotifications, loadNextResult } from "../../store/ChatMessageSlice";
import { useChat, useDashboard } from "../../store/DashboardHook";
import { acceptSolidNotifications, updateParticipantReferences } from "../../store/DashboardSlice";
import { useProfileIdsToLoad } from "../../store/ProfileHook";
import { loadProfile } from "../../store/ProfileSlice";
import { Profile } from "../../types";
import ChatMessageListPanel from "./ChatMessageListPanel";
import ChatPanelHeader from "./ChatPanelHeader";
import ScrollPanel from "./ScrollPanel";
import WithTooltip from "./WithTooltip";

const ChatPanelContent = ({ settingsPath, profile, chatId }: { settingsPath: string, profile: Profile, chatId: string }) => {

    const { dashboard } = useDashboard();
    const { chat, participantChatIds, chatNotificationsForReferenceId: notifications } = useChat({ chatId });
    const { profileIdsToLoad } = useProfileIdsToLoad({ profileIds: chat ? chat.participants.map(p => p.id) : [] });
    const { hasResult } = useChatMessage({ chatId });
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const refChatIds = useRef<string[]>([]);
    const refProfileIdsToLoad = useRef<boolean>(false);

    const references = useMemo(
        () => notifications.reduce((acc, value) => {
            if (!acc.find(r => r.participantId === value.actorId)) {
                return [...acc, { participantId: value.actorId, participantChatId: value.targetId }]
            }
            return acc;
        }, [] as Array<{ participantId: string, participantChatId: string }>),
        [notifications],
    );

    useEffect(() => {
        if (!hasResult && !refChatIds.current.includes(chatId)) {
            dispatch(loadNextResult({ chatId, chatIdsToLoad: [...participantChatIds, chatId] }));
            refChatIds.current.push(chatId);
        }
    }, [dispatch, chatId, participantChatIds, hasResult]);

    useEffect(() => {
        if (!refProfileIdsToLoad.current && profileIdsToLoad.length > 0) {
            profileIdsToLoad.forEach(profileIdToLoad => dispatch(loadProfile(profileIdToLoad)));
            refProfileIdsToLoad.current = true;
        }
    }, [dispatch, profileIdsToLoad]);

    useEffect(() => {
        if (notifications.length > 0 && dashboard?.profile) {
            // load chat messages from notification object (chat message resource)
            dispatch(completeChatMessageAddNotifications({ chatId, notifications }));
            // update participant references
            if (references.length > 0) {
                dispatch(updateParticipantReferences({ chatId, references }));
            }
            // uppdate notifications processed
            dispatch(acceptSolidNotifications(notifications));
        }
    }, [dispatch, notifications, references, chatId, dashboard?.profile]);

    return (
        <>
            {chat && (
                <ScrollPanel
                    header={<ChatPanelHeader profile={profile} chat={chat} />}
                    footer={
                        <WithTooltip tooltipMessage="Settings">
                            <Button className="shadow-none m-2" onClick={() => navigate({ pathname: settingsPath, search: `?${createSearchParams({ chatId: chat.id })}` })}>
                                <FaCog className="mb-1" />
                            </Button>
                        </WithTooltip>
                    }>
                    <ChatMessageListPanel chatId={chat.id} />
                </ScrollPanel>
            )}
        </>
    );
}


const ChatPanel = ({ settingsPath }: { settingsPath: string }) => {

    const [searchParams] = useSearchParams();
    const { dashboard } = useDashboard();
    const chatId = searchParams.get('chatId');

    return (
        <>
            {dashboard && chatId && <ChatPanelContent profile={dashboard.profile} chatId={chatId} settingsPath={settingsPath} />}
        </>

    );
};

export default ChatPanel;
