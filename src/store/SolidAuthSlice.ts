import { login, logout } from "@inrupt/solid-client-authn-browser";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { AppState } from ".";

export interface SolidAuthState {
    webid?: string,
    error?: string
}

const initialState: SolidAuthState = {};

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
        builder.addCase(solidLogin.pending, () => { });
        builder.addCase(solidLogin.fulfilled, () => { });
        builder.addCase(solidLogin.rejected, (state, action) => {
            state.error = action.payload;
            state.webid = undefined;
        });
    }
});

const selectWebid = (state: SolidAuthState) => state.webid;
const selectError = (state: SolidAuthState) => state.error;

export const useSolidAuth = () => {
    const webid = useSelector((state: AppState) => selectWebid(state.solidAuthState));
    const error = useSelector((state: AppState) => selectError(state.solidAuthState));
    return { webid, error };
}

export default slice.reducer;
export const { loggedIn, loggedOut } = slice.actions;