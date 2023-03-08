import { useEffect, useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useAppDispatch } from "../../store";
import { useChatCreate } from "../../store/ChatCreateHook";
import { addProfile, chatCreateSubmit } from "../../store/ChatCreateSlice";
import { useDashboard } from "../../store/DashboardHook";
import { useProfile } from "../../store/ProfileHook";
import { loadProfile } from "../../store/ProfileSlice";
import ChatCreateParticipants from "./ChatCreateParticipants";
import PendingSpinner from "./PendingSpinner";
import PodProviderWebidSelect from "./PodProviderWebidSelect";

const ChatCreateForm = ({ ownerId }: { ownerId: string }) => {

    const [webidSelectError, setWebidSelectError] = useState<string | undefined>(undefined);
    const [podProviderWebid, setPodProviderWebid] = useState("");
    const [podProviderWebidRequested, setPodProviderWebidRequested] = useState("");
    const { dashboard } = useDashboard();
    const { profileIds } = useChatCreate();
    const { profileWrapper } = useProfile({ profileId: podProviderWebid });
    const { profileWrapper: profileWrapperRequested } = useProfile({ profileId: podProviderWebidRequested });
    const dispatch = useAppDispatch();

    const resetError = () => {
        setWebidSelectError(undefined);
    };

    const isInvalid = (): boolean => {
        return webidSelectError !== undefined || profileWrapper?.asyncState.error !== undefined;
    };

    const validateWebid = (webid: string): boolean => {
        if (webid === "") {
            setWebidSelectError("No empty values permitted");
            return false;
        }

        try {
            new URL(webid);
        } catch (err) {
            setWebidSelectError("Web-ID is not a valid URL.");
            return false;
        }

        if (ownerId === webid) {
            setWebidSelectError("This is your Web-ID.");
            return false;
        }

        if (profileIds.includes(webid)) {
            setWebidSelectError("You already added this Web-ID.");
            return false;
        }

        return true;
    }

    const addProfileWebid = (evt: React.MouseEvent<HTMLButtonElement>, webid: string) => {
        evt.preventDefault();
        const webidTrimmed = webid.trim();

        const isWebidValid = validateWebid(webidTrimmed);
        if (isWebidValid) {
            if (profileWrapper) {
                if (profileWrapper.profile) {
                    dispatch(addProfile(profileWrapper.profile));
                }
            } else {
                dispatch(loadProfile(webidTrimmed));
                setPodProviderWebidRequested(webidTrimmed);
            }
        }
    };

    const startChat = () => {
        if (dashboard) {
            dispatch(chatCreateSubmit({ dashboard }));
        }
    }

    const pending = useMemo(() => profileWrapperRequested && profileWrapperRequested.asyncState.pending, [profileWrapperRequested]);

    useEffect(() => {
        if (profileWrapperRequested?.profile) {
            dispatch(addProfile(profileWrapperRequested.profile));
        }
    }, [dispatch, profileWrapperRequested?.profile, profileWrapperRequested?.id]);

    return (
        <Form noValidate id="ChatCreateForm">
            <h5 className="ms-1">Add a friend to chat with</h5>
            <PodProviderWebidSelect podProviderWebid={podProviderWebid} setPodProviderWebid={setPodProviderWebid} resetError={resetError} isInvalid={isInvalid}>
                <Button onClick={(evt: React.MouseEvent<HTMLButtonElement>) => addProfileWebid(evt, podProviderWebid)}
                    className="shadow-none" disabled={pending} type="submit" style={{ width: '60px' }}>
                    {pending
                        ? <PendingSpinner />
                        : <span>add</span>
                    }
                </Button>
            </PodProviderWebidSelect>
            <small className="text-danger ms-1">{webidSelectError || profileWrapper?.asyncState.error}</small>
            <ChatCreateParticipants />
            {profileIds.length > 0 &&
                <div className="d-flex justify-content-end"><Button className="shadow-none my-2" disabled={profileIds.length === 0} onClick={() => startChat()}>start chat</Button></div>
            }
        </Form>
    );
};

export default ChatCreateForm;
