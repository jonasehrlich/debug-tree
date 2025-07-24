# Getting Started

## Install

Download the binary from the [Releases](https://github.com/jonasehrlich/debug-flow/releases) and put
it into a directory inside the `$PATH` environment variable.

## Run

Run `debug-flow` inside the Git Repository that should be managed using:

```sh
debug-flow serve
```

> ![NOTE]
> `debug-flow` does not allow binding the server to another host than `localhost`. The started server
> provides access to your Git repository through the API which should not be exposed to other users.
> See [Running on Remote Servers](#running-on-remote-servers) for how to use it on remote servers.

This will create a `./debug-flow` directory and start a webserver on `localhost` that provides access
to your projects and the repository.

The host and port that the server binds to is printed in the terminal and can then be opened in the
browser.

> ![TIP]
> `debug-flow` binds to port 8000 by default.Use the `--port 0` argument with the `serve` subcommand
> to bind to a random port provided by your operating system. This avoids binding to a port that is
> already in use.

### Running on Remote Servers

> ![TODO]
> Use SSH tunnels

## Create a first debug flow

Open the URL printed by the server
