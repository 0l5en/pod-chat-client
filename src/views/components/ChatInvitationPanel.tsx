import { useEffect, useMemo, useRef } from "react";
import { Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store";
import { useChatInvitation } from "../../store/ChatInvitationHook";
import { joinChatOfInvitation, loadChatOfInvitation, resetState } from "../../store/ChatInvitationSlice";
import { useDashboard, useNotifications } from "../../store/DashboardHook";
import { acceptSolidNotifications, addChat } from "../../store/DashboardSlice";
import ChatParticipantList from "./ChatParticipantList";
import IconWithBorder from "./IconWithBorder";
import PendingSpinner from "./PendingSpinner";
import ScrollPanel from "./ScrollPanel";

const ChatInvitationPanel = ({ chatPath, backLink }: { chatPath: string, backLink: string }) => {

    const ref = useRef<boolean>(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { dashboard } = useDashboard();
    const { pending, chatOfInvitation, participantChatId } = useChatInvitation();
    const { chatNotificationsForTargetId } = useNotifications({ chatId: participantChatId });
    const participantIds = useMemo(() => chatOfInvitation ? chatOfInvitation.participants.map(p => p.id) : [], [chatOfInvitation]);

    const onDecline = () => {
        navigate(backLink);
        dispatch(acceptSolidNotifications(chatNotificationsForTargetId));
        dispatch(resetState());
    }

    const onAccept = () => {
        if (dashboard) {
            dispatch(joinChatOfInvitation(dashboard.profile));
        }
    }

    const header =
        <div className="d-flex align-items-center py-1">
            <IconWithBorder><FaPlus /></IconWithBorder> Accept or decline the invitation to chat with
            {pending && <>&nbsp;<PendingSpinner /></>}
        </div>;

    const footer =
        <>
            {dashboard &&
                <div className="d-flex justify-content-between w-100">
                    <Button variant="success" className="shadow-none m-2" onClick={onAccept}>Accept</Button>
                    <Button variant="danger" className="shadow-none m-2" onClick={onDecline}>Decline</Button>
                </div>
            }
        </>;

    useEffect(() => {
        if (!ref.current) {
            dispatch(loadChatOfInvitation());
            ref.current = true;
        }
    }, [dispatch]);

    useEffect(() => {
        if (chatOfInvitation?.isJoined) {
            if (chatOfInvitation.isNew) {
                dispatch(addChat(chatOfInvitation));
            }

            navigate(chatPath + '/' + encodeURIComponent(chatOfInvitation.id));
            dispatch(resetState());
        }
    }, [dispatch, chatOfInvitation, chatPath, navigate]);

    return (
        <ScrollPanel header={header} footer={footer}>
            {chatOfInvitation && <ChatParticipantList participantIds={participantIds} />}
        </ScrollPanel>
    );
};

export default ChatInvitationPanel;
