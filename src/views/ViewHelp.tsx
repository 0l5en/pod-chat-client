import { ReactNode } from "react";
import { FaQuestion, FaQuestionCircle } from "react-icons/fa";
import styled from "styled-components";
import IconWithBorder from "./components/IconWithBorder";
import ScrollPanel from "./components/ScrollPanel";

const Question = ({ question }: { question: string }) => {
    return (
        <div className="d-flex align-items-start text-info">
            <div className="mx-2"><FaQuestionCircle className="mb-1" /></div>
            <strong>{question}</strong>
        </div>
    );
}

const Answer = ({ answer }: { answer: ReactNode }) => {
    return (
        <div className="d-flex align-items-start text-default ms-4">
            <div className="ms-2">{answer}</div>
        </div>
    );
}


const ViewHelp = () => {
    const header = <div className="d-flex align-items-center py-1"><IconWithBorder><FaQuestion /></IconWithBorder> Help</div>;
    return (
        <StyledBody className="h-100 overflow-hidden">
            <ScrollPanel header={header}>
                <h5>What are Solid PODs?</h5>
                <div className="my-2">Solid was created by the inventor of the World Wide Web, <strong>Prof. Tim Berners-Lee</strong>. Its mission is to reshape the web as we know it. Solid will foster a new breed of applications with capabilities above and beyond anything that exists today. Everyone in the Solid ecosystem can store any piece of the data they produce wherever they want. So while my response on your chat message is stored in my pod, your chat message is stored in your pod. However, this means that we need a way for connecting the data in different pods together, such that the connection between my message and your message can be identified and used to form a chatroom.</div>
                <div className="mb-2">Solid connects resources in different pods by representing all data as Linked Data. At its core, Linked Data is really simple: every piece of data gets its own HTTP URL on the Web, and we use those URLs to refer to this data. So if your chat message is identified by <i>https://yourpod.solid/pod-chat.com/chatroom/message#123</i>, then my response at <i>https://mypod.solid/pod-chat.com/chatroom/message#456</i> will link back to that URL. Solid empowers users and organizations to separate their data from the applications that use it. It allows people to look at the same data with different apps at the same time. It opens brand new avenues for creativity, problem-solving, and commerce.</div>
                <div className="mb-2"><a href="https://solid.mit.edu/" target="_blank" rel="noreferrer">Learn how it came to be.</a></div>
                <h5>F.A.Q.</h5>
                <div className="mb-2">
                    <Question question="What is a Web-ID?" />
                    <Answer answer={
                        <>
                            A Web-ID is your unique identifier in the World of POD's.
                        </>
                    } />
                </div>
                <div className="mb-2">
                    <Question question="Does pod-chat save any of my data?" />
                    <Answer answer={
                        <>
                            <strong>No!</strong> Pod-chat does not save any of your data. All data stays in your POD.
                        </>
                    } />
                </div>
                <div className="mb-2">
                    <Question question="Why do I need to check all 4 authorizations when I login for the first time?" />
                    <Answer answer={
                        <>
                            This is necessary to grant all needed rights to pod-chat.com to make the messenger work.
                        </>
                    } />
                </div>
                <div className="mb-2">
                    <Question question="The POD Chat messenger does not work in my Google Chrome / Edge browser. What can I do?" />
                    <Answer answer={
                        <>
                            To make this messenger work in Google Chrome you have to disable the “Same Cookie Enforcement”.<br />
                            Simply enter: <i>chrome://flags/#same-site-by-default-cookies</i> into your Chrome browser address-bar, hit enter, disable the cookie enforcement and relaunch your browser.<br />
                            Edge users have to enter <i>edge://flags/#same-site-by-default-cookies</i> to make it work.
                        </>
                    } />
                </div>
                <div className="mb-2">
                    <Question question="How to configure access modes for pod-chat application?" />
                    <Answer answer={
                        <>
                            <StyledParagraphLeft>
                                <div>At first you have to login to your profile.</div>
                                <div>You will see your avatar at the upper right corner.</div>
                                <div>If you hover with your mouse pointer over the avatar a menu will appear.</div>
                                <div>Go to the <strong>Preferences</strong> item and click.</div>
                            </StyledParagraphLeft>
                            <StyledImage alt="Profile preferences menu" src={process.env.PUBLIC_URL + '/img/goto-profile-preferences.png'} className="m-2" />
                        </>
                    } />
                    <Answer answer={
                        <StyledParagraphLeft>
                            <div>At the Preferences Page you will find a section called <strong>Manage your trusted applications</strong>.</div>
                            <div>There should be a line with an application url like <strong>https://pod-chat.com</strong>.</div>
                            <div>You have to ensure that <strong>all 4 access modes</strong> are checked.</div>
                            <div>Don't forget to click the Update Button to save your modifications!</div>
                            <img alt="Manage trusted apps" src={process.env.PUBLIC_URL + '/img/profile-manage-trusted-apps.png'} />
                        </StyledParagraphLeft>
                    } />
                </div>
            </ScrollPanel>
        </StyledBody>
    );
}

export default ViewHelp;

const StyledBody = styled.div`
    margin-top: 5px;
`;
const StyledParagraphLeft = styled.div`
    float: left;
`
const StyledImage = styled.img`
    max-height: 300px;
`