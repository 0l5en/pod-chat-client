import { ReactElement } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const WithTooltip = ({ tooltipMessage, children }: { tooltipMessage: string | ReactElement, children: ReactElement }) => {
    return (
        <OverlayTrigger placement="auto" overlay={<Tooltip>{tooltipMessage}</Tooltip>}>
            {({ ref, ...triggerHandler }) => (
                <div className="d-inline" ref={ref} {...triggerHandler}>{children}</div>
            )}
        </OverlayTrigger>
    );
};

export default WithTooltip;