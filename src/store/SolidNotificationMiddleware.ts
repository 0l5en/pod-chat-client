import { AnyAction, createAction, Dispatch, Middleware, MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit";
import ReconnectingWebSocket from 'reconnecting-websocket';
import { AppState } from ".";
import { ConnectActionPayload, Profile } from "../types";
import { setNotifications } from "./DashboardSlice";
import { STORAGE_NOTIFICATIONS_CLEANUP_INTERVAL_MS } from "./solid/Constants";
import { notificationsFromProfileInbox } from "./solid/Dashboard";
import { cleanupNotifications } from "./solid/Notification";

const processNextNotification = async (
    dispatch: Dispatch<UnknownAction>,
    profile: Profile,
    setNotificationProcessPending: (pending: boolean) => void,
    setStaleInboxData: (pending: boolean) => void,
    getStaleInboxData: () => boolean): Promise<void> => {

    setNotificationProcessPending(true);

    do {
        try {
            setStaleInboxData(false);
            const notifications = await notificationsFromProfileInbox({ profile, force: true });
            dispatch(setNotifications(notifications));
        } catch (error) {
            console.error("cannot load notifications: ", error);
        }
    } while (getStaleInboxData());

    setNotificationProcessPending(false);
}


const solidNotificationMiddleware = (): Middleware<{}, AppState> => {
    let socket: ReconnectingWebSocket | undefined = undefined;
    let notificationProcessPending: boolean = false;
    let staleInboxData: boolean = false;
    let cleanupNotificationsWorkerId: number | undefined = undefined;
    let cleanupNotificationsPending: boolean = false;

    const setNotificationProcessPending = (pending: boolean) => {
        notificationProcessPending = pending;
    }

    const setStaleInboxData = (stale: boolean) => {
        staleInboxData = stale;
    }

    const getStaleInboxData = (): boolean => {
        return staleInboxData;
    }

    const connectUrlFromAuthWebid = (authWebid: string) => {
        return 'wss://' + new URL(authWebid).host;
    };

    const onOpen = (_api: MiddlewareAPI<Dispatch<AnyAction>, AppState>, { profile }: ConnectActionPayload) => () => {
        if (socket) {
            socket.send("sub " + profile.inboxId);
        }
    }

    const onMessage = ({ dispatch }: MiddlewareAPI<Dispatch<AnyAction>, AppState>, { profile }: ConnectActionPayload) => (event: MessageEvent) => {
        const payload = event.data as string;
        if (payload.startsWith("pub ") && payload.substring(4) === profile.inboxId) {
            if (notificationProcessPending) {
                setStaleInboxData(true);
            } else {
                processNextNotification(dispatch, profile, setNotificationProcessPending, setStaleInboxData, getStaleInboxData);
            }
        } else if (payload.startsWith("ack ")) {
            // acknowledge
        } else {
            console.warn("unexpected downstream message received:", payload);
        }
    }

    const onCleanupNotifications = (_: MiddlewareAPI<Dispatch<AnyAction>, AppState>, { profile }: ConnectActionPayload) => async () => {
        if (!cleanupNotificationsPending) {
            cleanupNotificationsPending = true;
            await cleanupNotifications(profile.storageId);
            cleanupNotificationsPending = false;
        }
    }

    const connectSocket = (api: MiddlewareAPI<Dispatch<AnyAction>, AppState>, payload: ConnectActionPayload) => {

        if (socket) {
            return;
        }

        socket = new ReconnectingWebSocket(connectUrlFromAuthWebid(payload.profile.id));
        socket.addEventListener('open', onOpen(api, payload))
        socket.addEventListener('message', onMessage(api, payload))
    }

    const startCleanupNotificationsWorker = (api: MiddlewareAPI<Dispatch<AnyAction>, AppState>, payload: ConnectActionPayload) => {
        if (!cleanupNotificationsWorkerId) {
            cleanupNotificationsWorkerId = window.setInterval(onCleanupNotifications(api, payload), STORAGE_NOTIFICATIONS_CLEANUP_INTERVAL_MS);
        }
    }

    const stopCleanupNotificationsWorker = () => {
        if (cleanupNotificationsWorkerId) {
            clearInterval(cleanupNotificationsWorkerId);
        }
    }

    return api => next => action => {
        if (createSolidDownStreamConnectAction.match(action)) {
            connectSocket(api, action.payload);
            startCleanupNotificationsWorker(api, action.payload);
        }
        if (createSolidDownStreamDisconnectAction.match(action)) {
            stopCleanupNotificationsWorker();
            if (socket) {
                socket.close();
                socket = undefined;
            }
        }
        return next(action);
    };
};

export default solidNotificationMiddleware;

export const createSolidDownStreamConnectAction = createAction(
    "solidNotification/middleware/connect",
    (payload: ConnectActionPayload) => ({ payload }));

export const createSolidDownStreamDisconnectAction = createAction(
    "solidNotification/middleware/disconnect");