import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import AppFooter from "./AppFooter";
import Navigation from "./Navigation";
const Layout = () => {

    return (
        <Container className="d-flex flex-column flex-grow-1 vh-100 overflow-hidden">
            <Navigation />
            <Outlet />
            <AppFooter />
        </Container>
    );
}

export default Layout;