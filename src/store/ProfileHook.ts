import { useMemo } from "react"
import { useSelector } from "react-redux"
import { AppState } from "."
import { makeSelectProfileIdsToLoad, makeSelectProfileWrapperById } from "./ProfileSlice"

export const useProfile = ({ profileId }: { profileId: string }) => {
    const selectProfileWrapperById = useMemo(() => makeSelectProfileWrapperById(), []);
    const profileWrapper = useSelector((state: AppState) => selectProfileWrapperById(state.profileState, profileId));
    return { profileWrapper };
}

export const useProfileIdsToLoad = ({ profileIds }: { profileIds: string[] }) => {
    const selectProfileIdsToLoad = useMemo(() => makeSelectProfileIdsToLoad(), []);
    const profileIdsToLoad = useSelector((state: AppState) => selectProfileIdsToLoad(state.profileState, profileIds));
    return { profileIdsToLoad };
}