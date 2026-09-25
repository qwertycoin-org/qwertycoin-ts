#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE_DIR="${ROOT_DIR}/external/qwertycoin-cpp/external/qwertycoin-core"
CRATE_DIR="${CORE_DIR}/src/qms/crypto"
OUT_DIR="${QWC_QMS_WASM_OUT_DIR:-${ROOT_DIR}/dist/qms2}"
CARGO_BIN="${CARGO:-cargo}"
RUSTC_BIN="${RUSTC:-rustc}"
WASM_BINDGEN_BIN="${WASM_BINDGEN:-wasm-bindgen}"

EXPECTED_RUST="1.98.1"
EXPECTED_ABI="3"
export RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-${EXPECTED_RUST}}"

test "$(git -C "${CORE_DIR}" rev-parse HEAD)" = "efd0667129d52c89157cb36241a703c3becfb52f"
"${CARGO_BIN}" --version
"${RUSTC_BIN}" --version | grep -F "rustc ${EXPECTED_RUST}"

"${CARGO_BIN}" build --manifest-path "${CRATE_DIR}/Cargo.toml" --locked --release \
  --target wasm32-unknown-unknown

WASM_INPUT="${CRATE_DIR}/target/wasm32-unknown-unknown/release/qwertycoin_qms_crypto.wasm"
test -s "${WASM_INPUT}"

WEB_TMP="$(mktemp -d)"
NODE_TMP="$(mktemp -d)"
cleanup() {
  rm -r -- "${WEB_TMP}" "${NODE_TMP}"
}
trap cleanup EXIT

"${WASM_BINDGEN_BIN}" --target web --out-dir "${WEB_TMP}" \
  --out-name qwc_qms_crypto "${WASM_INPUT}"
"${WASM_BINDGEN_BIN}" --target nodejs --out-dir "${NODE_TMP}" \
  --out-name qwc_qms_crypto "${WASM_INPUT}"

node "${CRATE_DIR}/tests/wasm_roundtrip.cjs" "${NODE_TMP}/qwc_qms_crypto.js"
node -e "const q=require(process.argv[1]); if(q.qwc_qms_wasm_abi_version()!==Number(process.argv[2])) process.exit(1)" \
  "${NODE_TMP}/qwc_qms_crypto.js" "${EXPECTED_ABI}"

mkdir -p "${OUT_DIR}"
install -m 0644 "${WEB_TMP}/qwc_qms_crypto.js" "${OUT_DIR}/qwc_qms_crypto.js"
install -m 0644 "${WEB_TMP}/qwc_qms_crypto_bg.wasm" "${OUT_DIR}/qwc_qms_crypto_bg.wasm"
install -m 0644 "${WEB_TMP}/qwc_qms_crypto.d.ts" "${OUT_DIR}/qwc_qms_crypto.d.ts"
install -m 0644 "${WEB_TMP}/qwc_qms_crypto_bg.wasm.d.ts" "${OUT_DIR}/qwc_qms_crypto_bg.wasm.d.ts"
install -m 0644 "${CRATE_DIR}/LICENSE" "${OUT_DIR}/LICENSE.qwc-qms-crypto"
install -m 0644 "${CRATE_DIR}/THIRD_PARTY.md" "${OUT_DIR}/THIRD_PARTY.qwc-qms-crypto.md"

(
  cd "${OUT_DIR}"
  sha256sum \
    qwc_qms_crypto.js \
    qwc_qms_crypto_bg.wasm \
    qwc_qms_crypto.d.ts \
    qwc_qms_crypto_bg.wasm.d.ts \
    LICENSE.qwc-qms-crypto \
    THIRD_PARTY.qwc-qms-crypto.md \
    > QMS2-SHA256SUMS
)
