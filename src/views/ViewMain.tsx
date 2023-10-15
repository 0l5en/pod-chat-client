import { handleIncomingRedirect } from "@inrupt/solid-client-authn-browser";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../store";
import { loggedIn, useSolidAuth } from "../store/SolidAuthSlice";
import ViewDashboard from "./ViewDashboard";
import ViewLogin from "./ViewLogin";

const ViewMain = ({ chatPath }: { chatPath: string }) => {
    const [restoreSessionPending, setRestoreSessionPending] = useState<boolean>(false);
    const ref = useRef(false);
    const { webid, pending } = useSolidAuth();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const init = async () => {
            try {
                setRestoreSessionPending(true);
                const info = await handleIncomingRedirect({
                    restorePreviousSession: true
                });
                if (info && info.isLoggedIn && info.webId) {
                    dispatch(loggedIn(info.webId));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setRestoreSessionPending(false);
            }
        }
        if (!ref.current) {
            init();
            ref.current = true;
        }
    }, [dispatch]);

    return (
        <>{webid ? <ViewDashboard chatPath={chatPath} webid={webid} /> : <ViewLogin restoreSessionPending={restoreSessionPending || pending} />}</>
    );
}

export default ViewMain;