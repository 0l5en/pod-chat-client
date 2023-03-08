import { Button, ListGroup, ListGroupItem } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { useAppDispatch } from "../../store";
import { useChatCreate } from "../../store/ChatCreateHook";
import { removeProfile } from "../../store/ChatCreateSlice";
import { useProfile } from "../../store/ProfileHook";
import IconWithBorder from "./IconWithBorder";
import PendingSpinner from "./PendingSpinner";
import ProfileHeader from "./ProfileHeader";

const ChatCreateParticipant = ({ profileId }: { profileId: string }) => {

    const { profileWrapper } = useProfile({ profileId })
    const dispatch = useAppDispatch();

    return (
        <div className="d-flex justify-content-between align-items-center">
            {profileWrapper === undefined || profileWrapper.asyncState.pending
                ? <IconWithBorder><PendingSpinner /></IconWithBorder>
                : profileWrapper.profile && (
                    <>
                        <ProfileHeader name={profileWrapper.profile.name} image={profileWrapper.profile.image} />
                        <Button variant="link" title="remove" className="shadow-none" onClick={() => dispatch(removeProfile(profileId))}>
                            <FaTrash />
                        </Button>
                    </>
                )
            }
        </div>
    );
};


const ChatCreateParticipants = () => {

    const { profileIds } = useChatCreate();

    return (
        <ListGroup className="mt-2">
            {profileIds.map(profileId => (
                <ListGroupItem key={profileId}>
                    <ChatCreateParticipant profileId={profileId} />
                </ListGroupItem>
            ))}
        </ListGroup>
    );
};

export default ChatCreateParticipants;
