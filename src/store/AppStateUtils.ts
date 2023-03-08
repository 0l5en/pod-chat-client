import { Chat } from "../types";

/*
 * Utils
 */
export const findChatByParticipantWebids = (participantWebids: string[], chats: Chat[]) => {
    let newWebidsSorted = participantWebids.sort((p1, p2) => p1.localeCompare(p2));
    return chats.find(chat => {
        let currentWebidsSorted = chat.participants.map(p => p.id).sort((p1, p2) => p1.localeCompare(p2));
        if (newWebidsSorted.length === currentWebidsSorted.length && currentWebidsSorted.every((element, index) => element === newWebidsSorted[index])) {
            return chat;
        }
        return undefined;
    });
};
