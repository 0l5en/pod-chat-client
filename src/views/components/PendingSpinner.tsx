import { Spinner } from "react-bootstrap";

const PendingSpinner = () => {
    return (
        <span className="m-1"><Spinner animation="border" role="status" size="sm"></Spinner></span>
    );
}

export default PendingSpinner;