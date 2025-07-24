# Getting Started

## Install

Download the binary from the [Releases](https://github.com/jonasehrlich/debug-flow/releases) and put
it into a directory that is included in the `$PATH` environment variable or build your own binary as described in
[Build and Run](/dev/#build-and-run).

## Run debug-flow

Run `debug-flow` inside the Git Repository that should be managed using:

```sh
debug-flow serve
```

This will create a `./debug-flow` directory and start a webserver on `localhost` that provides access
to your projects and the repository.

The host and port that the server binds to is printed in the terminal and can then be opened in the
browser.

> [!TIP]
> `debug-flow` binds to port 8000 by default.Use the `--port 0` argument with the `serve` subcommand
> to bind to a random port provided by your operating system. This avoids binding to a port that is
> already in use.

### Running on Remote Servers

`debug-flow` does not allow binding the server to another host than `localhost`. The started server
provides access to your Git repository through the API which should not be exposed to other users.

If you are running `debug-flow` on a remote server, you can use SSH local port forwarding to access
the web interface from your local machine.

> [!TIP]
> Some development environments, like VSCode Remote Development, automatically forward ports for
> you. When you start `debug-flow` on a remote server, you might see a notification that the port
> has been forwarded, and you can access it directly on `http://localhost:8000` on your local machine.

This can be done by running the following command on your local machine:

```sh
ssh -L <local-port>:localhost:<remote-port> user@remote-server
```

This command forwards requests from `<local-port>` on your local machine to port `<remote-port>` on the
`remote-server`. For example, if `debug-flow` is running on the default port 8000 on the remote server, you can forward
it to port 8000 on your local machine:

```sh
ssh -L 8000:localhost:8000 user@remote-server
```

You can then open `http://localhost:8000` in your browser to access `debug-flow`.

> [!TIP]
> To make this permanent, you can add the `LocalForward` directive to your SSH configuration file
> (`~/.ssh/config`):
>
> ```text
> Host my-remote-server
>   HostName remote-server
>   User user
>   LocalForward 8000 localhost:8000
> ```
