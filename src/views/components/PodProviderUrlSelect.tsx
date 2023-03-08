import React, { ReactNode, useState } from "react";
import { ButtonGroup, Dropdown, FormControl, InputGroup } from "react-bootstrap";
import CustomDropdownToggle from "./CustomDropdownToggle";
import { POD_PROVIDERS, POD_PROVIDER_ANY } from "./PodProvider";

interface PodProviderUrlSelectProps {
    podProviderUrl: string;
    setPodProviderUrl: (podProviderUrl: string) => void;
    podProviderSelectError?: string;
    setProviderSelectError: (error: string | undefined) => void;
    children?: ReactNode;
    formControlId: string;
}

const PodProviderUrlSelect = ({ formControlId, podProviderUrl, podProviderSelectError, setPodProviderUrl, setProviderSelectError, children }: PodProviderUrlSelectProps) => {

    const [podProvider, setPodProvider] = useState(POD_PROVIDERS[1]);

    const selectPodProviderForName = (podProviderName: string) => {
        let found = POD_PROVIDERS.find(pp => pp.name === podProviderName);
        if (found) {
            return found;
        }
        return POD_PROVIDERS[0];
    }

    const handlePodProviderInputChanged = (evt: React.ChangeEvent<HTMLInputElement>) => {
        setProviderSelectError(undefined);
        if (podProvider.name === POD_PROVIDER_ANY) {
            setPodProviderUrl(evt.currentTarget.value);
        }
    };

    const handleSelectPodProvider = (podProviderName: string): void => {
        setProviderSelectError(undefined);
        let podProvider = selectPodProviderForName(podProviderName);
        setPodProvider(podProvider);
        setPodProviderUrl(podProvider.url);
    }

    return (
        <InputGroup>
            <FormControl id={formControlId} type="text" onChange={handlePodProviderInputChanged} value={podProviderUrl} disabled={podProvider.name !== POD_PROVIDER_ANY} placeholder={POD_PROVIDERS[1].url} required={true} isInvalid={podProviderSelectError !== undefined} />
            <ButtonGroup role={'group'}>
                <Dropdown onSelect={eventKey => eventKey && handleSelectPodProvider(eventKey)}  >
                    <Dropdown.Toggle as={CustomDropdownToggle}></Dropdown.Toggle>
                    <Dropdown.Menu>
                        {POD_PROVIDERS.map(pp => <Dropdown.Item key={pp.name} active={podProvider.name === pp.name} eventKey={pp.name}>{pp.name}</Dropdown.Item>)}
                    </Dropdown.Menu>
                </Dropdown>
                {children}
            </ButtonGroup>
            <FormControl.Feedback type="invalid">{podProviderSelectError}</FormControl.Feedback>
        </InputGroup>
    );
};

export default PodProviderUrlSelect;