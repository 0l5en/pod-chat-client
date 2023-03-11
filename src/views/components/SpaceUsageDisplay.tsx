import { useEffect, useRef } from "react";
import { FaHdd } from "react-icons/fa";
import { useSpaceUsageCounter } from "../../store/DashboardHook";
import WithTooltip from "./WithTooltip";

const SpaceUsagedisplay = () => {
    const { summHumanReadable, calculateSpaceUsage, dashboard, end } = useSpaceUsageCounter();
    const ref = useRef(false);
    useEffect(() => {
        if (!ref.current && dashboard) {
            calculateSpaceUsage();
            ref.current = true;
        }
    }, [calculateSpaceUsage, dashboard]);
    return (
        <div>{summHumanReadable.length > 0 ? <><WithTooltip tooltipMessage='Shows you the approximate disk space usage.'><FaHdd /></WithTooltip><small className="ms-1"><code className={end ? 'text-dark' : 'text-secondary'}>{summHumanReadable}</code></small></> : <></>}</div>
    );
}

export default SpaceUsagedisplay;