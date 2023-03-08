import React, { useState } from "react";
import { Button, Col, Container, Form, FormControl, FormGroup, FormLabel, Row } from "react-bootstrap";
import { FaRegCheckCircle, FaUserPlus } from "react-icons/fa";
import styled from "styled-components";
import { useAppDispatch } from "../store";
import { solidLogin } from "../store/SolidAuthSlice";
import { useSolidRegistration } from "../store/SolidRegistrationHook";
import {
    register,
    resetRegistrationError,
    resetRegistrationResult
} from "../store/SolidRegistrationSlice";
import IconWithBorder from "./components/IconWithBorder";
import PendingSpinner from "./components/PendingSpinner";
import { POD_PROVIDERS } from "./components/PodProvider";
import PodProviderUrlSelect from "./components/PodProviderUrlSelect";
import ScrollPanel from "./components/ScrollPanel";

const ViewRegister = () => {
    const usernameRegex = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/;
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const dispatch = useAppDispatch();

    const { pending, error, success, duplicateUserError } = useSolidRegistration();

    const [podProviderUrl, setPodProviderUrl] = useState(POD_PROVIDERS[1].url);
    const [podProviderSelectError, setPodProviderSelectError] = useState<string | undefined>(undefined);

    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState<string | undefined>(undefined);

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>(undefined);

    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | undefined>(undefined);

    const header = <>
        <div className="d-flex align-items-center py-1"><IconWithBorder><FaUserPlus /></IconWithBorder> Registration</div>
        {pending && <PendingSpinner />}
    </>;

    const setProviderSelectErrorAndResetRegistrationError = (error: string | undefined) => {
        if (error === undefined || error === '') {
            if (error) {
                dispatch(resetRegistrationError());
            }
            if (duplicateUserError) {
                dispatch(resetRegistrationResult());
            }
        }
        setPodProviderSelectError(error);
    }

    const validateForm = (): boolean => {
        let isValid = true;

        // pod provider url
        if (podProviderUrl === '') {
            setPodProviderSelectError('URL for pod provider must not be empty.');
            isValid = false;
        } else {
            try {
                new URL(podProviderUrl);
            } catch (error) {
                setPodProviderSelectError('Invalid URL for pod provider.');
                isValid = false;
            }
        }

        // username
        if (username === '') {
            setUsernameError('Username must not be empty.');
            isValid = false;
        } else if (!username.match(usernameRegex)) {
            setUsernameError('Only Letters from english alphabet and a maximum of 62 Characters are allowed.');
            isValid = false;
        }

        // email
        if (email === '') {
            setEmailError('Email must not be empty.');
            isValid = false;
        } else if (!email.match(emailRegex)) {
            setEmailError('Email must start with some letters followed by "@" followed by a domain.');
            isValid = false;
        }

        // password
        if (password === '') {
            setPasswordError('Password must not be empty.');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('Password must contain at least 6 characters.');
            isValid = false;
        }


        return isValid;
    }

    const onChangeUsername = (evt: React.ChangeEvent<HTMLInputElement>) => {
        evt.preventDefault();
        if (error) {
            dispatch(resetRegistrationError());
        }
        if (duplicateUserError) {
            dispatch(resetRegistrationResult());
        }
        setUsernameError(undefined);
        setUsername(evt.currentTarget.value);
    }

    const onChangeEmail = (evt: React.ChangeEvent<HTMLInputElement>) => {
        evt.preventDefault();
        if (error) {
            dispatch(resetRegistrationError());
        }
        setEmailError(undefined);
        setEmail(evt.currentTarget.value);
    }

    const onChangePassword = (evt: React.ChangeEvent<HTMLInputElement>) => {
        evt.preventDefault();
        if (error) {
            dispatch(resetRegistrationError());
        }
        setPasswordError(undefined);
        setPassword(evt.currentTarget.value);
    }

    const submitRegistration = (evt: React.FormEvent<HTMLFormElement>) => {
        evt.preventDefault();

        const isValid = validateForm();
        if (isValid) {
            dispatch(register({ username, email, password, podProviderUrl }))
        }

    }

    const loginFromRegistration = (evt: React.MouseEvent<HTMLButtonElement>) => {
        evt.preventDefault();
        dispatch(solidLogin(podProviderUrl));
    }

    return (
        <StyledBody className="h-100 overflow-hidden">
            <ScrollPanel header={header}>

                {success
                    ? <>
                        <h5>Great job!</h5>
                        <div className="mb-1 text-primary"><FaRegCheckCircle /> Remember your registration details</div>
                        <Container>
                            <Row className="mt-2">
                                <Col lg="2" md="4" sm="6" className="text-muted">pod provider</Col>
                                <Col><strong>{podProviderUrl}</strong></Col>
                            </Row>
                            <Row className="mt-2">
                                <Col lg="2" md="4" sm="6" className="text-muted">username</Col>
                                <Col><strong>{username}</strong></Col>
                            </Row>
                        </Container>
                        <div className="mt-2">When you click the login button below, you will be redirected to your pod provider and asked for your username and password.</div>
                        <div>After successfully logging in, you will need to grant <strong>all permissions</strong> for pod-chat to function properly.</div>
                        <div className="mb-3">Finally, click the Accept button to come back and discover the world of pod-chat.</div>
                        <div><Button onClick={loginFromRegistration} className="shadow-none">login</Button></div>
                    </>
                    : <Form className="" onSubmit={submitRegistration} noValidate={true}>
                        <Row className="mb-3">
                            <Col lg="6" md="9">
                                <FormGroup>
                                    <FormLabel htmlFor="register_username"><small className="text-muted">Username</small></FormLabel>
                                    <FormControl id="register_username" type="text" value={username} onChange={onChangeUsername} isInvalid={usernameError !== undefined || duplicateUserError !== undefined} placeholder="username" />
                                    <FormControl.Feedback type="invalid">{usernameError || duplicateUserError}</FormControl.Feedback>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col lg="6" md="9">
                                <FormGroup>
                                    <FormLabel htmlFor="register_email"><small className="text-muted">Email</small></FormLabel>
                                    <FormControl id="register_email" type="text" onChange={onChangeEmail} isInvalid={emailError !== undefined} placeholder="username@mailprovider.com" />
                                    <FormControl.Feedback type="invalid">{emailError}</FormControl.Feedback>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col lg="6" md="9">
                                <FormGroup>
                                    <FormLabel htmlFor="register_password"><small className="text-muted">Password</small></FormLabel>
                                    <FormControl id="register_password" type="password" onChange={onChangePassword} isInvalid={passwordError !== undefined} placeholder="super strong password phrase" />
                                    <FormControl.Feedback type="invalid">{passwordError}</FormControl.Feedback>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col lg="6" md="9">
                                <FormGroup>
                                    <FormLabel htmlFor="register_pod_provider_url"><small className="text-muted">POD provider</small></FormLabel>
                                    <PodProviderUrlSelect formControlId="register_pod_provider_url" podProviderUrl={podProviderUrl} podProviderSelectError={podProviderSelectError} setPodProviderUrl={setPodProviderUrl} setProviderSelectError={setProviderSelectErrorAndResetRegistrationError}>
                                        <Button className="shadow-none" type="submit">register</Button>
                                    </PodProviderUrlSelect>
                                    <small className="text-danger">{error}</small>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
                }

            </ScrollPanel>
        </StyledBody>
    );
}

export default ViewRegister;

const StyledBody = styled.div`
    margin-top: 5px;
`;