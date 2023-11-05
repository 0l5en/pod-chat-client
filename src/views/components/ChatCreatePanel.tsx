import { useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store";
import { useChatCreate } from "../../store/ChatCreateHook";
import { resetState } from "../../store/ChatCreateSlice";
import { useDashboard } from "../../store/DashboardHook";
import { addChat } from "../../store/DashboardSlice";
import ChatCreateForm from "./ChatCreateForm";
import IconWithBorder from "./IconWithBorder";
import ScrollPanel from "./ScrollPanel";

const ChatCreatePanel = ({ chatPath }: { chatPath: string }) => {

    const { dashboard } = useDashboard();
    const { chatCreated } = useChatCreate();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const header =
        <div className="d-flex align-items-center py-1">
            <IconWithBorder><FaPlus /></IconWithBorder> Create a new chat
        </div>;

    useEffect(() => {
        if (chatCreated) {
            if (chatCreated.isNew) {
                dispatch(addChat(chatCreated));
            }

            navigate(chatPath + '/' + encodeURIComponent(chatCreated.id));
            dispatch(resetState());
        }
    }, [dispatch, chatCreated, chatPath, navigate]);

    return (
        <ScrollPanel header={header}>
            {dashboard && <ChatCreateForm ownerId={dashboard.profile.id} />}
        </ScrollPanel>
    );
};

export default ChatCreatePanel;
