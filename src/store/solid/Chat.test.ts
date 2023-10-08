import { graph, IndexedFormula } from 'rdflib';
import { expect, vi } from 'vitest';
import { chatIdFromIdValue, idValueFromChatId } from './Chat';
import rdfStore from './RdfStore';

vi.mock('./RdfStore', async (importOriginal) => {
    const mod = await importOriginal<{ cache: IndexedFormula }>();
    return {
        ...mod,
        default: {
            fetcher: {
                load: vi.fn()
            },
            cache: graph(),
            updateManager: {
                update: vi.fn()
            }
        },
    };
});

describe('Chat', () => {

    afterEach(() => {
        rdfStore.cache = graph();
        vi.restoreAllMocks();
    });

    describe('idValueFromChatId', () => {
        it('should extract the id value from a given webid', () => {
            const idValue = idValueFromChatId('https://me.pod.provider/pod-chat.com/1234/index.ttl#this');
            expect(idValue).toBe('1234');
        });
        it('should produce a webid for a chat from the given id value', () => {
            const webidOfChat = chatIdFromIdValue("https://me.pod.provider/", "1234");
            expect(webidOfChat).toBe('https://me.pod.provider/pod-chat.com/1234/index.ttl#this');
        });
    });
});