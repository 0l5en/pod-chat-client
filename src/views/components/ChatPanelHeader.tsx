import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import { useAppDispatch } from "../../store";
import { useChatMessageAnswer } from "../../store/ChatMessageAnswerHook";
import { setMessageAnswer } from "../../store/ChatMessageAnswerSlice";
import { useChatMessage } from "../../store/ChatMessageHook";
import { syncChatMessageResource } from "../../store/ChatMessageSlice";
import { useSendMessage } from "../../store/SendMessageHook";
import { resetState as resetSendMessageState, sendMessageSubmit } from "../../store/SendMessageSlice";
import { logSendLongChatMessage } from "../../store/solid/ApplicationApi";
import { Chat, Profile } from "../../types";
import ChatHeader from "./ChatHeader";
import EmoticonDropdown from "./EmoticonDropdown";
import PendingSpinner from "./PendingSpinner";
import WithTooltip from "./WithTooltip";

const ChatPanelHeader = ({ profile, chat }: { profile: Profile; chat: Chat }) => {

    const [messageContent, setMessageContent] = useState("");
    const [messageContentValidated, setMessageContentValidated] = useState(false);
    const [messageContentValidationError, setMessageContentValidationError] = useState("");

    const { loadResultPending } = useChatMessage({ chatId: chat.id });
    const { pending: sendMessagePending, error: sendMessageError, modified: messageResourceModified } = useSendMessage();
    const { answerContent } = useChatMessageAnswer();

    const inputEl = useRef<HTMLInputElement>(null);
    const dispatch = useAppDispatch();

    const isSendMessageInvalid = useMemo(
        () => messageContentValidated !== undefined && (messageContentValidationError.trim().length > 0 || sendMessageError !== undefined),
        [messageContentValidated, messageContentValidationError, sendMessageError]
    );

    const pending = useMemo(
        () => loadResultPending || sendMessagePending,
        [loadResultPending, sendMessagePending]
    );

    const messageContentWithAnser = useMemo(
        () => answerContent ? messageContent + " ''' " + answerContent + " ''' " : messageContent,
        [answerContent, messageContent]
    );

    const onClickEmoticon = (emoticon: number) => {
        if (inputEl && inputEl.current) {
            inputEl.current.focus();
            const selectionStart = inputEl.current.selectionStart || undefined;
            const emoStr = String.fromCodePoint(emoticon);

            setMessageContentValidated(false);
            setMessageContentValidationError("");
            setMessageContent(cnt => {
                if (selectionStart) {
                    return cnt.substring(0, selectionStart) + emoStr + cnt.substring(selectionStart);
                }
                return cnt + emoStr;
            });

            if (selectionStart) {
                inputEl.current.setSelectionRange(selectionStart + 1, selectionStart + 1, "forward");
            }
        }
    }

    const onClickResetChatMessageAnswer = () => {
        dispatch(setMessageAnswer({}));
    }

    const validateMessageContent = (): boolean => {
        if (messageContent.trim() === "") {
            setMessageContentValidationError("Please fill in some Text.");
            return false;
        }

        return true;
    }

    const handleMessageContentChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        setMessageContent(evt.currentTarget.value);
        setMessageContentValidated(false);
        setMessageContentValidationError("");
    }

    const handleSendMessage = (evt: React.MouseEvent<HTMLButtonElement>) => {
        evt.preventDefault();
        evt.stopPropagation();

        const validMessageContent = validateMessageContent();
        setMessageContentValidated(true);

        if (validMessageContent) {
            dispatch(sendMessageSubmit({
                authorId: profile.id,
                chatId: chat.id,
                participationIds: chat.participants.map(p => p.id),
                content: messageContentWithAnser
            }));
            dispatch(setMessageAnswer({}));
        }
    }

    useEffect(() => {
        if (messageResourceModified) {
            logSendLongChatMessage();
            dispatch(syncChatMessageResource({ ...messageResourceModified, chatId: chat.id, searchResultChatId: chat.id }));
            dispatch(resetSendMessageState());
            setMessageContentValidated(false);
            setMessageContentValidationError("");
            setMessageContent("");
        }
    }, [dispatch, messageResourceModified, chat.id])

    useEffect(() => {
        dispatch(setMessageAnswer({}));
    }, [dispatch, chat.id]);

    return (
        <div className="d-flex flex-column w-100">
            <div className="d-flex align-items-start justify-content-between my-1">
                <ChatHeader chat={chat} nameOnHover={true} disableNotificationBadge={true} />
                <Form className="ms-1 w-100">
                    <InputGroup className="flex-nowrap">
                        <EmoticonDropdown onClickEmoticon={onClickEmoticon} disabled={pending} />
                        <Form.Control type="text" aria-describedby="message-content" ref={inputEl} className="" isInvalid={isSendMessageInvalid} onChange={handleMessageContentChange} value={messageContent} disabled={pending} />
                        <Button type="submit" variant="primary" className="shadow-none" disabled={pending} onClick={handleSendMessage}>
                            {pending
                                ? <PendingSpinner />
                                : <WithTooltip tooltipMessage="Send"><i><FaPaperPlane className="mb-1" /></i></WithTooltip>
                            }
                        </Button>
                    </InputGroup>
                    {isSendMessageInvalid &&
                        <small className="text-danger">
                            {messageContentValidationError || sendMessageError}
                        </small>
                    }
                </Form>
            </div>
            {answerContent &&
                <>
                    <div className="d-flex">
                        <small className="text-muted">You answer to this message:</small>
                    </div>
                    <div className="d-flex">
                        <span className="text-truncate flex-fill">{answerContent}</span>
                        <Button size="sm" variant="outline-primary" onClick={onClickResetChatMessageAnswer}><FaTimes className="mb-1" /></Button>
                    </div>
                </>
            }
        </div>
    );
}

export default ChatPanelHeader;
