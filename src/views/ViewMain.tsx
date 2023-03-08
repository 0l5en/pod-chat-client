import { handleIncomingRedirect } from "@inrupt/solid-client-authn-browser";
import { useEffect, useRef } from "react";
import { useAppDispatch } from "../store";
import { loggedIn, useSolidAuth } from "../store/SolidAuthSlice";
import ViewDashboard from "./ViewDashboard";
import ViewLogin from "./ViewLogin";

const ViewMain = ({ chatPath }: { chatPath: string }) => {

    const ref = useRef(false);
    const { webid } = useSolidAuth();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const init = async () => {
            try {
                const info = await handleIncomingRedirect({
                    restorePreviousSession: true
                });
                if (info && info.isLoggedIn && info.webId) {
                    dispatch(loggedIn(info.webId));
                }
            } catch (err) {
                console.error(err);
            }
        }
        if (!ref.current) {
            init();
            ref.current = true;
        }
    }, [dispatch]);

    return (
        <>{webid ? <ViewDashboard chatPath={chatPath} webid={webid} /> : <ViewLogin />}</>
    );
}

export default ViewMain;