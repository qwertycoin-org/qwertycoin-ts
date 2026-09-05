# Qwertycoin v2 WASM Engine Spike

## Current Goal

Prove whether the upstream `monero-ts` WebAssembly wallet path can be reused
with Qwertycoin v2 core wallet code instead of reimplementing wallet
cryptography in JavaScript.

## Fork Chain

- `qwertycoin-ts` is derived from `woodser/monero-ts`.
- `qwertycoin-cpp` is derived from `woodser/monero-cpp`.
- `qwertycoin-cpp/external/monero-project` points to the Qwertycoin v2 core
  repository.

## Pinned QWC Core

- Core repository: `https://github.com/qwertycoin-org/qwertycoin.git`
- Core commit: `203eff708020c74b5d30de3ee156ba897315c869`
- Branch source: `main`

## QWC v2 Parameters To Preserve

- Coin: Qwertycoin / QWC
- Decimals: 8
- Mainnet standard address prefix constant: `0x14820c`
- Mainnet standard addresses must begin with `QWC`
- HF17 is active from genesis in the QWC v2 chain
- Existing QWC Core wallet, address, RingCT, CLSAG, Bulletproofs+, and view-tag
  behavior must remain the source of truth.

## Security Position

The browser wallet must not contain a second independent implementation of QWC
wallet cryptography. The preferred path is:

```text
QWC Core wallet code
  -> qwertycoin-cpp bridge
  -> qwertycoin-ts WebAssembly bindings
  -> Web Wallet UI
```

Seeds and private keys must remain inside the browser process and must never be
sent to Cloudflare, daemon RPC nodes, logs, analytics, telemetry, or any
third-party API.

## First Practical Check

The first WebAssembly build passed in a Docker-based Emscripten environment on
2026-08-31.

- Build host: controlled Linux build host
- Container image: `emscripten/emsdk:3.1.66`
- Node.js: provided by the Emscripten image
- QWC core source: historical pre-migration PoC snapshot
- Bridge source: historical pre-migration `qwertycoin-cpp` snapshot
- Engine source: historical pre-migration `qwertycoin-ts` snapshot
- Output: `dist/monero.js` and `dist/monero.worker.js`

Artifact checksums from the first successful spike build:

```text
a9d47b1715410a5a3cd122707b09b2eff72459085c72519b279f5a07ea9c4ce5  dist/monero.js
c03493d3431b0880ad96b253f7b532854da2e91cc0f3837c0d04c5a88a400f25  dist/monero.worker.js
```

The same build was repeated directly in Docker on a second controlled Linux host while
GitHub Actions was unavailable due to account minute/billing limits:

- Build date: 2026-08-31
- Container image: `emscripten/emsdk:3.1.66`
- Engine commit: `6297ecc5` in `qwertycoin-ts`
- QWC core commit: `cdb23fe454028b34bb98c76216896deb0d936a73`
- Native dependencies installed inside the temporary container only.
- Emscripten include paths must not point at `/usr/include`, because that
  exposes native Linux libc headers to Emscripten's ports. Copy only
  `unbound.h` into a small temporary include directory and export that path.

The direct Docker build produced identical artifact checksums:

```text
a9d47b1715410a5a3cd122707b09b2eff72459085c72519b279f5a07ea9c4ce5  dist/monero.js
c03493d3431b0880ad96b253f7b532854da2e91cc0f3837c0d04c5a88a400f25  dist/monero.worker.js
```

A later full-wallet sync smoke exposed that the keys-only build path was not
enough for balance and history. `createWalletFull()` aborted in WASM with
`missing function: rx_slow_hash` when sync touched wallet2/RandomX-dependent
code. The WASM target now explicitly compiles QWC core's `rx-slow-hash.c` and
links RandomX into the Emscripten target.

Updated full-wallet sync build:

- Build host: controlled Linux build host
- Container image: `emscripten/emsdk:3.1.66`
- Engine source: historical pre-migration `qwertycoin-ts` snapshot
- QWC core source: historical pre-migration PoC snapshot

Updated artifact checksums:

```text
976cf7f41200b38a03383623dab9e151f44d297468bfd265f1ddcd3d333cfffe  dist/monero.js
8289d09e18e372c554786106d98cd4452244635d5f948271e08a46cfd134ff1e  dist/monero.worker.js
```

The first full-wallet sync smoke against the live restricted QWC node passed:

- Daemon: controlled restricted QWC RPC endpoint
- Daemon height: `164`
- Wallet sync result: `numBlocksFetched: 163`
- Balance: `0`
- Unlocked balance: `0`
- Transaction count: `0`

A targeted JavaScript smoke against the built `dist` passed:

- `MoneroUtils.isValidAddress()` accepts a known QWC v2 mainnet `QWC...`
  address.
- `createWalletKeys()` creates a mainnet keys-only wallet.
- The generated primary address begins with `QWC`.
- The generated address validates as mainnet.

The first dedicated regression test for this path is
`src/test/TestQwertycoinUtils.ts`. It passed in the same Docker/Emscripten
environment:

```text
TEST QWERTYCOIN UTILITIES
  3 passing
```

The first direct QWC core integration failure was a bridge API mismatch:
`qwertycoin-cpp` expected `tools::wallet2::shutdown()`, but the current QWC v2
wallet2 implementation does not expose that method. The bridge now calls
`shutdown()` only when the embedded wallet implementation provides it.

The build still reports upstream undefined-symbol warnings because the inherited
WASM build disables `ERROR_ON_UNDEFINED_SYMBOLS`. These warnings must be audited
before beta release:

- OpenSSL BIO/PEM cleanup helpers
- selected epee file helper functions
- selected Blockchain pending-block helper
- Trezor registration symbol
- notification helper symbol

The JavaScript dependency tree also needs security work before public beta. The
first `npm audit` during the spike reported 29 vulnerabilities, including 5
critical findings. No wallet beta may be published before the dependency set is
reduced, upgraded, or explicitly risk-accepted with compensating controls.
