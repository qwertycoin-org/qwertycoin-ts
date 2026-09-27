cmake_minimum_required(VERSION 3.5)

project(qwertycoin-ts-wasm)

# build with exception whitelist from file
set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS wasm_exception_whitelist.txt) # reconfigure when the whitelist changes so flags are not stale
file(STRINGS wasm_exception_whitelist.txt WASM_EXCEPTION_WHITELIST)
string(REPLACE ";" "," WASM_EXCEPTION_WHITELIST "${WASM_EXCEPTION_WHITELIST}")
SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14 -Oz -s EXCEPTION_CATCHING_ALLOWED='[${WASM_EXCEPTION_WHITELIST}]' -D_REENTRANT")
add_definitions(-DAUTO_INITIALIZE_EASYLOGGINGPP -DNO_AES)

##############
# C++ bridge
##############

include_directories("src/cpp")

#####################
# qwertycoin-cpp
#####################

set(QWERTYCOIN_CPP "external/qwertycoin-cpp")
set(QWERTYCOIN_CPP_SRC "${QWERTYCOIN_CPP}/src")

# headers
include_directories("${QWERTYCOIN_CPP_SRC}")
include_directories("${QWERTYCOIN_CPP}/external/libsodium/include")
include_directories("${QWERTYCOIN_CPP}/external/libsodium/include/sodium")

##################
# Qwertycoin Core
##################

set(QWERTYCOIN_CORE "${QWERTYCOIN_CPP}/external/qwertycoin-core")
set(QWERTYCOIN_CORE_SRC "${QWERTYCOIN_CORE}/src")

# Generate version.cpp from the pinned Qwertycoin Core source tree.  The core's
# Version.cmake assumes it is included from the core's own top-level project;
# when included here it incorrectly treats qwertycoin-ts as SOURCE_DIR and
# looks for qwertycoin-ts/src/version.cpp.in.  Accept an explicit revision for
# immutable source snapshots, otherwise derive it from the pinned submodule.
set(QWC_CORE_SOURCE_DIR "${CMAKE_SOURCE_DIR}/${QWERTYCOIN_CORE}")
if(NOT DEFINED QWC_CORE_REVISION OR QWC_CORE_REVISION STREQUAL "")
  find_package(Git QUIET)
  if(GIT_FOUND OR Git_FOUND)
    execute_process(
      COMMAND "${GIT_EXECUTABLE}" -C "${QWC_CORE_SOURCE_DIR}" rev-parse --short=9 HEAD
      RESULT_VARIABLE QWC_CORE_GIT_RESULT
      OUTPUT_VARIABLE QWC_CORE_REVISION
      OUTPUT_STRIP_TRAILING_WHITESPACE)
  endif()
endif()
if(NOT DEFINED QWC_CORE_REVISION OR QWC_CORE_REVISION STREQUAL "" OR
   (DEFINED QWC_CORE_GIT_RESULT AND NOT QWC_CORE_GIT_RESULT EQUAL 0))
  message(FATAL_ERROR "QWC_CORE_REVISION is required when building from a source snapshot")
endif()
string(LENGTH "${QWC_CORE_REVISION}" QWC_CORE_REVISION_LENGTH)
if(NOT QWC_CORE_REVISION MATCHES "^[0-9a-f]+$" OR
   QWC_CORE_REVISION_LENGTH LESS 9 OR QWC_CORE_REVISION_LENGTH GREATER 40)
  message(FATAL_ERROR "QWC_CORE_REVISION must be a 9-40 character lowercase Git object id")
endif()
set(VERSIONTAG "${QWC_CORE_REVISION}")
set(VERSION_IS_RELEASE "false")
configure_file(
  "${QWC_CORE_SOURCE_DIR}/src/version.cpp.in"
  "${CMAKE_BINARY_DIR}/version.cpp"
  @ONLY)

# headers
include_directories("src/main/cpp")
include_directories("${QWERTYCOIN_CORE_SRC}/")
include_directories("${QWERTYCOIN_CORE_SRC}/checkpoints")
include_directories("${QWERTYCOIN_CORE_SRC}/common")
#include_directories("${QWERTYCOIN_CORE_SRC}/crypto")
#include_directories("${QWERTYCOIN_CORE_SRC}/crypto/crypto_ops_builder/include/")    # DISABLED?
#include_directories("${QWERTYCOIN_CORE_SRC}/crypto/crypto_ops_builder/include/sodium")    # DISABLED?
include_directories("${QWERTYCOIN_CORE_SRC}/cryptonote_basic")
#include_directories("${QWERTYCOIN_CORE_SRC}/multisig")
#include_directories("${QWERTYCOIN_CORE_SRC}/cryptonote_core")
#include_directories("${QWERTYCOIN_CORE_SRC}/cryptonote_protocol")
#include_directories("${QWERTYCOIN_CORE_SRC}/wallet")
#include_directories("${QWERTYCOIN_CORE_SRC}/rpc")
#include_directories("${QWERTYCOIN_CORE_SRC}/mnemonics")
include_directories("${QWERTYCOIN_CORE}/external/")
include_directories("${QWERTYCOIN_CORE}/external/easylogging++")
include_directories("${QWERTYCOIN_CORE}/external/rapidjson/include")
include_directories("${QWERTYCOIN_CORE}/external/unbound/libunbound")
include_directories("${QWERTYCOIN_CORE}/external/db_drivers/liblmdb")
include_directories("${QWERTYCOIN_CORE}/external/randomx/src")
include_directories("${QWERTYCOIN_CORE}/contrib/epee/include")
include_directories("${QWERTYCOIN_CORE}/contrib/epee/include/net")

#include_directories("${CMAKE_CURRENT_BINARY_DIR}")
#include_directories("${QWERTYCOIN_CORE_SRC}/wallet/api")

include_directories("${QWERTYCOIN_CORE}/build/release/translations")

# generate empty crypto/wallet/ops.h to select Qwertycoin Core internal wallet crypto (supercop asm is not wasm-compatible)
configure_file("${QWERTYCOIN_CORE_SRC}/crypto/wallet/empty.h.in" "${CMAKE_BINARY_DIR}/generated_include/crypto/wallet/ops.h" COPYONLY)
include_directories("${CMAKE_BINARY_DIR}/generated_include")

#############
# Unbound
#############

if(NOT DEFINED QWC_UNBOUND_SOURCE_INCLUDE OR QWC_UNBOUND_SOURCE_INCLUDE STREQUAL "")
  set(QWC_UNBOUND_SOURCE_INCLUDE "$ENV{HOME}/unbound-1.22.0/libunbound")
endif()
if(NOT EXISTS "${QWC_UNBOUND_SOURCE_INCLUDE}/unbound.h")
  message(FATAL_ERROR
    "QWC_UNBOUND_SOURCE_INCLUDE must point to the verified Unbound 1.22.0 libunbound source directory")
endif()
include_directories("${QWC_UNBOUND_SOURCE_INCLUDE}")

#############
# OpenSSL
#############

#find_package(OpenSSL REQUIRED)
#message(STATUS "Using OpenSSL include dir at ${OPENSSL}")

set(OPENSSL ${CMAKE_SOURCE_DIR}/build/openssl)
include_directories("${OPENSSL}")
include_directories("${OPENSSL}/include") # must exist already - run bin/build-openssl-emscripten.sh

add_library(openssl_crypto STATIC IMPORTED)
set_target_properties(
    openssl_crypto PROPERTIES IMPORTED_LOCATION
    ${OPENSSL}/lib/libcrypto.a
)

add_library(openssl_ssl STATIC IMPORTED)
set_target_properties(
    openssl_ssl PROPERTIES IMPORTED_LOCATION
    ${OPENSSL}/lib/libssl.a
)

#############
# Boost
#############

set(BOOST ${CMAKE_SOURCE_DIR}/build/boost)
include_directories("${BOOST}")
include_directories("${BOOST}/include") # must exist already - run bin/build_boost_emscripten.sh

add_library(boost_chrono STATIC IMPORTED)
set_target_properties(
    boost_chrono PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_chrono.a
)

add_library(boost_system STATIC IMPORTED)
set_target_properties(
    boost_system PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_system.a
)

add_library(boost_thread STATIC IMPORTED)
set_target_properties(
    boost_thread PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_thread.a
)

add_library(boost_serialization STATIC IMPORTED)
set_target_properties(
    boost_serialization PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_serialization.a
)

add_library(boost_filesystem STATIC IMPORTED)
set_target_properties(
    boost_filesystem PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_filesystem.a
)

add_library(boost_regex STATIC IMPORTED)
set_target_properties(
    boost_regex PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_regex.a
)

#############
# RandomX
#############

add_subdirectory(
    "${QWERTYCOIN_CORE}/external/randomx"
    "${CMAKE_BINARY_DIR}/randomx"
    EXCLUDE_FROM_ALL
)

#add_library(boost_atomic STATIC IMPORTED)
#set_target_properties(
    #boost_atomic PROPERTIES IMPORTED_LOCATION
    #${BOOST}/lib/libboost_atomic.a
#)

################################
# Keys-only wallet source files
################################

set(
    QWC_WALLET_KEYS_SRC_FILES
    
    # qwertycoin-ts WASM bridge
    src/main/cpp/index.cpp
    src/main/cpp/qwertycoin_wasm_bridge.cpp
    
    # qwertycoin-cpp (modified for WASM)
    ${QWERTYCOIN_CPP_SRC}/utils/gen_utils.cpp
    ${QWERTYCOIN_CPP_SRC}/utils/monero_utils.cpp
    ${QWERTYCOIN_CPP_SRC}/common/monero_rpc_connection.cpp
    ${QWERTYCOIN_CPP_SRC}/daemon/monero_daemon_model.cpp
    ${QWERTYCOIN_CPP_SRC}/wallet/monero_wallet_model.cpp
    ${QWERTYCOIN_CPP_SRC}/wallet/monero_wallet_keys.cpp
    ${QWERTYCOIN_CPP}/external/libsodium/src/crypto_verify/verify.c
    
    # Qwertycoin Core (modified for WASM)
    ${CMAKE_BINARY_DIR}/version.cpp
    ${QWERTYCOIN_CORE_SRC}/cryptonote_basic/cryptonote_basic_impl.cpp
    ${QWERTYCOIN_CORE_SRC}/cryptonote_basic/account.cpp
    ${QWERTYCOIN_CORE_SRC}/cryptonote_basic/cryptonote_format_utils.cpp
    ${QWERTYCOIN_CORE_SRC}/cryptonote_basic/cryptonote_format_utils_basic.cpp
    ${QWERTYCOIN_CORE_SRC}/crypto/crypto.cpp
    ${QWERTYCOIN_CORE_SRC}/crypto/hash.c
    ${QWERTYCOIN_CORE_SRC}/crypto/slow-hash.c
    ${QWERTYCOIN_CORE_SRC}/crypto/rx-slow-hash.c
    ${QWERTYCOIN_CORE_SRC}/crypto/oaes_lib.c
    ${QWERTYCOIN_CORE_SRC}/crypto/crypto-ops.c
    ${QWERTYCOIN_CORE_SRC}/crypto/crypto-ops-data.c
    ${QWERTYCOIN_CORE_SRC}/crypto/keccak.c
    ${QWERTYCOIN_CORE_SRC}/crypto/chacha.c
    ${QWERTYCOIN_CORE_SRC}/crypto/random.c
    ${QWERTYCOIN_CORE_SRC}/crypto/aesb.c
    ${QWERTYCOIN_CORE_SRC}/crypto/tree-hash.c
    ${QWERTYCOIN_CORE_SRC}/crypto/hash-extra-blake.c
    ${QWERTYCOIN_CORE_SRC}/crypto/blake256.c
    ${QWERTYCOIN_CORE_SRC}/crypto/hash-extra-groestl.c
    ${QWERTYCOIN_CORE_SRC}/crypto/hash-extra-jh.c
    ${QWERTYCOIN_CORE_SRC}/crypto/hash-extra-skein.c
    ${QWERTYCOIN_CORE_SRC}/crypto/groestl.c
    ${QWERTYCOIN_CORE_SRC}/crypto/jh.c
    ${QWERTYCOIN_CORE_SRC}/crypto/skein.c
    ${QWERTYCOIN_CORE_SRC}/cryptonote_core/cryptonote_tx_utils.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/byte_stream.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/byte_slice.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/hex.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/string_tools.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/memwipe.c
    ${QWERTYCOIN_CORE}/contrib/epee/src/mlocker.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/mlog.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/wipeable_string.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/portable_storage.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/net_parse_helpers.cpp
    ${QWERTYCOIN_CORE}/contrib/epee/src/parserse_base_utils.cpp
    ${QWERTYCOIN_CORE_SRC}/common/base58.cpp
    ${QWERTYCOIN_CORE_SRC}/device/device.cpp
    ${QWERTYCOIN_CORE_SRC}/device/device_default.cpp
    ${QWERTYCOIN_CORE_SRC}/hardforks/hardforks.cpp
    ${QWERTYCOIN_CORE_SRC}/multisig/multisig.cpp
    ${QWERTYCOIN_CORE_SRC}/multisig/multisig_account.cpp
    ${QWERTYCOIN_CORE_SRC}/multisig/multisig_account_kex_impl.cpp
    ${QWERTYCOIN_CORE_SRC}/multisig/multisig_clsag_context.cpp
    ${QWERTYCOIN_CORE_SRC}/multisig/multisig_kex_msg.cpp
    ${QWERTYCOIN_CORE_SRC}/multisig/multisig_tx_builder_ringct.cpp
    ${QWERTYCOIN_CORE_SRC}/ringct/rctOps.cpp
    ${QWERTYCOIN_CORE_SRC}/ringct/rctTypes.cpp
    ${QWERTYCOIN_CORE_SRC}/ringct/rctCryptoOps.c
    ${QWERTYCOIN_CORE_SRC}/ringct/rctSigs.cpp
    ${QWERTYCOIN_CORE_SRC}/ringct/bulletproofs.cc
    ${QWERTYCOIN_CORE_SRC}/ringct/bulletproofs_plus.cc
    ${QWERTYCOIN_CORE_SRC}/ringct/multiexp.cc
    ${QWERTYCOIN_CORE_SRC}/mnemonics/electrum-words.cpp
    ${QWERTYCOIN_CORE}/external/easylogging++/easylogging++.cc
)

################################
# Full wallet source files
################################

set(
    QWC_WALLET_FULL_SRC_FILES
    
    # qwertycoin-ts WASM bridge
    src/main/cpp/http_client_wasm.cpp
    
    # qwertycoin-cpp (modified for WASM)
    ${QWERTYCOIN_CPP_SRC}/wallet/monero_wallet_full.cpp
    
    # Qwertycoin Core (modified for WASM)
    ${QWERTYCOIN_CORE}/external/db_drivers/liblmdb/mdb.c
    ${QWERTYCOIN_CORE}/external/db_drivers/liblmdb/midl.c
    ${QWERTYCOIN_CORE}/contrib/epee/src/abstract_http_client.cpp
    #${QWERTYCOIN_CORE}/contrib/epee/src/http_auth.cpp
    ${QWERTYCOIN_CORE_SRC}/wallet/wallet2.cpp
    ${QWERTYCOIN_CORE_SRC}/wallet/message_store.cpp
    ${QWERTYCOIN_CORE_SRC}/wallet/message_transporter.cpp
    ${QWERTYCOIN_CORE_SRC}/wallet/node_rpc_proxy.cpp
    ${QWERTYCOIN_CORE_SRC}/wallet/wallet_rpc_payments.cpp
    #${QWERTYCOIN_CORE_SRC}/blockchain_db/lmdb/db_lmdb.cpp
    ${QWERTYCOIN_CORE_SRC}/cryptonote_core/cryptonote_tx_utils.cpp
    ${QWERTYCOIN_CORE_SRC}/checkpoints/checkpoints.cpp
    ${QWERTYCOIN_CORE_SRC}/common/perf_timer.cpp
    ${QWERTYCOIN_CORE_SRC}/common/threadpool.cpp
    ${QWERTYCOIN_CORE_SRC}/common/aligned.c
    ${QWERTYCOIN_CORE_SRC}/common/util.cpp
    ${QWERTYCOIN_CORE_SRC}/common/i18n.cpp
    ${QWERTYCOIN_CORE_SRC}/common/combinator.cpp
    ${QWERTYCOIN_CORE_SRC}/rpc/rpc_payment_signature.cpp
    ${QWERTYCOIN_CORE_SRC}/wallet/ringdb.cpp
    ${QWERTYCOIN_CORE_SRC}/cryptonote_basic/miner.cpp
    ${QWERTYCOIN_CORE_SRC}/cryptonote_basic/difficulty.cpp
    ${QWERTYCOIN_CORE_SRC}/cryptonote_core/tx_sanity_check.cpp
)

####################
# Build parameters
####################

#-s USE_PTHREADS=1 \
#-s PTHREAD_POOL_SIZE=2 \
#-s PROXY_TO_PTHREAD \
#-s DISABLE_EXCEPTION_CATCHING=0 \
#-s ASYNCIFY=1 \
#-s 'ASYNCIFY_IMPORTS=[\"js_send_json_request\",\"js_send_binary_request\",\"emscripten_sleep\"]' \
#-s ALLOW_MEMORY_GROWTH=0 \
#-s INITIAL_MEMORY=1536MB \
#-s MALLOC=emmalloc \
#-s INITIAL_MEMORY=1024MB \
#-s TOTAL_STACK=512MB \

set (
EMCC_LINKER_FLAGS_BASE

# unsure if the -I...boost..include is necessary here due to include above
# TODO? does EXPORT_NAME need to be the same for both targets? (or should it be set per-target with …_WASM, …_ASMJS?)

"-Wall -Werror -Wno-js-compiler -Wl,--allow-undefined -std=c++14 -Oz -D_REENTRANT \
--bind \
-s MODULARIZE=1 \
-s 'EXPORT_NAME=\"qwertycoin_ts\"' \
-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
-s ASSERTIONS=0 \
-s EXIT_RUNTIME=0 \
-s PRECISE_F32=1 \
-s EXCEPTION_DEBUG=0 \
-s NO_DYNAMIC_EXECUTION=1 \
-s NODEJS_CATCH_EXIT=0 \
-s RESERVED_FUNCTION_POINTERS=5 \
-s EXPORTED_RUNTIME_METHODS='[\"UTF8ToString\",\"stringToUTF8\",\"lengthBytesUTF8\",\"intArrayToString\",\"getTempRet0\",\"addFunction\"]' \
-s SINGLE_FILE=1 \
-s ALLOW_MEMORY_GROWTH=1 \
-s WASM_BIGINT=1 \
-s EXPORTED_FUNCTIONS='[_free, _malloc]' \
-s STACK_SIZE=5MB \
-s DEFAULT_PTHREAD_STACK_SIZE=2MB \
"
    # • Disabling exception catching does not introduce silent failures 
    # • Probably don't need PRECISE_F32 but wouldn't want to not use it
    #
    #
    # -s SAFE_HEAP=1 \
    # -g \
)

set(
EMCC_LINKER_FLAGS_FULL
"${EMCC_LINKER_FLAGS_BASE} \
-s ASYNCIFY=1 \
-s 'ASYNCIFY_IMPORTS=[\"js_send_json_request\",\"js_send_binary_request\",\"emscripten_sleep\"]' \
"
)

message(STATUS "EMCC_LINKER_FLAGS_FULL ${EMCC_LINKER_FLAGS_FULL}")

####################
# Build targets
####################

add_executable(qwertycoin ${QWC_WALLET_FULL_SRC_FILES} ${QWC_WALLET_KEYS_SRC_FILES})
set_target_properties(qwertycoin PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS_FULL}")
target_compile_definitions(qwertycoin PRIVATE BUILD_WALLET_FULL=1)
target_link_libraries(
    qwertycoin
    #
    #openssl_ssl
    #openssl_crypto
    #
    boost_chrono
    boost_system
    boost_thread
    boost_serialization
    boost_filesystem
    boost_regex
    randomx
    #boost_atomic
    #
    ${log-lib}
)

# build to bitcode instead of wasm
#SET(CMAKE_EXECUTABLE_SUFFIX ".bc")
