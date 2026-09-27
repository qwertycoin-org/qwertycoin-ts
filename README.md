# qwertycoin-ts

TypeScript and WebAssembly bindings for Qwertycoin v2 wallets, daemon RPC,
message signing, and the QMS2 encrypted-messaging backend.

The WebAssembly build is compiled from the pinned source graph:

```text
qwertycoin-ts
└── external/qwertycoin-cpp
    └── external/qwertycoin-core
```

The public package keeps its inherited API type identifiers for source and ABI
compatibility. Active repository paths, build targets, distributable artifacts,
and worker names use Qwertycoin branding. Original copyright, license, and
provenance notices remain in `NOTICE`, `LICENSE.txt`, and the relevant source
files.

## Distribution artifacts

The browser distribution produces:

- `dist/qwertycoin.js` — single-file wallet WebAssembly loader;
- `dist/qwertycoin.worker.js` — browser wallet worker;
- `dist/qwertycoin.worker.js.LICENSE.txt` — bundled third-party notices;
- `dist/qms2/` — separately checksummed QMS2 cryptography module and notices.

Applications can load the wallet module directly:

```ts
import LibraryUtils from "./src/main/ts/common/LibraryUtils";

const module = await LibraryUtils.loadWasmModule();
```

Browser applications may override the worker location before creating a wallet:

```ts
LibraryUtils.setWorkerDistPath("/assets/qwertycoin.worker.js");
```

## Build

Clone with submodules and install the pinned JavaScript dependencies:

```bash
git clone --recurse-submodules https://github.com/qwertycoin-org/qwertycoin-ts.git
cd qwertycoin-ts
npm ci
```

The complete browser build additionally requires the Emscripten, Rust,
wasm-bindgen, Boost, OpenSSL, and Unbound versions pinned by
`.github/workflows/qms-wasm-artifact.yml`.

```bash
./bin/build_dist.sh
RUSTUP_TOOLCHAIN=1.98.1 ./bin/build_qms_wasm.sh
```

The CI workflow verifies the exact qwertycoin-ts → qwertycoin-cpp → Core source
graph before building and publishes a short-lived artifact with SHA-256 evidence.

## Tests

```bash
npm test
npm run test:qwc-utils
```

QMS2 also runs the Rust, native bridge, WebAssembly round-trip, manifest, and
browser integration tests documented in the open Messenger pull requests.

## Security and networking

- QMS2 requires ABI 3 and fails closed on mismatched modules.
- Browser networking remains disabled unless the embedding application provides
  the reviewed transport policy.
- Do not expose private wallet RPC methods to untrusted callers.
- Verify `QMS-WASM-SHA256SUMS`, `QMS2-SHA256SUMS`, and `QMS-WASM-SOURCES` before
  vendoring an artifact.

## License and provenance

Qwertycoin-specific changes are MIT licensed unless a component states
otherwise. QMS2 includes AGPL-3.0-licensed libsignal code; its corresponding
source, license, rebuild information, and third-party notices must accompany
every distributed QMS2 binary or WebAssembly build. See `NOTICE` and
`dist/qms2/THIRD_PARTY.qwc-qms-crypto.md`.
