import styled from 'styled-components';
import ImageLoad, { StyledImage } from "./ImageLoad";

interface AvatarProps {
    srcValue: string;
    isImage: boolean;
    size?: 'md' | 'sm'
}

type Props = AvatarProps;

const Avatar = ({ isImage, srcValue, size = 'md' }: Props) => {

    return (
        <>
            {size === 'sm' ? isImage
                ? <StyledAvatarImageSmall className="me-2"><ImageLoad imageSrc={srcValue} /></StyledAvatarImageSmall>
                : <StyledAvatarTextBoxSmall><StyledAvatarText className="me-2">{srcValue.substring(0, 2)}</StyledAvatarText></StyledAvatarTextBoxSmall>
                : isImage
                    ? <StyledAvatarImage className="me-2"><ImageLoad imageSrc={srcValue} /></StyledAvatarImage>
                    : <StyledAvatarTextBox><StyledAvatarText className="me-2">{srcValue.substring(0, 2)}</StyledAvatarText></StyledAvatarTextBox>
            }
        </>
    );
}

export default Avatar;

const StyledAvatarText = styled.div`
    border: 1px solid var(--bs-border-color);
    border-radius: 0.25rem;
    text-align: center;
    padding: 0.42rem;
    background-color: var(--bs-white);
    color: var(--bs-dark);
`

const StyledAvatarTextBox = styled.div`
    ${StyledAvatarText} {
        min-width: 40px;
        max-height: 40px;        
    }
`

const StyledAvatarImage = styled.div`
 ${StyledImage} {
    min-width: 40px;
    max-height: 40px;
 }
`

const StyledAvatarImageSmall = styled.div`
 ${StyledImage} {
    min-width: 26px;
    max-height: 26px;
 }
`

const StyledAvatarTextBoxSmall = styled.div`
    ${StyledAvatarText} {
        min-width: 26px;
        max-height: 26px;
        padding: 0px;
        padding-top: 1px;
        padding-bottom: 3px; 
        margin-top: 2px;
        font-size: small;
    }
`