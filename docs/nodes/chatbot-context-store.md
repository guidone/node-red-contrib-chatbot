
Get, set or delete an element in the chat context.

The chat context is a volatile namespace for variables related to the current chat user, some variables are predefined (like _firstName_, _lastName_, _topic_, _chatId_, etc).

Typically this node is used to manually set the _topic_ of the user before or after entering a [Rivescript node](https://www.notion.so/db8481a702b6491093f7ea53d765129e)  or to store the extracted variables of an [Intent payload](https://www.notion.so/b4bd4f8db5d243d487430d073c35992b) .

For example, nodes like [Dialogflow node](https://www.notion.so/84b9ea66d20743fd9cf45d3de5f17693)  can extract the _intent_ from a sentences along with some variables (numbers, dates, etc). Chaining a [Context node](https://www.notion.so/24a646bff58b4edfb249f1d27384230f)  stores these vars in the chat context

![Store Intent vars](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/d13e4586-3e43-4549-aad8-d7139cab26dc/context-example-1.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4662GJBU23R%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T123011Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIQCLDnx1T5qrD65e50VU8yhdwHAV0Lfi4eJ7WGLODoKbpgIgbxjs4t%2FrIgCjreBGxaorXZk1CGz6TZxgYEBTmw5KxMIq%2FwMILRAAGgw2Mzc0MjMxODM4MDUiDHl3bfYrO6GGbPVAxyrcA2Roy6lIo6TkH2P%2FMG1Tu8%2FpsZIxF9widrqNtvkpBgG1n4psQuDsmm1457ndk1%2ByVg2lakqv%2B6vxVON0Pt4OLdRXqaeDaVRtyjxCm2VQekaprIbhaqX3Z1DB3LZnNR71XN%2F%2BrnEfuVhjFAynahrFVFKPkOOExlcWEY0f%2BH2i%2FHPw3Uuz8XT6q0H3frMATrrmvNaQky7rFc8u4dlkWb7iSBmFuoWds%2B8%2F2FKYGvr0D07ehgJOLXDdOFjXf7r1VsDVDsPyaI4NUxYQkx%2FceZGbJnafrZIwBXhowYI1OUolNJEMOtOwUh61z3Nff85T%2FTh4f%2Bx8LBcgC2wng0vBaECjGk7cIe8kPpgMOH2dLEZk1w4KhOy4bFp3uZSpm49JGqdw60NihFxAbctlaLr0wG9Sqmb8YYOZZBwQfH19I6HbgtesYAMJzaE%2Bja3TQg2JHfLmL%2BP%2BPFtgpqpdRBFZm3MtXthA0xaIJ3KiaDuAwDePyK3ek4wLrRt0I%2F08X0DZF%2FncaOf9c0g4Q8FGIEVjja4T%2B1ajCaf9PBVzfxVWjhGXsGSxA9jVCG6%2B1NEgnyJQCSlNtSAYPkWmBF5enkTYcSVpj7%2Fn2EWwddu6SmeEI2l3mtDi45HV2XANHgaHHhxVMMOyjNAGOqUBRKbGvsqk1DSMM7%2FWGNqfl6XAxSyKYNwCdcx2FzcqUM6vwKqP7PHqdz3FVArHVQxNTuspoCD4R9cdSv4Ve87125JBljgyvx2peGTKlzH8cKQy9oZhA9SCnlq%2FY%2F8EEMk6FgCk97T7cxUg4bg%2By3BXRq%2FwhWfUmRy8hPKb5IXEmAiKNlzZnv2eSHYeU2iROY55h6knutBKOKmfMz7e97M0zaYhLnl2&X-Amz-Signature=f40e14c1b907c63283e668f8321c719700b44eb7f774f8b29a1bab42b4dac76a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Available parameters for the `msg.payload`

| Name       | Type   | Description                                                                             |
| ---------- | ------ | --------------------------------------------------------------------------------------- |
| command    | string | Operation to do on the context: _get_, _set_, _delete_, _intent_                        |
| fieldType  | string | Type of field to set. Required for command: _set_. Can be: _str_, _num_, _bol_, _json_. |
| fieldValue | string | The value to be set. Required for command: _set_                                        |
| fieldName  | string | The name of the chat context variable. Required for command: _set_, _get_, _delete_     |

This node is available for all platforms.
