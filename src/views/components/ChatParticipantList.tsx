import { useEffect, useRef } from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { useAppDispatch } from "../../store";
import { loadProfile } from "../../store/ProfileSlice";
import ChatParticipant from "./ChatParticipant";

const ChatParticipantList = ({ participantIds }: { participantIds: string[] }) => {
    const ref = useRef<boolean>(false);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!ref.current && participantIds.length > 0) {
            participantIds.forEach(participantId => dispatch(loadProfile(participantId)));
            ref.current = true;
        }
    }, [dispatch, participantIds]);

    return (
        <ListGroup>
            {participantIds.map(participantId => (
                <ListGroupItem key={participantId}>
                    <ChatParticipant profileId={participantId} />
                </ListGroupItem>
            ))}
        </ListGroup>
    );
}

export default ChatParticipantList;
