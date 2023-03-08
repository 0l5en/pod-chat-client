import { locationFromMessageResourceUrl } from "./Message";

describe('test', () => {
    it('should do something', () => {
        let str_of_emojis = "😘🤗🦀";
        for (var i = 0; i < str_of_emojis.length; i++) {
            console.log(str_of_emojis.charCodeAt(i));
        }
        const location = locationFromMessageResourceUrl('https://a.b.c/2022/01/01/chat.ttl');
        expect(location.day).toEqual(1);
        expect(location.month).toEqual(1);
        expect(location.year).toEqual(2022);
    });
});