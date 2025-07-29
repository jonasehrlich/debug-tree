# Usage

## Create, Open or Delete a Flow

After opening the frontend application, a new flow can be created. If no flow is opened already,
you are forced to create a flow first in the opened dialog.

If another flow is already open, the flows dialog can be opened by

- Click on the currently open flow name in the menu bar
- Select `File > Open / Create Flow` in the menu bar

This dialog also allows opening an existing flow from the list of flows. Flows can be opened either
by a double click on a flow in the list or selecting it and clicking `Open Flow`

This dialog also allows deleting flows by clicking on the trash icon next to flows in the list.

## Create a Node

After creation of a flow you are forced to create a root status node.

After a node is created, new nodes can be created by dragging an edge from the source handle of
a node. Creating a node will always open a dialog to describe the node.

For action nodes the node creation dialog also offers to create new branches or tags in the Git
repository. The created reference is then automatically selected as the revision associated with
this node.

## Edit a Node

Existing nodes can be edited in two ways:

- Double-click on the existing node
- Select _Edit_ from the dot-menu in the header of the existing node

This will open a dialog where the current node information can be edited.

Status nodes have the additional `state` attribute which represents whether the status is an
improvement, another problem or a fix.

The status node state can be edited in the edit node dialog and by using the dropdown on the
state icon in the node header.

## Delete a Node

All nodes, except the root node can be deleted by selecting _Delete_ from the dot-menu in
the node header or by pressing `Backspace` while a node is selected.

Deleting a node will automatically delete all edges connected to it.

## Persistence and Saving

The web frontend will persist the state of the application in `local storage` in the browser.
To save the current status of a flow to the file-system through the backend click `File > Save` in
the menu bar or press `^S` / `⌘S` depending on your platform.

While unsaved changes are detected, the `File` item in the menu bar will display a small badge.
