import { Container, Image, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import UserAuth from './UserAuth';
function Navigation() {
    return (
        <Navbar expand="lg">
            <Container>
                <Navbar.Brand className="d-flex">
                    <Link to={'/'}>
                        <Image src={process.env.PUBLIC_URL + "/logo.svg"} style={{ maxWidth: '48px' }} className="mr-2" />
                    </Link>
                    <h5 className="text-primary">pod-chat</h5>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto" />
                    <Nav>
                        <UserAuth />
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Navigation;