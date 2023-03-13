# pod-chat-client
Web client based on React - makes use of solid pods to read/write data required to form a chat

[Solid model](doc/solid-model.md)

## Gotchas

### @inrupt/solid-client-authn-browser
Doesn't work with the following versions:
1.13.1, 1.13.2, 1.13.3  
Wrong redirect URI seems to be used on browser reload.
