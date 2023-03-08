import React, { ReactNode } from "react";
import { Button } from "react-bootstrap";
import { FaChevronDown } from "react-icons/fa";

interface CustomToggleProps {
    onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    children: ReactNode;
};

const CustomDropdownToggle = React.forwardRef<HTMLButtonElement, CustomToggleProps>(({ children, onClick }, ref) => (
    <Button className="shadow-none" ref={ref} onClick={(e) => {
        e.preventDefault();
        onClick(e);
    }}>{children}{children ? <FaChevronDown className="ml-3" /> : <FaChevronDown />}
    </Button>
));

export default CustomDropdownToggle;