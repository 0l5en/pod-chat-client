import { useEffect, useRef } from "react";
import { useAppDispatch } from "../../store";
import { useChatOfParticipant } from "../../store/ChatSettingsHook";
import { chatOfParticipantLoad } from "../../store/ChatSettingsSlice";
import { useProfile } from "../../store/ProfileHook";
import { loadProfile } from "../../store/ProfileSlice";
import { FeedbackType } from "../../types";
import Feedback from "./Feedback";
import IconWithBorder from "./IconWithBorder";
import PendingSpinner from "./PendingSpinner";
import ProfileHeader from "./ProfileHeader";
import UserReadAccessSwitch from "./UserReadAccessSwitch";

const getErrorMessage = (solidErrorMessage: string) => {
    if (solidErrorMessage.indexOf('[403] [Forbidden]')) {
        return 'Has not permitted read access for me.';
    }
    return solidErrorMessage;
}

const ChatOfParticipantContent = ({ chatId, participantId, chatOfParticipantId }: { chatId: string, participantId: string, chatOfParticipantId: string }) => {
    const { chatWrapper } = useChatOfParticipant({ chatId, chatOfParticipantId });
    const refChat = useRef<boolean>(false);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!refChat.current && chatWrapper === undefined) {
            dispatch(chatOfParticipantLoad({ chatId, chatOfParticipantId, participantId }));
            refChat.current = true;
        }
    }, [dispatch, chatWrapper, chatId, chatOfParticipantId, participantId]);

    return (
        <>
            {chatWrapper?.asyncState.error
                ? <Feedback type={FeedbackType.ERROR}><>{getErrorMessage(chatWrapper.asyncState.error)}</></Feedback>
                : <Feedback type={FeedbackType.SUCCESS}><>Everything ok - ready for chat!</></Feedback>
            }
        </>
    );
}

const ChatOfParticipantPanel = ({ chatId, participantId, chatOfParticipantId }: { chatId: string, participantId: string, chatOfParticipantId?: string }) => {

    const { profileWrapper } = useProfile({ profileId: participantId });

    const dispatch = useAppDispatch();
    const refProfile = useRef<boolean>(false);

    useEffect(() => {
        if (!refProfile.current && profileWrapper === undefined) {
            dispatch(loadProfile(participantId));
            refProfile.current = true;
        }
    }, [dispatch, profileWrapper, participantId]);

    return (
        <>
            <div className="d-flex align-items-center justify-content-between">
                {profileWrapper === undefined || profileWrapper.asyncState.pending
                    ? <IconWithBorder><PendingSpinner /></IconWithBorder>
                    : profileWrapper.profile && <ProfileHeader name={profileWrapper.profile.name} image={profileWrapper.profile.image} />
                }
                <UserReadAccessSwitch chatId={chatId} participantId={participantId} />
            </div>
            {chatOfParticipantId
                ? <div className="mt-1 ms-1">
                    {profileWrapper && profileWrapper.profile && profileWrapper.profile.applicationReadAccessPermitted
                        ? <ChatOfParticipantContent chatId={chatId} chatOfParticipantId={chatOfParticipantId} participantId={participantId} />
                        : <Feedback type={FeedbackType.ERROR}><>Has not permitted read access for pod-chat application at {window.location.origin}.</></Feedback>
                    }
                </div>
                : <div className="mt-1 ms-1"><Feedback type={FeedbackType.WARN}><>Has not yet accepted your invitation.</></Feedback></div>
            }
        </>
    );
};

export default ChatOfParticipantPanel;
