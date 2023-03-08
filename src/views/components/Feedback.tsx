import { ReactElement } from "react";
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import { FeedbackType } from "../../types";

const getTextClassForType = (type: FeedbackType) => {
    switch (type) {
        case FeedbackType.SUCCESS:
            return 'text-success';
        case FeedbackType.WARN:
            return 'text-warning';
        case FeedbackType.ERROR:
            return 'text-danger';
    }
}


const getIconForType = (type: FeedbackType) => {
    switch (type) {
        case FeedbackType.SUCCESS:
            return <i><FaCheckCircle className="mb-1" /></i>;
        case FeedbackType.WARN:
            return <i><FaExclamationTriangle className="mb-1" /></i>;
        case FeedbackType.ERROR:
            return <i><FaExclamationCircle className="mb-1" /></i>;
    }
}

const Feedback = ({ type, children }: { type: FeedbackType, children?: ReactElement }) => {
    return (
        <div className={"d-flex " + getTextClassForType(type)}>
            <div className="mx-2">{getIconForType(type)}</div>
            <div>{children}</div>
        </div>
    );
};

export default Feedback;