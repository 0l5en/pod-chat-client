import { useEffect } from "react";
import { Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store";
import { useChatOfInviter } from "../../store/ChatInviterHook";
import { createChatForInviter, declineChatForInviter, resetState } from "../../store/ChatInviterSlice";
import { useDashboard } from "../../store/DashboardHook";
import { addChat, resetInviter } from "../../store/DashboardSlice";
import { idValueFromChatId } from "../../store/solid/Chat";
import ChatParticipantList from "./ChatParticipantList";
import IconWithBorder from "./IconWithBorder";
import PendingSpinner from "./PendingSpinner";
import ScrollPanel from "./ScrollPanel";

const ChatInviterPanel = ({ chatPath, backLink }: { chatPath: string, backLink: string }) => {

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { dashboard } = useDashboard();
    const { pending, chatOfInviter, chatOfInviterDeclined } = useChatOfInviter();

    const onAccept = () => {
        if (dashboard?.inviter) {
            dispatch(createChatForInviter({ inviterId: dashboard.inviter.id }))
        }
    }

    const onDecline = () => {
        dispatch(declineChatForInviter());
    }

    const header =
        <div className="d-flex align-items-center py-1">
            <IconWithBorder><FaPlus className="mb-1" /></IconWithBorder> Accept or decline the invitation to chat with
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
        if (chatOfInviter) {
            if (chatOfInviter.isNew) {
                dispatch(addChat(chatOfInviter));
            }
            navigate(chatPath + '/' + idValueFromChatId(chatOfInviter.id));
            dispatch(resetInviter());
            dispatch(resetState());
        }
    }, [dispatch, chatOfInviter, chatPath, navigate]);

    useEffect(() => {
        if (chatOfInviterDeclined) {
            navigate(backLink);
            dispatch(resetInviter());
            dispatch(resetState());
        }
    }, [dispatch, chatOfInviterDeclined, backLink, navigate]);

    return (
        <>
            {dashboard?.inviter
                ? <ScrollPanel header={header} footer={footer}><ChatParticipantList participantIds={[dashboard.inviter.id]} /> </ScrollPanel>
                : <div>No data available for the requested operation.</div>}
        </>
    );
};

export default ChatInviterPanel;
