import { locationFromMessageResourceUrl } from "./Message";

describe('Message', () => {
    it('should create expected loacation for valid url', () => {
        const location = locationFromMessageResourceUrl('https://a.b.c/2022/01/01/chat.ttl');
        expect(location.day).toEqual(1);
        expect(location.month).toEqual(1);
        expect(location.year).toEqual(2022);
    });
});