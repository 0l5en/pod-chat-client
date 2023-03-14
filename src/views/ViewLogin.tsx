import React, { useState } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { FaRegCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAppDispatch } from "../store";
import { solidLogin } from "../store/SolidAuthSlice";
import { POD_PROVIDERS } from "./components/PodProvider";
import PodProviderUrlSelect from "./components/PodProviderUrlSelect";

const ViewLogin = () => {

    const [podProviderUrl, setPodProviderUrl] = useState(POD_PROVIDERS[1].url);
    const [podProviderSelectError, setPodProviderSelectError] = useState<string | undefined>(undefined);
    const dispatch = useAppDispatch();

    const handleLogin = (evt: React.MouseEvent<HTMLElement>) => {
        evt.preventDefault();

        if (podProviderUrl === '') {
            setPodProviderSelectError('Please type in a valid url for pod provider.');
            return;
        }
        try {
            new URL(podProviderUrl);
        } catch (error) {
            setPodProviderSelectError('invalid POD Provider URL');
            return;
        }

        dispatch(solidLogin(podProviderUrl));
    }

    return (
        <Card className="overflow-hidden h-100">
            <Card.Img src={"/logo-bg-01.png"} alt="Background" />
            <Card.ImgOverlay>
                <Card.Title className="d-flex align-items-center flex-shrink-0"> </Card.Title>
                <Card.Body className="d-flex flex-column flex-grow-1 overflow-auto h-100">
                    <div>
                        <h1>Reclaim your privacy</h1>
                        <div className="d-flex mt-3">
                            <FaRegCheckCircle size={28} className="text-primary m-1" />
                            <h3>Chat with your friends in a decentralized system.</h3>
                        </div>
                        <div className="d-flex mt-2">
                            <FaRegCheckCircle size={28} className="text-primary m-1" />
                            <h3>Decide at any time who can read your messages.</h3>
                        </div>
                        <div className="d-flex mt-2">
                            <FaRegCheckCircle size={28} className="text-primary m-1" />
                            <h3>Use a pod provider of your choice to save your messages.</h3>
                        </div>

                        <Row className="mt-5">
                            <Col>
                                <small className="text-muted mb-1">Select your pod provider and start to chat or <Link to="/register" className="text-decoration-none"><strong>register</strong></Link></small>
                            </Col>
                        </Row>
                        <Row>
                            <Col sm={12} md={12} lg={6}>
                                <div>
                                    <PodProviderUrlSelect formControlId="login_pod_provider_url" podProviderUrl={podProviderUrl} setPodProviderUrl={setPodProviderUrl} podProviderSelectError={podProviderSelectError} setProviderSelectError={setPodProviderSelectError}>
                                        <Button className="shadow-none ml-2" onClick={handleLogin}>Login</Button>
                                    </PodProviderUrlSelect>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <small className="text-muted"><i>We do not use cookies to record user behavior. Cookies are used for technical purposes only.</i></small>
                            </Col>
                        </Row>
                    </div>
                </Card.Body>
            </Card.ImgOverlay>
        </Card>
    );
}


export default ViewLogin;