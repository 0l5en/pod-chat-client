import { useSelector } from "react-redux";
import { AppState } from ".";
import { selectRegistrationDuplicateUserError, selectRegistrationError, selectRegistrationPending, selectRegistrationSuccess } from "./SolidRegistrationSlice";

export const useSolidRegistration = () => {
    const pending = useSelector((state: AppState) => selectRegistrationPending(state.solidRegistrationState));
    const error = useSelector((state: AppState) => selectRegistrationError(state.solidRegistrationState));
    const duplicateUserError = useSelector((state: AppState) => selectRegistrationDuplicateUserError(state.solidRegistrationState));
    const success = useSelector((state: AppState) => selectRegistrationSuccess(state.solidRegistrationState));

    return {
        pending,
        error,
        duplicateUserError,
        success
    }
}