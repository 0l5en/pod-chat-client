import { login, logout } from "@inrupt/solid-client-authn-browser";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { AppState } from ".";

export interface SolidAuthState {
    pending: boolean,
    webid?: string,
    error?: string
}

const initialState: SolidAuthState = { pending: false };

export const solidLogin = createAsyncThunk<void, string, { rejectValue: string }>(
    "solidAuth/login",
    async (podProvider, { rejectWithValue }): Promise<void> => {
        try {
            await login({
                oidcIssuer: podProvider,
                redirectUrl: window.location.origin
            });
        } catch (error) {
            rejectWithValue(error instanceof Error ? error.message : "" + error);
        }
    }
);

export const solidLogout = createAsyncThunk<void>(
    "solidAuth/logout",
    async () => {
        await logout();
    }
);

const slice = createSlice({
    name: "solidAuth",
    initialState,
    reducers: {
        loggedIn(state, action: PayloadAction<string>) {
            return { ...state, webid: action.payload };
        },
        loggedOut(state) {
            return { ...state, webid: undefined };
        }
    },
    extraReducers: builder => {
        builder.addCase(solidLogin.pending, (state) => {
            state.pending = true;
        });
        builder.addCase(solidLogin.fulfilled, (state) => {
            state.pending = false;
        });
        builder.addCase(solidLogin.rejected, (state, action) => {
            state.error = action.payload;
            state.webid = undefined;
            state.pending = false;
        });
    }
});

const selectWebid = (state: SolidAuthState) => state.webid;
const selectError = (state: SolidAuthState) => state.error;
const selectPending = (state: SolidAuthState) => state.pending;

export const useSolidAuth = () => {
    const webid = useSelector((state: AppState) => selectWebid(state.solidAuthState));
    const error = useSelector((state: AppState) => selectError(state.solidAuthState));
    const pending = useSelector((state: AppState) => selectPending(state.solidAuthState));
    return { webid, error, pending };
}

export default slice.reducer;
export const { loggedIn, loggedOut } = slice.actions;