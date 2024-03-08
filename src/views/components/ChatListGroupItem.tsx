import { ReactElement, useEffect, useRef } from "react";
import { ListGroupItem } from "react-bootstrap";
import { createSearchParams, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "../../store";
import { useChat } from "../../store/DashboardHook";
import { useProfileIdsToLoad } from "../../store/ProfileHook";
import { loadProfile } from "../../store/ProfileSlice";

const ChatListGroupItem = ({ chatPath, chatId, children }: { chatPath: string, chatId: string, children?: ReactElement }) => {
    let { id: idParam } = useParams<string>();
    const { chat } = useChat({ chatId });
    const { profileIdsToLoad } = useProfileIdsToLoad({ profileIds: chat ? chat.participants.map(p => p.id) : [] });
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const refProfileIdsToLoad = useRef<boolean>(false);

    const handleClick = () => {
        navigate({ pathname: chatPath, search: `?${createSearchParams({ chatId })}` });
    }

    useEffect(() => {
        if (!refProfileIdsToLoad.current && profileIdsToLoad.length > 0) {
            profileIdsToLoad.forEach(profileIdToLoad => dispatch(loadProfile(profileIdToLoad)));
            refProfileIdsToLoad.current = true;
        }
    }, [dispatch, profileIdsToLoad]);

    return (
        <ListGroupItem action={true} onClick={handleClick} active={chatId === idParam}>
            {children}
        </ListGroupItem>
    );
};

export default ChatListGroupItem;
