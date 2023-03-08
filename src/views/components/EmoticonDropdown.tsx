import React, { ReactNode } from "react";
import { Button, Col, Container, Dropdown, Row } from "react-bootstrap";
import { FaGrin } from "react-icons/fa";
import styled from 'styled-components';
import WithTooltip from "./WithTooltip";

type EmoticonDropdownProps = {
    onClickEmoticon: (emoticon: number) => void;
    size?: "sm" | "md";
    disabled?: boolean;
}

type Props = EmoticonDropdownProps;

const ToggleDefault = React.forwardRef<HTMLButtonElement, { onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void, disabled: boolean }>(({ onClick, disabled }, ref) => (
    <Button className="shadow-none" ref={ref} disabled={disabled} onClick={(e) => {
        e.preventDefault();
        onClick(e);
    }}><WithTooltip tooltipMessage="Emoticons"><i><FaGrin className="mb-1" /></i></WithTooltip></Button>
));

const ToggleSmall = React.forwardRef<HTMLButtonElement, { onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void, disabled: boolean }>(({ onClick, disabled }, ref) => (
    <Button size="sm" className="shadow-none px-1 py-0" ref={ref} disabled={disabled} onClick={(e) => {
        e.preventDefault();
        onClick(e);
    }}><WithTooltip tooltipMessage="Emoticons"><i><FaGrin className="mb-1" /></i></WithTooltip></Button>
));

const EmoticonDropdown = ({ onClickEmoticon, size = "md", disabled = false }: Props) => {

    const createRowForEmoticon = (entityReferenceNumber: number): React.ReactNode => {
        const emoticon = String.fromCodePoint(entityReferenceNumber);
        return (
            <Col key={entityReferenceNumber}>
                <Button
                    className="p-0 m-0 border-0 shadow-none text-decoration-none"
                    variant="link"
                    onClick={() => onClickEmoticon(entityReferenceNumber)}>{emoticon}</Button>
            </Col>

        );
    }

    const emoBlock = (result: Array<ReactNode>, start: number, rows?: number) => {
        let myRows = rows || 20;
        for (var i = 0; i < myRows * 4; i += 4) {
            const cols = [] as Array<ReactNode>;
            for (var j = 0; j < 4; j++) {
                const entityReferenceNumber = start + i + j;
                cols.push(createRowForEmoticon(entityReferenceNumber));
            }
            result.push(<Row key={start + i + ''} className={i > 0 ? "mt-2" : ""}>{cols}</Row>);
        }
    }

    const emoData = () => {
        const result = [] as Array<ReactNode>;
        emoBlock(result, 0x1F600);
        emoBlock(result, 0x1F442);
        return result;
    }

    return (

        <Dropdown>
            {size === "sm" ? <Dropdown.Toggle as={ToggleSmall} disabled={disabled} /> : <Dropdown.Toggle as={ToggleDefault} disabled={disabled} />}
            <Dropdown.Menu>
                <StyledDropdownItem>
                    <StyledEmoMenu className="my-2">
                        <Container className="h-100 overflow-auto">
                            {emoData()}
                        </Container>
                    </StyledEmoMenu>
                </StyledDropdownItem>
            </Dropdown.Menu>
        </Dropdown >
    );
}

export default EmoticonDropdown;

const StyledEmoMenu = styled.div`
    height: 100px;
    width: 230px;
    overflow: hidden;
`

const StyledDropdownItem = styled(Dropdown.Item)`
    &:hover {
        background-color: white;
    }
`
