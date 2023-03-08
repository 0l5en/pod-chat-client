import { ReactElement } from "react";
import styled from 'styled-components';

const IconWithBorder = ({ children }: { children: ReactElement }) => {
    return (
        <span className="me-2"><StyledBox>{children}</StyledBox></span>
    );
};

export default IconWithBorder;

const StyledBox = styled.span`
    border: 1px solid var(--bs-border-color);
    border-radius: 0.25rem;
    display: block;
    min-width: 40px;
    min-height: 40px;
    text-align: center;
    padding-top: 0.42rem;
    background-color: var(--bs-white);
    color: var(--bs-dark);
`;