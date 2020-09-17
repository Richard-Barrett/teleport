# Automated node join script for Teleport

This is an automated node join script for Teleport, which does the following:

- checks for an existing Teleport process, data directory, config file or Teleport binaries (and provides details how to clean up if any of these are present)
- tests connectivity to the given Teleport server host and port
  - using either `nc`, `telnet` or `/dev/tcp` if available)
- detects OS, distribution, architecture and appropriate Teleport package format, then downloads this package  to a temporary directory and installs it
  - using either `curl` or `wget` for downloads depending on which is available
  - `tar` for tarball extraction if needed
  - `dpkg` for .deb installs
  - `dnf`, `yum` or `rpm` for .rpm installs
- generates a Teleport config to set up a node and writes it to disk
- installs and starts Teleport
  - via `systemd` on Linux
  - via `launchctl` on MacOS
- cleans up downloaded archives afterwards

## Supported operating systems, architectures and distributions

- Linux
  - Architectures: i386, x86_64, armv7l
  - Any Debian-based distribution
    - Debian 8+
    - Ubuntu 18.04+
      - uses `.deb` package
  - Any CentOS-based distribution
    - CentOS 6+*
    - RHEL 6+*
    - Fedora 27+
    - Amazon Linux 2+
      - uses `.rpm` package
  - Any other distribution
    - uses `.tar.gz` tarball package

- MacOS
  - Architectures: x86_64, aarch64 (no Teleport binaries available yet)
  - MacOS 10.12+
    - uses `.tar.gz` tarball package

## Arguments

Required arguments:
| Flag | Description | Example value | Required |
| - | - | - | - |
| `-v` | Teleport version | `4.3.5` | yes |
| `-h` | Hostname for the Teleport auth/proxy server | `teleport.example.com` | yes |
| `-j` | A valid node join token | `ool7ahpo4thohmeuS1gieY7laiwae7oo` | yes |
| `-c` | The CA pin hash of the cluster being joined | `sha256:6abdd3a143a230fd31c9706d668bba3ee25a6e0eec54fcd69680c1ec0530fe9c` | yes |
| `-p` | Port connect to on the Teleport auth/proxy server | `3080` | no |

If any of these arguments is not provided via CLI flags, they will be requested interactively at runtime.

Optional extra flags:

| Flag | Description | Example value | Required |
| - | - | - | - |
| `-q` | Enable quiet mode | n/a | no |
| `-l` | Write logs to file | `/var/log/teleport-node-installer.log` | no |

## Example usage

```console
$ bash ./install.sh \
    -v 4.3.5 \
    -h teleport.example.com \
    -p 3080 \
    -j ool7ahpo4thohmeuS1gieY7laiwae7oo \
    -c sha256:6abdd3a143a230fd31c9706d668bba3ee25a6e0eec54fcd69680c1ec0530fe9c
```