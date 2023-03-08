import { ReactNode, useEffect, useMemo, useRef } from "react";
import { Button, ListGroup, ListGroupItem } from "react-bootstrap";
import { FaClock, FaExclamationCircle, FaExclamationTriangle, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import styled from "styled-components";
import { useAppDispatch } from "../../store";
import { setMessageAnswer } from "../../store/ChatMessageAnswerSlice";
import { useChatMessage } from "../../store/ChatMessageHook";
import { useChatMessageReplyGroups } from "../../store/ChatMessageReplyHook";
import { loadNextResult, syncChatMessageResource } from "../../store/ChatMessageSlice";
import { useChat, useDashboard } from "../../store/DashboardHook";
import { useProfile } from "../../store/ProfileHook";
import { loadProfile } from "../../store/ProfileSlice";
import { useSendMessageReply } from "../../store/SendMessageReplyHook";
import { resetState as resetSendMessageReplyState, sendMessageReplySubmit } from "../../store/SendMessageReplySlice";
import { logSendLongChatMessage } from "../../store/solid/ApplicationApi";
import { ChatMessage, ChatMessageReplyGroup } from "../../types";
import MessageMenuDropdown, { MessageMenuAction } from "./MessageMenuDropdown";
import PendingSpinner from "./PendingSpinner";
import ProfileHeader from "./ProfileHeader";
import WithTooltip from "./WithTooltip";

const ReplyAgent = ({ agent }: { agent: string }) => {

    const { dashboard } = useDashboard();
    const { profileWrapper } = useProfile({ profileId: agent });
    const dispatch = useAppDispatch();
    const ref = useRef<boolean>(false);

    const isDashboardAgent = useMemo(() => dashboard && dashboard.profile.id === agent, [agent, dashboard]);
    const agentName = useMemo(() => isDashboardAgent ? dashboard?.profile.name : profileWrapper?.profile?.name, [isDashboardAgent, dashboard, profileWrapper]);

    useEffect(() => {
        if (!ref.current && !isDashboardAgent && !profileWrapper) {
            dispatch(loadProfile(agent));
            ref.current = true;
        }
    }, [isDashboardAgent, profileWrapper, agent, dispatch]);

    return (
        <div>{agentName} {profileWrapper?.asyncState.pending && <PendingSpinner />}</div>
    );
}

const ReplyAgents = ({ agents }: { agents: string[] }) => {

    return (
        <div className="d-flex flex-column">
            {agents.map(a => <div key={a} className="d-flex"><ReplyAgent agent={a} /></div>)}
        </div>

    );
}


const ReplyItem = ({ chatId, messageId, chatMessageReplyGroup }: { chatId: string, messageId: string, chatMessageReplyGroup: ChatMessageReplyGroup }) => {

    const { dashboard } = useDashboard();
    const { chat } = useChat({ chatId });
    const { modified, pending } = useSendMessageReply({ messageId });
    const dispatch = useAppDispatch();

    const onClickReplyButton = () => {
        if (dashboard && dashboard.profile && chat) {
            dispatch(sendMessageReplySubmit({
                authorId: dashboard.profile.id,
                chatId,
                participationIds: chat.participants.map(p => p.id),
                replyName: chatMessageReplyGroup.name,
                messageId
            }));
        }
    }

    const replyNode: ReactNode = useMemo(() => {
        if (chatMessageReplyGroup.name === '👍') {
            return <FaThumbsUp className="mb-1" />
        }
        if (chatMessageReplyGroup.name === '👎') {
            return <FaThumbsDown className="mb-1" />
        }
        return <>{chatMessageReplyGroup.name}</>
    }, [chatMessageReplyGroup.name]);

    useEffect(() => {
        if (chat && modified) {
            dispatch(syncChatMessageResource({ ...modified, chatId: chat.id, searchResultChatId: chat.id }));
            dispatch(resetSendMessageReplyState(messageId));
        }
    }, [dispatch, modified, chat, messageId]);

    return (
        <WithTooltip tooltipMessage={<ReplyAgents agents={chatMessageReplyGroup.agents} />}>
            <Button size="sm" className="py-0 px-1" onClick={onClickReplyButton} disabled={pending}>
                {replyNode} {chatMessageReplyGroup.agents.length}
            </Button>
        </WithTooltip>
    );
}


const MessagePanel = ({ chatId, message }: { chatId: string, message: ChatMessage }) => {
    const { dashboard } = useDashboard();
    const { chat } = useChat({ chatId });
    const { profileWrapper } = useProfile({ profileId: message.maker });
    const { chatMessageReplyGroups } = useChatMessageReplyGroups({ chatId, messageId: message.id });
    const { pending, modified } = useSendMessageReply({ messageId: message.id });
    const dispatch = useAppDispatch();

    const onClickMessageMenuDropdownItem = (action: MessageMenuAction) => {
        if (dashboard && dashboard.profile && chat) {
            switch (action) {
                case 'like':
                    dispatch(sendMessageReplySubmit({
                        authorId: dashboard.profile.id,
                        chatId,
                        participationIds: chat.participants.map(p => p.id),
                        replyName: '👍',
                        messageId: message.id
                    }));
                    break;
                case 'dislike':
                    dispatch(sendMessageReplySubmit({
                        authorId: dashboard.profile.id,
                        chatId,
                        participationIds: chat.participants.map(p => p.id),
                        replyName: '👎',
                        messageId: message.id
                    }));
                    break;
                case 'answer':
                    dispatch(setMessageAnswer({ answer: message }));
                    break;
                default:

            }
        }
    }

    const contentToReactNodes = (content: string): ReactNode[] => {
        const words = content.split(' ');
        let isAnswer = false;
        let answerContent: ReactNode[] = [];

        const createNodeForWord = (word: string, prefix: string, key: string, isAnswer: boolean): ReactNode => {
            if (word.startsWith('http://') || word.startsWith('https://')) {
                try {
                    const url = new URL(word);
                    const targetStr = url.origin === window.location.origin ? '_self' : '_blank';
                    const urlStr = url.origin === window.location.origin ? url.pathname + url.search + url.hash : url.toString();
                    return (<>
                        {isAnswer
                            ? <SyledContentLinkSmall key={key} variant="link" href={urlStr} target={targetStr} className="p-0 ms-1 no-shadow">
                                <small>{urlStr}</small>
                            </SyledContentLinkSmall>
                            : <SyledContentLink key={key} variant="link" href={urlStr} target={targetStr} className="p-0 ms-1 no-shadow">
                                {urlStr}
                            </SyledContentLink>}
                    </>)
                } catch (error) {

                }
            }
            return <span key={key}>{prefix}{word}</span>;
        };

        return words.reduce((acc, word, index) => {
            const wordTrimmed = word.trim();
            const key = index + '';
            if (wordTrimmed === "'''") {
                isAnswer = !isAnswer;
                if (!isAnswer && answerContent.length > 0) {
                    const answerNode = <div className='text-muted' key={key}><small>{answerContent}</small></div>;
                    acc.push(answerNode);
                    answerContent = [];
                }
                return acc;
            }


            const node = createNodeForWord(wordTrimmed, index === 0 ? '' : ' ', key, isAnswer);
            if (isAnswer) {
                answerContent.push(node);
            } else {
                acc.push(node);
            }

            return acc;
        }, [] as ReactNode[]);
    }

    const jsxContent: ReactNode = <div>{contentToReactNodes(message.content)}</div>;

    useEffect(() => {
        if (chat && modified) {
            logSendLongChatMessage();
            dispatch(syncChatMessageResource({ ...modified, chatId: chat.id, searchResultChatId: chat.id }));
            dispatch(resetSendMessageReplyState(message.id));
        }
    }, [dispatch, modified, chat, message.id]);

    return (
        <>
            <div className="d-flex justify-content-between">
                <div className="d-flex align-items-center">
                    {dashboard && dashboard.profile.id === message.maker
                        ? <ProfileHeader name={dashboard.profile.name} image={dashboard.profile.image} nameOnHover={true} size="sm" />
                        : profileWrapper?.profile && <ProfileHeader name={profileWrapper.profile.name} image={profileWrapper.profile.image} nameOnHover={true} size="sm" />}
                    <small className="text-muted flex-grow-1">{new Date(message.created).toLocaleString()} {pending && <PendingSpinner />}</small>
                    {message.trusted === false && <i className="text-danger mb-1 mx-1"><WithTooltip tooltipMessage="Not signed by author!"><FaExclamationTriangle /></WithTooltip></i>}
                    {message.trusted === undefined && <i className="text-secondary mb-1 mx-1"><WithTooltip tooltipMessage="The message has no signature!"><FaExclamationCircle /></WithTooltip></i>}
                </div>
                <div className="d-flex align-items-center">
                    <div className="mx-1 text-primary"><MessageMenuDropdown onClickMenuItem={onClickMessageMenuDropdownItem} disabled={pending} /></div>
                </div>
            </div>
            <div className="d-flex my-1">
                <div className="w-100">
                    <div>{jsxContent}</div>
                </div>
            </div>
            <div className="d-flex justify-content-end">
                {chatMessageReplyGroups.length > 0 && (
                    <div className="d-flex justify-content-end">
                        {chatMessageReplyGroups.map(g => (
                            <div key={g.name} className="m-1">
                                <ReplyItem chatId={chatId} messageId={message.id} chatMessageReplyGroup={g} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}


const ChatMessageListPanel = ({ chatId }: { chatId: string }) => {

    const { participantChatIds } = useChat({ chatId });
    const { messages, hasEndLocation, loadResultPending } = useChatMessage({ chatId });
    const dispatch = useAppDispatch();

    const handleLoadNext = () => {
        dispatch(loadNextResult({ chatId, chatIdsToLoad: [...participantChatIds, chatId] }));
    };

    return (
        <div>
            <ListGroup>
                {hasEndLocation && messages.length === 0 && <ListGroupItem>Be the first to send a message.</ListGroupItem>}
                {messages.map(message => (
                    <ListGroupItem key={message.id}>
                        <MessagePanel chatId={chatId} message={message} />
                    </ListGroupItem>
                ))}
                {!hasEndLocation &&
                    <ListGroupItem className="d-flex justify-content-center">
                        <WithTooltip tooltipMessage="Previous messages"><Button className="shadow-none" onClick={handleLoadNext} disabled={loadResultPending}>
                            <span className="text-nowrap"><FaClock className="mb-1" /></span>
                        </Button></WithTooltip>
                    </ListGroupItem>
                }
            </ListGroup>

        </div >
    );
};

export default ChatMessageListPanel;

const SyledContentLink = styled(Button)`
    text-decoration:none;
    margin-bottom: 5px;
`
const SyledContentLinkSmall = styled(Button)`
    text-decoration:none;
    margin-bottom: 6px;
`
