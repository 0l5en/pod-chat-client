import { Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSpaceUsageCounter } from '../../store/DashboardHook';
import PendingSpinner from './PendingSpinner';

const AppFooter = () => {
    const { pending, error, bytes } = useSpaceUsageCounter();
    return (
        <Navbar className="mb-1">
            <Navbar.Toggle aria-controls="footer-navbar-nav" />
            <Navbar.Collapse id="footer-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Item><Navbar.Text>&copy; {new Date().getFullYear()} pod-chat</Navbar.Text></Nav.Item>
                    <Nav.Item><Navbar.Text className='mx-1 text-muted'>|</Navbar.Text></Nav.Item>
                    <Nav.Item><Navbar.Text className='text-muted'>{pending ? <PendingSpinner /> : error ? error : 'Space usage: ' + bytes}</Navbar.Text></Nav.Item>
                </Nav>
                <Nav className="ml-auto">
                    <Nav.Item><Nav.Link as={Link} to="/imprint">Imprint</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link disabled={true}>|</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link as={Link} to="/terms-and-conditions">T&C</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link disabled={true}>|</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link as={Link} to="/help">Help</Nav.Link></Nav.Item>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default AppFooter;