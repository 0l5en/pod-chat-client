import { useState } from "react";
import { Image } from "react-bootstrap";

export interface ImageLoadProps {
    imageSrc: string
}

const ImageLoad = (props: ImageLoadProps) => {
    const [imageLoadError, setImageLoadError] = useState(false);
    return (
        <>{!imageLoadError && <Image src={props.imageSrc} onError={() => setImageLoadError(true)} thumbnail={true} />}</>
    );
}

export default ImageLoad;