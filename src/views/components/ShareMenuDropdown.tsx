import React from "react";
import { Button, Dropdown } from "react-bootstrap";
import DropdownItem from "react-bootstrap/esm/DropdownItem";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaLink, FaSkype, FaTelegram, FaWhatsapp } from "react-icons/fa";
import { useDashboard } from "../../store/DashboardHook";
import WithTooltip from "./WithTooltip";

const ToggleDefault = React.forwardRef<HTMLButtonElement, { onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void, disabled: boolean }>(({ onClick, disabled }, ref) => (
    <WithTooltip tooltipMessage='Invite your friends and your accounts will be linked automatically!'><Button variant="primary" className="shadow-none m-2 w-100" ref={ref} disabled={disabled} onClick={(e) => {
        e.preventDefault();
        onClick(e);
    }}><strong>Invite Friends</strong></Button></WithTooltip>
));


const ShareMenuDropdown = () => {

    const { dashboard } = useDashboard();

    return (
        <>
            {dashboard &&
                <Dropdown>
                    <Dropdown.Toggle as={ToggleDefault} disabled={false} />
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => window.open('https://api.whatsapp.com/send?text=' + encodeURI('Connect with me on this new decentralized messenger https://pod-chat.com/share/invitation?inviter=' + encodeURIComponent(dashboard.profile.id)), "pop", "width=600, height=400, scrollbars=no")}>
                            <span><FaWhatsapp className="mb-1" /> Whatsapp</span>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => window.open('https://telegram.me/share/url?url=' + encodeURI('https://pod-chat.com/share/invitation?inviter=' + encodeURIComponent(dashboard.profile.id)) + '&text=' + encodeURI('Connect with me on this new decentralized messenger'), "pop", "width=600, height=400, scrollbars=no")}>
                            <span><FaTelegram className="mb-1" /> Telegram</span>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => window.open('https://web.skype.com/share?url=' + encodeURIComponent('https://pod-chat.com/share/invitation?inviter=' + encodeURIComponent(dashboard.profile.id)) + '&text=' + encodeURI('Connect with me on this new decentralized messenger'), "pop", "width=600, height=400, scrollbars=no")}>
                            <span><FaSkype className="mb-1" /> Skype</span>
                        </Dropdown.Item>
                        <CopyToClipboard text={'https://pod-chat.com/share/invitation?inviter=' + encodeURIComponent(dashboard.profile.id)}>
                            <DropdownItem>
                                <span><FaLink className="mb-1" /> Copy to clipboard</span>
                            </DropdownItem>
                        </CopyToClipboard>
                    </Dropdown.Menu>
                </Dropdown >
            }
        </>
    );
};

export default ShareMenuDropdown;
