import { useDashboard } from "../../store/DashboardHook";
import IconWithBorder from "./IconWithBorder";
import PendingSpinner from "./PendingSpinner";
import ProfileHeader from "./ProfileHeader";

const DashboardProfileHeader = ({ nameOnHover }: { nameOnHover?: boolean }) => {
    const { pending, dashboard } = useDashboard();

    return (
        <>
            {pending
                ? <IconWithBorder><PendingSpinner /></IconWithBorder>
                : dashboard && <a href={dashboard.profile.id} target="_blank" rel="noreferrer"><ProfileHeader name={dashboard.profile.name} image={dashboard.profile.image} nameOnHover={nameOnHover} /></a>
            }
        </>
    );
};

export default DashboardProfileHeader;