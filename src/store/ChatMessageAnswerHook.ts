import { useSelector } from "react-redux";
import { AppState } from ".";
import { selectAnswerContent } from "./ChatMessageAnswerSlice";

export const useChatMessageAnswer = () => {
    const answerContent = useSelector((state: AppState) => selectAnswerContent(state.chatMessageAnswerState));
    return { answerContent };
}