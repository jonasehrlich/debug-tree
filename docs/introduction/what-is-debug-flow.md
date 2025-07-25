# What is debug-flow?

<!--@include: ../../README.md#introduction-->

This is how the application looks like from a conceptual point of view.

![debug-flow production setup](/debug-flow-prod-setup.drawio.svg)

It is the backend server, running in the repository, interacting with it and managing the state of
flows stored in the repository.

It also serves a web frontend which contains the flow editor.

## Nodes

`debug-flow` has two kinds of nodes status nodes and action nodes

### Status Node

A status node represents a status in the debugging process. It can be linked to a Git tag or a
commit ID.

### Action Node

An action node is the action taken as a result of a status. One status can result in multiple, parallel
actions taken to represent different possible approaches.
