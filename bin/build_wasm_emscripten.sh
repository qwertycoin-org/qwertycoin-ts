#!/bin/sh

#EMCC_DEBUG=1

export BOOSTROOT="build/boost/lib"
export BOOST_ROOT=$BOOSTROOT
export BOOST_LIB=$BOOSTROOT/lib
export BOOST_IGNORE_SYSTEM_PATHS=1
export BOOST_LIBRARYDIR=$BOOSTROOT/lib

# delete emscripten cache (enable if modifying em_js or its dependencies for full refresh)
rm -rf ~/.emscripten_cache || exit 1

# build wasm files
HOST_NCORES=$(nproc 2>/dev/null || shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)
[ -d build ] || mkdir -p build || exit 1
cd build || exit 1
set -- ..
if [ -n "${QWC_CORE_REVISION:-}" ]; then
  set -- "$@" "-DQWC_CORE_REVISION=${QWC_CORE_REVISION}"
fi
if [ -n "${QWC_UNBOUND_SOURCE_INCLUDE:-}" ]; then
  set -- "$@" "-DQWC_UNBOUND_SOURCE_INCLUDE=${QWC_UNBOUND_SOURCE_INCLUDE}"
fi
emcmake cmake "$@" || exit 1
emmake cmake --build . -j$HOST_NCORES || exit 1
cd ..

# postprocess wasm files
./bin/postprocess_wasm.sh || exit 1

# move wasm files to ./dist
mkdir -p ./dist || exit 1
[ -f ./build/monero.js ] \
  && {
    mv ./build/monero.js ./dist/
  }
