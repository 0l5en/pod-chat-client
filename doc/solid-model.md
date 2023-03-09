# Solid model

## Chat directory

Each chat stores its data in its own directory.  
Whenever a new chat is created, the application creates a new folder in its preconfigured directory. The application also writes an ACL file to set permissions on the folder as well as default settings for all sub-items of that folder.
The following ACL file is written into Alice's pod when Alice starts a new chat with Bob and the new chat directory name is '1234':
```
# https://alice.pod/pod-chat/1234/.acl
@prefix : <#>.
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix n1: <./>.
@prefix c: </profile/card#>.
@prefix c0: <https://bob.pod/profile/card#>.

:ControlReadWrite
    a acl:Authorization;
    acl:accessTo n1:;
    acl:agent c:me;
    acl:default n1:;
    acl:mode acl:Control, acl:Read, acl:Write.
:Read
    a acl:Authorization;
    acl:accessTo n1:;
    acl:agent c0:me;
    acl:default n1:;
    acl:mode acl:Read.
```
This ensures, that only Alice is permitted to control, write and read the data of the chat. All other participants are only allowed to read data from the chat, like Bob in this example.

If Bob accepts Alice's chat invitation, a new chat will also be created in Bob's pod. The ACL file for Bob's chat folder has the following content, assuming a directory name of '5678':
```
# https://bob.pod/pod-chat/5678/.acl
@prefix : <#>.
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix n1: <./>.
@prefix c: </profile/card#>.
@prefix c0: <https://alice.pod/profile/card#>.

:ControlReadWrite
    a acl:Authorization;
    acl:accessTo n1:;
    acl:agent c:me;
    acl:default n1:;
    acl:mode acl:Control, acl:Read, acl:Write.
:Read
    a acl:Authorization;
    acl:accessTo n1:;
    acl:agent c0:me;
    acl:default n1:;
    acl:mode acl:Read.
```
In this case it is ensured that only Bob can control, write and read the data of the chat. All other participants are only allowed to read data from the chat, like Alice in this example.

## Chat messages
When someone sends a chat message, it's only saved in their own pod below the chat directory. A chat file is created in a new directory for each day. 
The application does not create an additional ACL file to apply the inherited chat directory access rules. The directory structure corresponds to the following pattern:
```
<chat directory>/<year>/<month>/<day>/chat.ttl
```
The message is signed with the authenticated user's private key and stored in the user's pod.  
For example, if Bob writes the first message for Alice on Sunday 1/1/2000 at 1am UTC, the following file will be placed in his pod:
```
# https://bob.pod/pod-chat.com/1234/2000/01/01/chat.ttl
@prefix : <#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix sioc: <http://rdfs.org/sioc/ns#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: </profile/card#>.
@prefix ind: <../../../index.ttl#>.
@prefix podchat: <https://www.pod-chat.com/>.

# podchat:signature has been shortened for better readability
:msg-1af45c15-1bed-4b95-aa92-d075a321cf75
    dct:created "2000-01-01T01:00:00Z"^^xsd:dateTime;
    sioc:content
        "a message from Bob";
    foaf:maker c:me;
    podchat:signature
        "HE8ojizpNIcCQYqp73...".
ind:this
    wf:message
        :msg-1af45c15-1bed-4b95-aa92-d075a321cf75.
```

## Chat
An index.ttl file is created for each chat just below the chat directory.
Among other things, this file is required to find out which chats have to be merged in order to be able to display the messages of all chat participants.  
Using the example above, Bob's file would look like this:
```
@prefix : <#>.
@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.
@prefix dc: <http://purl.org/dc/elements/1.1/>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix c: <https://alice.pod/profile/card#>.
@prefix c0: </profile/card#>.
@prefix ind: <https://alice.pod/pod-chat.com/1234/index.ttl#>.

# Participation of Alice
:e65efc06-1cd0-49d8-a4b2-aee53cbf8362
    # optional reference to the chat of Alice
    dct:references ind:this;
    cal:dtstart "2000-01-01T01:00:00Z"^^xsd:dateTime;
    wf:participant c:me.

# Participation of Bob
:ea7dbe14-5c7b-4f1a-8a0c-b2fb1de71a84
    cal:dtstart "2000-01-01T01:00:00Z"^^xsd:dateTime;
    wf:participant c0:me.

:this
    a meeting:LongChat;
    dc:author c0:me;
    dc:created "2000-01-01T01:00:00Z"^^xsd:dateTime;
    dc:title "Chat Channel";
    wf:participation
        :e65efc06-1cd0-49d8-a4b2-aee53cbf8362,
        :ea7dbe14-5c7b-4f1a-8a0c-b2fb1de71a84;
    ui:sharedPreferences :SharedPreferences.
```
The file closely matches the Solid LongChat sample. Particular attention is paid to the participation predicate `dct:references`. As described above, the application can only find messages for the currently logged-in user in their pod. The messages of the other participants are in the respective pods of the participants. In order to be able to know where to find this data, the application needs to know which chat belongs to which participant. This is exactly what the additional predicate `dct:references` is for. This predicate is set as soon as the respective chat of the participant is known, e.g. after a chat invitation has been accepted.

## Chat display
Suppose Bob has successfully logged into pod-chat.com. When he selects the chat with Alice, the following things are done:

1. The index.ttl of the concerned chat is loaded from Bob's pod.
2. The application will find the reference to Alice's chat and will start loading the messages of the current day from Alice's pod
3. The application knows that Bob is the authenticated user and will start to load all messages of the current day from Bob's pod
4. The application will merge the messages to display them in chronological order in a chat display
5. The application validates Alice's messages with its public key to verify that the signature actually came from Alice. If not, a warning will appear right next to the untrusted message.


