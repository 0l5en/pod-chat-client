import { useProfile } from "../../store/ProfileHook";
import IconWithBorder from "./IconWithBorder";
import PendingSpinner from "./PendingSpinner";
import ProfileHeader from "./ProfileHeader";

const ChatParticipant = ({ profileId }: { profileId: string }) => {

    const { profileWrapper } = useProfile({ profileId })

    return (
        <div className="d-flex justify-content-between align-items-center">
            {profileWrapper === undefined || profileWrapper.asyncState.pending
                ? <IconWithBorder><PendingSpinner /></IconWithBorder>
                : profileWrapper.profile && <ProfileHeader name={profileWrapper.profile.name} image={profileWrapper.profile.image} />
            }
        </div>
    );
};

export default ChatParticipant;
