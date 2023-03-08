import { useEffect, useRef } from "react";
import { Button, ListGroup, ListGroupItem } from "react-bootstrap";
import { FaExclamationTriangle, FaHome, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router";
import { useAppDispatch } from "../store";
import { addProfile } from "../store/ChatCreateSlice";
import { useDashboard } from "../store/DashboardHook";
import { loadProfile } from "../store/ProfileSlice";
import { createSolidDownStreamConnectAction } from "../store/SolidNotificationMiddleware";
import { Profile } from "../types";
import ChatMessageAddNotificationGroupPanel from "./components/ChatMessageAddNotificationGroupPanel";
import IconWithBorder from "./components/IconWithBorder";
import ProfileHeader from "./components/ProfileHeader";
import ScrollPanel from "./components/ScrollPanel";
import WithTooltip from "./components/WithTooltip";

const Header = ({ profile }: { profile: Profile }) => {
    const dispatch = useAppDispatch();
    const ref = useRef<boolean>(false);
    useEffect(() => {
        if (!ref.current) {
            dispatch(createSolidDownStreamConnectAction({ profile }));
            ref.current = true;
        }
    }, [dispatch, profile]);

    return (
        <div className="d-flex align-items-center py-1">
            <IconWithBorder><FaHome /></IconWithBorder> Howdy {profile.name}!
        </div>);
};

const ChatInviter = ({ inviterProfile }: { inviterProfile: Profile }) => {

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleClick = () => {
        dispatch(loadProfile(inviterProfile.id));
        dispatch(addProfile(inviterProfile));
        navigate('/chat/inviter');
    }

    return (
        <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
                <ProfileHeader name={inviterProfile.name} image={inviterProfile.image} nameOnHover={true} />
                <span className="ms-1"> is the user that invited you to pod-chat</span>
            </div>
            <div>
                <WithTooltip tooltipMessage="New chat"><Button onClick={handleClick}><FaPlus className="mb-1" /></Button></WithTooltip>
            </div>
        </div>
    );
}

const ViewNotificationList = ({ chatPath }: { chatPath: string }) => {

    const { chatMessageAddNotificationGroups, dashboard, dashboardInviter } = useDashboard();
    const navigate = useNavigate();

    return (
        <>
            {dashboard &&
                <ScrollPanel header={<Header profile={dashboard.profile} />}>
                    {!dashboard.profile.applicationControlAccessPermitted
                        ? <div className="mb-2">
                            <div className="d-flex align-items-start text-warning">
                                <div className="mx-2"><FaExclamationTriangle className="mb-1" /></div>
                                <div>Please grant all 4 access modes or pod-chat will not work like expected.</div>
                            </div>
                            <div className="d-flex align-items-start text-default ms-4">
                                <div className="ms-2">
                                    <div>
                                        Pod-chat needs the right to handle your messages. This does not mean pod-chat has access to your messages/data at any time.
                                        All your data in this decentralized system is stored at many individual URL's ( https://yourpod.solidweb.org/message/#123 )
                                        that only you have the admin access to and can grant other users to read your messages.
                                        These 4 access-mode-rights enable the messenger-app to handle your messages (URL's) and deliver it to the credited users.
                                    </div>
                                    <div>
                                        You have to go to your <a className="text-decoration-none" href={dashboard.profile.id} target="_blank" rel="noreferrer">profile</a> to solve the problem.
                                        After changing the access modes in your profile simply reload this page and the warning will disapear.
                                    </div>
                                    <div>
                                        If you dont't have any idea how to manage access modes for your pod, feel free to visit our Q&A Section with a detailed explanation about <a className="text-decoration-none" href="/help">How to configure access modes for pod-chat application</a>.
                                    </div>
                                </div>
                            </div>
                        </div>
                        : chatMessageAddNotificationGroups.length === 0 && !dashboardInviter ? <>
                            <div>
                                You can start a new chat
                                <WithTooltip tooltipMessage='Start new chat'><Button size="sm" className="m-1 shadow-none" onClick={() => navigate(chatPath + '/new')}>
                                    <FaPlus className="mb-1" />
                                </Button></WithTooltip>
                                with an already registered user, select one of your existing chats on the right or invite your friends from other messengers by using your personal invitation link.
                            </div>
                            <h5 className="mt-3">Happy chatting!</h5>
                        </>
                            : <ListGroup>
                                {dashboardInviter && (
                                    <ListGroupItem key={dashboardInviter.id + '-inviter'}>
                                        <ChatInviter inviterProfile={dashboardInviter} />
                                    </ListGroupItem>
                                )}
                                {chatMessageAddNotificationGroups.map(group => (
                                    <ListGroupItem key={group.element.id}>
                                        <ChatMessageAddNotificationGroupPanel group={group} chatPath={chatPath} />
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                    }
                </ScrollPanel>
            }
        </>
    );
};

export default ViewNotificationList;
