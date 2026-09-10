
Set the waiting status on the chat client (something like _your_bot is typing…_).

Different type of wait are available: typing, recording a video, uploading a video etc (depends on the platform).

In **Deep Chat** the wait is a message with animated dots (plus the label of the waiting type, when it's not plain typing) that the widget replaces with the answer. It only shows up when the bot runs in *WebSocket* mode: over HTTP the widget is already showing its own indicator while it waits for the response, and that is the only moment the browser can be reached.

For example

![Waiting message](./docs/assets/fe8b3eb91688bdaf.png)
