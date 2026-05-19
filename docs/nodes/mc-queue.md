
The `MC Queue node` is used to manage long running tasks. It takes the payload of the incoming message, it stores it a _SQLite_ queue and redirect the stored payloads to the output pin one by one, at regular interval.

The typical use is broadcasting the same message to a large set of users with a regular pace, accepted by the chat platform, the broadcast is split in single tasks, it can be stopped or resumed, it’s stored in a database and survives across Node-RED’s restarts and can be inspected with the **Mission Controls** queues panels.

 

![Simple send to recipients flow](./docs/assets/95c90435939c25a1.png)

| Name           | Description                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _name_         | The name of the queue, if left blank is _default_                                                                                                                                                                           |
| _initialState_ | The initial state of the queue: _running_ or _pause_. If running it will start consuming elements from the queue as soon as the flow is deployed                                                                            |
| _type_         | The type of the queue: _sequential_ or _stops after each element_. If sequential it will continue to consume elements from the queue at a pace defined by delay, otherwise the queue is paused after each consumed element. |
| _delay_        | The delay in ms between elements consumed by the queue. It also accepts variables from the _flow_ and _global_ context, for example `{{flow.myDelay}}` or `{{global.someDelay}}`                                            |

It’s possible to issue commands to the queue with a simple inbound message 

```javascript
{
  mycommand: true
}
```

Available commands

| Command | Description                       |
| ------- | --------------------------------- |
| _start_ | Start a paused queue              |
| _next_  | Consume next element of the queue |
| _pause_ | Pause a running queue             |

The _stops after each element queue_ type is useful in scenarios where each element of the queue needs to be extracted when the previous task is completed, for example a FTP server which doesn’t allow concurrent uploads

![Retroaction to execute one element at a time](./docs/assets/433ce9cfc058924c.png)

Here a simple retro-action of the function node which sends to the output a msg `{ next: true }` which triggers the extraction of the next element of the queue only when the previous element is uploaded completely.

The payload added to the queue can contain a _taskId_, which identifies the task, if a task with the same taskId already exists in the queue, then the new payload will be merged with the existing one. If no _taskId_ is provided, then a random one is assigned.

```javascript
{
  payload: {
    taskId: 'my-task-id',
    some: 'payload'
	}
}
```
