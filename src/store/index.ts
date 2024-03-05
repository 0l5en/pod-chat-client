import { UnknownAction, combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import chatCreateState from './ChatCreateSlice';
import chatDeleteState from './ChatDeleteSlice';
import chatInvitationState from './ChatInvitationSlice';
import chatInviterState from './ChatInviterSlice';
import chatMessageAnswerState from './ChatMessageAnswerSlice';
import chatMessageState from './ChatMessageSlice';
import chatOfParticipantState from './ChatSettingsSlice';
import dashboardState from './DashboardSlice';
import profileState from './ProfileSlice';
import sendMessageReplyState from './SendMessageReplySlice';
import sendMessageState from './SendMessageSlice';
import solidRegistrationState from './SolidRegistrationSlice';

import solidAuthMiddleware from './SolidAuthMiddleware';
import solidAuthState, { loggedOut } from './SolidAuthSlice';
import solidNotificationMiddleware from './SolidNotificationMiddleware';

const rootReducer = combineReducers({
    chatCreateState,
    chatDeleteState,
    chatMessageState,
    chatOfParticipantState,
    chatInvitationState,
    chatMessageAnswerState,
    chatInviterState,
    dashboardState,
    profileState,
    sendMessageState,
    sendMessageReplyState,
    solidAuthState,
    solidRegistrationState
});

export type AppState = ReturnType<typeof rootReducer>;

const appReducer = (state: AppState | undefined, dispatch: UnknownAction) => {
    if (dispatch.type === loggedOut.type) {
        state = undefined;
    }
    return rootReducer(state, dispatch);
};

const createStore = () => configureStore({
    reducer: appReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware()
        .concat(solidAuthMiddleware(), solidNotificationMiddleware())
});


const store = createStore();
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export default store;