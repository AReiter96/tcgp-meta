# Shared devcontainer image for the owner's Node, Python and Rust projects (no JDK).
# Master copy: homeserver-projects infra/devcontainer/general/Dockerfile (v1).
# Keep every copy byte-identical; per-repo differences go into build.args in
# .devcontainer/devcontainer.json (EXTRA_APT_PACKAGES, RUST_TOOLCHAIN).
FROM mcr.microsoft.com/devcontainers/base:3.0.8-noble@sha256:d7c468679f45a52ad3673d06656b5bf16e488990b17216a1fa295d9e1f89d724

SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

# The GitHub CLI from the signed Ubuntu archive.
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends gh \
 && rm -rf /var/lib/apt/lists/*

# Node.js from nodejs.org, checksum-pinned. It has to exist before the Claude Code
# feature runs; otherwise the feature installs Node 18 from NodeSource.
ARG NODE_VERSION=24.21.0
ARG NODE_SHA256=6e1db87ef58b8819e5d5402eff1536491b18edd8eb7bee5ef7897876e88dc5ff
RUN curl -fsSLo /tmp/node.tar.gz "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
 && echo "${NODE_SHA256}  /tmp/node.tar.gz" | sha256sum -c - \
 && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 --no-same-owner \
 && rm /tmp/node.tar.gz

# Mount point of the claude-code-config volume. A new volume copies owner and mode
# from the image path, so creating it here keeps it writable for vscode.
RUN install -d -o vscode -g vscode /home/vscode/.claude

# Extra Ubuntu packages per repo, e.g. python3-venv (Ubuntu 24.04 ships Python 3.12).
ARG EXTRA_APT_PACKAGES=""
RUN if [ -n "${EXTRA_APT_PACKAGES}" ]; then \
      apt-get update \
      && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ${EXTRA_APT_PACKAGES} \
      && rm -rf /var/lib/apt/lists/*; \
    fi

# Rust in /usr/local/rustup and /usr/local/cargo, only when RUST_TOOLCHAIN names an
# exact version (e.g. 1.98.1, never "stable"). rustup-init is checksum-pinned; rustup
# checks the toolchain against that version's channel manifest. gcc is the linker.
# Both trees belong to vscode, so cargo can fill its registry cache. The PATH entry
# is harmless without Rust.
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:${PATH}
ARG RUST_TOOLCHAIN=""
ARG RUSTUP_VERSION=1.29.1
ARG RUSTUP_SHA256=dda7234360b7f578ca8b0ddcb80145646fa61a67c1720a5abc7051b35c9fcb71
RUN if [ -n "${RUST_TOOLCHAIN}" ]; then \
      apt-get update \
      && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends gcc libc6-dev \
      && rm -rf /var/lib/apt/lists/* \
      && curl -fsSLo /tmp/rustup-init "https://static.rust-lang.org/rustup/archive/${RUSTUP_VERSION}/x86_64-unknown-linux-gnu/rustup-init" \
      && echo "${RUSTUP_SHA256}  /tmp/rustup-init" | sha256sum -c - \
      && chmod +x /tmp/rustup-init \
      && /tmp/rustup-init -y --no-modify-path --profile minimal --default-toolchain "${RUST_TOOLCHAIN}" \
      && rm /tmp/rustup-init \
      && chown -R vscode:vscode "${RUSTUP_HOME}" "${CARGO_HOME}" \
      && rustc --version; \
    fi
