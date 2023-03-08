import { Badge } from "react-bootstrap";
import { FaUserFriends } from "react-icons/fa";
import { useChat } from "../../store/DashboardHook";
import { useProfile } from "../../store/ProfileHook";
import { Chat } from "../../types";
import IconWithBorder from "./IconWithBorder";
import PendingSpinner from "./PendingSpinner";
import ProfileHeader from "./ProfileHeader";
import WithTooltip from "./WithTooltip";

const ChatHeader = ({ chat, nameOnHover, disableNotificationBadge = false }: { chat: Chat, nameOnHover?: boolean, disableNotificationBadge?: boolean }) => {

    const { chatMessageAddNotificationsForReferenceId: notifications } = useChat({ chatId: chat.id });
    const { profileWrapper } = useProfile({ profileId: chat.participants[0].id });

    return (
        <div className="d-flex align-items-center justify-content-between">
            {chat.participants.length === 1 &&
                <>
                    {profileWrapper === undefined || profileWrapper.asyncState.pending
                        ? <IconWithBorder><PendingSpinner /></IconWithBorder>
                        : profileWrapper.profile && <ProfileHeader name={profileWrapper.profile.name} image={profileWrapper.profile.image} nameOnHover={nameOnHover} />
                    }
                </>
            }
            {chat.participants.length > 1 && (
                <>
                    <IconWithBorder>
                        {nameOnHover
                            ? <WithTooltip tooltipMessage={chat.title}><FaUserFriends /></WithTooltip>
                            : <FaUserFriends />
                        }
                    </IconWithBorder>
                    {!nameOnHover && <span className="text-truncate flex-fill">{chat.title}</span>}
                </>
            )}

            {!disableNotificationBadge &&
                <div className="ms-auto">{notifications.length > 0 && <Badge>{notifications.length}</Badge>}</div>
            }
        </div>
    );
};

export default ChatHeader;