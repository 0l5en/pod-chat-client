import { ReactNode } from "react";
import { Card } from "react-bootstrap";

const ScrollPanel = ({ header, children, footer }: { header: ReactNode, children?: ReactNode | Iterable<ReactNode>, footer?: ReactNode }) => {
    return (
        <Card className="h-100 overflow-hidden">
            {header &&
                <Card.Header className="d-flex justify-content-between align-items-center flex-shrink-0">
                    {header}
                </Card.Header>}
            <Card.Body className="flex-grow-1 overflow-auto">{children}</Card.Body>
            {footer && <Card.Footer className="d-flex py-0 flex-shrink-0 px-2">
                {footer}
            </Card.Footer>}
        </Card>
    );
}

export default ScrollPanel;