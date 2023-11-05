import { useEffect, useRef } from "react";
import { Button, ListGroup, ListGroupItem } from "react-bootstrap";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "../../store";
import { useChatDelete } from "../../store/ChatDeleteHook";
import { chatDeleteSubmit, resetState } from "../../store/ChatDeleteSlice";
import { useParticipantsHavingReadAccess } from "../../store/ChatSettingsHook";
import { participantsHavingReadAccessLoad } from "../../store/ChatSettingsSlice";
import { useChat, useDashboard } from "../../store/DashboardHook";
import { removeChat } from "../../store/DashboardSlice";
import { Chat, Dashboard } from "../../types";
import ChatHeader from "./ChatHeader";
import ChatOfParticipantPanel from "./ChatOfParticipantPanel";
import PendingSpinner from "./PendingSpinner";
import ScrollPanel from "./ScrollPanel";
import WithTooltip from "./WithTooltip";

const ChatSettingsHeader = ({ chat }: { chat: Chat }) => {
    return (
        <div className="d-flex my-1 align-items-center">
            <ChatHeader chat={chat} nameOnHover={true} disableNotificationBadge={true} />
            <div>Settings</div>
        </div>
    );
}

const ChatSettingsFooter = ({ chatId, privateTypeIndex, publicTypeIndex, backLink }: { chatId: string, privateTypeIndex: string, publicTypeIndex: string, backLink: string }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { pending, chatDeleted } = useChatDelete();

    useEffect(() => {
        if (chatDeleted) {
            dispatch(removeChat(chatDeleted));
            dispatch(resetState());
            navigate('/');
        }
    }, [dispatch, navigate, chatDeleted]);

    return (
        <div className="d-flex justify-content-between w-100">
            <WithTooltip tooltipMessage="Back to chat"><Button className="schadow-none m-2" onClick={() => navigate(backLink)} disabled={pending}>
                <FaArrowLeft className="mb-1" />
            </Button>
            </WithTooltip>
            <WithTooltip tooltipMessage="Delete chat">
                <Button variant="danger" className="shadow-none m-2" onClick={() => dispatch(chatDeleteSubmit({ chatId, privateTypeIndex, publicTypeIndex }))} disabled={pending}>
                    {pending
                        ? <PendingSpinner />
                        : <FaTrash />
                    }
                </Button>
            </WithTooltip>
        </div>
    );
}

const ChatSettingsContent = ({ chatId, dashboard, backLink }: { chatId: string, dashboard: Dashboard, backLink: string }) => {

    const { chat } = useChat({ chatId });
    const { participantsHavingReadAccessPending } = useParticipantsHavingReadAccess({ chatId });
    const dispatch = useAppDispatch();
    const ref = useRef<boolean>(false);

    useEffect(() => {
        if (!ref.current) {
            dispatch(participantsHavingReadAccessLoad(chatId));
            ref.current = true;
        }
    }, [dispatch, chatId])

    return (
        <>
            {chat && (
                <ScrollPanel
                    header={<ChatSettingsHeader chat={chat} />}
                    footer={<ChatSettingsFooter backLink={backLink} chatId={chat.id} privateTypeIndex={dashboard.profile.privateTypeIndexId} publicTypeIndex={dashboard.profile.publicTypeIndexId} />}>
                    <div className="d-flex flex-row-reverse">
                        <small className="text-muted">{(participantsHavingReadAccessPending) && <PendingSpinner />} You have permitted read access</small>
                    </div>
                    <ListGroup>
                        {chat.participants.map(p => (
                            <ListGroupItem key={p.id}>
                                <ChatOfParticipantPanel chatId={chatId} participantId={p.id} chatOfParticipantId={p.chatId} />
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </ScrollPanel>
            )}
        </>
    );
}

const ChatSettingsPanel = ({ backLink }: { backLink: string }) => {

    const { id: idParam } = useParams<string>();
    const { dashboard } = useDashboard();

    return (
        <>
            {dashboard && idParam && <ChatSettingsContent chatId={idParam} dashboard={dashboard} backLink={backLink} />}
        </>
    );
};

export default ChatSettingsPanel;
