import { useState } from "react";
import { Image } from "react-bootstrap";
import styled from 'styled-components';

export interface ImageLoadProps {
    imageSrc: string
}

const ImageLoad = (props: ImageLoadProps) => {
    const [imageLoadError, setImageLoadError] = useState(false);
    return (
        <>{!imageLoadError && <StyledImage src={props.imageSrc} onError={() => setImageLoadError(true)} thumbnail={true} />}</>
    );
}

export default ImageLoad;

export const StyledImage = styled(Image)`
`

// 26