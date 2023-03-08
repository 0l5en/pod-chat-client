import React from "react";
import { Button, Dropdown } from "react-bootstrap";
import { FaEllipsisH, FaQuoteRight, FaThumbsDown, FaThumbsUp } from "react-icons/fa";

export type MessageMenuAction = 'like' | 'dislike' | 'answer';

type MessageMenuDropdownProps = {
    onClickMenuItem: (action: MessageMenuAction) => void;
    disabled?: boolean;
}

const ToggleDefault = React.forwardRef<HTMLButtonElement, { onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void, disabled: boolean }>(({ onClick, disabled }, ref) => (
    <Button variant="link" className="shadow-none px-1 py-0" ref={ref} disabled={disabled} onClick={(e) => {
        e.preventDefault();
        onClick(e);
    }}><i><FaEllipsisH className="mb-1" /></i></Button>
));

const MessageMenuDropdown = ({ disabled, onClickMenuItem }: MessageMenuDropdownProps) => {

    return (
        <Dropdown>
            <Dropdown.Toggle as={ToggleDefault} disabled={disabled} />
            <Dropdown.Menu>
                <Dropdown.Item onClick={() => onClickMenuItem('like')}>
                    <span><FaThumbsUp /> Like</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={() => onClickMenuItem('dislike')}>
                    <span><FaThumbsDown /> Dislike</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={() => onClickMenuItem('answer')}>
                    <span><FaQuoteRight /> Answer</span>
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown >
    );
};

export default MessageMenuDropdown;
