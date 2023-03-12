export const STORAGE_APP_BASE = "pod-chat.com/"
export const STORAGE_NOTIFICATIONS_PROCESSED = "notificationsProcessed.ttl"
export const STORAGE_RSA_PRIV_KEY = "rsaPrivKey.ttl"
export const STORAGE_NOTIFICATIONS_CLEANUP_BATCH_SIZE = 100;
export const STORAGE_NOTIFICATIONS_CLEANUP_INTERVAL_MS = 60000;
export const STORAGE_LONG_CHAT_RESOURCE_NAME = "index.ttl";
export const STORAGE_LONG_CHAT_RESOURCE_FRAGMENT = "this";

export const removeHashFromUrl = (url: string) => {
    const hash = new URL(url).hash;
    const foundIndex = hash.length > 0 ? url.indexOf(hash) : -1;
    return foundIndex > -1 ? url.substring(0, foundIndex) : url;
}

export function currentContainerFromDoc(docUrl: string) {
    return docUrl.substring(0, docUrl.lastIndexOf("/") + 1);
}

const PODCHAT_NS = 'https://www.pod-chat.com/';
export const PODCHAT = {
    LongChatMessage: PODCHAT_NS + 'LongChatMessage',
    LongChatMessageReply: PODCHAT_NS + 'LongChatMessageReply',
    RSAPublicKey: PODCHAT_NS + 'RSAPublicKey',
    RSAPrivateKey: PODCHAT_NS + 'RSAPrivateKey',
    signature: PODCHAT_NS + 'signature'
}

const PIM_SPACE_NS = 'http://www.w3.org/ns/pim/space#';
export const PIM_SPACE = {
    storage: PIM_SPACE_NS + 'storage'
}

const PIM_MEETING_NS = 'http://www.w3.org/ns/pim/meeting#';
export const PIM_MEETING = {
    LongChat: PIM_MEETING_NS + 'LongChat'
}

const DC_ELEMENTS_NS = 'http://purl.org/dc/elements/1.1/';
export const DC_ELEMENTS = {
    author: DC_ELEMENTS_NS + 'author',
    created: DC_ELEMENTS_NS + 'created',
    title: DC_ELEMENTS_NS + 'title'
}

const FLOW_NS = 'http://www.w3.org/2005/01/wf/flow#';
export const FLOW = {
    message: FLOW_NS + 'message',
    participation: FLOW_NS + 'participation',
    participant: FLOW_NS + 'participant'
}

const SOLID_TERMS_NS = 'http://www.w3.org/ns/solid/terms#';
export const SOLID_TERMS = {
    forClass: SOLID_TERMS_NS + 'forClass',
    instance: SOLID_TERMS_NS + 'instance',
    privateTypeIndex: SOLID_TERMS_NS + 'privateTypeIndex',
    publicTypeIndex: SOLID_TERMS_NS + 'publicTypeIndex'

}

const XML_SCHEMA_NS = 'http://www.w3.org/2001/XMLSchema#';
export const XML_SCHEMA = {
    dateTime: XML_SCHEMA_NS + 'dateTime',
    hexBinary: XML_SCHEMA_NS + 'hexBinary'
}

const SCHEMA_NS = 'http://schema.org/'
export const SCHEMA = {
    ReactAction: SCHEMA_NS + 'ReactAction',
    agent: SCHEMA_NS + 'agent',
    target: SCHEMA_NS + 'target',
    name: SCHEMA_NS + 'name'
}

const CERT_NS = 'http://www.w3.org/ns/auth/cert#'
export const CERT = {
    RSAPublicKey: CERT_NS + 'RSAPublicKey',
    RSAPrivateKey: CERT_NS + 'RSAPrivateKey',
    modulus: CERT_NS + 'modulus',
    exponent: CERT_NS + 'exponent',
}

const W3ID_SECURITY_NS = 'https://w3id.org/security#'
export const W3ID_SECURITY = {
    proof: W3ID_SECURITY_NS + 'proof'
}

