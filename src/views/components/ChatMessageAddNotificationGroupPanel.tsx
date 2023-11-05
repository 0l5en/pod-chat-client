import { useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import { FaComments, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store";
import { setInvitation } from "../../store/ChatInvitationSlice";
import { useDashboard } from "../../store/DashboardHook";
import { useProfile } from "../../store/ProfileHook";
import { loadProfile } from "../../store/ProfileSlice";
import { SolidNotification } from "../../types";
import ProfileHeader from "./ProfileHeader";
import WithTooltip from "./WithTooltip";

const ChatConversation = ({
    chatPath,
    meChatId,
    groupCount,
    participantProfileName,
    participantProfileImage
}: {
    chatPath: string,
    meChatId: string,
    groupCount: number,
    participantProfileName: string,
    participantProfileImage?: string
}) => {
    const navigate = useNavigate();
    const navigatTo = chatPath + '/' + encodeURIComponent(meChatId);
    return (
        <>
            <div className="d-flex align-items-center">
                <ProfileHeader name={participantProfileName} image={participantProfileImage} nameOnHover={false} />
                <span className="ms-1">has sent {groupCount} Message{groupCount > 1 && 's'}</span>
            </div>
            <div>
                <Button onClick={() => navigate(navigatTo)}><FaComments className="mb-1" /></Button>
            </div>
        </>
    );
}

const ChatInvitation = ({
    chatPath,
    authProfileId,
    participantId,
    participantChatId,
    participantProfileName,
    participantProfileImage
}: {
    chatPath: string,
    authProfileId: string,
    participantId: string,
    participantChatId: string,
    participantProfileName: string,
    participantProfileImage?: string
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const navigatTo = chatPath + '/invitation';

    const handleClick = () => {
        dispatch(setInvitation({ authProfileId, participantId, participantChatId }));
        navigate(navigatTo);
    }

    return (<>
        <div className="d-flex align-items-center">
            <ProfileHeader name={participantProfileName} image={participantProfileImage} nameOnHover={true} />
            <span className="ms-1">would like to invite you to a chat</span>
        </div>
        <div>
            <WithTooltip tooltipMessage="New chat"><Button onClick={handleClick}><FaPlus className="mb-1" /></Button></WithTooltip>
        </div>
    </>);
}


const ChatMessageAddNotificationGroupPanel = ({ chatPath, group }: {
    chatPath: string,
    group: {
        count: number;
        element: SolidNotification;
    }
}) => {

    const { dashboard } = useDashboard();
    const { profileWrapper } = useProfile({ profileId: group.element.actorId });
    const ref = useRef<boolean>(false);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!ref.current && profileWrapper === undefined) {
            dispatch(loadProfile(group.element.actorId));
            ref.current = true;
        }
    }, [dispatch, profileWrapper, group.element.actorId]);

    return (
        <div className="d-flex align-items-center justify-content-between">
            {dashboard && profileWrapper && profileWrapper.profile && (
                <>
                    {group.element.referenceId
                        ? <ChatConversation
                            chatPath={chatPath} meChatId={group.element.referenceId} groupCount={group.count}
                            participantProfileName={profileWrapper.profile.name} participantProfileImage={profileWrapper.profile.image} />
                        : <ChatInvitation
                            chatPath={chatPath} authProfileId={dashboard.profile.id} participantId={group.element.actorId} participantChatId={group.element.targetId}
                            participantProfileName={profileWrapper.profile.name} participantProfileImage={profileWrapper.profile.image} />
                    }
                </>
            )}
        </div>
    );
};

export default ChatMessageAddNotificationGroupPanel;
