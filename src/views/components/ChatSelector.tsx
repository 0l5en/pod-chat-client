import { ListGroup } from "react-bootstrap";
import { useDashboard } from "../../store/DashboardHook";
import ChatHeader from "./ChatHeader";
import ChatListGroupItem from "./ChatListGroupItem";

const ChatSelector = ({ chatPath }: { chatPath: string }) => {

    const { chats } = useDashboard();

    return (
        <ListGroup>
            {chats.map(chat => (
                <ChatListGroupItem key={chat.id} chatPath={chatPath} chatId={chat.id}>
                    <ChatHeader chat={chat} />
                </ChatListGroupItem>
            ))}
        </ListGroup>
    );
};

export default ChatSelector;
