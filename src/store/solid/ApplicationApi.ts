import { LoadInviterResponse, RegistrationPayload, RegistrationResult } from "../../types";

const register = async ({ username, email, password, podProviderUrl }: RegistrationPayload): Promise<RegistrationResult> => {
    const podProviderUrlSanitized = podProviderUrl.endsWith('/') ? podProviderUrl : podProviderUrl + '/';
    const resourceUrl = '/api/register';
    const requestInit: RequestInit = {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: 'username=' + encodeURIComponent(username)
            + '&name=' + encodeURIComponent(username)
            + '&email=' + encodeURIComponent(email)
            + '&password=' + encodeURIComponent(password)
            + '&podProviderUrl=' + encodeURIComponent(podProviderUrlSanitized)
    }
    const resp = await fetch(resourceUrl, requestInit);
    return { statusCode: resp.status, message: resp.statusText };
}

const loadInviter = async (): Promise<string> => {
    const resp = await fetch('/api/inviter');
    if (resp.ok) {
        try {
            const inviterResp: LoadInviterResponse = await resp.json();
            return inviterResp.inviter;
        } catch (error) { }
    }
    return '';
}

const deleteInviter = async (): Promise<void> => {
    await fetch('/api/inviter', { method: 'DELETE' });
}

const logSelectLongChat = async (): Promise<void> => {
    await fetch('/api/selectLongChat');
}

const logSendLongChatMessage = async (): Promise<void> => {
    await fetch('/api/sendLongChatMessage');
}

export {
    register,
    loadInviter,
    deleteInviter,
    logSelectLongChat,
    logSendLongChatMessage
};

