import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { Profile, ProfilesState } from "../types";
import { loadProfile as loadProfileSolid } from "./solid/Profile";

export const loadProfile = createAsyncThunk<Profile, string, { rejectValue: string }>(
    "profile/load",
    async (profileId, { rejectWithValue }) => {
        try {
            return await loadProfileSolid(profileId);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "" + error);
        }
    }
);

const initialState: ProfilesState = { profiles: [] };

const slice = createSlice({
    name: 'profile',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(loadProfile.pending, (state, action) => {
            const profileWrapper = makeSelectProfileWrapperById()(state, action.meta.arg);
            if (profileWrapper) {
                profileWrapper.asyncState.pending = true;
                profileWrapper.asyncState.error = undefined;
            } else {
                state.profiles = [...state.profiles, { id: action.meta.arg, asyncState: { pending: true } }]
            }
        }).addCase(loadProfile.fulfilled, (state, action) => {
            const profileWrapper = makeSelectProfileWrapperById()(state, action.meta.arg);
            if (profileWrapper) {
                profileWrapper.asyncState.pending = false;
                profileWrapper.profile = action.payload;
            }
        }).addCase(loadProfile.rejected, (state, action) => {
            const profileWrapper = makeSelectProfileWrapperById()(state, action.meta.arg);
            if (profileWrapper) {
                profileWrapper.asyncState.pending = false;
                profileWrapper.asyncState.error = action.payload;
            }
        });
    }
});

export default slice.reducer;

/*
 * Selectors
 */

const selectProfileId = (_state: ProfilesState, profileId: string) => profileId;
const selectProfileIds = (_state: ProfilesState, profileIds: string[]) => profileIds;
const selectProfileWrappers = (state: ProfilesState) => state.profiles;

export const makeSelectHasProfileId = () => createSelector(
    [selectProfileWrappers, selectProfileId],
    (profileWrappers, profileId) => profileWrappers.findIndex(p => p.id === profileId) > -1
);

export const makeSelectProfileWrapperById = () => createSelector(
    [selectProfileWrappers, selectProfileId],
    (profileWrappers, profileId) => profileWrappers.find(p => p.id === profileId)
);

export const makeSelectProfileIdsToLoad = () => createSelector(
    [selectProfileWrappers, selectProfileIds],
    (profileWrappers, profileIds) => profileIds.filter(profileId => profileWrappers.findIndex(pw => pw.id === profileId) === -1)
);