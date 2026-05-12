
The configuration node is used to receive in **NodeRED** configuration data defined in the **Mission Control** dashboard.

Warning! To correctly use this node it might be necessary to develop a specific plugin for **Mission Control**. 

A configuration is an custom payload related to a plugin and it’s identified by a _“namespace”_. For example a plugin for answering about the opening hours of a shop could have a configuration panel to define the timetable, in that case the namespace could be “opening-hours”.

| Name      | Type   | Description                        |
| --------- | ------ | ---------------------------------- |
| chatbotId | string | The chatbotId of the configuration |
| namespace | string | The namespace of the configuration |
