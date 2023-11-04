import { EVENTS, getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { createAction } from "@reduxjs/toolkit";
import { AnyAction, Dispatch, MiddlewareAPI } from "redux";
import { AppState } from ".";
import AppMiddleware from "./AppMiddleware";
import { loggedIn, loggedOut } from "./SolidAuthSlice";
import { createSolidDownStreamDisconnectAction } from "./SolidNotificationMiddleware";

export const trackSolidSession = createAction("solid/auth/trackSession");

const solidAuthMiddleware = (): AppMiddleware<AppState, AnyAction> => {

    let trackSession = false;

    const startTrackSession = ({ dispatch }: MiddlewareAPI<Dispatch<AnyAction>>) => {
        if (!trackSession) {
            getDefaultSession().events.on(EVENTS.LOGIN, () => {
                const webid = getDefaultSession().info.webId;
                if (webid) {
                    dispatch(loggedIn(webid));
                }
            });
            getDefaultSession().events.on(EVENTS.LOGOUT, () => {
                trackSession = false;
                dispatch(loggedOut());
                dispatch(createSolidDownStreamDisconnectAction());
            });
            trackSession = true;
        }
    }

    return api => next => action => {
        if (trackSolidSession.match(action)) {
            startTrackSession(api);
        }

        return next(action);
    }
}

export default solidAuthMiddleware;