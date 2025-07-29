# What is debug-flow?

<!--@include: ../../README.md#introduction-->

Conceptually, the application serves as a backend server running in the repository, which:

- Serves the frontend application
- Interacts with the Git Repository
- Manages the state of the flows stored in the flows directory

![debug-flow production setup](/debug-flow-prod-setup.drawio.svg)

It is the backend server, running in the repository, interacting with it and managing the state of
flows stored in the repository.

It also serves a web frontend which contains the flow editor.

## Nodes

`debug-flow` has two kinds of nodes status nodes and action nodes.

A status node represents a status in the debugging process. It can be linked to a Git tag or a
commit ID.

An action node is the action taken as a result of a status. One status can result in multiple, parallel
actions taken to represent different possible approaches.

The types of nodes can only be added in alternating order, as the result of an action is always a
new status and a status can (but not _must_) result in a new action.

Each node can be linked to Git revisions.
