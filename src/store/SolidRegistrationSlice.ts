import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { register as solidRegister } from "../store/solid/ApplicationApi";
import { AsyncState, RegistrationPayload, RegistrationResult } from "../types";

type SolidRegistrationState = {
    asyncState: AsyncState;
    result?: RegistrationResult;
}

export const register = createAsyncThunk<RegistrationResult, RegistrationPayload, { rejectValue: string }>(
    'solidRegistration/register',
    async (registrationPayload, { rejectWithValue }) => {
        try {
            return await solidRegister(registrationPayload);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : error + '');
        }
    }
);

export const selectRegistrationResult = (state: SolidRegistrationState) => state.result;
export const selectRegistrationPending = (state: SolidRegistrationState) => state.asyncState.pending;
export const selectRegistrationError = (state: SolidRegistrationState) => state.asyncState.error;
export const selectRegistrationDuplicateUserError = createSelector([selectRegistrationResult], registrationResult => registrationResult?.statusCode === 400 ? 'Username already exists' : undefined);
export const selectRegistrationSuccess = createSelector([selectRegistrationResult], registrationResult => registrationResult !== undefined && registrationResult.statusCode === 200);

const initialState: SolidRegistrationState = { asyncState: { pending: false } };

const slice = createSlice({
    name: 'solidRegistration',
    initialState,
    reducers: {
        resetRegistrationResult: (state) => ({ ...state, result: undefined }),
        resetRegistrationError: (state) => ({ ...state, asyncState: { ...state.asyncState, error: undefined } })
    },
    extraReducers: builder => {
        builder.addCase(register.pending, (state) => {
            state.asyncState.pending = true;
            state.asyncState.error = undefined;
        }).addCase(register.fulfilled, (state, action) => {
            state.asyncState.pending = false;
            state.result = action.payload;
        }).addCase(register.rejected, (state, action) => {
            state.asyncState.pending = false;
            state.asyncState.error = action.payload;
        });
    }
});

export const { resetRegistrationResult, resetRegistrationError } = slice.actions;
export default slice.reducer;