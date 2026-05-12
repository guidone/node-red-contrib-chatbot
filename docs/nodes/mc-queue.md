
The `MC Queue node` is used to manage long running tasks. It takes the payload of the incoming message, it stores it a _SQLite_ queue and redirect the stored payloads to the output pin one by one, at regular interval.

The typical use is broadcasting the same message to a large set of users with a regular pace, accepted by the chat platform, the broadcast is split in single tasks, it can be stopped or resumed, it’s stored in a database and survives across Node-RED’s restarts and can be inspected with the **Mission Controls** queues panels.

 

![Simple send to recipients flow](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/bfa564f8-144c-4942-b3e8-f3c460761d4d/Schermata_2022-08-13_alle_20.27.56.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663L7ASXFV%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T123037Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGUaCXVzLXdlc3QtMiJHMEUCIQCPWvM7h0%2BD%2BaItLgkYEHZ1s1V5o%2FoBbD4Kytipe5ZoXgIgR5ZAIXvFoGezTT5Kguu2jVVI8OqrvQKMhm0zUIwU15cq%2FwMILRAAGgw2Mzc0MjMxODM4MDUiDITfqKx8%2B%2BK%2F7kgoFyrcA3K1q2w5uzpRHeXgx1VzM%2FNvybamU%2For6FX4xkPgugnKYkFoarli56UWwUh6JXe0vy0MXxwCpFtSvvMCc6OI14MQ6wu%2BB3v2jQM%2FD5Z3U61YrRkiHVmRSIHzog9Qyay0eUkFUoqNKADRc0xRbW02lpKHLjaPnFTS0OLrHvBlEvnq81r3YnZvR5R82mpMEKOP8u%2Fncl8ZRxbqyr2o%2FOAvYEEljVWH7HX%2B6wsiGXhmy5b0rzXljoY6MuCIZx6ZdXR4FBplAJORDmGvaNKzF1CqIFKki5wJRfx3A2y73rt%2BR6rPE6wLpxP2kjLiA1xzVpOqJCVF65m4u%2F2Vagr8pT%2FDPakMAgwcVXj8TJH4%2FGKBuKJ0oUuvfQ9jd1c6cGDmpLxSC0%2BghUfxQsjCvSWxD6Aw5hxUnMBUlWQQXPi1UQn7mWleKreU75l8zwhxG60t4ZYfcWrJri5UU1v3KQWDCpvw0%2BMtSsvP3lWUjcroovFKXn3BABjzUIAAkN5L2ZEfN8j0bTNl1ocHxni27pSPm%2FSNInkDXUSLraz2d4i8wFYAYx4Vwp%2BN2BSsk5lr8W2hjNrTadJThLDtDhN%2BqhF3vgXX0L99lsFuvCY7CQm0GyJsQahAQe9JEsowOBwXDFNyMPK1jNAGOqUBmIaSuk5uYp4swxdgXWspqhHmTs1iw6WwXOD16HLSGKbb8kRUhXyE1KwqekZfSrfXIuSdepORgpRDFdolHeDZCSUE%2FA2VBNhdW3Qyfud3858GhO7tDZjyNX23rdd1Mb7agV3Qz7pWztAi3V%2FyYAO%2FWB%2Fy6a29eFRok3uoNA7u9LlXzzNlE6tpXk%2BDNv8uZK4OaFcyAS9aRYtqJZEovLXG0Oxn2mcV&X-Amz-Signature=dfdb181cf29380dd3484007af5e5a1e5afcd0dbf80dfad1e1bbd52be73cc72cb&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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

![Retroaction to execute one element at a time](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/0d575475-0392-4108-86be-6a3cd96a4c06/Schermata_2022-08-14_alle_17.59.16.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663L7ASXFV%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T123037Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGUaCXVzLXdlc3QtMiJHMEUCIQCPWvM7h0%2BD%2BaItLgkYEHZ1s1V5o%2FoBbD4Kytipe5ZoXgIgR5ZAIXvFoGezTT5Kguu2jVVI8OqrvQKMhm0zUIwU15cq%2FwMILRAAGgw2Mzc0MjMxODM4MDUiDITfqKx8%2B%2BK%2F7kgoFyrcA3K1q2w5uzpRHeXgx1VzM%2FNvybamU%2For6FX4xkPgugnKYkFoarli56UWwUh6JXe0vy0MXxwCpFtSvvMCc6OI14MQ6wu%2BB3v2jQM%2FD5Z3U61YrRkiHVmRSIHzog9Qyay0eUkFUoqNKADRc0xRbW02lpKHLjaPnFTS0OLrHvBlEvnq81r3YnZvR5R82mpMEKOP8u%2Fncl8ZRxbqyr2o%2FOAvYEEljVWH7HX%2B6wsiGXhmy5b0rzXljoY6MuCIZx6ZdXR4FBplAJORDmGvaNKzF1CqIFKki5wJRfx3A2y73rt%2BR6rPE6wLpxP2kjLiA1xzVpOqJCVF65m4u%2F2Vagr8pT%2FDPakMAgwcVXj8TJH4%2FGKBuKJ0oUuvfQ9jd1c6cGDmpLxSC0%2BghUfxQsjCvSWxD6Aw5hxUnMBUlWQQXPi1UQn7mWleKreU75l8zwhxG60t4ZYfcWrJri5UU1v3KQWDCpvw0%2BMtSsvP3lWUjcroovFKXn3BABjzUIAAkN5L2ZEfN8j0bTNl1ocHxni27pSPm%2FSNInkDXUSLraz2d4i8wFYAYx4Vwp%2BN2BSsk5lr8W2hjNrTadJThLDtDhN%2BqhF3vgXX0L99lsFuvCY7CQm0GyJsQahAQe9JEsowOBwXDFNyMPK1jNAGOqUBmIaSuk5uYp4swxdgXWspqhHmTs1iw6WwXOD16HLSGKbb8kRUhXyE1KwqekZfSrfXIuSdepORgpRDFdolHeDZCSUE%2FA2VBNhdW3Qyfud3858GhO7tDZjyNX23rdd1Mb7agV3Qz7pWztAi3V%2FyYAO%2FWB%2Fy6a29eFRok3uoNA7u9LlXzzNlE6tpXk%2BDNv8uZK4OaFcyAS9aRYtqJZEovLXG0Oxn2mcV&X-Amz-Signature=68a7f1a8c09a467a5c4898791eae07410ae84c4908b93e6ac706f6023bf18d13&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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
