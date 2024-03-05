import { useEffect, useRef, useState } from "react";
import { Button, Col, Fade, Form, InputGroup, ProgressBar, Row } from "react-bootstrap";
import { FaPlus, FaTimes } from "react-icons/fa";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store";
import { useDashboard } from "../store/DashboardHook";
import { loadDashboard, setChatSearchFilter } from "../store/DashboardSlice";
import ChatSelector from "./components/ChatSelector";
import ScrollPanel from "./components/ScrollPanel";
import ShareMenuDropdown from "./components/ShareMenuDropdown";
import WithTooltip from "./components/WithTooltip";

const ChatSelectorFooter = ({ chatPath }: { chatPath: string }) => {

    const navigate = useNavigate();

    return (
        <Row className="p-0 m-0 w-100">
            <Col className="p-0 pe-2" sm={6}>
                <WithTooltip tooltipMessage='Start new chat'>
                    <Button className="m-2 shadow-none w-100" onClick={() => navigate(chatPath + '/new')}>
                        <FaPlus className="mb-1" />
                    </Button>
                </WithTooltip>
            </Col>
            <Col className="ps-0 pe-3">
                <ShareMenuDropdown />
            </Col>
        </Row>
    );
};

const ChatSelectorHeader = () => {
    const { chatSearchFilter } = useDashboard();
    const dispatch = useAppDispatch();
    const handleChatSearchFilterChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setChatSearchFilter(evt.currentTarget.value));
    }
    const handleChatSearchFilterReset = () => {
        dispatch(setChatSearchFilter(''));
    }

    return (
        <Form className="w-100">
            <InputGroup className="flex-nowrap w-100 py-1">
                <Form.Control type="text" aria-describedby="message-content" placeholder="Search Chat" onChange={handleChatSearchFilterChange} value={chatSearchFilter} />
                <Button variant="primary" className="shadow-none" onClick={handleChatSearchFilterReset}><WithTooltip tooltipMessage='Reset search filter'><FaTimes className="mb-1" /></WithTooltip></Button>
            </InputGroup>
        </Form>
    );
}

const ViewDashboard = ({ chatPath, webid }: { chatPath: string, webid: string }) => {

    const [progress, setProgress] = useState<number>(0);
    const { pending } = useDashboard();
    const dispatch = useAppDispatch();
    const refLoadDashboard = useRef<boolean>(false);

    useEffect(() => {
        if (!refLoadDashboard.current) {
            dispatch(loadDashboard({ profileId: webid, onProgress: (progress) => { setProgress(progress) } }));
            refLoadDashboard.current = true;
        }
    }, [dispatch, webid]);

    return (
        <>
            <Fade in={pending}>
                < Row > <Col><ProgressBar now={progress} /></Col></Row>
            </Fade>
            <Fade in={!pending}>
                <Row className="d-flex flex-grow-1 overflow-hidden h-100">
                    <Col className="h-100 overflow-hidden">
                        <Outlet />
                    </Col>
                    <Col xs={4} className="h-100 overflow-hidden">
                        <ScrollPanel header={<ChatSelectorHeader />} footer={<ChatSelectorFooter chatPath={chatPath} />}>
                            <ChatSelector chatPath={chatPath} />
                        </ScrollPanel>
                    </Col>
                </Row>
            </Fade>
        </>
    );
}

export default ViewDashboard;