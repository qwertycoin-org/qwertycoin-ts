"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _HttpClient = _interopRequireDefault(require("./HttpClient"));
var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));
var _MoneroBan = _interopRequireDefault(require("../daemon/model/MoneroBan"));
var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));
var _MoneroDaemonConfig = _interopRequireDefault(require("../daemon/model/MoneroDaemonConfig"));
var _MoneroDaemonListener = _interopRequireDefault(require("../daemon/model/MoneroDaemonListener"));
var _MoneroDaemonRpc = _interopRequireDefault(require("../daemon/MoneroDaemonRpc"));
var _MoneroError = _interopRequireDefault(require("./MoneroError"));
var _MoneroKeyImage = _interopRequireDefault(require("../daemon/model/MoneroKeyImage"));
var _MoneroRpcConnection = _interopRequireDefault(require("./MoneroRpcConnection"));
var _MoneroTxConfig = _interopRequireDefault(require("../wallet/model/MoneroTxConfig"));

var _MoneroTxSet = _interopRequireDefault(require("../wallet/model/MoneroTxSet"));
var _MoneroUtils = _interopRequireDefault(require("./MoneroUtils"));
var _MoneroWalletConfig = _interopRequireDefault(require("../wallet/model/MoneroWalletConfig"));
var _MoneroWalletListener = _interopRequireDefault(require("../wallet/model/MoneroWalletListener"));
var _MoneroWalletKeys = require("../wallet/MoneroWalletKeys");
var _MoneroWalletFull = _interopRequireDefault(require("../wallet/MoneroWalletFull"));



// deno configuration

if (_GenUtils.default.isDeno() && typeof self === "undefined" && typeof globalThis === "object" && typeof DedicatedWorkerGlobalScope === "function" && DedicatedWorkerGlobalScope.prototype.isPrototypeOf(globalThis)) {
  self = globalThis;
  globalThis.self = globalThis;
}

// expose some modules to the worker
self.HttpClient = _HttpClient.default;
self.LibraryUtils = _LibraryUtils.default;
self.GenUtils = _GenUtils.default;

/**
 * Worker to manage a daemon and wasm wallet off the main thread using messages.
 * 
 * Required message format: e.data[0] = object id, e.data[1] = function name, e.data[2+] = function args
 *
 * For browser applications, this file must be browserified and placed in the web app root.
 * 
 * @private
 */
self.onmessage = async function (e) {

  // initialize one time
  await self.initOneTime();

  // validate params
  let objectId = e.data[0];
  let fnName = e.data[1];
  let callbackId = e.data[2];
  (0, _assert.default)(fnName, "Must provide function name to worker");
  (0, _assert.default)(callbackId, "Must provide callback id to worker");
  if (!self[fnName]) throw new Error("Method '" + fnName + "' is not registered with worker");
  e.data.splice(1, 2); // remove function name and callback id to apply function with arguments

  // execute worker function and post result to callback
  try {
    postMessage([objectId, callbackId, { result: await self[fnName].apply(null, e.data) }]);
  } catch (e) {
    if (!(e instanceof Error)) e = new Error(e);
    postMessage([objectId, callbackId, { error: _LibraryUtils.default.serializeError(e) }]);
  }
};

self.initOneTime = async function () {
  if (!self.isInitialized) {
    self.WORKER_OBJECTS = {};
    self.isInitialized = true;
    _MoneroUtils.default.PROXY_TO_WORKER = false;
  }
};

// --------------------------- STATIC UTILITIES -------------------------------

self.httpRequest = async function (objectId, opts) {
  try {
    return await _HttpClient.default.request(Object.assign(opts, { proxyToWorker: false }));
  } catch (err) {
    throw err.statusCode ? new Error(JSON.stringify({ statusCode: err.statusCode, statusMessage: err.message })) : err;
  }
};

self.setLogLevel = async function (objectId, level) {
  return _LibraryUtils.default.setLogLevel(level);
};

self.getWasmMemoryUsed = async function (objectId) {
  return _LibraryUtils.default.getWasmModule() && _LibraryUtils.default.getWasmModule().HEAP8 ? _LibraryUtils.default.getWasmModule().HEAP8.length : undefined;
};

// ----------------------------- MONERO UTILS ---------------------------------

self.moneroUtilsGetIntegratedAddress = async function (objectId, networkType, standardAddress, paymentId) {
  return (await _MoneroUtils.default.getIntegratedAddress(networkType, standardAddress, paymentId)).toJson();
};

self.moneroUtilsValidateAddress = async function (objectId, address, networkType) {
  return _MoneroUtils.default.validateAddress(address, networkType);
};

self.moneroUtilsJsonToBinary = async function (objectId, json) {
  return _MoneroUtils.default.jsonToBinary(json);
};

self.moneroUtilsBinaryToJson = async function (objectId, uint8arr) {
  return _MoneroUtils.default.binaryToJson(uint8arr);
};

self.moneroUtilsBinaryBlocksToJson = async function (objectId, uint8arr) {
  return _MoneroUtils.default.binaryBlocksToJson(uint8arr);
};

// ---------------------------- DAEMON METHODS --------------------------------

self.daemonAddListener = async function (daemonId, listenerId) {
  let listener = new class extends _MoneroDaemonListener.default {
    async onBlockHeader(blockHeader) {
      self.postMessage([daemonId, "onBlockHeader_" + listenerId, blockHeader.toJson()]);
    }
  }();
  if (!self.daemonListeners) self.daemonListeners = {};
  self.daemonListeners[listenerId] = listener;
  await self.WORKER_OBJECTS[daemonId].addListener(listener);
};

self.daemonRemoveListener = async function (daemonId, listenerId) {
  if (!self.daemonListeners[listenerId]) throw new _MoneroError.default("No daemon worker listener registered with id: " + listenerId);
  await self.WORKER_OBJECTS[daemonId].removeListener(self.daemonListeners[listenerId]);
  delete self.daemonListeners[listenerId];
};

self.connectDaemonRpc = async function (daemonId, config) {
  self.WORKER_OBJECTS[daemonId] = await _MoneroDaemonRpc.default.connectToDaemonRpc(new _MoneroDaemonConfig.default(config));
};

self.daemonGetRpcConnection = async function (daemonId) {
  let connection = await self.WORKER_OBJECTS[daemonId].getRpcConnection();
  return connection ? connection.getConfig() : undefined;
};

self.daemonIsConnected = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].isConnected();
};

self.daemonGetVersion = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getVersion()).toJson();
};

self.daemonIsTrusted = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].isTrusted();
};

self.daemonGetHeight = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getHeight();
};

self.daemonGetBlockHash = async function (daemonId, height) {
  return self.WORKER_OBJECTS[daemonId].getBlockHash(height);
};

self.daemonGetBlockTemplate = async function (daemonId, walletAddress, reserveSize) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockTemplate(walletAddress, reserveSize)).toJson();
};

self.daemonGetLastBlockHeader = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getLastBlockHeader()).toJson();
};

self.daemonGetBlockHeaderByHash = async function (daemonId, hash) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockHeaderByHash(hash)).toJson();
};

self.daemonGetBlockHeaderByHeight = async function (daemonId, height) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockHeaderByHeight(height)).toJson();
};

self.daemonGetBlockHeadersByRange = async function (daemonId, startHeight, endHeight) {
  let blockHeadersJson = [];
  for (let blockHeader of await self.WORKER_OBJECTS[daemonId].getBlockHeadersByRange(startHeight, endHeight)) blockHeadersJson.push(blockHeader.toJson());
  return blockHeadersJson;
};

self.daemonGetBlockByHash = async function (daemonId, blockHash) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockByHash(blockHash)).toJson();
};

self.daemonGetBlocksByHash = async function (daemonId, blockHashes, startHeight, prune) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByHash(blockHashes, startHeight, prune)) blocksJson.push(block.toJson());
  return blocksJson;
};

self.daemonGetBlockByHeight = async function (daemonId, height) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockByHeight(height)).toJson();
};

self.daemonGetBlocksByHeight = async function (daemonId, heights) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByHeight(heights)) blocksJson.push(block.toJson());
  return blocksJson;
};

self.daemonGetBlocksByRange = async function (daemonId, startHeight, endHeight) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByRange(startHeight, endHeight)) blocksJson.push(block.toJson());
  return blocksJson;
};

self.daemonGetBlocksByRangeChunked = async function (daemonId, startHeight, endHeight, maxChunkSize) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize)) blocksJson.push(block.toJson());
  return blocksJson;
};

self.daemonGetBlockHashes = async function (daemonId, blockHashes, startHeight) {
  throw new Error("worker.getBlockHashes not implemented");
};

// TODO: factor common code with self.getTxs()
self.daemonGetTxs = async function (daemonId, txHashes, prune) {

  // get txs
  let txs = await self.WORKER_OBJECTS[daemonId].getTxs(txHashes, prune);

  // collect unique blocks to preserve model relationships as trees (based on qwertycoin_wasm_bridge.cpp::get_txs)
  let blocks = [];
  let unconfirmedBlock = undefined;
  let seenBlocks = new Set();
  for (let tx of txs) {
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock.default().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }

  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  return blocks;
};

self.daemonGetTxHexes = async function (daemonId, txHashes, prune) {
  return self.WORKER_OBJECTS[daemonId].getTxHexes(txHashes, prune);
};

self.daemonGetMinerTxSum = async function (daemonId, height, numBlocks) {
  return (await self.WORKER_OBJECTS[daemonId].getMinerTxSum(height, numBlocks)).toJson();
};

self.daemonGetFeeEstimate = async function (daemonId, graceBlocks) {
  return (await self.WORKER_OBJECTS[daemonId].getFeeEstimate(graceBlocks)).toJson();
};

self.daemonSubmitTxHex = async function (daemonId, txHex, doNotRelay) {
  return (await self.WORKER_OBJECTS[daemonId].submitTxHex(txHex, doNotRelay)).toJson();
};

self.daemonRelayTxsByHash = async function (daemonId, txHashes) {
  return self.WORKER_OBJECTS[daemonId].relayTxsByHash(txHashes);
};

self.daemonGetTxPool = async function (daemonId) {
  let txs = await self.WORKER_OBJECTS[daemonId].getTxPool();
  let block = new _MoneroBlock.default().setTxs(txs);
  for (let tx of txs) tx.setBlock(block);
  return block.toJson();
};

self.daemonGetTxPoolHashes = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getTxPoolHashes();
};

//async getTxPoolBacklog() {
//  throw new MoneroError("Not implemented");
//}

self.daemonGetTxPoolStats = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getTxPoolStats()).toJson();
};

self.daemonFlushTxPool = async function (daemonId, hashes) {
  return self.WORKER_OBJECTS[daemonId].flushTxPool(hashes);
};

self.daemonGetKeyImageSpentStatuses = async function (daemonId, keyImages) {
  return self.WORKER_OBJECTS[daemonId].getKeyImageSpentStatuses(keyImages);
};

//
//async getOutputs(outputs) {
//  throw new MoneroError("Not implemented");
//}

self.daemonGetOutputHistogram = async function (daemonId, amounts, minCount, maxCount, isUnlocked, recentCutoff) {
  let entriesJson = [];
  for (let entry of await self.WORKER_OBJECTS[daemonId].getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff)) {
    entriesJson.push(entry.toJson());
  }
  return entriesJson;
};

//
//async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
//  throw new MoneroError("Not implemented");
//}

self.daemonGetInfo = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getInfo()).toJson();
};

self.daemonGetSyncInfo = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getSyncInfo()).toJson();
};

self.daemonGetHardForkInfo = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getHardForkInfo()).toJson();
};

self.daemonGetAltChains = async function (daemonId) {
  let altChainsJson = [];
  for (let altChain of await self.WORKER_OBJECTS[daemonId].getAltChains()) altChainsJson.push(altChain.toJson());
  return altChainsJson;
};

self.daemonGetAltBlockHashes = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getAltBlockHashes();
};

self.daemonGetDownloadLimit = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getDownloadLimit();
};

self.daemonSetDownloadLimit = async function (daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setDownloadLimit(limit);
};

self.daemonResetDownloadLimit = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].resetDownloadLimit();
};

self.daemonGetUploadLimit = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getUploadLimit();
};

self.daemonSetUploadLimit = async function (daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setUploadLimit(limit);
};

self.daemonResetUploadLimit = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].resetUploadLimit();
};

self.daemonGetPeers = async function (daemonId) {
  let peersJson = [];
  for (let peer of await self.WORKER_OBJECTS[daemonId].getPeers()) peersJson.push(peer.toJson());
  return peersJson;
};

self.daemonGetKnownPeers = async function (daemonId) {
  let peersJson = [];
  for (let peer of await self.WORKER_OBJECTS[daemonId].getKnownPeers()) peersJson.push(peer.toJson());
  return peersJson;
};

self.daemonSetOutgoingPeerLimit = async function (daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setOutgoingPeerLimit(limit);
};

self.daemonSetIncomingPeerLimit = async function (daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setIncomingPeerLimit(limit);
};

self.daemonGetPeerBans = async function (daemonId) {
  let bansJson = [];
  for (let ban of await self.WORKER_OBJECTS[daemonId].getPeerBans()) bansJson.push(ban.toJson());
  return bansJson;
};

self.daemonSetPeerBans = async function (daemonId, bansJson) {
  let bans = [];
  for (let banJson of bansJson) bans.push(new _MoneroBan.default(banJson));
  return self.WORKER_OBJECTS[daemonId].setPeerBans(bans);
};

self.daemonStartMining = async function (daemonId, address, numThreads, isBackground, ignoreBattery) {
  return self.WORKER_OBJECTS[daemonId].startMining(address, numThreads, isBackground, ignoreBattery);
};

self.daemonStopMining = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].stopMining();
};

self.daemonGetMiningStatus = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getMiningStatus()).toJson();
};

self.daemonSubmitBlocks = async function (daemonId, blockBlobs) {
  return self.WORKER_OBJECTS[daemonId].submitBlocks(blockBlobs);
};

self.daemonPruneBlockchain = async function (daemonId, check) {
  return (await self.WORKER_OBJECTS[daemonId].pruneBlockchain(check)).toJson();
};

//async checkForUpdate() {
//  throw new MoneroError("Not implemented");
//}
//
//async downloadUpdate(path) {
//  throw new MoneroError("Not implemented");
//}

self.daemonStop = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].stop();
};

self.daemonWaitForNextBlockHeader = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].waitForNextBlockHeader()).toJson();
};

//------------------------------ WALLET METHODS -------------------------------

self.openWalletData = async function (walletId, path, password, networkType, keysData, cacheData, daemonUriOrConfig) {
  let daemonConnection = daemonUriOrConfig ? new _MoneroRpcConnection.default(daemonUriOrConfig) : undefined;
  self.WORKER_OBJECTS[walletId] = await _MoneroWalletFull.default.openWallet({ path: "", password: password, networkType: networkType, keysData: keysData, cacheData: cacheData, server: daemonConnection, proxyToWorker: false });
  self.WORKER_OBJECTS[walletId].setBrowserMainPath(path);
};

self.createWalletKeys = async function (walletId, configJson) {
  let config = new _MoneroWalletConfig.default(configJson);
  config.setProxyToWorker(false);
  self.WORKER_OBJECTS[walletId] = await _MoneroWalletKeys.MoneroWalletKeys.createWallet(config);
};

self.createWalletFull = async function (walletId, configJson) {
  let config = new _MoneroWalletConfig.default(configJson);
  let path = config.getPath();
  config.setPath("");
  config.setProxyToWorker(false);
  self.WORKER_OBJECTS[walletId] = await _MoneroWalletFull.default.createWallet(config);
  self.WORKER_OBJECTS[walletId].setBrowserMainPath(path);
};

self.isViewOnly = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isViewOnly();
};

self.getNetworkType = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getNetworkType();
};

//
//async getVersion() {
//  throw new Error("Not implemented");
//}

self.getSeed = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getSeed();
};

self.getSeedLanguage = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getSeedLanguage();
};

self.getSeedLanguages = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getSeedLanguages();
};

self.getPrivateSpendKey = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getPrivateSpendKey();
};

self.getPrivateViewKey = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getPrivateViewKey();
};

self.getPublicViewKey = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getPublicViewKey();
};

self.getPublicSpendKey = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getPublicSpendKey();
};

self.getAddress = async function (walletId, accountIdx, subaddressIdx) {
  return self.WORKER_OBJECTS[walletId].getAddress(accountIdx, subaddressIdx);
};

self.getAddressIndex = async function (walletId, address) {
  return (await self.WORKER_OBJECTS[walletId].getAddressIndex(address)).toJson();
};

self.setSubaddressLabel = async function (walletId, accountIdx, subaddressIdx, label) {
  await self.WORKER_OBJECTS[walletId].setSubaddressLabel(accountIdx, subaddressIdx, label);
};

self.getIntegratedAddress = async function (walletId, standardAddress, paymentId) {
  return (await self.WORKER_OBJECTS[walletId].getIntegratedAddress(standardAddress, paymentId)).toJson();
};

self.decodeIntegratedAddress = async function (walletId, integratedAddress) {
  return (await self.WORKER_OBJECTS[walletId].decodeIntegratedAddress(integratedAddress)).toJson();
};

self.setDaemonConnection = async function (walletId, config, isTrusted) {
  return self.WORKER_OBJECTS[walletId].setDaemonConnection(config ? new _MoneroRpcConnection.default(Object.assign(config, { proxyToWorker: false })) : undefined, isTrusted);
};

self.getDaemonConnection = async function (walletId) {
  let connection = await self.WORKER_OBJECTS[walletId].getDaemonConnection();
  return connection ? connection.getConfig() : undefined;
};

self.isDaemonTrusted = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isDaemonTrusted();
};

self.isConnectedToDaemon = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isConnectedToDaemon();
};

self.getRestoreHeight = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getRestoreHeight();
};

self.setRestoreHeight = async function (walletId, restoreHeight) {
  return self.WORKER_OBJECTS[walletId].setRestoreHeight(restoreHeight);
};

self.getDaemonHeight = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getDaemonHeight();
};

self.getDaemonMaxPeerHeight = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getDaemonMaxPeerHeight();
};

self.getHeightByDate = async function (walletId, year, month, day) {
  return self.WORKER_OBJECTS[walletId].getHeightByDate(year, month, day);
};

self.isDaemonSynced = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isDaemonSynced();
};

self.getHeight = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getHeight();
};

self.addListener = async function (walletId, listenerId) {

  /**
   * Internal listener to bridge notifications to external listeners.
   * 
   * TODO: MoneroWalletListener is not defined until scripts imported
   * 
   * @private
   */
  class WalletWorkerHelperListener extends _MoneroWalletListener.default {





    constructor(walletId, id, worker) {
      super();
      this.walletId = walletId;
      this.id = id;
      this.worker = worker;
    }

    getId() {
      return this.id;
    }

    async onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      this.worker.postMessage([this.walletId, "onSyncProgress_" + this.getId(), height, startHeight, endHeight, percentDone, message]);
    }

    async onNewBlock(height) {
      this.worker.postMessage([this.walletId, "onNewBlock_" + this.getId(), height]);
    }

    async onBalancesChanged(newBalance, newUnlockedBalance) {
      this.worker.postMessage([this.walletId, "onBalancesChanged_" + this.getId(), newBalance.toString(), newUnlockedBalance.toString()]);
    }

    async onOutputReceived(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new _MoneroBlock.default().setTxs([output.getTx()]);
      this.worker.postMessage([this.walletId, "onOutputReceived_" + this.getId(), block.toJson()]); // serialize from root block
    }

    async onOutputSpent(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new _MoneroBlock.default().setTxs([output.getTx()]);
      this.worker.postMessage([this.walletId, "onOutputSpent_" + this.getId(), block.toJson()]); // serialize from root block
    }
  }

  let listener = new WalletWorkerHelperListener(walletId, listenerId, self);
  if (!self.listeners) self.listeners = [];
  self.listeners.push(listener);
  await self.WORKER_OBJECTS[walletId].addListener(listener);
};

self.removeListener = async function (walletId, listenerId) {
  for (let i = 0; i < self.listeners.length; i++) {
    if (self.listeners[i].getId() !== listenerId) continue;
    await self.WORKER_OBJECTS[walletId].removeListener(self.listeners[i]);
    self.listeners.splice(i, 1);
    return;
  }
  throw new _MoneroError.default("Listener is not registered with wallet");
};

self.isSynced = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isSynced();
};

self.sync = async function (walletId, startHeight, allowConcurrentCalls) {
  return await self.WORKER_OBJECTS[walletId].sync(undefined, startHeight, allowConcurrentCalls);
};

self.startSyncing = async function (walletId, syncPeriodInMs) {
  return self.WORKER_OBJECTS[walletId].startSyncing(syncPeriodInMs);
};

self.stopSyncing = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].stopSyncing();
};

self.scanTxs = async function (walletId, txHashes) {
  return self.WORKER_OBJECTS[walletId].scanTxs(txHashes);
};

self.rescanSpent = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].rescanSpent();
};

self.rescanBlockchain = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].rescanBlockchain();
};

self.getBalance = async function (walletId, accountIdx, subaddressIdx) {
  return (await self.WORKER_OBJECTS[walletId].getBalance(accountIdx, subaddressIdx)).toString();
};

self.getUnlockedBalance = async function (walletId, accountIdx, subaddressIdx) {
  return (await self.WORKER_OBJECTS[walletId].getUnlockedBalance(accountIdx, subaddressIdx)).toString();
};

self.getAccounts = async function (walletId, includeSubaddresses, tag) {
  let accountJsons = [];
  for (let account of await self.WORKER_OBJECTS[walletId].getAccounts(includeSubaddresses, tag)) accountJsons.push(account.toJson());
  return accountJsons;
};

self.getAccount = async function (walletId, accountIdx, includeSubaddresses) {
  return (await self.WORKER_OBJECTS[walletId].getAccount(accountIdx, includeSubaddresses)).toJson();
};

self.createAccount = async function (walletId, label) {
  return (await self.WORKER_OBJECTS[walletId].createAccount(label)).toJson();
};

self.getSubaddresses = async function (walletId, accountIdx, subaddressIndices) {
  let subaddressJsons = [];
  for (let subaddress of await self.WORKER_OBJECTS[walletId].getSubaddresses(accountIdx, subaddressIndices)) subaddressJsons.push(subaddress.toJson());
  return subaddressJsons;
};

self.createSubaddress = async function (walletId, accountIdx, label) {
  return (await self.WORKER_OBJECTS[walletId].createSubaddress(accountIdx, label)).toJson();
};

// TODO: easier or more efficient way than serializing from root blocks?
self.getTxs = async function (walletId, blockJsonQuery) {

  // deserialize query which is json string rooted at block
  let query = new _MoneroBlock.default(blockJsonQuery, _MoneroBlock.default.DeserializationType.TX_QUERY).getTxs()[0];

  // get txs
  let txs = await self.WORKER_OBJECTS[walletId].getTxs(query);

  // collect unique blocks to preserve model relationships as trees (based on qwertycoin_wasm_bridge.cpp::get_txs)
  let seenBlocks = new Set();
  let unconfirmedBlock = undefined;
  let blocks = [];
  for (let tx of txs) {
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock.default().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }

  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  return { blocks: blocks };
};

self.getTransfers = async function (walletId, blockJsonQuery) {

  // deserialize query which is json string rooted at block
  let query = new _MoneroBlock.default(blockJsonQuery, _MoneroBlock.default.DeserializationType.TX_QUERY).getTxs()[0].getTransferQuery();

  // get transfers
  let transfers = await self.WORKER_OBJECTS[walletId].getTransfers(query);

  // collect unique blocks to preserve model relationships as tree
  let unconfirmedBlock = undefined;
  let blocks = [];
  let seenBlocks = new Set();
  for (let transfer of transfers) {
    let tx = transfer.getTx();
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock.default().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }

  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  return blocks;
};

self.getOutputs = async function (walletId, blockJsonQuery) {

  // deserialize query which is json string rooted at block
  let query = new _MoneroBlock.default(blockJsonQuery, _MoneroBlock.default.DeserializationType.TX_QUERY).getTxs()[0].getOutputQuery();

  // get outputs
  let outputs = await self.WORKER_OBJECTS[walletId].getOutputs(query);

  // collect unique blocks to preserve model relationships as tree
  let unconfirmedBlock = undefined;
  let blocks = [];
  let seenBlocks = new Set();
  for (let output of outputs) {
    let tx = output.getTx();
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock.default().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }

  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  return blocks;
};

self.exportOutputs = async function (walletId, all) {
  return self.WORKER_OBJECTS[walletId].exportOutputs(all);
};

self.importOutputs = async function (walletId, outputsHex) {
  return self.WORKER_OBJECTS[walletId].importOutputs(outputsHex);
};

self.getKeyImages = async function (walletId, all) {
  return (await self.WORKER_OBJECTS[walletId].exportKeyImages(all)).toJson();
};

self.importKeyImages = async function (walletId, keyImagesJson, offset) {
  let keyImages = [];
  for (let keyImageJson of keyImagesJson) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
  return (await self.WORKER_OBJECTS[walletId].importKeyImages(keyImages, offset)).toJson();
};

//async getNewKeyImagesFromLastImport() {
//  throw new MoneroError("Not implemented");
//}

self.freezeOutput = async function (walletId, keyImage) {
  return self.WORKER_OBJECTS[walletId].freezeOutput(keyImage);
};

self.thawOutput = async function (walletId, keyImage) {
  return self.WORKER_OBJECTS[walletId].thawOutput(keyImage);
};

self.isOutputFrozen = async function (walletId, keyImage) {
  return self.WORKER_OBJECTS[walletId].isOutputFrozen(keyImage);
};

self.getDefaultFeePriority = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getDefaultFeePriority();
};

self.createTxs = async function (walletId, config) {
  if (typeof config === "object") config = new _MoneroTxConfig.default(config);
  let txs = await self.WORKER_OBJECTS[walletId].createTxs(config);
  return txs[0].getTxSet().toJson();
};

self.sweepOutput = async function (walletId, config) {
  if (typeof config === "object") config = new _MoneroTxConfig.default(config);
  let tx = await self.WORKER_OBJECTS[walletId].sweepOutput(config);
  return tx.getTxSet().toJson();
};

self.sweepUnlocked = async function (walletId, config) {
  if (typeof config === "object") config = new _MoneroTxConfig.default(config);
  let txs = await self.WORKER_OBJECTS[walletId].sweepUnlocked(config);
  let txSets = [];
  for (let tx of txs) if (!_GenUtils.default.arrayContains(txSets, tx.getTxSet())) txSets.push(tx.getTxSet());
  let txSetsJson = [];
  for (let txSet of txSets) txSetsJson.push(txSet.toJson());
  return txSetsJson;
};

self.sweepDust = async function (walletId, relay) {
  let txs = await self.WORKER_OBJECTS[walletId].sweepDust(relay);
  return txs.length === 0 ? {} : txs[0].getTxSet().toJson();
};

self.relayTxs = async function (walletId, txMetadatas) {
  return self.WORKER_OBJECTS[walletId].relayTxs(txMetadatas);
};

self.describeTxSet = async function (walletId, txSetJson) {
  return (await self.WORKER_OBJECTS[walletId].describeTxSet(new _MoneroTxSet.default(txSetJson))).toJson();
};

self.signTxs = async function (walletId, unsignedTxHex) {
  return self.WORKER_OBJECTS[walletId].signTxs(unsignedTxHex);
};

self.submitTxs = async function (walletId, signedTxHex) {
  return self.WORKER_OBJECTS[walletId].submitTxs(signedTxHex);
};

self.signMessage = async function (walletId, message, signatureType, accountIdx, subaddressIdx) {
  return self.WORKER_OBJECTS[walletId].signMessage(message, signatureType, accountIdx, subaddressIdx);
};

self.verifyMessage = async function (walletId, message, address, signature) {
  return (await self.WORKER_OBJECTS[walletId].verifyMessage(message, address, signature)).toJson();
};

self.getTxKey = async function (walletId, txHash) {
  return self.WORKER_OBJECTS[walletId].getTxKey(txHash);
};

self.checkTxKey = async function (walletId, txHash, txKey, address) {
  return (await self.WORKER_OBJECTS[walletId].checkTxKey(txHash, txKey, address)).toJson();
};

self.getTxProof = async function (walletId, txHash, address, message) {
  return self.WORKER_OBJECTS[walletId].getTxProof(txHash, address, message);
};

self.checkTxProof = async function (walletId, txHash, address, message, signature) {
  return (await self.WORKER_OBJECTS[walletId].checkTxProof(txHash, address, message, signature)).toJson();
};

self.getSpendProof = async function (walletId, txHash, message) {
  return self.WORKER_OBJECTS[walletId].getSpendProof(txHash, message);
};

self.checkSpendProof = async function (walletId, txHash, message, signature) {
  return self.WORKER_OBJECTS[walletId].checkSpendProof(txHash, message, signature);
};

self.getReserveProofWallet = async function (walletId, message) {
  return self.WORKER_OBJECTS[walletId].getReserveProofWallet(message);
};

self.getReserveProofAccount = async function (walletId, accountIdx, amountStr, message) {
  return self.WORKER_OBJECTS[walletId].getReserveProofAccount(accountIdx, amountStr, message);
};

self.checkReserveProof = async function (walletId, address, message, signature) {
  return (await self.WORKER_OBJECTS[walletId].checkReserveProof(address, message, signature)).toJson();
};

self.getTxNotes = async function (walletId, txHashes) {
  return self.WORKER_OBJECTS[walletId].getTxNotes(txHashes);
};

self.setTxNotes = async function (walletId, txHashes, txNotes) {
  return self.WORKER_OBJECTS[walletId].setTxNotes(txHashes, txNotes);
};

self.getAddressBookEntries = async function (walletId, entryIndices) {
  let entriesJson = [];
  for (let entry of await self.WORKER_OBJECTS[walletId].getAddressBookEntries(entryIndices)) entriesJson.push(entry.toJson());
  return entriesJson;
};

self.addAddressBookEntry = async function (walletId, address, description) {
  return self.WORKER_OBJECTS[walletId].addAddressBookEntry(address, description);
};

self.editAddressBookEntry = async function (walletId, index, setAddress, address, setDescription, description) {
  return self.WORKER_OBJECTS[walletId].editAddressBookEntry(index, setAddress, address, setDescription, description);
};

self.deleteAddressBookEntry = async function (walletId, index) {
  return self.WORKER_OBJECTS[walletId].deleteAddressBookEntry(index);
};

self.tagAccounts = async function (walletId, tag, accountIndices) {
  throw new Error("Not implemented");
};

self.untagAccounts = async function (walletId, accountIndices) {
  throw new Error("Not implemented");
};

self.getAccountTags = async function (walletId) {
  throw new Error("Not implemented");
};

self.setAccountTagLabel = async function (walletId, tag, label) {
  throw new Error("Not implemented");
};

self.getPaymentUri = async function (walletId, configJson) {
  return self.WORKER_OBJECTS[walletId].getPaymentUri(new _MoneroTxConfig.default(configJson));
};

self.parsePaymentUri = async function (walletId, uri) {
  return (await self.WORKER_OBJECTS[walletId].parsePaymentUri(uri)).toJson();
};

self.getAttribute = async function (walletId, key) {
  return self.WORKER_OBJECTS[walletId].getAttribute(key);
};

self.setAttribute = async function (walletId, key, value) {
  return self.WORKER_OBJECTS[walletId].setAttribute(key, value);
};

self.startMining = async function (walletId, numThreads, backgroundMining, ignoreBattery) {
  return self.WORKER_OBJECTS[walletId].startMining(numThreads, backgroundMining, ignoreBattery);
};

self.stopMining = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].stopMining();
};

self.isMultisigImportNeeded = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isMultisigImportNeeded();
};

self.isMultisig = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isMultisig();
};

self.getMultisigInfo = async function (walletId) {
  return (await self.WORKER_OBJECTS[walletId].getMultisigInfo()).toJson();
};

self.prepareMultisig = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].prepareMultisig();
};

self.makeMultisig = async function (walletId, multisigHexes, threshold, password) {
  return await self.WORKER_OBJECTS[walletId].makeMultisig(multisigHexes, threshold, password);
};

self.exchangeMultisigKeys = async function (walletId, multisigHexes, password) {
  return (await self.WORKER_OBJECTS[walletId].exchangeMultisigKeys(multisigHexes, password)).toJson();
};

self.exportMultisigHex = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].exportMultisigHex();
};

self.importMultisigHex = async function (walletId, multisigHexes, refreshAfterImport) {
  return self.WORKER_OBJECTS[walletId].importMultisigHex(multisigHexes, refreshAfterImport);
};

self.signMultisigTxHex = async function (walletId, multisigTxHex) {
  return (await self.WORKER_OBJECTS[walletId].signMultisigTxHex(multisigTxHex)).toJson();
};

self.submitMultisigTxHex = async function (walletId, signedMultisigTxHex) {
  return self.WORKER_OBJECTS[walletId].submitMultisigTxHex(signedMultisigTxHex);
};

self.getData = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getData();
};

self.changePassword = async function (walletId, oldPassword, newPassword) {
  return self.WORKER_OBJECTS[walletId].changePassword(oldPassword, newPassword);
};

self.isClosed = async function (walletId) {
  return !self.WORKER_OBJECTS[walletId] || self.WORKER_OBJECTS[walletId].isClosed();
};

self.close = async function (walletId, save) {
  return self.WORKER_OBJECTS[walletId].close(save);
  delete self.WORKER_OBJECTS[walletId];
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwiR2VuVXRpbHMiLCJpc0Rlbm8iLCJzZWxmIiwiZ2xvYmFsVGhpcyIsIkRlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlIiwicHJvdG90eXBlIiwiaXNQcm90b3R5cGVPZiIsIkh0dHBDbGllbnQiLCJMaWJyYXJ5VXRpbHMiLCJvbm1lc3NhZ2UiLCJlIiwiaW5pdE9uZVRpbWUiLCJvYmplY3RJZCIsImRhdGEiLCJmbk5hbWUiLCJjYWxsYmFja0lkIiwiYXNzZXJ0IiwiRXJyb3IiLCJzcGxpY2UiLCJwb3N0TWVzc2FnZSIsInJlc3VsdCIsImFwcGx5IiwiZXJyb3IiLCJzZXJpYWxpemVFcnJvciIsImlzSW5pdGlhbGl6ZWQiLCJXT1JLRVJfT0JKRUNUUyIsIk1vbmVyb1V0aWxzIiwiUFJPWFlfVE9fV09SS0VSIiwiaHR0cFJlcXVlc3QiLCJvcHRzIiwicmVxdWVzdCIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5VG9Xb3JrZXIiLCJlcnIiLCJzdGF0dXNDb2RlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c01lc3NhZ2UiLCJtZXNzYWdlIiwic2V0TG9nTGV2ZWwiLCJsZXZlbCIsImdldFdhc21NZW1vcnlVc2VkIiwiZ2V0V2FzbU1vZHVsZSIsIkhFQVA4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJ0b0pzb24iLCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyIsImFkZHJlc3MiLCJ2YWxpZGF0ZUFkZHJlc3MiLCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeSIsImpzb24iLCJqc29uVG9CaW5hcnkiLCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiYmluYXJ5VG9Kc29uIiwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJkYWVtb25BZGRMaXN0ZW5lciIsImRhZW1vbklkIiwibGlzdGVuZXJJZCIsImxpc3RlbmVyIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJvbkJsb2NrSGVhZGVyIiwiYmxvY2tIZWFkZXIiLCJkYWVtb25MaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImRhZW1vblJlbW92ZUxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImNvbm5lY3REYWVtb25ScGMiLCJjb25maWciLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJNb25lcm9EYWVtb25Db25maWciLCJkYWVtb25HZXRScGNDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJkYWVtb25Jc0Nvbm5lY3RlZCIsImlzQ29ubmVjdGVkIiwiZGFlbW9uR2V0VmVyc2lvbiIsImdldFZlcnNpb24iLCJkYWVtb25Jc1RydXN0ZWQiLCJpc1RydXN0ZWQiLCJkYWVtb25HZXRIZWlnaHQiLCJnZXRIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja0hhc2giLCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwiZ2V0QmxvY2tUZW1wbGF0ZSIsImRhZW1vbkdldExhc3RCbG9ja0hlYWRlciIsImdldExhc3RCbG9ja0hlYWRlciIsImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJibG9ja0hlYWRlcnNKc29uIiwiZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZSIsInB1c2giLCJkYWVtb25HZXRCbG9ja0J5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJwcnVuZSIsImJsb2Nrc0pzb24iLCJibG9jayIsImdldEJsb2Nrc0J5SGFzaCIsImRhZW1vbkdldEJsb2NrQnlIZWlnaHQiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJkYWVtb25HZXRCbG9ja0hhc2hlcyIsImRhZW1vbkdldFR4cyIsInR4SGFzaGVzIiwidHhzIiwiZ2V0VHhzIiwiYmxvY2tzIiwidW5jb25maXJtZWRCbG9jayIsInNlZW5CbG9ja3MiLCJTZXQiLCJ0eCIsImdldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJzZXRCbG9jayIsImhhcyIsImFkZCIsImkiLCJkYWVtb25HZXRUeEhleGVzIiwiZ2V0VHhIZXhlcyIsImRhZW1vbkdldE1pbmVyVHhTdW0iLCJudW1CbG9ja3MiLCJnZXRNaW5lclR4U3VtIiwiZGFlbW9uR2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZGFlbW9uU3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJzdWJtaXRUeEhleCIsImRhZW1vblJlbGF5VHhzQnlIYXNoIiwicmVsYXlUeHNCeUhhc2giLCJkYWVtb25HZXRUeFBvb2wiLCJnZXRUeFBvb2wiLCJkYWVtb25HZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xIYXNoZXMiLCJkYWVtb25HZXRUeFBvb2xTdGF0cyIsImdldFR4UG9vbFN0YXRzIiwiZGFlbW9uRmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJmbHVzaFR4UG9vbCIsImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsImVudHJpZXNKc29uIiwiZW50cnkiLCJnZXRPdXRwdXRIaXN0b2dyYW0iLCJkYWVtb25HZXRJbmZvIiwiZ2V0SW5mbyIsImRhZW1vbkdldFN5bmNJbmZvIiwiZ2V0U3luY0luZm8iLCJkYWVtb25HZXRIYXJkRm9ya0luZm8iLCJnZXRIYXJkRm9ya0luZm8iLCJkYWVtb25HZXRBbHRDaGFpbnMiLCJhbHRDaGFpbnNKc29uIiwiYWx0Q2hhaW4iLCJnZXRBbHRDaGFpbnMiLCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlcyIsImdldEFsdEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdCIsImdldERvd25sb2FkTGltaXQiLCJkYWVtb25TZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uR2V0VXBsb2FkTGltaXQiLCJnZXRVcGxvYWRMaW1pdCIsImRhZW1vblNldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJkYWVtb25SZXNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImRhZW1vbkdldFBlZXJzIiwicGVlcnNKc29uIiwicGVlciIsImdldFBlZXJzIiwiZGFlbW9uR2V0S25vd25QZWVycyIsImdldEtub3duUGVlcnMiLCJkYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldE91dGdvaW5nUGVlckxpbWl0IiwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImRhZW1vbkdldFBlZXJCYW5zIiwiYmFuc0pzb24iLCJiYW4iLCJnZXRQZWVyQmFucyIsImRhZW1vblNldFBlZXJCYW5zIiwiYmFucyIsImJhbkpzb24iLCJNb25lcm9CYW4iLCJzZXRQZWVyQmFucyIsImRhZW1vblN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdGFydE1pbmluZyIsImRhZW1vblN0b3BNaW5pbmciLCJzdG9wTWluaW5nIiwiZGFlbW9uR2V0TWluaW5nU3RhdHVzIiwiZ2V0TWluaW5nU3RhdHVzIiwiZGFlbW9uU3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInN1Ym1pdEJsb2NrcyIsImRhZW1vblBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwicHJ1bmVCbG9ja2NoYWluIiwiZGFlbW9uU3RvcCIsInN0b3AiLCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwid2FpdEZvck5leHRCbG9ja0hlYWRlciIsIm9wZW5XYWxsZXREYXRhIiwid2FsbGV0SWQiLCJwYXRoIiwicGFzc3dvcmQiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImRhZW1vblVyaU9yQ29uZmlnIiwiZGFlbW9uQ29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJNb25lcm9XYWxsZXRGdWxsIiwib3BlbldhbGxldCIsInNlcnZlciIsInNldEJyb3dzZXJNYWluUGF0aCIsImNyZWF0ZVdhbGxldEtleXMiLCJjb25maWdKc29uIiwiTW9uZXJvV2FsbGV0Q29uZmlnIiwic2V0UHJveHlUb1dvcmtlciIsIk1vbmVyb1dhbGxldEtleXMiLCJjcmVhdGVXYWxsZXQiLCJjcmVhdGVXYWxsZXRGdWxsIiwiZ2V0UGF0aCIsInNldFBhdGgiLCJpc1ZpZXdPbmx5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRTZWVkIiwiZ2V0U2VlZExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsImdldFByaXZhdGVTcGVuZEtleSIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHVibGljVmlld0tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0QWRkcmVzcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiZ2V0QWRkcmVzc0luZGV4Iiwic2V0U3ViYWRkcmVzc0xhYmVsIiwibGFiZWwiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJpc0RhZW1vblRydXN0ZWQiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0UmVzdG9yZUhlaWdodCIsInNldFJlc3RvcmVIZWlnaHQiLCJyZXN0b3JlSGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsImlzRGFlbW9uU3luY2VkIiwiV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsImNvbnN0cnVjdG9yIiwiaWQiLCJ3b3JrZXIiLCJnZXRJZCIsIm9uU3luY1Byb2dyZXNzIiwicGVyY2VudERvbmUiLCJvbk5ld0Jsb2NrIiwib25CYWxhbmNlc0NoYW5nZWQiLCJuZXdCYWxhbmNlIiwibmV3VW5sb2NrZWRCYWxhbmNlIiwidG9TdHJpbmciLCJvbk91dHB1dFJlY2VpdmVkIiwib3V0cHV0IiwiZ2V0VHgiLCJvbk91dHB1dFNwZW50IiwibGlzdGVuZXJzIiwiaXNTeW5jZWQiLCJzeW5jIiwiYWxsb3dDb25jdXJyZW50Q2FsbHMiLCJzdGFydFN5bmNpbmciLCJzeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInJlc2NhblNwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50SnNvbnMiLCJhY2NvdW50IiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJnZXRTdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSW5kaWNlcyIsInN1YmFkZHJlc3NKc29ucyIsInN1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwiYmxvY2tKc29uUXVlcnkiLCJxdWVyeSIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWF9RVUVSWSIsImdldFRyYW5zZmVycyIsImdldFRyYW5zZmVyUXVlcnkiLCJ0cmFuc2ZlcnMiLCJ0cmFuc2ZlciIsImdldE91dHB1dHMiLCJnZXRPdXRwdXRRdWVyeSIsIm91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiaW1wb3J0T3V0cHV0cyIsIm91dHB1dHNIZXgiLCJnZXRLZXlJbWFnZXMiLCJleHBvcnRLZXlJbWFnZXMiLCJpbXBvcnRLZXlJbWFnZXMiLCJrZXlJbWFnZXNKc29uIiwib2Zmc2V0Iiwia2V5SW1hZ2VKc29uIiwiTW9uZXJvS2V5SW1hZ2UiLCJmcmVlemVPdXRwdXQiLCJrZXlJbWFnZSIsInRoYXdPdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImdldERlZmF1bHRGZWVQcmlvcml0eSIsImNyZWF0ZVR4cyIsIk1vbmVyb1R4Q29uZmlnIiwiZ2V0VHhTZXQiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJ0eFNldHMiLCJhcnJheUNvbnRhaW5zIiwidHhTZXRzSnNvbiIsInR4U2V0Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJyZWxheVR4cyIsInR4TWV0YWRhdGFzIiwiZGVzY3JpYmVUeFNldCIsInR4U2V0SnNvbiIsIk1vbmVyb1R4U2V0Iiwic2lnblR4cyIsInVuc2lnbmVkVHhIZXgiLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsInR4SGFzaCIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudFN0ciIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZXMiLCJ0eE5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImRlc2NyaXB0aW9uIiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsInBhcnNlUGF5bWVudFVyaSIsInVyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInNldEF0dHJpYnV0ZSIsInZhbHVlIiwiYmFja2dyb3VuZE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJpc011bHRpc2lnIiwiZ2V0TXVsdGlzaWdJbmZvIiwicHJlcGFyZU11bHRpc2lnIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsInRocmVzaG9sZCIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsInJlZnJlc2hBZnRlckltcG9ydCIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiZ2V0RGF0YSIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImlzQ2xvc2VkIiwiY2xvc2UiLCJzYXZlIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL1F3ZXJ0eWNvaW5XZWJXb3JrZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4uL2RhZW1vbi9Nb25lcm9EYWVtb25ScGNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIlxuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIlxuaW1wb3J0IHtNb25lcm9XYWxsZXRLZXlzfSBmcm9tIFwiLi4vd2FsbGV0L01vbmVyb1dhbGxldEtleXNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRGdWxsIGZyb20gXCIuLi93YWxsZXQvTW9uZXJvV2FsbGV0RnVsbFwiO1xuXG5kZWNsYXJlIHZhciBzZWxmOiBhbnk7XG5cbi8vIGRlbm8gY29uZmlndXJhdGlvblxuZGVjbGFyZSB2YXIgRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGU6IGFueTtcbmlmIChHZW5VdGlscy5pc0Rlbm8oKSAmJiB0eXBlb2Ygc2VsZiA9PT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGUgPT09IFwiZnVuY3Rpb25cIiAmJiBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZS5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihnbG9iYWxUaGlzKSkge1xuICBzZWxmID0gZ2xvYmFsVGhpcztcbiAgKGdsb2JhbFRoaXMgYXMgYW55KS5zZWxmID0gZ2xvYmFsVGhpcztcbn1cblxuLy8gZXhwb3NlIHNvbWUgbW9kdWxlcyB0byB0aGUgd29ya2VyXG5zZWxmLkh0dHBDbGllbnQgPSBIdHRwQ2xpZW50O1xuc2VsZi5MaWJyYXJ5VXRpbHMgPSBMaWJyYXJ5VXRpbHM7XG5zZWxmLkdlblV0aWxzID0gR2VuVXRpbHM7XG5cbi8qKlxuICogV29ya2VyIHRvIG1hbmFnZSBhIGRhZW1vbiBhbmQgd2FzbSB3YWxsZXQgb2ZmIHRoZSBtYWluIHRocmVhZCB1c2luZyBtZXNzYWdlcy5cbiAqIFxuICogUmVxdWlyZWQgbWVzc2FnZSBmb3JtYXQ6IGUuZGF0YVswXSA9IG9iamVjdCBpZCwgZS5kYXRhWzFdID0gZnVuY3Rpb24gbmFtZSwgZS5kYXRhWzIrXSA9IGZ1bmN0aW9uIGFyZ3NcbiAqXG4gKiBGb3IgYnJvd3NlciBhcHBsaWNhdGlvbnMsIHRoaXMgZmlsZSBtdXN0IGJlIGJyb3dzZXJpZmllZCBhbmQgcGxhY2VkIGluIHRoZSB3ZWIgYXBwIHJvb3QuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbnNlbGYub25tZXNzYWdlID0gYXN5bmMgZnVuY3Rpb24oZSkge1xuICBcbiAgLy8gaW5pdGlhbGl6ZSBvbmUgdGltZVxuICBhd2FpdCBzZWxmLmluaXRPbmVUaW1lKCk7XG4gIFxuICAvLyB2YWxpZGF0ZSBwYXJhbXNcbiAgbGV0IG9iamVjdElkID0gZS5kYXRhWzBdO1xuICBsZXQgZm5OYW1lID0gZS5kYXRhWzFdO1xuICBsZXQgY2FsbGJhY2tJZCA9IGUuZGF0YVsyXTtcbiAgYXNzZXJ0KGZuTmFtZSwgXCJNdXN0IHByb3ZpZGUgZnVuY3Rpb24gbmFtZSB0byB3b3JrZXJcIik7XG4gIGFzc2VydChjYWxsYmFja0lkLCBcIk11c3QgcHJvdmlkZSBjYWxsYmFjayBpZCB0byB3b3JrZXJcIik7XG4gIGlmICghc2VsZltmbk5hbWVdKSB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2QgJ1wiICsgZm5OYW1lICsgXCInIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd29ya2VyXCIpO1xuICBlLmRhdGEuc3BsaWNlKDEsIDIpOyAvLyByZW1vdmUgZnVuY3Rpb24gbmFtZSBhbmQgY2FsbGJhY2sgaWQgdG8gYXBwbHkgZnVuY3Rpb24gd2l0aCBhcmd1bWVudHNcbiAgXG4gIC8vIGV4ZWN1dGUgd29ya2VyIGZ1bmN0aW9uIGFuZCBwb3N0IHJlc3VsdCB0byBjYWxsYmFja1xuICB0cnkge1xuICAgIHBvc3RNZXNzYWdlKFtvYmplY3RJZCwgY2FsbGJhY2tJZCwge3Jlc3VsdDogYXdhaXQgc2VsZltmbk5hbWVdLmFwcGx5KG51bGwsIGUuZGF0YSl9XSk7XG4gIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikpIGUgPSBuZXcgRXJyb3IoZSk7XG4gICAgcG9zdE1lc3NhZ2UoW29iamVjdElkLCBjYWxsYmFja0lkLCB7ZXJyb3I6IExpYnJhcnlVdGlscy5zZXJpYWxpemVFcnJvcihlKX1dKTtcbiAgfVxufVxuXG5zZWxmLmluaXRPbmVUaW1lID0gYXN5bmMgZnVuY3Rpb24oKSB7XG4gIGlmICghc2VsZi5pc0luaXRpYWxpemVkKSB7XG4gICAgc2VsZi5XT1JLRVJfT0JKRUNUUyA9IHt9O1xuICAgIHNlbGYuaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSID0gZmFsc2U7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyBVVElMSVRJRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLmh0dHBSZXF1ZXN0ID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIG9wdHMpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KE9iamVjdC5hc3NpZ24ob3B0cywge3Byb3h5VG9Xb3JrZXI6IGZhbHNlfSkpOyAgXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgdGhyb3cgZXJyLnN0YXR1c0NvZGUgPyBuZXcgRXJyb3IoSlNPTi5zdHJpbmdpZnkoe3N0YXR1c0NvZGU6IGVyci5zdGF0dXNDb2RlLCBzdGF0dXNNZXNzYWdlOiBlcnIubWVzc2FnZX0pKSA6IGVycjtcbiAgfVxufVxuXG5zZWxmLnNldExvZ0xldmVsID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGxldmVsKSB7XG4gIHJldHVybiBMaWJyYXJ5VXRpbHMuc2V0TG9nTGV2ZWwobGV2ZWwpO1xufVxuXG5zZWxmLmdldFdhc21NZW1vcnlVc2VkID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQpIHtcbiAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgJiYgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQOCA/IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUDgubGVuZ3RoIDogdW5kZWZpbmVkO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBNT05FUk8gVVRJTFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYubW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBuZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpIHtcbiAgcmV0dXJuIChhd2FpdCBNb25lcm9VdGlscy5nZXRJbnRlZ3JhdGVkQWRkcmVzcyhuZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBhZGRyZXNzLCBuZXR3b3JrVHlwZSkge1xuICByZXR1cm4gTW9uZXJvVXRpbHMudmFsaWRhdGVBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0pzb25Ub0JpbmFyeSA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBqc29uKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5qc29uVG9CaW5hcnkoanNvbik7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNCaW5hcnlUb0pzb24gPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgdWludDhhcnIpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmJpbmFyeVRvSnNvbih1aW50OGFycik7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24gPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgdWludDhhcnIpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmJpbmFyeUJsb2Nrc1RvSnNvbih1aW50OGFycik7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gREFFTU9OIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5kYWVtb25BZGRMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaXN0ZW5lcklkKSB7XG4gIGxldCBsaXN0ZW5lciA9IG5ldyBjbGFzcyBleHRlbmRzIE1vbmVyb0RhZW1vbkxpc3RlbmVyIHtcbiAgICBhc3luYyBvbkJsb2NrSGVhZGVyKGJsb2NrSGVhZGVyKSB7XG4gICAgICBzZWxmLnBvc3RNZXNzYWdlKFtkYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCwgYmxvY2tIZWFkZXIudG9Kc29uKCldKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFzZWxmLmRhZW1vbkxpc3RlbmVycykgc2VsZi5kYWVtb25MaXN0ZW5lcnMgPSB7fTtcbiAgc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0gPSBsaXN0ZW5lcjtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xufVxuXG5zZWxmLmRhZW1vblJlbW92ZUxpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpc3RlbmVySWQpIHtcbiAgaWYgKCFzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gZGFlbW9uIHdvcmtlciBsaXN0ZW5lciByZWdpc3RlcmVkIHdpdGggaWQ6IFwiICsgbGlzdGVuZXJJZCk7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlbW92ZUxpc3RlbmVyKHNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdKTtcbiAgZGVsZXRlIHNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdO1xufVxuXG5zZWxmLmNvbm5lY3REYWVtb25ScGMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgY29uZmlnKSB7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKGNvbmZpZykpO1xufVxuXG5zZWxmLmRhZW1vbkdldFJwY0Nvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgY29ubmVjdGlvbiA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFJwY0Nvbm5lY3Rpb24oKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkO1xufVxuXG5zZWxmLmRhZW1vbklzQ29ubmVjdGVkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmlzQ29ubmVjdGVkKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VmVyc2lvbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VmVyc2lvbigpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25Jc1RydXN0ZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uaXNUcnVzdGVkKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEhlaWdodCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrSGFzaChoZWlnaHQpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrVGVtcGxhdGUgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgd2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TGFzdEJsb2NrSGVhZGVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRMYXN0QmxvY2tIZWFkZXIoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGFzaCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrSGVhZGVyQnlIYXNoKGhhc2gpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlckJ5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIZWFkZXJzQnlSYW5nZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gIGxldCBibG9ja0hlYWRlcnNKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrSGVhZGVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkpIGJsb2NrSGVhZGVyc0pzb24ucHVzaChibG9ja0hlYWRlci50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja0hlYWRlcnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQsIHBydW5lKSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5SGFzaChibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQsIHBydW5lKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tCeUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0J5SGVpZ2h0KGhlaWdodCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodHMpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cykpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5UmFuZ2UgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0KSB7XG4gIHRocm93IG5ldyBFcnJvcihcIndvcmtlci5nZXRCbG9ja0hhc2hlcyBub3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbi8vIFRPRE86IGZhY3RvciBjb21tb24gY29kZSB3aXRoIHNlbGYuZ2V0VHhzKClcbnNlbGYuZGFlbW9uR2V0VHhzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzLCBwcnVuZSkge1xuICBcbiAgLy8gZ2V0IHR4c1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhzKHR4SGFzaGVzLCBwcnVuZSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlcyAoYmFzZWQgb24gcXdlcnR5Y29pbl93YXNtX2JyaWRnZS5jcHA6OmdldF90eHMpXG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWRcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4SGV4ZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluZXJUeFN1bSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQsIG51bUJsb2Nrcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRGZWVFc3RpbWF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBncmFjZUJsb2Nrcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uU3VibWl0VHhIZXggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIZXgsIGRvTm90UmVsYXkpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblJlbGF5VHhzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VHhQb29sID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4UG9vbCgpO1xuICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHModHhzKTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB0eC5zZXRCbG9jayhibG9jaylcbiAgcmV0dXJuIGJsb2NrLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbEhhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2xIYXNoZXMoKTtcbn1cblxuLy9hc3luYyBnZXRUeFBvb2xCYWNrbG9nKCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbFN0YXRzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2xTdGF0cygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25GbHVzaFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmZsdXNoVHhQb29sKGhhc2hlcyk7XG59XG5cbnNlbGYuZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGtleUltYWdlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dHMob3V0cHV0cykge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICBsZXQgZW50cmllc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgZW50cnkgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmKSkge1xuICAgIGVudHJpZXNKc29uLnB1c2goZW50cnkudG9Kc29uKCkpO1xuICB9XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldFN5bmNJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRTeW5jSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIYXJkRm9ya0luZm8gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEhhcmRGb3JrSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRBbHRDaGFpbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgYWx0Q2hhaW5zSnNvbiA9IFtdO1xuICBmb3IgKGxldCBhbHRDaGFpbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRBbHRDaGFpbnMoKSkgYWx0Q2hhaW5zSnNvbi5wdXNoKGFsdENoYWluLnRvSnNvbigpKTtcbiAgcmV0dXJuIGFsdENoYWluc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0QmxvY2tIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0QmxvY2tIYXNoZXMoKTtcbn1cblxuc2VsZi5kYWVtb25HZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldERvd25sb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25TZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXREb3dubG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldERvd25sb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVzZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25TZXRVcGxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0VXBsb2FkTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblJlc2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVzZXRVcGxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFBlZXJzKCkpIHBlZXJzSnNvbi5wdXNoKHBlZXIudG9Kc29uKCkpO1xuICByZXR1cm4gcGVlcnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEtub3duUGVlcnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgcGVlcnNKc29uID0gW107XG4gIGZvciAobGV0IHBlZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0S25vd25QZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblNldEluY29taW5nUGVlckxpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UGVlckJhbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgYmFuc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmFuIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFBlZXJCYW5zKCkpIGJhbnNKc29uLnB1c2goYmFuLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJhbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vblNldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJhbnNKc29uKSB7XG4gIGxldCBiYW5zID0gW107XG4gIGZvciAobGV0IGJhbkpzb24gb2YgYmFuc0pzb24pIGJhbnMucHVzaChuZXcgTW9uZXJvQmFuKGJhbkpzb24pKTtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFBlZXJCYW5zKGJhbnMpO1xufVxuXG5zZWxmLmRhZW1vblN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RhcnRNaW5pbmcoYWRkcmVzcywgbnVtVGhyZWFkcywgaXNCYWNrZ3JvdW5kLCBpZ25vcmVCYXR0ZXJ5KTtcbn1cblxuc2VsZi5kYWVtb25TdG9wTWluaW5nID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3BNaW5pbmcoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRNaW5pbmdTdGF0dXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE1pbmluZ1N0YXR1cygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25TdWJtaXRCbG9ja3MgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tCbG9icykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0QmxvY2tzKGJsb2NrQmxvYnMpO1xufVxuXG5zZWxmLmRhZW1vblBydW5lQmxvY2tjaGFpbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjaGVjaykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnBydW5lQmxvY2tjaGFpbihjaGVjaykpLnRvSnNvbigpO1xufVxuXG4vL2FzeW5jIGNoZWNrRm9yVXBkYXRlKCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuLy9cbi8vYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vblN0b3AgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RvcCgpO1xufVxuXG5zZWxmLmRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLndhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKSkudG9Kc29uKCk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5vcGVuV2FsbGV0RGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBwYXRoLCBwYXNzd29yZCwgbmV0d29ya1R5cGUsIGtleXNEYXRhLCBjYWNoZURhdGEsIGRhZW1vblVyaU9yQ29uZmlnKSB7XG4gIGxldCBkYWVtb25Db25uZWN0aW9uID0gZGFlbW9uVXJpT3JDb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihkYWVtb25VcmlPckNvbmZpZykgOiB1bmRlZmluZWQ7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5vcGVuV2FsbGV0KHtwYXRoOiBcIlwiLCBwYXNzd29yZDogcGFzc3dvcmQsIG5ldHdvcmtUeXBlOiBuZXR3b3JrVHlwZSwga2V5c0RhdGE6IGtleXNEYXRhLCBjYWNoZURhdGE6IGNhY2hlRGF0YSwgc2VydmVyOiBkYWVtb25Db25uZWN0aW9uLCBwcm94eVRvV29ya2VyOiBmYWxzZX0pO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRCcm93c2VyTWFpblBhdGgocGF0aCk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0S2V5cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbn1cblxuc2VsZi5jcmVhdGVXYWxsZXRGdWxsID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZ0pzb24pIHtcbiAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnSnNvbik7XG4gIGxldCBwYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKGZhbHNlKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0gPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldChjb25maWcpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRCcm93c2VyTWFpblBhdGgocGF0aCk7XG59XG5cbnNlbGYuaXNWaWV3T25seSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc1ZpZXdPbmx5KCk7XG59XG5cbnNlbGYuZ2V0TmV0d29ya1R5cGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TmV0d29ya1R5cGUoKTtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0VmVyc2lvbigpIHtcbi8vICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5nZXRTZWVkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWQoKTtcbn1cblxuc2VsZi5nZXRTZWVkTGFuZ3VhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkTGFuZ3VhZ2VzKCk7XG59XG5cbnNlbGYuZ2V0UHJpdmF0ZVNwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFByaXZhdGVTcGVuZEtleSgpO1xufVxuXG5zZWxmLmdldFByaXZhdGVWaWV3S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFByaXZhdGVWaWV3S2V5KCk7XG59XG5cbnNlbGYuZ2V0UHVibGljVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQdWJsaWNWaWV3S2V5KCk7XG59XG5cbnNlbGYuZ2V0UHVibGljU3BlbmRLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzc0luZGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzSW5kZXgoYWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldFN1YmFkZHJlc3NMYWJlbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCkge1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xufVxuXG5zZWxmLmdldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbnRlZ3JhdGVkQWRkcmVzcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc2V0RGFlbW9uQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcsIGlzVHJ1c3RlZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihPYmplY3QuYXNzaWduKGNvbmZpZywge3Byb3h5VG9Xb3JrZXI6IGZhbHNlfSkpIDogdW5kZWZpbmVkLCBpc1RydXN0ZWQpO1xufVxuXG5zZWxmLmdldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICBsZXQgY29ubmVjdGlvbiA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbkNvbm5lY3Rpb24oKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkO1xufVxuXG5zZWxmLmlzRGFlbW9uVHJ1c3RlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0RhZW1vblRydXN0ZWQoKTtcbn1cblxuc2VsZi5pc0Nvbm5lY3RlZFRvRGFlbW9uID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbn1cblxuc2VsZi5nZXRSZXN0b3JlSGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc3RvcmVIZWlnaHQoKTtcbn1cblxuc2VsZi5zZXRSZXN0b3JlSGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHJlc3RvcmVIZWlnaHQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uSGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbkhlaWdodCgpO1xufVxuXG5zZWxmLmdldERhZW1vbk1heFBlZXJIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpXG59XG5cbnNlbGYuZ2V0SGVpZ2h0QnlEYXRlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbn1cblxuc2VsZi5pc0RhZW1vblN5bmNlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0RhZW1vblN5bmNlZCgpO1xufVxuXG5zZWxmLmdldEhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRIZWlnaHQoKTtcbn1cblxuc2VsZi5hZGRMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsaXN0ZW5lcklkKSB7XG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgbGlzdGVuZXIgdG8gYnJpZGdlIG5vdGlmaWNhdGlvbnMgdG8gZXh0ZXJuYWwgbGlzdGVuZXJzLlxuICAgKiBcbiAgICogVE9ETzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgaXMgbm90IGRlZmluZWQgdW50aWwgc2NyaXB0cyBpbXBvcnRlZFxuICAgKiBcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNsYXNzIFdhbGxldFdvcmtlckhlbHBlckxpc3RlbmVyIGV4dGVuZHMgTW9uZXJvV2FsbGV0TGlzdGVuZXIge1xuXG4gICAgcHJvdGVjdGVkIHdhbGxldElkOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIGlkOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIHdvcmtlcjogV29ya2VyO1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKHdhbGxldElkLCBpZCwgd29ya2VyKSB7XG4gICAgICBzdXBlcigpO1xuICAgICAgdGhpcy53YWxsZXRJZCA9IHdhbGxldElkO1xuICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgdGhpcy53b3JrZXIgPSB3b3JrZXI7XG4gICAgfVxuICAgIFxuICAgIGdldElkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpIHtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uU3luY1Byb2dyZXNzX1wiICsgdGhpcy5nZXRJZCgpLCBoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlXSk7XG4gICAgfVxuXG4gICAgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHsgXG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbk5ld0Jsb2NrX1wiICsgdGhpcy5nZXRJZCgpLCBoZWlnaHRdKTtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZSwgbmV3VW5sb2NrZWRCYWxhbmNlKSB7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIHRoaXMuZ2V0SWQoKSwgbmV3QmFsYW5jZS50b1N0cmluZygpLCBuZXdVbmxvY2tlZEJhbGFuY2UudG9TdHJpbmcoKV0pO1xuICAgIH1cblxuICAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChvdXRwdXQpIHtcbiAgICAgIGxldCBibG9jayA9IG91dHB1dC5nZXRUeCgpLmdldEJsb2NrKCk7XG4gICAgICBpZiAoYmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW291dHB1dC5nZXRUeCgpXSk7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgdGhpcy5nZXRJZCgpLCBibG9jay50b0pzb24oKV0pOyAgLy8gc2VyaWFsaXplIGZyb20gcm9vdCBibG9ja1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvbk91dHB1dFNwZW50KG91dHB1dCkge1xuICAgICAgbGV0IGJsb2NrID0gb3V0cHV0LmdldFR4KCkuZ2V0QmxvY2soKTtcbiAgICAgIGlmIChibG9jayA9PT0gdW5kZWZpbmVkKSBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbb3V0cHV0LmdldFR4KCldKTtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyB0aGlzLmdldElkKCksIGJsb2NrLnRvSnNvbigpXSk7ICAgICAvLyBzZXJpYWxpemUgZnJvbSByb290IGJsb2NrXG4gICAgfVxuICB9XG4gIFxuICBsZXQgbGlzdGVuZXIgPSBuZXcgV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIod2FsbGV0SWQsIGxpc3RlbmVySWQsIHNlbGYpO1xuICBpZiAoIXNlbGYubGlzdGVuZXJzKSBzZWxmLmxpc3RlbmVycyA9IFtdO1xuICBzZWxmLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xufVxuXG5zZWxmLnJlbW92ZUxpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxpc3RlbmVySWQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxmLmxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzZWxmLmxpc3RlbmVyc1tpXS5nZXRJZCgpICE9PSBsaXN0ZW5lcklkKSBjb250aW51ZTtcbiAgICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZW1vdmVMaXN0ZW5lcihzZWxmLmxpc3RlbmVyc1tpXSk7XG4gICAgc2VsZi5saXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgIHJldHVybjtcbiAgfVxuICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbn1cblxuc2VsZi5pc1N5bmNlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc1N5bmNlZCgpO1xufVxuXG5zZWxmLnN5bmMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3luYyh1bmRlZmluZWQsIHN0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxscykpO1xufVxuXG5zZWxmLnN0YXJ0U3luY2luZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzeW5jUGVyaW9kSW5Ncykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKTtcbn1cblxuc2VsZi5zdG9wU3luY2luZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdG9wU3luY2luZygpO1xufVxuXG5zZWxmLnNjYW5UeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNjYW5UeHModHhIYXNoZXMpO1xufVxuXG5zZWxmLnJlc2NhblNwZW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlc2NhblNwZW50KCk7XG59XG5cbnNlbGYucmVzY2FuQmxvY2tjaGFpbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZXNjYW5CbG9ja2NoYWluKCk7XG59XG5cbnNlbGYuZ2V0QmFsYW5jZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSkudG9TdHJpbmcoKTtcbn1cblxuc2VsZi5nZXRVbmxvY2tlZEJhbGFuY2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSkudG9TdHJpbmcoKTtcbn1cblxuc2VsZi5nZXRBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpIHtcbiAgbGV0IGFjY291bnRKc29ucyA9IFtdO1xuICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykpIGFjY291bnRKc29ucy5wdXNoKGFjY291bnQudG9Kc29uKCkpO1xuICByZXR1cm4gYWNjb3VudEpzb25zO1xufVxuXG5zZWxmLmdldEFjY291bnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3NlcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmNyZWF0ZUFjY291bnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGFiZWwpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVBY2NvdW50KGxhYmVsKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0U3ViYWRkcmVzc2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSB7XG4gIGxldCBzdWJhZGRyZXNzSnNvbnMgPSBbXTtcbiAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpKSBzdWJhZGRyZXNzSnNvbnMucHVzaChzdWJhZGRyZXNzLnRvSnNvbigpKTtcbiAgcmV0dXJuIHN1YmFkZHJlc3NKc29ucztcbn1cblxuc2VsZi5jcmVhdGVTdWJhZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIGxhYmVsKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCkpLnRvSnNvbigpO1xufVxuXG4vLyBUT0RPOiBlYXNpZXIgb3IgbW9yZSBlZmZpY2llbnQgd2F5IHRoYW4gc2VyaWFsaXppbmcgZnJvbSByb290IGJsb2Nrcz9cbnNlbGYuZ2V0VHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGJsb2NrSnNvblF1ZXJ5KSB7XG4gIFxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvblF1ZXJ5LCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1FVRVJZKS5nZXRUeHMoKVswXTtcbiAgXG4gIC8vIGdldCB0eHNcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4cyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlcyAoYmFzZWQgb24gcXdlcnR5Y29pbl93YXNtX2JyaWRnZS5jcHA6OmdldF90eHMpXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBsZXQgdW5jb25maXJtZWRCbG9jayA9IHVuZGVmaW5lZDtcbiAgbGV0IGJsb2NrcyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIHtibG9ja3M6IGJsb2Nrc307XG59XG5cbnNlbGYuZ2V0VHJhbnNmZXJzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGJsb2NrSnNvblF1ZXJ5KSB7XG4gIFxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICBcbiAgLy8gZ2V0IHRyYW5zZmVyc1xuICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHJhbnNmZXJzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgIGxldCB0eCA9IHRyYW5zZmVyLmdldFR4KCk7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZ2V0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSAobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvblF1ZXJ5LCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1FVRVJZKS5nZXRUeHMoKVswXSBhcyBNb25lcm9UeFF1ZXJ5KS5nZXRPdXRwdXRRdWVyeSgpO1xuICBcbiAgLy8gZ2V0IG91dHB1dHNcbiAgbGV0IG91dHB1dHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRPdXRwdXRzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgbGV0IHR4ID0gb3V0cHV0LmdldFR4KCk7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZXhwb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4cG9ydE91dHB1dHMoYWxsKTtcbn1cblxuc2VsZi5pbXBvcnRPdXRwdXRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG91dHB1dHNIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE91dHB1dHMob3V0cHV0c0hleCk7XG59XG5cbnNlbGYuZ2V0S2V5SW1hZ2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFsbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4cG9ydEtleUltYWdlcyhhbGwpKS50b0pzb24oKTtcbn1cblxuc2VsZi5pbXBvcnRLZXlJbWFnZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2VzSnNvbiwgb2Zmc2V0KSB7XG4gIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIGtleUltYWdlc0pzb24pIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzLCBvZmZzZXQpKS50b0pzb24oKTtcbn1cblxuLy9hc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5mcmVlemVPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmZyZWV6ZU91dHB1dChrZXlJbWFnZSk7XG59XG5cbnNlbGYudGhhd091dHB1dCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0udGhhd091dHB1dChrZXlJbWFnZSk7XG59XG5cbnNlbGYuaXNPdXRwdXRGcm96ZW4gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzT3V0cHV0RnJvemVuKGtleUltYWdlKTtcbn1cblxuc2VsZi5nZXREZWZhdWx0RmVlUHJpb3JpdHkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk7XG59XG5cbnNlbGYuY3JlYXRlVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgcmV0dXJuIHR4c1swXS5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eCA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gIHJldHVybiB0eC5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwVW5sb2NrZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgbGV0IHR4U2V0cyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICghR2VuVXRpbHMuYXJyYXlDb250YWlucyh0eFNldHMsIHR4LmdldFR4U2V0KCkpKSB0eFNldHMucHVzaCh0eC5nZXRUeFNldCgpKTtcbiAgbGV0IHR4U2V0c0pzb24gPSBbXTtcbiAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSB0eFNldHNKc29uLnB1c2godHhTZXQudG9Kc29uKCkpO1xuICByZXR1cm4gdHhTZXRzSnNvbjtcbn1cblxuc2VsZi5zd2VlcER1c3QgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVsYXkpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwRHVzdChyZWxheSk7XG4gIHJldHVybiB0eHMubGVuZ3RoID09PSAwID8ge30gOiB0eHNbMF0uZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5yZWxheVR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eE1ldGFkYXRhcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVsYXlUeHModHhNZXRhZGF0YXMpO1xufVxuXG5zZWxmLmRlc2NyaWJlVHhTZXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhTZXRKc29uKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNpZ25UeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdW5zaWduZWRUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbn1cblxuc2VsZi5zdWJtaXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN1Ym1pdFR4cyhzaWduZWRUeEhleCk7XG59XG5cbnNlbGYuc2lnbk1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYudmVyaWZ5TWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhLZXkodHhIYXNoKTtcbn1cblxuc2VsZi5jaGVja1R4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrVHhQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFNwZW5kUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tTcGVuZFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xufVxuXG5zZWxmLmdldFJlc2VydmVQcm9vZldhbGxldCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSk7XG59XG5cbnNlbGYuZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBhbW91bnRTdHIsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50U3RyLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1Jlc2VydmVQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5zZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzLCB0eE5vdGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRUeE5vdGVzKHR4SGFzaGVzLCB0eE5vdGVzKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzQm9va0VudHJpZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgZW50cnlJbmRpY2VzKSB7XG4gIGxldCBlbnRyaWVzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBlbnRyeSBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSkgZW50cmllc0pzb24ucHVzaChlbnRyeS50b0pzb24oKSk7XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuc2VsZi5hZGRBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5lZGl0QWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5kZWxldGVBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluZGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGluZGV4KTtcbn1cblxuc2VsZi50YWdBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi51bnRhZ0FjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5nZXRBY2NvdW50VGFncyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5zZXRBY2NvdW50VGFnTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdGFnLCBsYWJlbCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuZ2V0UGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQYXltZW50VXJpKG5ldyBNb25lcm9UeENvbmZpZyhjb25maWdKc29uKSk7XG59XG5cbnNlbGYucGFyc2VQYXltZW50VXJpID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVyaSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnBhcnNlUGF5bWVudFVyaSh1cmkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn1cblxuc2VsZi5zZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5LCB2YWx1ZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xufVxuXG5zZWxmLnN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xufVxuXG5zZWxmLnN0b3BNaW5pbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcE1pbmluZygpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZygpO1xufVxuXG5zZWxmLmdldE11bHRpc2lnSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TXVsdGlzaWdJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnByZXBhcmVNdWx0aXNpZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wcmVwYXJlTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5tYWtlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICByZXR1cm4gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xufVxuXG5zZWxmLmV4Y2hhbmdlTXVsdGlzaWdLZXlzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5leHBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRNdWx0aXNpZ0hleCgpO1xufVxuXG5zZWxmLmltcG9ydE11bHRpc2lnSGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcywgcmVmcmVzaEFmdGVySW1wb3J0KTtcbn1cblxuc2VsZi5zaWduTXVsdGlzaWdUeEhleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ1R4SGV4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN1Ym1pdE11bHRpc2lnVHhIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbn1cblxuc2VsZi5nZXREYXRhID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhdGEoKTtcbn1cblxuc2VsZi5jaGFuZ2VQYXNzd29yZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCk7XG59XG5cbnNlbGYuaXNDbG9zZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gIXNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdIHx8IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzQ2xvc2VkKCk7XG59XG5cbnNlbGYuY2xvc2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2F2ZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2xvc2Uoc2F2ZSk7XG4gIGRlbGV0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