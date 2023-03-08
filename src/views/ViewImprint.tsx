import { FaGavel } from "react-icons/fa";
import { Link } from "react-router-dom";
import styled from 'styled-components';
import IconWithBorder from "./components/IconWithBorder";
import ScrollPanel from "./components/ScrollPanel";

const ViewImprint = () => {
    const header = <div className="d-flex align-items-center py-1"><IconWithBorder><FaGavel /></IconWithBorder> Imprint</div>;
    return (
        <StyledBody className="h-100 overflow-hidden">
            <ScrollPanel header={header}>
                <h5>Legal Disclosure</h5>
                Information in accordance with Section 5 TMG <br /><br />
                <h5>Contact Information</h5>
                Address: <br />Müggelstr. 30<br />10247 Berlin<br /><br />
                Telephone: 0300000000<br />E-Mail: <a href="mailto:info@pod-chat.com">info at pod-chat.com</a><br />Internet address: <Link to="/">https://pod-chat.com</Link><br /><br />
                <h5>Disclaimer</h5>
                <b>Accountability for content</b><br />
                The contents of our pages have been created with the utmost care.However, we cannot guarantee the contents'
                accuracy, completeness or topicality.According to statutory provisions, we are furthermore responsible for
                our own content on these web pages.In this matter, please note that we are not obliged to monitor
                the transmitted or saved information of third parties, or investigate circumstances pointing to illegal activity.
                Our obligations to remove or block the use of information under generally applicable laws remain unaffected by this as per
                §§ 8 to 10 of the Telemedia Act (TMG).

                <br /><br /><b>Accountability for links</b><br />
                Responsibility for the content of
                external links (to web pages of third parties) lies solely with the operators of the linked pages.No violations were
                evident to us at the time of linking.Should any legal infringement become known to us, we will remove the respective
                link immediately.<br /><br /><b>Copyright</b><br />
                Our web pages and their contents are subject to German copyright law.Unless
                expressly permitted by law, every form of utilizing, reproducing or processing
                works subject to copyright protection on our web pages requires the prior consent of the respective owner of the rights.
                Individual reproductions of a work are only allowed for private use.
                The materials from these pages are copyrighted and any unauthorized use may violate copyright laws.
            </ScrollPanel>
        </StyledBody>
    );
}

export default ViewImprint;

const StyledBody = styled.div`
    margin-top: 5px;
`;