import { ACL, RDF, SIOC } from '@inrupt/vocab-common-rdf';
import { literal, quad, Statement } from 'rdflib';
import { ChatMessage } from '../../types';
import { PODCHAT, removeHashFromUrl } from './Constants';
import rdfStore, { extractObjectLastValue } from './RdfStore';

export const prepareRsaKeyPair = async (profileId: string, rsaPrivateKeyResourceUrl: string): Promise<void> => {

    const privKey = await getPrivateKey(rsaPrivateKeyResourceUrl);
    const pubKey = await getPublicKey(profileId);

    if (!privKey || !pubKey) {
        await createKeyPair(profileId, rsaPrivateKeyResourceUrl);
        const privKeyNew = await getPrivateKey(rsaPrivateKeyResourceUrl);
        const pubKeyNew = await getPublicKey(profileId);
        if (!privKeyNew || !pubKeyNew) {
            throw new Error('Unable to create RSA keypair.');
        }
    }
}

export const signMessage = async (rsaPrivateKeyResourceUrl: string, message: ChatMessage): Promise<string | undefined> => {
    const privateKey = await getPrivateKey(rsaPrivateKeyResourceUrl);
    if (privateKey) {
        const messageVerificationStr = buildMessageVerificationStr(message);
        const messageContentEnc = new TextEncoder().encode(messageVerificationStr);
        const signature = await window.crypto.subtle.sign(
            {
                name: "RSA-PSS",
                saltLength: 32,
            },
            privateKey,
            messageContentEnc
        );
        const exportedAsString = ab2str(signature);
        const exportedAsBase64 = window.btoa(exportedAsString);
        return exportedAsBase64;
    }

    return undefined;
}

export const verifyMessage = async (profileId: string, messageVerificationString: string, signatureEncoded: string): Promise<boolean> => {

    let encoded = new TextEncoder().encode(messageVerificationString);

    const publicKey = await getPublicKey(profileId);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(signatureEncoded);
    // convert from a binary string to an ArrayBuffer
    const signature = str2ab(binaryDerString);

    if (publicKey) {
        return await window.crypto.subtle.verify(
            {
                name: "RSA-PSS",
                saltLength: 32,
            },
            publicKey,
            signature,
            encoded
        );
    }

    return false;
}

export function buildMessageVerificationStr(message: ChatMessage): string {
    // The date for verification can only be exact to the second, 
    // since the milliseconds are set to zero when it is transferred to/from the pod.
    const createdDate = new Date(message.created);
    createdDate.setMilliseconds(0);
    return message.id + createdDate.getTime() + message.content + message.maker;
}

const getPublicKey = async (profileId: string): Promise<CryptoKey | undefined> => {
    const profileResourceUrl = removeHashFromUrl(profileId);
    await rdfStore.fetcher.load(profileResourceUrl);
    const pubKeyEncoded = extractObjectLastValue(rdfStore, PODCHAT.RSAPublicKey, profileResourceUrl, rdfStore.cache.sym(SIOC.content_encoded));
    if (pubKeyEncoded) {
        return importPublicKey(pubKeyEncoded);
    }

    return undefined;
}

const getPrivateKey = async (rsaPrivateKeyResourceUrl: string): Promise<CryptoKey | undefined> => {
    await rdfStore.fetcher.load(rsaPrivateKeyResourceUrl);
    const privKeyEncoded = extractObjectLastValue(rdfStore, PODCHAT.RSAPrivateKey, rsaPrivateKeyResourceUrl, rdfStore.cache.sym(SIOC.content_encoded));
    if (privKeyEncoded) {
        return importPrivateKey(privKeyEncoded);
    }
    return undefined;
}

/*
  Import a PEM encoded RSA private key, to use for RSA-PSS signing.
  Takes a string containing the PEM encoded key, and returns a Promise
  that will resolve to a CryptoKey representing the private key.
  */
function importPrivateKey(pem: string) {
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pem);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSA-PSS",
            // Consider using a 4096-bit key for systems that require long-term security
            //modulusLength: 4096,
            //publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["sign"]
    );
}

/*
  Import a PEM encoded RSA public key, to use for RSA-OAEP encryption.
  Takes a string containing the PEM encoded key, and returns a Promise
  that will resolve to a CryptoKey representing the public key.
  */
function importPublicKey(pem: string) {
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pem);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-PSS",
            hash: "SHA-256"
        },
        true,
        ["verify"]
    );
}

const createKeyPair = async (profileId: string, rsaPrivateKeyResourceUrl: string) => {
    const key = await window.crypto.subtle
        .generateKey(
            {
                name: "RSA-PSS",
                // Consider using a 4096-bit key for systems that require long-term security
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        );

    await privKeyPkcs8Pem(key.privateKey, profileId, rsaPrivateKeyResourceUrl);
    await pubKeySpkiPem(key.publicKey, profileId);
}

async function privKeyPkcs8Pem(privKey: CryptoKey, profileId: string, rsaPrivateKeyResourceUrl: string) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privKey);
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    const del: Statement[] = [];
    const ins: Statement[] = [];
    del.push(...rdfStore.cache.statementsMatching(
        rdfStore.cache.sym(PODCHAT.RSAPrivateKey),
        rdfStore.cache.sym(SIOC.content_encoded),
        undefined,
        rdfStore.cache.sym(rsaPrivateKeyResourceUrl)
    ));
    ins.push(quad(
        rdfStore.cache.sym(PODCHAT.RSAPrivateKey),
        rdfStore.cache.sym(SIOC.content_encoded),
        literal(exportedAsBase64),
        rdfStore.cache.sym(rsaPrivateKeyResourceUrl)
    ));
    await rdfStore.updateManager.update(del, ins);
    await aclForResource(rsaPrivateKeyResourceUrl, profileId);
}

async function aclForResource(resourceUrl: string, ownerId: string) {
    const ins: Statement[] = [];
    const aclResourceUrl = resourceUrl + '.acl';
    const graph = rdfStore.cache.sym(aclResourceUrl);
    const aclId = rdfStore.cache.sym(aclResourceUrl + '#ControlReadWrite');
    ins.push(quad(aclId, rdfStore.cache.sym(RDF.type), rdfStore.cache.sym(ACL.Authorization), graph));
    ins.push(quad(aclId, rdfStore.cache.sym(ACL.accessTo), rdfStore.cache.sym(resourceUrl), graph));
    [ACL.Control, ACL.Write, ACL.Read].forEach(mode => {
        ins.push(quad(aclId, rdfStore.cache.sym(ACL.mode), rdfStore.cache.sym(mode), graph));
    });
    ins.push(quad(aclId, rdfStore.cache.sym(ACL.agent), rdfStore.cache.sym(ownerId), graph));
    await rdfStore.updateManager.update([], ins);
}

async function pubKeySpkiPem(pubKey: CryptoKey, profileId: string) {
    const exported = await window.crypto.subtle.exportKey("spki", pubKey);
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    const profileResourceUrl = removeHashFromUrl(profileId);
    const del: Statement[] = [];
    const ins: Statement[] = [];
    del.push(...rdfStore.cache.statementsMatching(
        rdfStore.cache.sym(PODCHAT.RSAPublicKey),
        rdfStore.cache.sym(SIOC.content_encoded),
        undefined,
        rdfStore.cache.sym(profileResourceUrl)
    ));
    ins.push(quad(
        rdfStore.cache.sym(PODCHAT.RSAPublicKey),
        rdfStore.cache.sym(SIOC.content_encoded),
        literal(exportedAsBase64),
        rdfStore.cache.sym(profileResourceUrl)
    ));
    await rdfStore.updateManager.update(del, ins);
}

/*
 * Convert an ArrayBuffer into a string
 */
function ab2str(buf: ArrayBuffer): string {
    return String.fromCharCode.apply(null, new Uint8Array(buf) as unknown as number[]);
}

/*
 * Convert a string into an ArrayBuffer
 */
function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}