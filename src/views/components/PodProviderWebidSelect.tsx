import React, { ReactNode, useState } from "react";
import { ButtonGroup, Dropdown, Form, FormControl, InputGroup } from "react-bootstrap";
import CustomDropdownToggle from "./CustomDropdownToggle";
import { POD_PROVIDERS, POD_PROVIDER_ANY } from "./PodProvider";

interface PodProviderWebidSelectProps {
    podProviderWebid: string;
    setPodProviderWebid: (podProviderWebid: string) => void;
    resetError: () => void;
    isInvalid: () => boolean;
    children?: ReactNode;
}

const PodProviderWebidSelect = ({ podProviderWebid, setPodProviderWebid, resetError, isInvalid, children }: PodProviderWebidSelectProps) => {

    const [podProvider, setPodProvider] = useState(POD_PROVIDERS[1]);
    const [userName, setUserName] = useState("");

    const selectPodProviderForName = (podProviderName: string) => {
        let found = POD_PROVIDERS.find(pp => pp.name === podProviderName);
        if (found) {
            return found;
        }
        return POD_PROVIDERS[0];
    }

    const handleWebidChanged = (evt: React.ChangeEvent<HTMLInputElement>) => {
        resetError();
        setPodProviderWebid(evt.currentTarget.value);
    };

    const handleUserNameChanged = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const url = new URL(podProvider.url);
        const userNameValue = evt.currentTarget.value;
        const userNameValueTrimmed = userNameValue.trim();

        resetError();
        setUserName(userNameValue);

        if (userNameValueTrimmed.length === 0) {
            setPodProviderWebid("");
        } else {
            setPodProviderWebid(url.protocol + "//" + userNameValueTrimmed + "." + url.host + "/profile/card#me");
        }
    };

    const handleSelectPodProvider = (podProviderName: string): void => {
        resetError();
        setPodProviderWebid("");
        setUserName("");
        let podProvider = selectPodProviderForName(podProviderName);
        setPodProvider(podProvider);
    }

    const renderUserNameInput = () => {
        const url = new URL(podProvider.url);
        return (
            <>
                <InputGroup.Text>{url.protocol + "//"}</InputGroup.Text>
                <Form.Control type="text" placeholder="username" onChange={handleUserNameChanged} value={userName} isInvalid={isInvalid()} />
                <InputGroup.Text>.{url.host}/profile/card#me</InputGroup.Text>
            </>
        );
    }

    const renderWebidInput = () => {
        return (
            <>
                <FormControl type="text" placeholder="https://username.podprovider.com/profile/card#me" onChange={handleWebidChanged} value={podProviderWebid} isInvalid={isInvalid()} />
            </>
        );
    }

    return (
        <Form.Group>
            {podProvider.name === POD_PROVIDER_ANY
                ? <small className="ms-1">Enter your friends Web-ID</small>
                : <small className="ms-1">Enter your friends username at {podProvider.name}</small>
            }
            <InputGroup className="mt-1">
                {podProvider.name === POD_PROVIDER_ANY
                    ? renderWebidInput()
                    : renderUserNameInput()
                }
                <ButtonGroup>
                    <Dropdown onSelect={eventKey => eventKey && handleSelectPodProvider(eventKey)}  >
                        <Dropdown.Toggle as={CustomDropdownToggle}></Dropdown.Toggle>
                        <Dropdown.Menu>
                            {POD_PROVIDERS.map(pp => <Dropdown.Item key={pp.name} active={podProvider.name === pp.name} eventKey={pp.name}>{pp.name}</Dropdown.Item>)}
                        </Dropdown.Menu>
                    </Dropdown>
                    {children}
                </ButtonGroup>
            </InputGroup>
        </Form.Group>
    );
};

export default PodProviderWebidSelect;
