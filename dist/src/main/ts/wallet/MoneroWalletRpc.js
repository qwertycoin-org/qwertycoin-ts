"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));
var _TaskLooper = _interopRequireDefault(require("../common/TaskLooper"));
var _MoneroAccount = _interopRequireDefault(require("./model/MoneroAccount"));
var _MoneroAccountTag = _interopRequireDefault(require("./model/MoneroAccountTag"));
var _MoneroAddressBookEntry = _interopRequireDefault(require("./model/MoneroAddressBookEntry"));
var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));
var _MoneroBlockHeader = _interopRequireDefault(require("../daemon/model/MoneroBlockHeader"));
var _MoneroCheckReserve = _interopRequireDefault(require("./model/MoneroCheckReserve"));
var _MoneroCheckTx = _interopRequireDefault(require("./model/MoneroCheckTx"));
var _MoneroDestination = _interopRequireDefault(require("./model/MoneroDestination"));
var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));
var _MoneroIncomingTransfer = _interopRequireDefault(require("./model/MoneroIncomingTransfer"));
var _MoneroIntegratedAddress = _interopRequireDefault(require("./model/MoneroIntegratedAddress"));
var _MoneroKeyImage = _interopRequireDefault(require("../daemon/model/MoneroKeyImage"));
var _MoneroKeyImageExportResult = _interopRequireDefault(require("./model/MoneroKeyImageExportResult"));
var _MoneroKeyImageImportResult = _interopRequireDefault(require("./model/MoneroKeyImageImportResult"));
var _MoneroMultisigInfo = _interopRequireDefault(require("./model/MoneroMultisigInfo"));
var _MoneroMultisigInitResult = _interopRequireDefault(require("./model/MoneroMultisigInitResult"));
var _MoneroMultisigSignResult = _interopRequireDefault(require("./model/MoneroMultisigSignResult"));
var _MoneroOutgoingTransfer = _interopRequireDefault(require("./model/MoneroOutgoingTransfer"));
var _MoneroOutputQuery = _interopRequireDefault(require("./model/MoneroOutputQuery"));
var _MoneroOutputWallet = _interopRequireDefault(require("./model/MoneroOutputWallet"));
var _MoneroRpcConnection = _interopRequireDefault(require("../common/MoneroRpcConnection"));
var _MoneroRpcError = _interopRequireDefault(require("../common/MoneroRpcError"));
var _MoneroSubaddress = _interopRequireDefault(require("./model/MoneroSubaddress"));
var _MoneroSyncResult = _interopRequireDefault(require("./model/MoneroSyncResult"));

var _MoneroTransferQuery = _interopRequireDefault(require("./model/MoneroTransferQuery"));

var _MoneroTxConfig = _interopRequireDefault(require("./model/MoneroTxConfig"));

var _MoneroTxQuery = _interopRequireDefault(require("./model/MoneroTxQuery"));
var _MoneroTxSet = _interopRequireDefault(require("./model/MoneroTxSet"));
var _MoneroTxWallet = _interopRequireDefault(require("./model/MoneroTxWallet"));
var _MoneroUtils = _interopRequireDefault(require("../common/MoneroUtils"));
var _MoneroVersion = _interopRequireDefault(require("../daemon/model/MoneroVersion"));
var _MoneroWallet = _interopRequireDefault(require("./MoneroWallet"));
var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));
var _MoneroWalletListener = _interopRequireDefault(require("./model/MoneroWalletListener"));
var _MoneroMessageSignatureType = _interopRequireDefault(require("./model/MoneroMessageSignatureType"));
var _MoneroMessageSignatureResult = _interopRequireDefault(require("./model/MoneroMessageSignatureResult"));
var _ThreadPool = _interopRequireDefault(require("../common/ThreadPool"));
var _SslOptions = _interopRequireDefault(require("../common/SslOptions"));function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}


/**
 * Copyright (c) woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Implements a MoneroWallet as a client of monero-wallet-rpc.
 * 
 * @implements {MoneroWallet}
 */
class MoneroWalletRpc extends _MoneroWallet.default {

  // static variables
  static DEFAULT_SYNC_PERIOD_IN_MS = 20000; // default period between syncs in ms (defined by DEFAULT_AUTO_REFRESH_PERIOD in wallet_rpc_server.cpp)

  // instance variables










  /** @private */
  constructor(config) {
    super();
    this.config = config;
    this.addressCache = {}; // avoid unecessary requests for addresses
    this.syncPeriodInMs = MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS;
  }

  // --------------------------- RPC WALLET METHODS ---------------------------

  /**
   * Get the internal process running monero-wallet-rpc.
   * 
   * @return {ChildProcess} the process running monero-wallet-rpc, undefined if not created from new process
   */
  getProcess() {
    return this.process;
  }

  /**
   * Stop the internal process running monero-wallet-rpc, if applicable.
   * 
   * @param {boolean} force specifies if the process should be destroyed forcibly (default false)
   * @return {Promise<number | undefined>} the exit code from stopping the process
   */
  async stopProcess(force = false) {
    if (this.process === undefined) throw new _MoneroError.default("MoneroWalletRpc instance not created from new process");
    let listenersCopy = _GenUtils.default.copyArray(this.getListeners());
    for (let listener of listenersCopy) await this.removeListener(listener);
    return _GenUtils.default.killProcess(this.process, force ? "SIGKILL" : undefined);
  }

  /**
   * Get the wallet's RPC connection.
   * 
   * @return {MoneroRpcConnection | undefined} the wallet's rpc connection
   */
  getRpcConnection() {
    return this.config.getServer();
  }

  /**
   * <p>Open an existing wallet on the monero-wallet-rpc server.</p>
   * 
   * <p>Example:<p>
   * 
   * <code>
   * let wallet = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br>
   * await wallet.openWallet("mywallet1", "supersecretpassword");<br>
   * <br>
   * await wallet.openWallet({<br>
   * &nbsp;&nbsp; path: "mywallet2",<br>
   * &nbsp;&nbsp; password: "supersecretpassword",<br>
   * &nbsp;&nbsp; server: "http://locahost:38081", // or object with uri, username, password, etc <br>
   * &nbsp;&nbsp; rejectUnauthorized: false<br>
   * });<br>
   * </code>
   * 
   * @param {string|MoneroWalletConfig} pathOrConfig  - the wallet's name or configuration to open
   * @param {string} pathOrConfig.path - path of the wallet to create (optional, in-memory wallet if not given)
   * @param {string} pathOrConfig.password - password of the wallet to create
   * @param {string|Partial<MoneroRpcConnection>} pathOrConfig.server - uri or MoneroRpcConnection of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
   * @param {string} [password] the wallet's password
   * @return {Promise<MoneroWalletRpc>} this wallet client
   */
  async openWallet(pathOrConfig, password) {

    // normalize and validate config
    let config = new _MoneroWalletConfig.default(typeof pathOrConfig === "string" ? { path: pathOrConfig, password: password ? password : "" } : pathOrConfig);
    // TODO: ensure other fields uninitialized?

    // open wallet on rpc server
    if (!config.getPath()) throw new _MoneroError.default("Must provide name of wallet to open");
    if (config.getRegtest() !== undefined) throw new _MoneroError.default("Cannot specify regtest mode when opening RPC wallet");
    await this.config.getServer().sendJsonRequest("open_wallet", { filename: config.getPath(), password: config.getPassword() });
    await this.clear();
    this.path = config.getPath();

    // set connection manager or server
    if (config.getConnectionManager() != null) {
      if (config.getServer()) throw new _MoneroError.default("Wallet can be opened with a server or connection manager but not both");
      await this.setConnectionManager(config.getConnectionManager());
    } else if (config.getServer() != null) {
      await this.setDaemonConnection(config.getServer());
    }

    return this;
  }

  /**
   * <p>Create and open a wallet on the monero-wallet-rpc server.<p>
   * 
   * <p>Example:<p>
   * 
   * <code>
   * &sol;&sol; construct client to monero-wallet-rpc<br>
   * let walletRpc = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br><br>
   * 
   * &sol;&sol; create and open wallet on monero-wallet-rpc<br>
   * await walletRpc.createWallet({<br>
   * &nbsp;&nbsp; path: "mywallet",<br>
   * &nbsp;&nbsp; password: "abc123",<br>
   * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon...",<br>
   * &nbsp;&nbsp; restoreHeight: 1543218l<br>
   * });
   *  </code>
   * 
   * @param {Partial<MoneroWalletConfig>} config - MoneroWalletConfig or equivalent JS object
   * @param {string} [config.path] - path of the wallet to create (optional, in-memory wallet if not given)
   * @param {string} [config.password] - password of the wallet to create
   * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
   * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed
   * @param {boolean} [config.isMultisig] - restore multisig wallet from seed
   * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
   * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
   * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
   * @param {number} [config.restoreHeight] - block height to start scanning from (defaults to 0 unless generating random wallet)
   * @param {string} [config.language] - language of the wallet's mnemonic phrase or seed (defaults to "English" or auto-detected)
   * @param {MoneroRpcConnection} [config.server] - MoneroRpcConnection to a monero daemon (optional)<br>
   * @param {string} [config.serverUri] - uri of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
   * @param {string} [config.serverUsername] - username to authenticate with the daemon (optional)
   * @param {string} [config.serverPassword] - password to authenticate with the daemon (optional)
   * @param {MoneroConnectionManager} [config.connectionManager] - manage connections to monerod (optional)
   * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (defaults to true)
   * @param {MoneroRpcConnection} [config.server] - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
   * @param {boolean} [config.saveCurrent] - specifies if the current RPC wallet should be saved before being closed (default true)
   * @return {MoneroWalletRpc} this wallet client
   */
  async createWallet(config) {

    // normalize and validate config
    if (config === undefined) throw new _MoneroError.default("Must provide config to create wallet");
    const configNormalized = new _MoneroWalletConfig.default(config);
    if (configNormalized.getSeed() !== undefined && (configNormalized.getPrimaryAddress() !== undefined || configNormalized.getPrivateViewKey() !== undefined || configNormalized.getPrivateSpendKey() !== undefined)) {
      throw new _MoneroError.default("Wallet can be initialized with a seed or keys but not both");
    }
    if (configNormalized.getRegtest() !== undefined) throw new _MoneroError.default("Cannot specify regtest mode when creating RPC wallet");
    if (configNormalized.getNetworkType() !== undefined) throw new _MoneroError.default("Cannot provide networkType when creating RPC wallet because server's network type is already set");
    if (configNormalized.getAccountLookahead() !== undefined || configNormalized.getSubaddressLookahead() !== undefined) throw new _MoneroError.default("monero-wallet-rpc does not support creating wallets with subaddress lookahead over rpc");
    if (configNormalized.getPassword() === undefined) configNormalized.setPassword("");

    // set server from connection manager if provided
    if (configNormalized.getConnectionManager()) {
      if (configNormalized.getServer()) throw new _MoneroError.default("Wallet can be created with a server or connection manager but not both");
      configNormalized.setServer(config.getConnectionManager().getConnection());
    }

    // create wallet
    if (configNormalized.getSeed() !== undefined) await this.createWalletFromSeed(configNormalized);else
    if (configNormalized.getPrivateSpendKey() !== undefined || configNormalized.getPrimaryAddress() !== undefined) await this.createWalletFromKeys(configNormalized);else
    await this.createWalletRandom(configNormalized);

    // set connection manager or server
    if (configNormalized.getConnectionManager()) {
      await this.setConnectionManager(configNormalized.getConnectionManager());
    } else if (configNormalized.getServer()) {
      await this.setDaemonConnection(configNormalized.getServer());
    }

    return this;
  }

  async createWalletRandom(config) {
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating random wallet");
    if (config.getRestoreHeight() !== undefined) throw new _MoneroError.default("Cannot provide restoreHeight when creating random wallet");
    if (config.getSaveCurrent() === false) throw new _MoneroError.default("Current wallet is saved automatically when creating random wallet");
    if (!config.getPath()) throw new _MoneroError.default("Name is not initialized");
    if (!config.getLanguage()) config.setLanguage(_MoneroWallet.default.DEFAULT_LANGUAGE);
    let params = { filename: config.getPath(), password: config.getPassword(), language: config.getLanguage() };
    try {
      await this.config.getServer().sendJsonRequest("create_wallet", params);
    } catch (err) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }

  async createWalletFromSeed(config) {
    try {
      await this.config.getServer().sendJsonRequest("restore_deterministic_wallet", {
        filename: config.getPath(),
        password: config.getPassword(),
        seed: config.getSeed(),
        seed_offset: config.getSeedOffset(),
        enable_multisig_experimental: config.getIsMultisig(),
        restore_height: config.getRestoreHeight(),
        language: config.getLanguage(),
        autosave_current: config.getSaveCurrent()
      });
    } catch (err) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }

  async createWalletFromKeys(config) {
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating wallet from keys");
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getLanguage() === undefined) config.setLanguage(_MoneroWallet.default.DEFAULT_LANGUAGE);
    try {
      await this.config.getServer().sendJsonRequest("generate_from_keys", {
        filename: config.getPath(),
        password: config.getPassword(),
        address: config.getPrimaryAddress(),
        viewkey: config.getPrivateViewKey(),
        spendkey: config.getPrivateSpendKey(),
        restore_height: config.getRestoreHeight(),
        autosave_current: config.getSaveCurrent()
      });
    } catch (err) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }

  handleCreateWalletError(name, err) {
    if (err.message) {
      if (err.message.toLowerCase().includes("already exists")) throw new _MoneroRpcError.default("Wallet already exists: " + name, err.getCode(), err.getRpcMethod(), err.getRpcParams());
      if (err.message.toLowerCase().includes("word list failed verification")) throw new _MoneroRpcError.default("Invalid mnemonic", err.getCode(), err.getRpcMethod(), err.getRpcParams());
    }
    throw err;
  }

  async isViewOnly() {
    try {
      await this.config.getServer().sendJsonRequest("query_key", { key_type: "mnemonic" });
      return false; // key retrieval succeeds if not view only
    } catch (e) {
      if (e.getCode() === -29) return true; // wallet is view only
      if (e.getCode() === -1) return false; // wallet is offline but not view only
      throw e;
    }
  }

  /**
   * Set the wallet's daemon connection.
   * 
   * @param {string|MoneroRpcConnection} [uriOrConnection] - the daemon's URI or connection (defaults to offline)
   * @param {boolean} isTrusted - indicates if the daemon in trusted
   * @param {SslOptions} sslOptions - custom SSL configuration
   */
  async setDaemonConnection(uriOrConnection, isTrusted, sslOptions) {
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    if (!sslOptions) sslOptions = new _SslOptions.default();
    let params = {};
    params.address = connection ? connection.getUri() : "bad_uri"; // TODO monero-wallet-rpc: bad daemon uri necessary for offline?
    params.username = connection ? connection.getUsername() : "";
    params.password = connection ? connection.getPassword() : "";
    params.trusted = isTrusted;
    params.ssl_support = "autodetect";
    params.ssl_private_key_path = sslOptions.getPrivateKeyPath();
    params.ssl_certificate_path = sslOptions.getCertificatePath();
    params.ssl_ca_file = sslOptions.getCertificateAuthorityFile();
    params.ssl_allowed_fingerprints = sslOptions.getAllowedFingerprints();
    params.ssl_allow_any_cert = sslOptions.getAllowAnyCert();

    // set proxy which must match startup proxy if applicable
    if (connection && connection.getProxyUri() === undefined) {
      if (this.startupProxyUri !== undefined) throw new _MoneroError.default("Cannot set daemon connection without proxy URI because monero-wallet-rpc was started with a proxy URI: " + this.startupProxyUri);
    } else {
      if (this.startupProxyUri === undefined) params.proxy = connection ? connection.getProxyUri() : "";else
      if (!_GenUtils.default.isSameProxyUri(this.startupProxyUri, connection.getProxyUri())) {
        throw new _MoneroError.default("Cannot set daemon connection with proxy URI " + connection.getProxyUri() + " because monero-wallet-rpc was started with a different proxy URI: " + this.startupProxyUri);
      }
    }
    if (!params.proxy) params.proxy = "";

    await this.config.getServer().sendJsonRequest("set_daemon", params);
    this.daemonConnection = connection;
  }

  async getDaemonConnection() {
    return this.daemonConnection;
  }

  /**
   * Get the total and unlocked balances in a single request.
   * 
   * @param {number} [accountIdx] account index
   * @param {number} [subaddressIdx] subaddress index
   * @return {Promise<bigint[]>} is the total and unlocked balances in an array, respectively
   */
  async getBalances(accountIdx, subaddressIdx) {
    if (accountIdx === undefined) {
      _assert.default.equal(subaddressIdx, undefined, "Must provide account index with subaddress index");
      let balance = BigInt(0);
      let unlockedBalance = BigInt(0);
      for (let account of await this.getAccounts()) {
        balance = balance + account.getBalance();
        unlockedBalance = unlockedBalance + account.getUnlockedBalance();
      }
      return [balance, unlockedBalance];
    } else {
      let params = { account_index: accountIdx, address_indices: subaddressIdx === undefined ? undefined : [subaddressIdx] };
      let resp = await this.config.getServer().sendJsonRequest("get_balance", params);
      if (subaddressIdx === undefined) return [BigInt(resp.result.balance), BigInt(resp.result.unlocked_balance)];else
      return [BigInt(resp.result.per_subaddress[0].balance), BigInt(resp.result.per_subaddress[0].unlocked_balance)];
    }
  }

  // -------------------------- COMMON WALLET METHODS -------------------------

  async addListener(listener) {
    await super.addListener(listener);
    this.refreshListening();
  }

  async removeListener(listener) {
    await super.removeListener(listener);
    this.refreshListening();
  }

  async isConnectedToDaemon() {
    try {
      await this.checkReserveProof(await this.getPrimaryAddress(), "", ""); // TODO (monero-project): provide better way to know if wallet rpc is connected to daemon
      throw new _MoneroError.default("check reserve expected to fail");
    } catch (e) {
      if (e instanceof _MoneroError.default && e.getCode() === -13) throw e; // no wallet file
      return e.message.indexOf("Failed to connect to daemon") < 0;
    }
  }

  async getVersion() {
    let resp = await this.config.getServer().sendJsonRequest("get_version");
    return new _MoneroVersion.default(resp.result.version, resp.result.release);
  }

  async getPath() {
    return this.path;
  }

  async getSeed() {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "mnemonic" });
    return resp.result.key;
  }

  async getSeedLanguage() {
    if ((await this.getSeed()) === undefined) return undefined;
    throw new _MoneroError.default("MoneroWalletRpc.getSeedLanguage() not supported");
  }

  /**
   * Get a list of available languages for the wallet's seed.
   * 
   * @return {string[]} the available languages for the wallet's seed.
   */
  async getSeedLanguages() {
    return (await this.config.getServer().sendJsonRequest("get_languages")).result.languages;
  }

  async getPrivateViewKey() {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "view_key" });
    return resp.result.key;
  }

  async getPrivateSpendKey() {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "spend_key" });
    return resp.result.key;
  }

  async getAddress(accountIdx, subaddressIdx) {
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      await this.getSubaddresses(accountIdx, undefined, true); // cache's all addresses at this account
      return this.getAddress(accountIdx, subaddressIdx); // recursive call uses cache
    }
    let address = subaddressMap[subaddressIdx];
    if (!address) {
      await this.getSubaddresses(accountIdx, undefined, true); // cache's all addresses at this account
      return this.addressCache[accountIdx][subaddressIdx];
    }
    return address;
  }

  // TODO: use cache
  async getAddressIndex(address) {

    // fetch result and normalize error if address does not belong to the wallet
    let resp;
    try {
      resp = await this.config.getServer().sendJsonRequest("get_address_index", { address: address });
    } catch (e) {
      if (e.getCode() === -2) throw new _MoneroError.default(e.message);
      throw e;
    }

    // convert rpc response
    let subaddress = new _MoneroSubaddress.default({ address: address });
    subaddress.setAccountIndex(resp.result.index.major);
    subaddress.setIndex(resp.result.index.minor);
    return subaddress;
  }

  async getIntegratedAddress(standardAddress, paymentId) {
    try {
      let integratedAddressStr = (await this.config.getServer().sendJsonRequest("make_integrated_address", { standard_address: standardAddress, payment_id: paymentId })).result.integrated_address;
      return await this.decodeIntegratedAddress(integratedAddressStr);
    } catch (e) {
      if (e.message.includes("Invalid payment ID")) throw new _MoneroError.default("Invalid payment ID: " + paymentId);
      throw e;
    }
  }

  async decodeIntegratedAddress(integratedAddress) {
    let resp = await this.config.getServer().sendJsonRequest("split_integrated_address", { integrated_address: integratedAddress });
    return new _MoneroIntegratedAddress.default().setStandardAddress(resp.result.standard_address).setPaymentId(resp.result.payment_id).setIntegratedAddress(integratedAddress);
  }

  async getHeight() {
    return (await this.config.getServer().sendJsonRequest("get_height")).result.height;
  }

  async getDaemonHeight() {
    throw new _MoneroError.default("monero-wallet-rpc does not support getting the chain height");
  }

  async getHeightByDate(year, month, day) {
    throw new _MoneroError.default("monero-wallet-rpc does not support getting a height by date");
  }

  async sync(listenerOrStartHeight, startHeight) {
    (0, _assert.default)(!(listenerOrStartHeight instanceof _MoneroWalletListener.default), "Monero Wallet RPC does not support reporting sync progress");
    try {
      let resp = await this.config.getServer().sendJsonRequest("refresh", { start_height: startHeight });
      await this.poll();
      return new _MoneroSyncResult.default(resp.result.blocks_fetched, resp.result.received_money);
    } catch (err) {
      if (err.message === "no connection to daemon") throw new _MoneroError.default("Wallet is not connected to daemon");
      throw err;
    }
  }

  async startSyncing(syncPeriodInMs) {

    // convert ms to seconds for rpc parameter
    let syncPeriodInSeconds = Math.round((syncPeriodInMs === undefined ? MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS : syncPeriodInMs) / 1000);

    // send rpc request
    await this.config.getServer().sendJsonRequest("auto_refresh", {
      enable: true,
      period: syncPeriodInSeconds
    });

    // update sync period for poller
    this.syncPeriodInMs = syncPeriodInSeconds * 1000;
    if (this.walletPoller !== undefined) this.walletPoller.setPeriodInMs(this.syncPeriodInMs);

    // poll if listening
    await this.poll();
  }

  getSyncPeriodInMs() {
    return this.syncPeriodInMs;
  }

  async stopSyncing() {
    return this.config.getServer().sendJsonRequest("auto_refresh", { enable: false });
  }

  async scanTxs(txHashes) {
    if (!txHashes || !txHashes.length) throw new _MoneroError.default("No tx hashes given to scan");
    await this.config.getServer().sendJsonRequest("scan_tx", { txids: txHashes });
    await this.poll();
  }

  async rescanSpent() {
    await this.config.getServer().sendJsonRequest("rescan_spent", undefined);
  }

  async rescanBlockchain() {
    await this.config.getServer().sendJsonRequest("rescan_blockchain", undefined);
  }

  async getBalance(accountIdx, subaddressIdx) {
    return (await this.getBalances(accountIdx, subaddressIdx))[0];
  }

  async getUnlockedBalance(accountIdx, subaddressIdx) {
    return (await this.getBalances(accountIdx, subaddressIdx))[1];
  }

  async getAccounts(includeSubaddresses, tag, skipBalances) {

    // fetch accounts from rpc
    let resp = await this.config.getServer().sendJsonRequest("get_accounts", { tag: tag });

    // build account objects and fetch subaddresses per account using get_address
    // TODO monero-wallet-rpc: get_address should support all_accounts so not called once per account
    let accounts = [];
    for (let rpcAccount of resp.result.subaddress_accounts) {
      let account = MoneroWalletRpc.convertRpcAccount(rpcAccount);
      if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(account.getIndex(), undefined, true));
      accounts.push(account);
    }

    // fetch and merge fields from get_balance across all accounts
    if (includeSubaddresses && !skipBalances) {

      // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
      for (let account of accounts) {
        for (let subaddress of account.getSubaddresses()) {
          subaddress.setBalance(BigInt(0));
          subaddress.setUnlockedBalance(BigInt(0));
          subaddress.setNumUnspentOutputs(0);
          subaddress.setNumBlocksToUnlock(0);
        }
      }

      // fetch and merge info from get_balance
      resp = await this.config.getServer().sendJsonRequest("get_balance", { all_accounts: true });
      if (resp.result.per_subaddress) {
        for (let rpcSubaddress of resp.result.per_subaddress) {
          let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);

          // merge info
          let account = accounts[subaddress.getAccountIndex()];
          _assert.default.equal(subaddress.getAccountIndex(), account.getIndex(), "RPC accounts are out of order"); // would need to switch lookup to loop
          let tgtSubaddress = account.getSubaddresses()[subaddress.getIndex()];
          _assert.default.equal(subaddress.getIndex(), tgtSubaddress.getIndex(), "RPC subaddresses are out of order");
          if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
          if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
          if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
        }
      }
    }

    return accounts;
  }

  // TODO: getAccountByIndex(), getAccountByTag()
  async getAccount(accountIdx, includeSubaddresses, skipBalances) {
    (0, _assert.default)(accountIdx >= 0);
    for (let account of await this.getAccounts()) {
      if (account.getIndex() === accountIdx) {
        if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(accountIdx, undefined, skipBalances));
        return account;
      }
    }
    throw new Error("Account with index " + accountIdx + " does not exist");
  }

  async createAccount(label) {
    label = label ? label : undefined;
    let resp = await this.config.getServer().sendJsonRequest("create_account", { label: label });
    return new _MoneroAccount.default({
      index: resp.result.account_index,
      primaryAddress: resp.result.address,
      label: label,
      balance: BigInt(0),
      unlockedBalance: BigInt(0)
    });
  }

  async getSubaddresses(accountIdx, subaddressIndices, skipBalances) {

    // fetch subaddresses
    let params = {};
    params.account_index = accountIdx;
    if (subaddressIndices) params.address_index = _GenUtils.default.listify(subaddressIndices);
    let resp = await this.config.getServer().sendJsonRequest("get_address", params);

    // initialize subaddresses
    let subaddresses = [];
    for (let rpcSubaddress of resp.result.addresses) {
      let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);
      subaddress.setAccountIndex(accountIdx);
      subaddresses.push(subaddress);
    }

    // fetch and initialize subaddress balances
    if (!skipBalances) {

      // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
      for (let subaddress of subaddresses) {
        subaddress.setBalance(BigInt(0));
        subaddress.setUnlockedBalance(BigInt(0));
        subaddress.setNumUnspentOutputs(0);
        subaddress.setNumBlocksToUnlock(0);
      }

      // fetch and initialize balances
      resp = await this.config.getServer().sendJsonRequest("get_balance", params);
      if (resp.result.per_subaddress) {
        for (let rpcSubaddress of resp.result.per_subaddress) {
          let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);

          // transfer info to existing subaddress object
          for (let tgtSubaddress of subaddresses) {
            if (tgtSubaddress.getIndex() !== subaddress.getIndex()) continue; // skip to subaddress with same index
            if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
            if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
            if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
            if (subaddress.getNumBlocksToUnlock() !== undefined) tgtSubaddress.setNumBlocksToUnlock(subaddress.getNumBlocksToUnlock());
          }
        }
      }
    }

    // cache addresses
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      subaddressMap = {};
      this.addressCache[accountIdx] = subaddressMap;
    }
    for (let subaddress of subaddresses) {
      subaddressMap[subaddress.getIndex()] = subaddress.getAddress();
    }

    // return results
    return subaddresses;
  }

  async getSubaddress(accountIdx, subaddressIdx, skipBalances) {
    (0, _assert.default)(accountIdx >= 0);
    (0, _assert.default)(subaddressIdx >= 0);
    return (await this.getSubaddresses(accountIdx, [subaddressIdx], skipBalances))[0];
  }

  async createSubaddress(accountIdx, label) {

    // send request
    let resp = await this.config.getServer().sendJsonRequest("create_address", { account_index: accountIdx, label: label });

    // build subaddress object
    let subaddress = new _MoneroSubaddress.default();
    subaddress.setAccountIndex(accountIdx);
    subaddress.setIndex(resp.result.address_index);
    subaddress.setAddress(resp.result.address);
    subaddress.setLabel(label ? label : undefined);
    subaddress.setBalance(BigInt(0));
    subaddress.setUnlockedBalance(BigInt(0));
    subaddress.setNumUnspentOutputs(0);
    subaddress.setIsUsed(false);
    subaddress.setNumBlocksToUnlock(0);
    return subaddress;
  }

  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    await this.config.getServer().sendJsonRequest("label_address", { index: { major: accountIdx, minor: subaddressIdx }, label: label });
  }

  async getTxs(query) {
    return this.getTxsAux(query, 5);
  }

  async getTxsAux(query, maxAttempts) {

    // copy query
    const queryNormalized = _MoneroWallet.default.normalizeTxQuery(query);

    // temporarily disable transfer and output queries in order to collect all tx information
    let transferQuery = queryNormalized.getTransferQuery();
    let inputQuery = queryNormalized.getInputQuery();
    let outputQuery = queryNormalized.getOutputQuery();
    queryNormalized.setTransferQuery(undefined);
    queryNormalized.setInputQuery(undefined);
    queryNormalized.setOutputQuery(undefined);

    // fetch all transfers that meet tx query
    let transfers = await this.getTransfersAux(new _MoneroTransferQuery.default().setTxQuery(MoneroWalletRpc.decontextualize(queryNormalized.copy())));

    // collect unique txs from transfers while retaining order
    let txs = [];
    let txsSet = new Set();
    for (let transfer of transfers) {
      if (!txsSet.has(transfer.getTx())) {
        txs.push(transfer.getTx());
        txsSet.add(transfer.getTx());
      }
    }

    // cache types into maps for merging and lookup
    let txMap = {};
    let blockMap = {};
    for (let tx of txs) {
      MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
    }

    // fetch and merge outputs if requested
    if (queryNormalized.getIncludeOutputs() || outputQuery) {

      // fetch outputs
      let outputQueryAux = (outputQuery ? outputQuery.copy() : new _MoneroOutputQuery.default()).setTxQuery(MoneroWalletRpc.decontextualize(queryNormalized.copy()));
      let outputs = await this.getOutputsAux(outputQueryAux);

      // merge output txs one time while retaining order
      let outputTxs = [];
      for (let output of outputs) {
        if (!outputTxs.includes(output.getTx())) {
          MoneroWalletRpc.mergeTx(output.getTx(), txMap, blockMap);
          outputTxs.push(output.getTx());
        }
      }
    }

    // restore transfer and output queries
    queryNormalized.setTransferQuery(transferQuery);
    queryNormalized.setInputQuery(inputQuery);
    queryNormalized.setOutputQuery(outputQuery);

    // filter txs that don't meet transfer query
    let txsQueried = [];
    for (let tx of txs) {
      if (queryNormalized.meetsCriteria(tx)) txsQueried.push(tx);else
      if (tx.getBlock() !== undefined) tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
    }
    txs = txsQueried;

    // special case: re-fetch txs if inconsistency caused by needing to make multiple rpc calls
    for (let tx of txs) {
      if (tx.getIsConfirmed() && tx.getBlock() === undefined || !tx.getIsConfirmed() && tx.getBlock() !== undefined) {
        if (maxAttempts <= 1) throw new _MoneroError.default("Unable to build consistent txs from multiple rpc calls");
        console.error("Inconsistency detected building txs from multiple rpc calls, re-fetching txs");
        return this.getTxsAux(queryNormalized, maxAttempts - 1);
      }
    }

    // order txs if tx hashes given then return
    if (queryNormalized.getHashes() && queryNormalized.getHashes().length > 0) {
      let txsById = new Map(); // store txs in temporary map for sorting
      for (let tx of txs) txsById.set(tx.getHash(), tx);
      let orderedTxs = [];
      for (let hash of queryNormalized.getHashes()) if (txsById.get(hash)) orderedTxs.push(txsById.get(hash));
      txs = orderedTxs;
    }
    return txs;
  }

  async getTransfers(query) {

    // copy and normalize query up to block
    const queryNormalized = _MoneroWallet.default.normalizeTransferQuery(query);

    // get transfers directly if query does not require tx context (other transfers, outputs)
    if (!MoneroWalletRpc.isContextual(queryNormalized)) return this.getTransfersAux(queryNormalized);

    // otherwise get txs with full models to fulfill query
    let transfers = [];
    for (let tx of await this.getTxs(queryNormalized.getTxQuery())) {
      for (let transfer of tx.filterTransfers(queryNormalized)) {
        transfers.push(transfer);
      }
    }

    return transfers;
  }

  async getOutputs(query) {

    // copy and normalize query up to block
    const queryNormalized = _MoneroWallet.default.normalizeOutputQuery(query);

    // get outputs directly if query does not require tx context (other outputs, transfers)
    if (!MoneroWalletRpc.isContextual(queryNormalized)) return this.getOutputsAux(queryNormalized);

    // otherwise get txs with full models to fulfill query
    let outputs = [];
    for (let tx of await this.getTxs(queryNormalized.getTxQuery())) {
      for (let output of tx.filterOutputs(queryNormalized)) {
        outputs.push(output);
      }
    }

    return outputs;
  }

  async exportOutputs(all = false) {
    return (await this.config.getServer().sendJsonRequest("export_outputs", { all: all })).result.outputs_data_hex;
  }

  async importOutputs(outputsHex) {
    let resp = await this.config.getServer().sendJsonRequest("import_outputs", { outputs_data_hex: outputsHex });
    return resp.result.num_imported;
  }

  async exportKeyImages(all = false) {
    return await this.rpcExportKeyImages(all);
  }

  async importKeyImages(keyImages, offset = 0) {

    // convert key images to rpc parameter
    let rpcKeyImages = keyImages.map((keyImage) => ({ key_image: keyImage.getHex(), signature: keyImage.getSignature() }));

    // send request
    let resp = await this.config.getServer().sendJsonRequest("import_key_images", { signed_key_images: rpcKeyImages, offset: offset });

    // build and return result
    let importResult = new _MoneroKeyImageImportResult.default();
    importResult.setHeight(resp.result.height);
    importResult.setSpentAmount(BigInt(resp.result.spent));
    importResult.setUnspentAmount(BigInt(resp.result.unspent));
    return importResult;
  }

  async getNewKeyImagesFromLastImport() {
    return (await this.rpcExportKeyImages(false)).getKeyImages();
  }

  async freezeOutput(keyImage) {
    return this.config.getServer().sendJsonRequest("freeze", { key_image: keyImage });
  }

  async thawOutput(keyImage) {
    return this.config.getServer().sendJsonRequest("thaw", { key_image: keyImage });
  }

  async isOutputFrozen(keyImage) {
    let resp = await this.config.getServer().sendJsonRequest("frozen", { key_image: keyImage });
    return resp.result.frozen === true;
  }

  async getDefaultFeePriority() {
    let resp = await this.config.getServer().sendJsonRequest("get_default_fee_priority");
    return resp.result.priority;
  }

  async createTxs(config) {

    // validate, copy, and normalize config
    const configNormalized = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    if (configNormalized.getCanSplit() === undefined) configNormalized.setCanSplit(true);
    if (configNormalized.getRelay() === true && (await this.isMultisig())) throw new _MoneroError.default("Cannot relay multisig transaction until co-signed");

    // determine account and subaddresses to send from
    let accountIdx = configNormalized.getAccountIndex();
    if (accountIdx === undefined) throw new _MoneroError.default("Must provide the account index to send from");
    let subaddressIndices = configNormalized.getSubaddressIndices() === undefined ? undefined : configNormalized.getSubaddressIndices().slice(0); // fetch all or copy given indices

    // build config parameters
    let params = {};
    params.destinations = [];
    for (let destination of configNormalized.getDestinations()) {
      (0, _assert.default)(destination.getAddress(), "Destination address is not defined");
      (0, _assert.default)(destination.getAmount(), "Destination amount is not defined");
      params.destinations.push({ address: destination.getAddress(), amount: destination.getAmount().toString() });
    }
    if (configNormalized.getSubtractFeeFrom()) params.subtract_fee_from_outputs = configNormalized.getSubtractFeeFrom();
    params.account_index = accountIdx;
    params.subaddr_indices = subaddressIndices;
    params.payment_id = configNormalized.getPaymentId();
    params.do_not_relay = configNormalized.getRelay() !== true;
    (0, _assert.default)(configNormalized.getPriority() === undefined || configNormalized.getPriority() >= 0 && configNormalized.getPriority() <= 3);
    params.priority = configNormalized.getPriority();
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    if (configNormalized.getCanSplit()) params.get_tx_keys = true; // param to get tx key(s) depends if split
    else params.get_tx_key = true;

    // cannot apply subtractFeeFrom with `transfer_split` call
    if (configNormalized.getCanSplit() && configNormalized.getSubtractFeeFrom() && configNormalized.getSubtractFeeFrom().length > 0) {
      throw new _MoneroError.default("subtractfeefrom transfers cannot be split over multiple transactions yet");
    }

    // send request
    let result;
    try {
      let resp = await this.config.getServer().sendJsonRequest(configNormalized.getCanSplit() ? "transfer_split" : "transfer", params);
      result = resp.result;
    } catch (err) {
      if (err.message.indexOf("WALLET_RPC_ERROR_CODE_WRONG_ADDRESS") > -1) throw new _MoneroError.default("Invalid destination address");
      throw err;
    }

    // pre-initialize txs iff present. multisig and view-only wallets will have tx set without transactions
    let txs;
    let numTxs = configNormalized.getCanSplit() ? result.fee_list !== undefined ? result.fee_list.length : 0 : result.fee !== undefined ? 1 : 0;
    if (numTxs > 0) txs = [];
    let copyDestinations = numTxs === 1;
    for (let i = 0; i < numTxs; i++) {
      let tx = new _MoneroTxWallet.default();
      MoneroWalletRpc.initSentTxWallet(configNormalized, tx, copyDestinations);
      tx.getOutgoingTransfer().setAccountIndex(accountIdx);
      if (subaddressIndices !== undefined && subaddressIndices.length === 1) tx.getOutgoingTransfer().setSubaddressIndices(subaddressIndices);
      txs.push(tx);
    }

    // notify of changes
    if (configNormalized.getRelay()) await this.poll();

    // initialize tx set from rpc response with pre-initialized txs
    if (configNormalized.getCanSplit()) return MoneroWalletRpc.convertRpcSentTxsToTxSet(result, txs, configNormalized).getTxs();else
    return MoneroWalletRpc.convertRpcTxToTxSet(result, txs === undefined ? undefined : txs[0], true, configNormalized).getTxs();
  }

  async sweepOutput(config) {

    // normalize and validate config
    config = _MoneroWallet.default.normalizeSweepOutputConfig(config);

    // build request parameters
    let params = {};
    params.address = config.getDestinations()[0].getAddress();
    params.account_index = config.getAccountIndex();
    params.subaddr_indices = config.getSubaddressIndices();
    params.key_image = config.getKeyImage();
    params.do_not_relay = config.getRelay() !== true;
    (0, _assert.default)(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
    params.priority = config.getPriority();
    params.payment_id = config.getPaymentId();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;

    // send request
    let resp = await this.config.getServer().sendJsonRequest("sweep_single", params);
    let result = resp.result;

    // notify of changes
    if (config.getRelay()) await this.poll();

    // build and return tx
    let tx = MoneroWalletRpc.initSentTxWallet(config, undefined, true);
    MoneroWalletRpc.convertRpcTxToTxSet(result, tx, true, config);
    tx.getOutgoingTransfer().getDestinations()[0].setAmount(tx.getOutgoingTransfer().getAmount()); // initialize destination amount
    return tx;
  }

  async sweepUnlocked(config) {

    // validate and normalize config
    const configNormalized = _MoneroWallet.default.normalizeSweepUnlockedConfig(config);

    // determine account and subaddress indices to sweep; default to all with unlocked balance if not specified
    let indices = new Map(); // maps each account index to subaddress indices to sweep
    if (configNormalized.getAccountIndex() !== undefined) {
      if (configNormalized.getSubaddressIndices() !== undefined) {
        indices.set(configNormalized.getAccountIndex(), configNormalized.getSubaddressIndices());
      } else {
        let subaddressIndices = [];
        indices.set(configNormalized.getAccountIndex(), subaddressIndices);
        for (let subaddress of await this.getSubaddresses(configNormalized.getAccountIndex())) {
          if (subaddress.getUnlockedBalance() > 0n) subaddressIndices.push(subaddress.getIndex());
        }
      }
    } else {
      let accounts = await this.getAccounts(true);
      for (let account of accounts) {
        if (account.getUnlockedBalance() > 0n) {
          let subaddressIndices = [];
          indices.set(account.getIndex(), subaddressIndices);
          for (let subaddress of account.getSubaddresses()) {
            if (subaddress.getUnlockedBalance() > 0n) subaddressIndices.push(subaddress.getIndex());
          }
        }
      }
    }

    // sweep from each account and collect resulting tx sets
    let txs = [];
    for (let accountIdx of indices.keys()) {

      // copy and modify the original config
      let copy = configNormalized.copy();
      copy.setAccountIndex(accountIdx);
      copy.setSweepEachSubaddress(false);

      // sweep all subaddresses together  // TODO monero-project: can this reveal outputs belong to the same wallet?
      if (copy.getSweepEachSubaddress() !== true) {
        copy.setSubaddressIndices(indices.get(accountIdx));
        for (let tx of await this.rpcSweepAccount(copy)) txs.push(tx);
      }

      // otherwise sweep each subaddress individually
      else {
        for (let subaddressIdx of indices.get(accountIdx)) {
          copy.setSubaddressIndices([subaddressIdx]);
          for (let tx of await this.rpcSweepAccount(copy)) txs.push(tx);
        }
      }
    }

    // notify of changes
    if (configNormalized.getRelay()) await this.poll();
    return txs;
  }

  async sweepDust(relay) {
    if (relay === undefined) relay = false;
    let resp = await this.config.getServer().sendJsonRequest("sweep_dust", { do_not_relay: !relay });
    if (relay) await this.poll();
    let result = resp.result;
    let txSet = MoneroWalletRpc.convertRpcSentTxsToTxSet(result);
    if (txSet.getTxs() === undefined) return [];
    for (let tx of txSet.getTxs()) {
      tx.setIsRelayed(!relay);
      tx.setInTxPool(tx.getIsRelayed());
    }
    return txSet.getTxs();
  }

  async relayTxs(txsOrMetadatas) {
    (0, _assert.default)(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txHashes = [];
    for (let txOrMetadata of txsOrMetadatas) {
      let metadata = txOrMetadata instanceof _MoneroTxWallet.default ? txOrMetadata.getMetadata() : txOrMetadata;
      let resp = await this.config.getServer().sendJsonRequest("relay_tx", { hex: metadata });
      txHashes.push(resp.result.tx_hash);
    }
    await this.poll(); // notify of changes
    return txHashes;
  }

  async describeTxSet(txSet) {
    let resp = await this.config.getServer().sendJsonRequest("describe_transfer", {
      unsigned_txset: txSet.getUnsignedTxHex(),
      multisig_txset: txSet.getMultisigTxHex()
    });
    return MoneroWalletRpc.convertRpcDescribeTransfer(resp.result);
  }

  async signTxs(unsignedTxHex) {
    let resp = await this.config.getServer().sendJsonRequest("sign_transfer", {
      unsigned_txset: unsignedTxHex,
      export_raw: true,
      get_tx_keys: true
    });
    await this.poll();
    return MoneroWalletRpc.convertRpcSentTxsToTxSet(resp.result);
  }

  async submitTxs(signedTxHex) {
    let resp = await this.config.getServer().sendJsonRequest("submit_transfer", {
      tx_data_hex: signedTxHex
    });
    await this.poll();
    return resp.result.tx_hash_list;
  }

  async signMessage(message, signatureType = _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY, accountIdx = 0, subaddressIdx = 0) {
    let resp = await this.config.getServer().sendJsonRequest("sign", {
      data: message,
      signature_type: signatureType === _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY ? "spend" : "view",
      account_index: accountIdx,
      address_index: subaddressIdx
    });
    return resp.result.signature;
  }

  async verifyMessage(message, address, signature) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("verify", { data: message, address: address, signature: signature });
      let result = resp.result;
      return new _MoneroMessageSignatureResult.default(
        result.good ? { isGood: result.good, isOld: result.old, signatureType: result.signature_type === "view" ? _MoneroMessageSignatureType.default.SIGN_WITH_VIEW_KEY : _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY, version: result.version } : { isGood: false }
      );
    } catch (e) {
      if (e.getCode() === -2) return new _MoneroMessageSignatureResult.default({ isGood: false });
      throw e;
    }
  }

  async getTxKey(txHash) {
    try {
      return (await this.config.getServer().sendJsonRequest("get_tx_key", { txid: txHash })).result.tx_key;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async checkTxKey(txHash, txKey, address) {
    try {

      // send request
      let resp = await this.config.getServer().sendJsonRequest("check_tx_key", { txid: txHash, tx_key: txKey, address: address });

      // interpret result
      let check = new _MoneroCheckTx.default();
      check.setIsGood(true);
      check.setNumConfirmations(resp.result.confirmations);
      check.setInTxPool(resp.result.in_pool);
      check.setReceivedAmount(BigInt(resp.result.received));
      return check;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async getTxProof(txHash, address, message) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_tx_proof", { txid: txHash, address: address, message: message });
      return resp.result.signature;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async checkTxProof(txHash, address, message, signature) {
    try {

      // send request
      let resp = await this.config.getServer().sendJsonRequest("check_tx_proof", {
        txid: txHash,
        address: address,
        message: message,
        signature: signature
      });

      // interpret response
      let isGood = resp.result.good;
      let check = new _MoneroCheckTx.default();
      check.setIsGood(isGood);
      if (isGood) {
        check.setNumConfirmations(resp.result.confirmations);
        check.setInTxPool(resp.result.in_pool);
        check.setReceivedAmount(BigInt(resp.result.received));
      }
      return check;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -1 && e.message === "basic_string") e = new _MoneroRpcError.default("Must provide signature to check tx proof", -1);
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());
      throw e;
    }
  }

  async getSpendProof(txHash, message) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_spend_proof", { txid: txHash, message: message });
      return resp.result.signature;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async checkSpendProof(txHash, message, signature) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("check_spend_proof", {
        txid: txHash,
        message: message,
        signature: signature
      });
      return resp.result.good;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async getReserveProofWallet(message) {
    let resp = await this.config.getServer().sendJsonRequest("get_reserve_proof", {
      all: true,
      message: message
    });
    return resp.result.signature;
  }

  async getReserveProofAccount(accountIdx, amount, message) {
    let resp = await this.config.getServer().sendJsonRequest("get_reserve_proof", {
      account_index: accountIdx,
      amount: amount.toString(),
      message: message
    });
    return resp.result.signature;
  }

  async checkReserveProof(address, message, signature) {

    // send request
    let resp = await this.config.getServer().sendJsonRequest("check_reserve_proof", {
      address: address,
      message: message,
      signature: signature
    });

    // interpret results
    let isGood = resp.result.good;
    let check = new _MoneroCheckReserve.default();
    check.setIsGood(isGood);
    if (isGood) {
      check.setUnconfirmedSpentAmount(BigInt(resp.result.spent));
      check.setTotalAmount(BigInt(resp.result.total));
    }
    return check;
  }

  async getTxNotes(txHashes) {
    return (await this.config.getServer().sendJsonRequest("get_tx_notes", { txids: txHashes })).result.notes;
  }

  async setTxNotes(txHashes, notes) {
    await this.config.getServer().sendJsonRequest("set_tx_notes", { txids: txHashes, notes: notes });
  }

  async getAddressBookEntries(entryIndices) {
    let resp = await this.config.getServer().sendJsonRequest("get_address_book", { entries: entryIndices });
    if (!resp.result.entries) return [];
    let entries = [];
    for (let rpcEntry of resp.result.entries) {
      entries.push(new _MoneroAddressBookEntry.default().setIndex(rpcEntry.index).setAddress(rpcEntry.address).setDescription(rpcEntry.description).setPaymentId(rpcEntry.payment_id));
    }
    return entries;
  }

  async addAddressBookEntry(address, description) {
    let resp = await this.config.getServer().sendJsonRequest("add_address_book", { address: address, description: description });
    return resp.result.index;
  }

  async editAddressBookEntry(index, setAddress, address, setDescription, description) {
    let resp = await this.config.getServer().sendJsonRequest("edit_address_book", {
      index: index,
      set_address: setAddress,
      address: address,
      set_description: setDescription,
      description: description
    });
  }

  async deleteAddressBookEntry(entryIdx) {
    await this.config.getServer().sendJsonRequest("delete_address_book", { index: entryIdx });
  }

  async tagAccounts(tag, accountIndices) {
    await this.config.getServer().sendJsonRequest("tag_accounts", { tag: tag, accounts: accountIndices });
  }

  async untagAccounts(accountIndices) {
    await this.config.getServer().sendJsonRequest("untag_accounts", { accounts: accountIndices });
  }

  async getAccountTags() {
    let tags = [];
    let resp = await this.config.getServer().sendJsonRequest("get_account_tags");
    if (resp.result.account_tags) {
      for (let rpcAccountTag of resp.result.account_tags) {
        tags.push(new _MoneroAccountTag.default({
          tag: rpcAccountTag.tag ? rpcAccountTag.tag : undefined,
          label: rpcAccountTag.label ? rpcAccountTag.label : undefined,
          accountIndices: rpcAccountTag.accounts
        }));
      }
    }
    return tags;
  }

  async setAccountTagLabel(tag, label) {
    await this.config.getServer().sendJsonRequest("set_account_tag_description", { tag: tag, description: label });
  }

  async getPaymentUri(config) {
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    let resp = await this.config.getServer().sendJsonRequest("make_uri", {
      address: config.getDestinations()[0].getAddress(),
      amount: config.getDestinations()[0].getAmount() ? config.getDestinations()[0].getAmount().toString() : undefined,
      payment_id: config.getPaymentId(),
      recipient_name: config.getRecipientName(),
      tx_description: config.getNote()
    });
    return resp.result.uri;
  }

  async parsePaymentUri(uri) {
    (0, _assert.default)(uri, "Must provide URI to parse");
    let resp = await this.config.getServer().sendJsonRequest("parse_uri", { uri: uri });
    let config = new _MoneroTxConfig.default({ address: resp.result.uri.address, amount: BigInt(resp.result.uri.amount) });
    config.setPaymentId(resp.result.uri.payment_id);
    config.setRecipientName(resp.result.uri.recipient_name);
    config.setNote(resp.result.uri.tx_description);
    if ("" === config.getDestinations()[0].getAddress()) config.getDestinations()[0].setAddress(undefined);
    if ("" === config.getPaymentId()) config.setPaymentId(undefined);
    if ("" === config.getRecipientName()) config.setRecipientName(undefined);
    if ("" === config.getNote()) config.setNote(undefined);
    return config;
  }

  async getAttribute(key) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_attribute", { key: key });
      return resp.result.value === "" ? undefined : resp.result.value;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -45) return undefined;
      throw e;
    }
  }

  async setAttribute(key, val) {
    await this.config.getServer().sendJsonRequest("set_attribute", { key: key, value: val });
  }

  async startMining(numThreads, backgroundMining, ignoreBattery) {
    await this.config.getServer().sendJsonRequest("start_mining", {
      threads_count: numThreads,
      do_background_mining: backgroundMining,
      ignore_battery: ignoreBattery
    });
  }

  async stopMining() {
    await this.config.getServer().sendJsonRequest("stop_mining");
  }

  async isMultisigImportNeeded() {
    let resp = await this.config.getServer().sendJsonRequest("get_balance");
    return resp.result.multisig_import_needed === true;
  }

  async getMultisigInfo() {
    let resp = await this.config.getServer().sendJsonRequest("is_multisig");
    let result = resp.result;
    let info = new _MoneroMultisigInfo.default();
    info.setIsMultisig(result.multisig);
    info.setIsReady(result.ready);
    info.setThreshold(result.threshold);
    info.setNumParticipants(result.total);
    return info;
  }

  async prepareMultisig() {
    let resp = await this.config.getServer().sendJsonRequest("prepare_multisig", { enable_multisig_experimental: true });
    this.addressCache = {};
    let result = resp.result;
    return result.multisig_info;
  }

  async makeMultisig(multisigHexes, threshold, password) {
    let resp = await this.config.getServer().sendJsonRequest("make_multisig", {
      multisig_info: multisigHexes,
      threshold: threshold,
      password: password
    });
    this.addressCache = {};
    return resp.result.multisig_info;
  }

  async exchangeMultisigKeys(multisigHexes, password) {
    let resp = await this.config.getServer().sendJsonRequest("exchange_multisig_keys", { multisig_info: multisigHexes, password: password });
    this.addressCache = {};
    let msResult = new _MoneroMultisigInitResult.default();
    msResult.setAddress(resp.result.address);
    msResult.setMultisigHex(resp.result.multisig_info);
    if (msResult.getAddress().length === 0) msResult.setAddress(undefined);
    if (msResult.getMultisigHex().length === 0) msResult.setMultisigHex(undefined);
    return msResult;
  }

  async exportMultisigHex() {
    let resp = await this.config.getServer().sendJsonRequest("export_multisig_info");
    return resp.result.info;
  }

  async importMultisigHex(multisigHexes, refreshAfterImport) {
    if (refreshAfterImport === undefined) refreshAfterImport = true;
    if (!_GenUtils.default.isArray(multisigHexes)) throw new _MoneroError.default("Must provide string[] to importMultisigHex()");
    let resp = await this.config.getServer().sendJsonRequest("import_multisig_info", { info: multisigHexes, refresh_after_import: refreshAfterImport });
    return resp.result.n_outputs;
  }

  async signMultisigTxHex(multisigTxHex) {
    let resp = await this.config.getServer().sendJsonRequest("sign_multisig", { tx_data_hex: multisigTxHex });
    let result = resp.result;
    let signResult = new _MoneroMultisigSignResult.default();
    signResult.setSignedMultisigTxHex(result.tx_data_hex);
    signResult.setTxHashes(result.tx_hash_list);
    return signResult;
  }

  async submitMultisigTxHex(signedMultisigTxHex) {
    let resp = await this.config.getServer().sendJsonRequest("submit_multisig", { tx_data_hex: signedMultisigTxHex });
    return resp.result.tx_hash_list;
  }

  async changePassword(oldPassword, newPassword) {
    return this.config.getServer().sendJsonRequest("change_wallet_password", { old_password: oldPassword || "", new_password: newPassword || "" });
  }

  async save() {
    await this.config.getServer().sendJsonRequest("store");
  }

  async close(save = false) {
    await super.close(save);
    if (save === undefined) save = false;
    await this.clear();
    await this.config.getServer().sendJsonRequest("close_wallet", { autosave_current: save });
  }

  async isClosed() {
    try {
      await this.getPrimaryAddress();
    } catch (e) {
      return e instanceof _MoneroRpcError.default && e.getCode() === -13 && e.message.indexOf("No wallet file") > -1;
    }
    return false;
  }

  /**
   * Save and close the current wallet and stop the RPC server.
   * 
   * @return {Promise<void>}
   */
  async stop() {
    await this.clear();
    await this.config.getServer().sendJsonRequest("stop_wallet");
  }

  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  async getNumBlocksToUnlock() {return super.getNumBlocksToUnlock();}
  async getTx(txHash) {return super.getTx(txHash);}
  async getIncomingTransfers(query) {return super.getIncomingTransfers(query);}
  async getOutgoingTransfers(query) {return super.getOutgoingTransfers(query);}
  async createTx(config) {return super.createTx(config);}
  async relayTx(txOrMetadata) {return super.relayTx(txOrMetadata);}
  async getTxNote(txHash) {return super.getTxNote(txHash);}
  async setTxNote(txHash, note) {return super.setTxNote(txHash, note);}

  // -------------------------------- PRIVATE ---------------------------------

  static async connectToWalletRpc(uriOrConfig, username, password) {
    let config = MoneroWalletRpc.normalizeConfig(uriOrConfig, username, password);
    if (config.cmd) return MoneroWalletRpc.startWalletRpcProcess(config);else
    return new MoneroWalletRpc(config);
  }

  static async startWalletRpcProcess(config) {
    (0, _assert.default)(_GenUtils.default.isArray(config.cmd), "Must provide string array with command line parameters");

    // start process
    let child_process = await Promise.resolve().then(() => _interopRequireWildcard(require("child_process")));
    const childProcess = child_process.spawn(config.cmd[0], config.cmd.slice(1), {
      env: { ...process.env, LANG: 'en_US.UTF-8' } // scrape output in english
    });
    childProcess.stdout.setEncoding('utf8');
    childProcess.stderr.setEncoding('utf8');

    // return promise which resolves after starting monero-wallet-rpc
    let uri;
    let that = this;
    let output = "";
    try {
      return await new Promise(function (resolve, reject) {

        // handle stdout
        childProcess.stdout.on('data', async function (data) {
          let line = data.toString();
          _LibraryUtils.default.log(2, line);
          output += line + '\n'; // capture output in case of error

          // extract uri from e.g. "I Binding on 127.0.0.1 (IPv4):38085"
          let uriLineContains = "Binding on ";
          let uriLineContainsIdx = line.indexOf(uriLineContains);
          if (uriLineContainsIdx >= 0) {
            let host = line.substring(uriLineContainsIdx + uriLineContains.length, line.lastIndexOf(' '));
            let unformattedLine = line.replace(/\u001b\[.*?m/g, '').trim(); // remove color formatting
            let port = unformattedLine.substring(unformattedLine.lastIndexOf(':') + 1);
            let sslIdx = config.cmd.indexOf("--rpc-ssl");
            let sslEnabled = sslIdx >= 0 ? "enabled" == config.cmd[sslIdx + 1].toLowerCase() : false;
            uri = (sslEnabled ? "https" : "http") + "://" + host + ":" + port;
          }

          // read success message
          if (line.indexOf("Starting wallet RPC server") >= 0) {

            // get username, password, zmq publish uri, and proxy uri from params
            let userPassIdx = config.cmd.indexOf("--rpc-login");
            let userPass = userPassIdx >= 0 ? config.cmd[userPassIdx + 1] : undefined;
            let username = userPass === undefined ? undefined : userPass.substring(0, userPass.indexOf(':'));
            let password = userPass === undefined ? undefined : userPass.substring(userPass.indexOf(':') + 1);
            let zmqUriIdx = config.cmd.indexOf("--zmq-pub");
            let zmqUri = zmqUriIdx >= 0 ? config.cmd[zmqUriIdx + 1] : undefined;
            let proxyUriIdx = config.cmd.indexOf("--proxy");
            this.startupProxyUri = proxyUriIdx >= 0 ? config.cmd[proxyUriIdx + 1] : undefined;

            // create client connected to internal process
            config = config.copy().setServer({ uri: uri, username: username, password: password, zmqUri: zmqUri, proxyUri: this.startupProxyUri, rejectUnauthorized: config.getServer() ? config.getServer().getRejectUnauthorized() : undefined });
            config.cmd = undefined;
            let wallet = await MoneroWalletRpc.connectToWalletRpc(config);
            wallet.process = childProcess;

            // resolve promise with client connected to internal process 
            this.isResolved = true;
            resolve(wallet);
          }
        });

        // handle stderr
        childProcess.stderr.on('data', function (data) {
          if (_LibraryUtils.default.getLogLevel() >= 2) console.error(data);
        });

        // handle exit
        childProcess.on("exit", function (code) {
          if (!this.isResolved) reject(new _MoneroError.default("monero-wallet-rpc process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
        });

        // handle error
        childProcess.on("error", function (err) {
          if (err.message.indexOf("ENOENT") >= 0) reject(new _MoneroError.default("monero-wallet-rpc does not exist at path '" + config.cmd[0] + "'"));
          if (!this.isResolved) reject(err);
        });

        // handle uncaught exception
        childProcess.on("uncaughtException", function (err, origin) {
          console.error("Uncaught exception in monero-wallet-rpc process: " + err.message);
          console.error(origin);
          if (!this.isResolved) reject(err);
        });
      });
    } catch (err) {
      throw new _MoneroError.default(err.message);
    }
  }

  async clear() {
    this.refreshListening();
    delete this.addressCache;
    this.addressCache = {};
    this.path = undefined;
  }

  async getAccountIndices(getSubaddressIndices) {
    let indices = new Map();
    for (let account of await this.getAccounts()) {
      indices.set(account.getIndex(), getSubaddressIndices ? await this.getSubaddressIndices(account.getIndex()) : undefined);
    }
    return indices;
  }

  async getSubaddressIndices(accountIdx) {
    let subaddressIndices = [];
    let resp = await this.config.getServer().sendJsonRequest("get_address", { account_index: accountIdx });
    for (let address of resp.result.addresses) subaddressIndices.push(address.address_index);
    return subaddressIndices;
  }

  async getTransfersAux(query) {

    // build params for get_transfers rpc call
    let txQuery = query.getTxQuery();
    let canBeConfirmed = txQuery.getIsConfirmed() !== false && txQuery.getInTxPool() !== true && txQuery.getIsFailed() !== true && txQuery.getIsRelayed() !== false;
    let canBeInTxPool = txQuery.getIsConfirmed() !== true && txQuery.getInTxPool() !== false && txQuery.getIsFailed() !== true && txQuery.getHeight() === undefined && txQuery.getMaxHeight() === undefined && txQuery.getIsLocked() !== false;
    let canBeIncoming = query.getIsIncoming() !== false && query.getIsOutgoing() !== true && query.getHasDestinations() !== true;
    let canBeOutgoing = query.getIsOutgoing() !== false && query.getIsIncoming() !== true;

    // check if fetching pool txs contradicted by configuration
    if (txQuery.getInTxPool() === true && !canBeInTxPool) {
      throw new _MoneroError.default("Cannot fetch pool transactions because it contradicts configuration");
    }

    let params = {};
    params.in = canBeIncoming && canBeConfirmed;
    params.out = canBeOutgoing && canBeConfirmed;
    params.pool = canBeIncoming && canBeInTxPool;
    params.pending = canBeOutgoing && canBeInTxPool;
    params.failed = txQuery.getIsFailed() !== false && txQuery.getIsConfirmed() !== true && txQuery.getInTxPool() != true;
    if (txQuery.getMinHeight() !== undefined) {
      if (txQuery.getMinHeight() > 0) params.min_height = txQuery.getMinHeight() - 1; // TODO monero-project: wallet2::get_payments() min_height is exclusive, so manually offset to match intended range (issues #5751, #5598)
      else params.min_height = txQuery.getMinHeight();
    }
    if (txQuery.getMaxHeight() !== undefined) params.max_height = txQuery.getMaxHeight();
    params.filter_by_height = txQuery.getMinHeight() !== undefined || txQuery.getMaxHeight() !== undefined;
    if (query.getAccountIndex() === undefined) {
      (0, _assert.default)(query.getSubaddressIndex() === undefined && query.getSubaddressIndices() === undefined, "Query specifies a subaddress index but not an account index");
      params.all_accounts = true;
    } else {
      params.account_index = query.getAccountIndex();

      // set subaddress indices param
      let subaddressIndices = new Set();
      if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
      if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map((subaddressIdx) => subaddressIndices.add(subaddressIdx));
      if (subaddressIndices.size) params.subaddr_indices = Array.from(subaddressIndices);
    }

    // cache unique txs and blocks
    let txMap = {};
    let blockMap = {};

    // build txs using `get_transfers`
    let resp = await this.config.getServer().sendJsonRequest("get_transfers", params);
    for (let key of Object.keys(resp.result)) {
      for (let rpcTx of resp.result[key]) {
        //if (rpcTx.txid === query.debugTxId) console.log(rpcTx);
        let tx = MoneroWalletRpc.convertRpcTxWithTransfer(rpcTx);
        if (tx.getIsConfirmed()) (0, _assert.default)(tx.getBlock().getTxs().indexOf(tx) > -1);

        // replace transfer amount with destination sum
        // TODO monero-wallet-rpc: confirmed tx from/to same account has amount 0 but cached transfers
        if (tx.getOutgoingTransfer() !== undefined && tx.getIsRelayed() && !tx.getIsFailed() &&
        tx.getOutgoingTransfer().getDestinations() && tx.getOutgoingAmount() === 0n) {
          let outgoingTransfer = tx.getOutgoingTransfer();
          let transferTotal = BigInt(0);
          for (let destination of outgoingTransfer.getDestinations()) transferTotal = transferTotal + destination.getAmount();
          tx.getOutgoingTransfer().setAmount(transferTotal);
        }

        // merge tx
        MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
      }
    }

    // sort txs by block height
    let txs = Object.values(txMap);
    txs.sort(MoneroWalletRpc.compareTxsByHeight);

    // filter and return transfers
    let transfers = [];
    for (let tx of txs) {

      // tx is not incoming/outgoing unless already set
      if (tx.getIsIncoming() === undefined) tx.setIsIncoming(false);
      if (tx.getIsOutgoing() === undefined) tx.setIsOutgoing(false);

      // sort incoming transfers
      if (tx.getIncomingTransfers() !== undefined) tx.getIncomingTransfers().sort(MoneroWalletRpc.compareIncomingTransfers);

      // collect queried transfers, erase if excluded
      for (let transfer of tx.filterTransfers(query)) {
        transfers.push(transfer);
      }

      // remove txs without requested transfer
      if (tx.getBlock() !== undefined && tx.getOutgoingTransfer() === undefined && tx.getIncomingTransfers() === undefined) {
        tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
      }
    }

    return transfers;
  }

  async getOutputsAux(query) {

    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (query.getAccountIndex() !== undefined) {
      let subaddressIndices = new Set();
      if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
      if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map((subaddressIdx) => subaddressIndices.add(subaddressIdx));
      indices.set(query.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : undefined); // undefined will fetch from all subaddresses
    } else {
      _assert.default.equal(query.getSubaddressIndex(), undefined, "Query specifies a subaddress index but not an account index");
      (0, _assert.default)(query.getSubaddressIndices() === undefined || query.getSubaddressIndices().length === 0, "Query specifies subaddress indices but not an account index");
      indices = await this.getAccountIndices(); // fetch all account indices without subaddresses
    }

    // cache unique txs and blocks
    let txMap = {};
    let blockMap = {};

    // collect txs with outputs for each indicated account using `incoming_transfers` rpc call
    let params = {};
    params.transfer_type = query.getIsSpent() === true ? "unavailable" : query.getIsSpent() === false ? "available" : "all";
    params.verbose = true;
    for (let accountIdx of indices.keys()) {

      // send request
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.getServer().sendJsonRequest("incoming_transfers", params);

      // convert response to txs with outputs and merge
      if (resp.result.transfers === undefined) continue;
      for (let rpcOutput of resp.result.transfers) {
        let tx = MoneroWalletRpc.convertRpcTxWithOutput(rpcOutput);
        MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
      }
    }

    // sort txs by block height
    let txs = Object.values(txMap);
    txs.sort(MoneroWalletRpc.compareTxsByHeight);

    // collect queried outputs
    let outputs = [];
    for (let tx of txs) {

      // sort outputs
      if (tx.getOutputs() !== undefined) tx.getOutputs().sort(MoneroWalletRpc.compareOutputs);

      // collect queried outputs, erase if excluded
      for (let output of tx.filterOutputs(query)) outputs.push(output);

      // remove excluded txs from block
      if (tx.getOutputs() === undefined && tx.getBlock() !== undefined) {
        tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
      }
    }
    return outputs;
  }

  /**
   * Common method to get key images.
   * 
   * @param all - pecifies to get all xor only new images from last import
   * @return {MoneroKeyImageExportResult} the key images and their offset among the wallet's outputs
   */
  async rpcExportKeyImages(all) {
    let resp = await this.config.getServer().sendJsonRequest("export_key_images", { all: all });
    let keyImages = (resp.result.signed_key_images || []).map((rpcImage) => new _MoneroKeyImage.default(rpcImage.key_image, rpcImage.signature));
    return new _MoneroKeyImageExportResult.default().setOffset(resp.result.offset).setKeyImages(keyImages);
  }

  async rpcSweepAccount(config) {

    // validate config
    if (config === undefined) throw new _MoneroError.default("Must provide sweep config");
    if (config.getAccountIndex() === undefined) throw new _MoneroError.default("Must provide an account index to sweep from");
    if (config.getDestinations() === undefined || config.getDestinations().length != 1) throw new _MoneroError.default("Must provide exactly one destination to sweep to");
    if (config.getDestinations()[0].getAddress() === undefined) throw new _MoneroError.default("Must provide destination address to sweep to");
    if (config.getDestinations()[0].getAmount() !== undefined) throw new _MoneroError.default("Cannot specify amount in sweep config");
    if (config.getKeyImage() !== undefined) throw new _MoneroError.default("Key image defined; use sweepOutput() to sweep an output by its key image");
    if (config.getSubaddressIndices() !== undefined && config.getSubaddressIndices().length === 0) throw new _MoneroError.default("Empty list given for subaddresses indices to sweep");
    if (config.getSweepEachSubaddress()) throw new _MoneroError.default("Cannot sweep each subaddress with RPC `sweep_all`");
    if (config.getSubtractFeeFrom() !== undefined && config.getSubtractFeeFrom().length > 0) throw new _MoneroError.default("Sweeping output does not support subtracting fees from destinations");

    // sweep from all subaddresses if not otherwise defined
    if (config.getSubaddressIndices() === undefined) {
      config.setSubaddressIndices([]);
      for (let subaddress of await this.getSubaddresses(config.getAccountIndex())) {
        config.getSubaddressIndices().push(subaddress.getIndex());
      }
    }
    if (config.getSubaddressIndices().length === 0) throw new _MoneroError.default("No subaddresses to sweep from");

    // common config params
    let params = {};
    let relay = config.getRelay() === true;
    params.account_index = config.getAccountIndex();
    params.subaddr_indices = config.getSubaddressIndices();
    params.address = config.getDestinations()[0].getAddress();
    (0, _assert.default)(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
    params.priority = config.getPriority();
    params.payment_id = config.getPaymentId();
    params.do_not_relay = !relay;
    params.below_amount = config.getBelowAmount();
    params.get_tx_keys = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;

    // invoke wallet rpc `sweep_all`
    let resp = await this.config.getServer().sendJsonRequest("sweep_all", params);
    let result = resp.result;

    // initialize txs from response
    let txSet = MoneroWalletRpc.convertRpcSentTxsToTxSet(result, undefined, config);

    // initialize remaining known fields
    for (let tx of txSet.getTxs()) {
      tx.setIsLocked(true);
      tx.setIsConfirmed(false);
      tx.setNumConfirmations(0);
      tx.setRelay(relay);
      tx.setInTxPool(relay);
      tx.setIsRelayed(relay);
      tx.setIsMinerTx(false);
      tx.setIsFailed(false);
      let transfer = tx.getOutgoingTransfer();
      transfer.setAccountIndex(config.getAccountIndex());
      if (config.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(config.getSubaddressIndices());
      let destination = new _MoneroDestination.default(config.getDestinations()[0].getAddress(), BigInt(transfer.getAmount()));
      transfer.setDestinations([destination]);
      tx.setOutgoingTransfer(transfer);
      tx.setPaymentId(config.getPaymentId());
      if (tx.getUnlockTime() === undefined) tx.setUnlockTime(0n);
      if (tx.getRelay()) {
        if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime()); // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
        if (tx.getIsDoubleSpendSeen() === undefined) tx.setIsDoubleSpendSeen(false);
      }
    }
    return txSet.getTxs();
  }

  refreshListening() {
    if (this.walletPoller == undefined && this.listeners.length) this.walletPoller = new WalletPoller(this);
    if (this.walletPoller !== undefined) this.walletPoller.setIsPolling(this.listeners.length > 0);
  }

  /**
   * Poll if listening.
   */
  async poll() {
    if (this.walletPoller !== undefined && this.walletPoller.isPolling) await this.walletPoller.poll();
  }

  // ---------------------------- PRIVATE STATIC ------------------------------

  static normalizeConfig(uriOrConfig, username, password) {
    let config = undefined;
    if (typeof uriOrConfig === "string" || uriOrConfig.uri) config = new _MoneroWalletConfig.default({ server: new _MoneroRpcConnection.default(uriOrConfig, username, password) });else
    if (_GenUtils.default.isArray(uriOrConfig)) config = new _MoneroWalletConfig.default({ cmd: uriOrConfig });else
    config = new _MoneroWalletConfig.default(uriOrConfig);
    if (config.proxyToWorker === undefined) config.proxyToWorker = true;
    return config;
  }

  /**
   * Remove criteria which requires looking up other transfers/outputs to
   * fulfill query.
   * 
   * @param {MoneroTxQuery} query - the query to decontextualize
   * @return {MoneroTxQuery} a reference to the query for convenience
   */
  static decontextualize(query) {
    query.setIsIncoming(undefined);
    query.setIsOutgoing(undefined);
    query.setTransferQuery(undefined);
    query.setInputQuery(undefined);
    query.setOutputQuery(undefined);
    return query;
  }

  static isContextual(query) {
    if (!query) return false;
    if (!query.getTxQuery()) return false;
    if (query.getTxQuery().getIsIncoming() !== undefined) return true; // requires getting other transfers
    if (query.getTxQuery().getIsOutgoing() !== undefined) return true;
    if (query instanceof _MoneroTransferQuery.default) {
      if (query.getTxQuery().getOutputQuery() !== undefined) return true; // requires getting other outputs
    } else if (query instanceof _MoneroOutputQuery.default) {
      if (query.getTxQuery().getTransferQuery() !== undefined) return true; // requires getting other transfers
    } else {
      throw new _MoneroError.default("query must be tx or transfer query");
    }
    return false;
  }

  static convertRpcAccount(rpcAccount) {
    let account = new _MoneroAccount.default();
    for (let key of Object.keys(rpcAccount)) {
      let val = rpcAccount[key];
      if (key === "account_index") account.setIndex(val);else
      if (key === "balance") account.setBalance(BigInt(val));else
      if (key === "unlocked_balance") account.setUnlockedBalance(BigInt(val));else
      if (key === "base_address") account.setPrimaryAddress(val);else
      if (key === "tag") account.setTag(val);else
      if (key === "label") {} // label belongs to first subaddress
      else console.log("WARNING: ignoring unexpected account field: " + key + ": " + val);
    }
    if ("" === account.getTag()) account.setTag(undefined);
    return account;
  }

  static convertRpcSubaddress(rpcSubaddress) {
    let subaddress = new _MoneroSubaddress.default();
    for (let key of Object.keys(rpcSubaddress)) {
      let val = rpcSubaddress[key];
      if (key === "account_index") subaddress.setAccountIndex(val);else
      if (key === "address_index") subaddress.setIndex(val);else
      if (key === "address") subaddress.setAddress(val);else
      if (key === "balance") subaddress.setBalance(BigInt(val));else
      if (key === "unlocked_balance") subaddress.setUnlockedBalance(BigInt(val));else
      if (key === "num_unspent_outputs") subaddress.setNumUnspentOutputs(val);else
      if (key === "label") {if (val) subaddress.setLabel(val);} else
      if (key === "used") subaddress.setIsUsed(val);else
      if (key === "blocks_to_unlock") subaddress.setNumBlocksToUnlock(val);else
      if (key == "time_to_unlock") {} // ignoring
      else console.log("WARNING: ignoring unexpected subaddress field: " + key + ": " + val);
    }
    return subaddress;
  }

  /**
   * Initializes a sent transaction.
   * 
   * TODO: remove copyDestinations after >18.3.1 when subtractFeeFrom fully supported
   * 
   * @param {MoneroTxConfig} config - send config
   * @param {MoneroTxWallet} [tx] - existing transaction to initialize (optional)
   * @param {boolean} copyDestinations - copies config destinations if true
   * @return {MoneroTxWallet} is the initialized send tx
   */
  static initSentTxWallet(config, tx, copyDestinations) {
    if (!tx) tx = new _MoneroTxWallet.default();
    let relay = config.getRelay() === true;
    tx.setIsOutgoing(true);
    tx.setIsConfirmed(false);
    tx.setNumConfirmations(0);
    tx.setInTxPool(relay);
    tx.setRelay(relay);
    tx.setIsRelayed(relay);
    tx.setIsMinerTx(false);
    tx.setIsFailed(false);
    tx.setIsLocked(true);
    tx.setRingSize(_MoneroUtils.default.RING_SIZE);
    let transfer = new _MoneroOutgoingTransfer.default();
    transfer.setTx(tx);
    if (config.getSubaddressIndices() && config.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(config.getSubaddressIndices().slice(0)); // we know src subaddress indices iff config specifies 1
    if (copyDestinations) {
      let destCopies = [];
      for (let dest of config.getDestinations()) destCopies.push(dest.copy());
      transfer.setDestinations(destCopies);
    }
    tx.setOutgoingTransfer(transfer);
    tx.setPaymentId(config.getPaymentId());
    if (tx.getUnlockTime() === undefined) tx.setUnlockTime(0n);
    if (config.getRelay()) {
      if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime()); // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
      if (tx.getIsDoubleSpendSeen() === undefined) tx.setIsDoubleSpendSeen(false);
    }
    return tx;
  }

  /**
   * Initializes a tx set from a RPC map excluding txs.
   * 
   * @param rpcMap - map to initialize the tx set from
   * @return MoneroTxSet - initialized tx set
   * @return the resulting tx set
   */
  static convertRpcTxSet(rpcMap) {
    let txSet = new _MoneroTxSet.default();
    txSet.setMultisigTxHex(rpcMap.multisig_txset);
    txSet.setUnsignedTxHex(rpcMap.unsigned_txset);
    txSet.setSignedTxHex(rpcMap.signed_txset);
    if (txSet.getMultisigTxHex() !== undefined && txSet.getMultisigTxHex().length === 0) txSet.setMultisigTxHex(undefined);
    if (txSet.getUnsignedTxHex() !== undefined && txSet.getUnsignedTxHex().length === 0) txSet.setUnsignedTxHex(undefined);
    if (txSet.getSignedTxHex() !== undefined && txSet.getSignedTxHex().length === 0) txSet.setSignedTxHex(undefined);
    return txSet;
  }

  /**
   * Initializes a MoneroTxSet from a list of rpc txs.
   * 
   * @param rpcTxs - rpc txs to initialize the set from
   * @param txs - existing txs to further initialize (optional)
   * @param config - tx config
   * @return the converted tx set
   */
  static convertRpcSentTxsToTxSet(rpcTxs, txs, config) {

    // build shared tx set
    let txSet = MoneroWalletRpc.convertRpcTxSet(rpcTxs);

    // get number of txs
    let numTxs = rpcTxs.fee_list ? rpcTxs.fee_list.length : rpcTxs.tx_hash_list ? rpcTxs.tx_hash_list.length : 0;

    // done if rpc response contains no txs
    if (numTxs === 0) {
      _assert.default.equal(txs, undefined);
      return txSet;
    }

    // initialize txs if none given
    if (txs) txSet.setTxs(txs);else
    {
      txs = [];
      for (let i = 0; i < numTxs; i++) txs.push(new _MoneroTxWallet.default());
    }
    for (let tx of txs) {
      tx.setTxSet(txSet);
      tx.setIsOutgoing(true);
    }
    txSet.setTxs(txs);

    // initialize txs from rpc lists
    for (let key of Object.keys(rpcTxs)) {
      let val = rpcTxs[key];
      if (key === "tx_hash_list") for (let i = 0; i < val.length; i++) txs[i].setHash(val[i]);else
      if (key === "tx_key_list") for (let i = 0; i < val.length; i++) txs[i].setKey(val[i]);else
      if (key === "tx_blob_list" || key === "tx_raw_list") for (let i = 0; i < val.length; i++) txs[i].setFullHex(val[i]);else
      if (key === "tx_metadata_list") for (let i = 0; i < val.length; i++) txs[i].setMetadata(val[i]);else
      if (key === "fee_list") for (let i = 0; i < val.length; i++) txs[i].setFee(BigInt(val[i]));else
      if (key === "weight_list") for (let i = 0; i < val.length; i++) txs[i].setWeight(val[i]);else
      if (key === "amount_list") {
        for (let i = 0; i < val.length; i++) {
          if (txs[i].getOutgoingTransfer() == undefined) txs[i].setOutgoingTransfer(new _MoneroOutgoingTransfer.default().setTx(txs[i]));
          txs[i].getOutgoingTransfer().setAmount(BigInt(val[i]));
        }
      } else
      if (key === "multisig_txset" || key === "unsigned_txset" || key === "signed_txset") {} // handled elsewhere
      else if (key === "spent_key_images_list") {
        let inputKeyImagesList = val;
        for (let i = 0; i < inputKeyImagesList.length; i++) {
          _GenUtils.default.assertTrue(txs[i].getInputs() === undefined);
          txs[i].setInputs([]);
          for (let inputKeyImage of inputKeyImagesList[i]["key_images"]) {
            txs[i].getInputs().push(new _MoneroOutputWallet.default().setKeyImage(new _MoneroKeyImage.default().setHex(inputKeyImage)).setTx(txs[i]));
          }
        }
      } else
      if (key === "amounts_by_dest_list") {
        let amountsByDestList = val;
        let destinationIdx = 0;
        for (let txIdx = 0; txIdx < amountsByDestList.length; txIdx++) {
          let amountsByDest = amountsByDestList[txIdx]["amounts"];
          if (txs[txIdx].getOutgoingTransfer() === undefined) txs[txIdx].setOutgoingTransfer(new _MoneroOutgoingTransfer.default().setTx(txs[txIdx]));
          txs[txIdx].getOutgoingTransfer().setDestinations([]);
          for (let amount of amountsByDest) {
            if (config.getDestinations().length === 1) txs[txIdx].getOutgoingTransfer().getDestinations().push(new _MoneroDestination.default(config.getDestinations()[0].getAddress(), BigInt(amount))); // sweeping can create multiple txs with one address
            else txs[txIdx].getOutgoingTransfer().getDestinations().push(new _MoneroDestination.default(config.getDestinations()[destinationIdx++].getAddress(), BigInt(amount)));
          }
        }
      } else
      console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }

    return txSet;
  }

  /**
   * Converts a rpc tx with a transfer to a tx set with a tx and transfer.
   * 
   * @param rpcTx - rpc tx to build from
   * @param tx - existing tx to continue initializing (optional)
   * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @param config - tx config
   * @return the initialized tx set with a tx
   */
  static convertRpcTxToTxSet(rpcTx, tx, isOutgoing, config) {
    let txSet = MoneroWalletRpc.convertRpcTxSet(rpcTx);
    txSet.setTxs([MoneroWalletRpc.convertRpcTxWithTransfer(rpcTx, tx, isOutgoing, config).setTxSet(txSet)]);
    return txSet;
  }

  /**
   * Builds a MoneroTxWallet from a RPC tx.
   * 
   * @param rpcTx - rpc tx to build from
   * @param tx - existing tx to continue initializing (optional)
   * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @param config - tx config
   * @return {MoneroTxWallet} is the initialized tx
   */
  static convertRpcTxWithTransfer(rpcTx, tx, isOutgoing, config) {// TODO: change everything to safe set

    // initialize tx to return
    if (!tx) tx = new _MoneroTxWallet.default();

    // initialize tx state from rpc type
    if (rpcTx.type !== undefined) isOutgoing = MoneroWalletRpc.decodeRpcType(rpcTx.type, tx);else
    _assert.default.equal(typeof isOutgoing, "boolean", "Must indicate if tx is outgoing (true) xor incoming (false) since unknown");

    // TODO: safe set
    // initialize remaining fields  TODO: seems this should be part of common function with DaemonRpc.convertRpcTx
    let header;
    let transfer;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "txid") tx.setHash(val);else
      if (key === "tx_hash") tx.setHash(val);else
      if (key === "fee") tx.setFee(BigInt(val));else
      if (key === "note") {if (val) tx.setNote(val);} else
      if (key === "tx_key") tx.setKey(val);else
      if (key === "type") {} // type already handled
      else if (key === "tx_size") tx.setSize(val);else
      if (key === "unlock_time") tx.setUnlockTime(val);else
      if (key === "weight") tx.setWeight(val);else
      if (key === "locked") tx.setIsLocked(val);else
      if (key === "tx_blob") tx.setFullHex(val);else
      if (key === "tx_metadata") tx.setMetadata(val);else
      if (key === "double_spend_seen") tx.setIsDoubleSpendSeen(val);else
      if (key === "block_height" || key === "height") {
        if (tx.getIsConfirmed()) {
          if (!header) header = new _MoneroBlockHeader.default();
          header.setHeight(val);
        }
      } else
      if (key === "timestamp") {
        if (tx.getIsConfirmed()) {
          if (!header) header = new _MoneroBlockHeader.default();
          header.setTimestamp(val);
        } else {

          // timestamp of unconfirmed tx is current request time
        }} else
      if (key === "confirmations") tx.setNumConfirmations(val);else
      if (key === "suggested_confirmations_threshold") {
        if (transfer === undefined) transfer = (isOutgoing ? new _MoneroOutgoingTransfer.default() : new _MoneroIncomingTransfer.default()).setTx(tx);
        if (!isOutgoing) transfer.setNumSuggestedConfirmations(val);
      } else
      if (key === "amount") {
        if (transfer === undefined) transfer = (isOutgoing ? new _MoneroOutgoingTransfer.default() : new _MoneroIncomingTransfer.default()).setTx(tx);
        transfer.setAmount(BigInt(val));
      } else
      if (key === "amounts") {} // ignoring, amounts sum to amount
      else if (key === "address") {
        if (!isOutgoing) {
          if (!transfer) transfer = new _MoneroIncomingTransfer.default().setTx(tx);
          transfer.setAddress(val);
        }
      } else
      if (key === "payment_id") {
        if ("" !== val && _MoneroTxWallet.default.DEFAULT_PAYMENT_ID !== val) tx.setPaymentId(val); // default is undefined
      } else
      if (key === "subaddr_index") (0, _assert.default)(rpcTx.subaddr_indices); // handled by subaddr_indices
      else if (key === "subaddr_indices") {
        if (!transfer) transfer = (isOutgoing ? new _MoneroOutgoingTransfer.default() : new _MoneroIncomingTransfer.default()).setTx(tx);
        let rpcIndices = val;
        transfer.setAccountIndex(rpcIndices[0].major);
        if (isOutgoing) {
          let subaddressIndices = [];
          for (let rpcIndex of rpcIndices) subaddressIndices.push(rpcIndex.minor);
          transfer.setSubaddressIndices(subaddressIndices);
        } else {
          _assert.default.equal(rpcIndices.length, 1);
          transfer.setSubaddressIndex(rpcIndices[0].minor);
        }
      } else
      if (key === "destinations" || key == "recipients") {
        (0, _assert.default)(isOutgoing);
        let destinations = [];
        for (let rpcDestination of val) {
          let destination = new _MoneroDestination.default();
          destinations.push(destination);
          for (let destinationKey of Object.keys(rpcDestination)) {
            if (destinationKey === "address") destination.setAddress(rpcDestination[destinationKey]);else
            if (destinationKey === "amount") destination.setAmount(BigInt(rpcDestination[destinationKey]));else
            throw new _MoneroError.default("Unrecognized transaction destination field: " + destinationKey);
          }
        }
        if (transfer === undefined) transfer = new _MoneroOutgoingTransfer.default({ tx: tx });
        transfer.setDestinations(destinations);
      } else
      if (key === "sources") {
        _GenUtils.default.assertTrue(tx.getInputs() === undefined);
        tx.setInputs([]);
        for (let rpcSource of val) {
          let input = new _MoneroOutputWallet.default().setTx(tx);
          input.setAmount(BigInt(rpcSource.amount));
          input.setIndex(rpcSource.global_index);
          if (rpcSource.pubkey !== undefined) input.setStealthPublicKey(rpcSource.pubkey.substring(0, 64)); // dest key of dest||mask
          tx.getInputs().push(input);
        }
      } else
      if (key === "multisig_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
      else if (key === "unsigned_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
      else if (key === "amount_in") tx.setInputSum(BigInt(val));else
      if (key === "amount_out") tx.setOutputSum(BigInt(val));else
      if (key === "change_address") tx.setChangeAddress(val === "" ? undefined : val);else
      if (key === "change_amount") tx.setChangeAmount(BigInt(val));else
      if (key === "dummy_outputs") tx.setNumDummyOutputs(val);else
      if (key === "extra") tx.setExtraHex(val);else
      if (key === "ring_size") tx.setRingSize(val);else
      if (key === "spent_key_images") {
        let inputKeyImages = val.key_images;
        _GenUtils.default.assertTrue(tx.getInputs() === undefined);
        tx.setInputs([]);
        for (let inputKeyImage of inputKeyImages) {
          tx.getInputs().push(new _MoneroOutputWallet.default().setKeyImage(new _MoneroKeyImage.default().setHex(inputKeyImage)).setTx(tx));
        }
      } else
      if (key === "amounts_by_dest") {
        _GenUtils.default.assertTrue(isOutgoing);
        let amountsByDest = val.amounts;
        _assert.default.equal(config.getDestinations().length, amountsByDest.length);
        if (transfer === undefined) transfer = new _MoneroOutgoingTransfer.default().setTx(tx);
        transfer.setDestinations([]);
        for (let i = 0; i < config.getDestinations().length; i++) {
          transfer.getDestinations().push(new _MoneroDestination.default(config.getDestinations()[i].getAddress(), BigInt(amountsByDest[i])));
        }
      } else
      console.log("WARNING: ignoring unexpected transaction field with transfer: " + key + ": " + val);
    }

    // link block and tx
    if (header) tx.setBlock(new _MoneroBlock.default(header).setTxs([tx]));

    // initialize final fields
    if (transfer) {
      if (tx.getIsConfirmed() === undefined) tx.setIsConfirmed(false);
      if (!transfer.getTx().getIsConfirmed()) tx.setNumConfirmations(0);
      if (isOutgoing) {
        tx.setIsOutgoing(true);
        if (tx.getOutgoingTransfer()) {
          if (transfer.getDestinations()) tx.getOutgoingTransfer().setDestinations(undefined); // overwrite to avoid reconcile error TODO: remove after >18.3.1 when amounts_by_dest supported
          tx.getOutgoingTransfer().merge(transfer);
        } else
        tx.setOutgoingTransfer(transfer);
      } else {
        tx.setIsIncoming(true);
        tx.setIncomingTransfers([transfer]);
      }
    }

    // return initialized transaction
    return tx;
  }

  static convertRpcTxWithOutput(rpcOutput) {

    // initialize tx
    let tx = new _MoneroTxWallet.default();
    tx.setIsConfirmed(true);
    tx.setInTxPool(false);
    tx.setIsRelayed(true);
    tx.setIsFailed(false);

    // initialize output
    let output = new _MoneroOutputWallet.default({ tx: tx });
    for (let key of Object.keys(rpcOutput)) {
      let val = rpcOutput[key];
      if (key === "amount") output.setAmount(BigInt(val));else
      if (key === "spent") output.setIsSpent(val);else
      if (key === "key_image") {if ("" !== val) output.setKeyImage(new _MoneroKeyImage.default(val));} else
      if (key === "global_index") output.setIndex(val);else
      if (key === "tx_hash") tx.setHash(val);else
      if (key === "unlocked") tx.setIsLocked(!val);else
      if (key === "frozen") output.setIsFrozen(val);else
      if (key === "pubkey") output.setStealthPublicKey(val);else
      if (key === "subaddr_index") {
        output.setAccountIndex(val.major);
        output.setSubaddressIndex(val.minor);
      } else
      if (key === "block_height") tx.setBlock(new _MoneroBlock.default().setHeight(val).setTxs([tx]));else
      console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }

    // initialize tx with output
    tx.setOutputs([output]);
    return tx;
  }

  static convertRpcDescribeTransfer(rpcDescribeTransferResult) {
    let txSet = new _MoneroTxSet.default();
    for (let key of Object.keys(rpcDescribeTransferResult)) {
      let val = rpcDescribeTransferResult[key];
      if (key === "desc") {
        txSet.setTxs([]);
        for (let txMap of val) {
          let tx = MoneroWalletRpc.convertRpcTxWithTransfer(txMap, undefined, true);
          tx.setTxSet(txSet);
          txSet.getTxs().push(tx);
        }
      } else
      if (key === "summary") {} // TODO: support tx set summary fields?
      else console.log("WARNING: ignoring unexpected descdribe transfer field: " + key + ": " + val);
    }
    return txSet;
  }

  /**
   * Decodes a "type" from monero-wallet-rpc to initialize type and state
   * fields in the given transaction.
   * 
   * TODO: these should be safe set
   * 
   * @param rpcType is the type to decode
   * @param tx is the transaction to decode known fields to
   * @return {boolean} true if the rpc type indicates outgoing xor incoming
   */
  static decodeRpcType(rpcType, tx) {
    let isOutgoing;
    if (rpcType === "in") {
      isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "out") {
      isOutgoing = true;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "pool") {
      isOutgoing = false;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false); // TODO: but could it be?
    } else if (rpcType === "pending") {
      isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "block") {
      isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(true);
    } else if (rpcType === "failed") {
      isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(false);
      tx.setIsRelayed(false);
      tx.setRelay(true);
      tx.setIsFailed(true);
      tx.setIsMinerTx(false);
    } else {
      throw new _MoneroError.default("Unrecognized transfer type: " + rpcType);
    }
    return isOutgoing;
  }

  /**
   * Merges a transaction into a unique set of transactions.
   *
   * @param {MoneroTxWallet} tx - the transaction to merge into the existing txs
   * @param {Object} txMap - maps tx hashes to txs
   * @param {Object} blockMap - maps block heights to blocks
   */
  static mergeTx(tx, txMap, blockMap) {
    (0, _assert.default)(tx.getHash() !== undefined);

    // merge tx
    let aTx = txMap[tx.getHash()];
    if (aTx === undefined) txMap[tx.getHash()] = tx; // cache new tx
    else aTx.merge(tx); // merge with existing tx

    // merge tx's block if confirmed
    if (tx.getHeight() !== undefined) {
      let aBlock = blockMap[tx.getHeight()];
      if (aBlock === undefined) blockMap[tx.getHeight()] = tx.getBlock(); // cache new block
      else aBlock.merge(tx.getBlock()); // merge with existing block
    }
  }

  /**
   * Compares two transactions by their height.
   */
  static compareTxsByHeight(tx1, tx2) {
    if (tx1.getHeight() === undefined && tx2.getHeight() === undefined) return 0; // both unconfirmed
    else if (tx1.getHeight() === undefined) return 1; // tx1 is unconfirmed
    else if (tx2.getHeight() === undefined) return -1; // tx2 is unconfirmed
    let diff = tx1.getHeight() - tx2.getHeight();
    if (diff !== 0) return diff;
    return tx1.getBlock().getTxs().indexOf(tx1) - tx2.getBlock().getTxs().indexOf(tx2); // txs are in the same block so retain their original order
  }

  /**
   * Compares two transfers by ascending account and subaddress indices.
   */
  static compareIncomingTransfers(t1, t2) {
    if (t1.getAccountIndex() < t2.getAccountIndex()) return -1;else
    if (t1.getAccountIndex() === t2.getAccountIndex()) return t1.getSubaddressIndex() - t2.getSubaddressIndex();
    return 1;
  }

  /**
   * Compares two outputs by ascending account and subaddress indices.
   */
  static compareOutputs(o1, o2) {

    // compare by height
    let heightComparison = MoneroWalletRpc.compareTxsByHeight(o1.getTx(), o2.getTx());
    if (heightComparison !== 0) return heightComparison;

    // compare by account index, subaddress index, output index, then key image hex
    let compare = o1.getAccountIndex() - o2.getAccountIndex();
    if (compare !== 0) return compare;
    compare = o1.getSubaddressIndex() - o2.getSubaddressIndex();
    if (compare !== 0) return compare;
    compare = o1.getIndex() - o2.getIndex();
    if (compare !== 0) return compare;
    return o1.getKeyImage().getHex().localeCompare(o2.getKeyImage().getHex());
  }
}

/**
 * Polls monero-wallet-rpc to provide listener notifications.
 * 
 * @private
 */exports.default = MoneroWalletRpc;
class WalletPoller {

  // instance variables











  constructor(wallet) {
    let that = this;
    this.wallet = wallet;
    this.looper = new _TaskLooper.default(async function () {await that.poll();});
    this.prevLockedTxs = [];
    this.prevUnconfirmedNotifications = new Set(); // tx hashes of previous notifications
    this.prevConfirmedNotifications = new Set(); // tx hashes of previously confirmed but not yet unlocked notifications
    this.threadPool = new _ThreadPool.default(1); // synchronize polls
    this.numPolling = 0;
  }

  setIsPolling(isPolling) {
    this.isPolling = isPolling;
    if (isPolling) this.looper.start(this.wallet.getSyncPeriodInMs());else
    this.looper.stop();
  }

  setPeriodInMs(periodInMs) {
    this.looper.setPeriodInMs(periodInMs);
  }

  async poll() {

    // skip if next poll is queued
    if (this.numPolling > 1) return;
    this.numPolling++;

    // synchronize polls
    let that = this;
    return this.threadPool.submit(async function () {
      try {

        // skip if wallet is closed
        if (await that.wallet.isClosed()) {
          that.numPolling--;
          return;
        }

        // take initial snapshot
        if (that.prevBalances === undefined) {
          that.prevHeight = await that.wallet.getHeight();
          that.prevLockedTxs = await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(true));
          that.prevBalances = await that.wallet.getBalances();
          that.numPolling--;
          return;
        }

        // announce height changes
        let height = await that.wallet.getHeight();
        if (that.prevHeight !== height) {
          for (let i = that.prevHeight; i < height; i++) await that.onNewBlock(i);
          that.prevHeight = height;
        }

        // get locked txs for comparison to previous
        let minHeight = Math.max(0, height - 70); // only monitor recent txs
        let lockedTxs = await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(true).setMinHeight(minHeight).setIncludeOutputs(true));

        // collect hashes of txs no longer locked
        let noLongerLockedHashes = [];
        for (let prevLockedTx of that.prevLockedTxs) {
          if (that.getTx(lockedTxs, prevLockedTx.getHash()) === undefined) {
            noLongerLockedHashes.push(prevLockedTx.getHash());
          }
        }

        // save locked txs for next comparison
        that.prevLockedTxs = lockedTxs;

        // fetch txs which are no longer locked
        let unlockedTxs = noLongerLockedHashes.length === 0 ? [] : await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(false).setMinHeight(minHeight).setHashes(noLongerLockedHashes).setIncludeOutputs(true));

        // announce new unconfirmed and confirmed outputs
        for (let lockedTx of lockedTxs) {
          let searchSet = lockedTx.getIsConfirmed() ? that.prevConfirmedNotifications : that.prevUnconfirmedNotifications;
          let unannounced = !searchSet.has(lockedTx.getHash());
          searchSet.add(lockedTx.getHash());
          if (unannounced) await that.notifyOutputs(lockedTx);
        }

        // announce new unlocked outputs
        for (let unlockedTx of unlockedTxs) {
          let missedConfirm = unlockedTx.getIsConfirmed() && !that.prevConfirmedNotifications.has(unlockedTx.getHash());
          that.prevUnconfirmedNotifications.delete(unlockedTx.getHash());
          that.prevConfirmedNotifications.delete(unlockedTx.getHash());
          if (missedConfirm) {// announce missed confirm transition if tx unlocked between polls
            let confirmedTx = unlockedTx.copy().setIsLocked(true);
            confirmedTx.setBlock(unlockedTx.getBlock().copy().setTxs([confirmedTx]));
            await that.notifyOutputs(confirmedTx);
          }
          await that.notifyOutputs(unlockedTx);
        }

        // announce balance changes
        await that.checkForChangedBalances();
        that.numPolling--;
      } catch (err) {
        that.numPolling--;
        if (that.isPolling) console.error("Failed to background poll wallet '" + (await that.wallet.getPath()) + "': " + err.message); // ignore errors from polls straggling after the wallet is closed
      }
    });
  }

  async onNewBlock(height) {
    await this.wallet.announceNewBlock(height);
  }

  async notifyOutputs(tx) {

    // notify spent outputs // TODO (monero-project): monero-wallet-rpc does not allow scrape of tx inputs so providing one input with outgoing amount
    if (tx.getOutgoingTransfer() !== undefined) {
      (0, _assert.default)(tx.getInputs() === undefined);
      let output = new _MoneroOutputWallet.default().
      setAmount(tx.getOutgoingTransfer().getAmount() + tx.getFee()).
      setAccountIndex(tx.getOutgoingTransfer().getAccountIndex()).
      setSubaddressIndex(tx.getOutgoingTransfer().getSubaddressIndices().length === 1 ? tx.getOutgoingTransfer().getSubaddressIndices()[0] : undefined) // initialize if transfer sourced from single subaddress
      .setTx(tx);
      tx.setInputs([output]);
      await this.wallet.announceOutputSpent(output);
    }

    // notify received outputs
    if (tx.getIncomingTransfers() !== undefined) {
      if (tx.getOutputs() !== undefined && tx.getOutputs().length > 0) {// TODO (monero-project): outputs only returned for confirmed txs
        for (let output of tx.getOutputs()) {
          await this.wallet.announceOutputReceived(output);
        }
      } else {// TODO (monero-project): monero-wallet-rpc does not allow scrape of unconfirmed received outputs so using incoming transfer values
        let outputs = [];
        for (let transfer of tx.getIncomingTransfers()) {
          outputs.push(new _MoneroOutputWallet.default().
          setAccountIndex(transfer.getAccountIndex()).
          setSubaddressIndex(transfer.getSubaddressIndex()).
          setAmount(transfer.getAmount()).
          setTx(tx));
        }
        tx.setOutputs(outputs);
        for (let output of tx.getOutputs()) {
          await this.wallet.announceOutputReceived(output);
        }
      }
    }
  }

  getTx(txs, txHash) {
    for (let tx of txs) if (txHash === tx.getHash()) return tx;
    return undefined;
  }

  async checkForChangedBalances() {
    let balances = await this.wallet.getBalances();
    if (balances[0] !== this.prevBalances[0] || balances[1] !== this.prevBalances[1]) {
      this.prevBalances = balances;
      await this.wallet.announceBalancesChanged(balances[0], balances[1]);
      return true;
    }
    return false;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJlIiwidCIsIldlYWtNYXAiLCJyIiwibiIsIl9fZXNNb2R1bGUiLCJvIiwiaSIsImYiLCJfX3Byb3RvX18iLCJkZWZhdWx0IiwiaGFzIiwiZ2V0Iiwic2V0IiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJNb25lcm9XYWxsZXRScGMiLCJNb25lcm9XYWxsZXQiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjb25maWciLCJhZGRyZXNzQ2FjaGUiLCJzeW5jUGVyaW9kSW5NcyIsImdldFByb2Nlc3MiLCJwcm9jZXNzIiwic3RvcFByb2Nlc3MiLCJmb3JjZSIsInVuZGVmaW5lZCIsIk1vbmVyb0Vycm9yIiwibGlzdGVuZXJzQ29weSIsIkdlblV0aWxzIiwiY29weUFycmF5IiwiZ2V0TGlzdGVuZXJzIiwibGlzdGVuZXIiLCJyZW1vdmVMaXN0ZW5lciIsImtpbGxQcm9jZXNzIiwiZ2V0UnBjQ29ubmVjdGlvbiIsImdldFNlcnZlciIsIm9wZW5XYWxsZXQiLCJwYXRoT3JDb25maWciLCJwYXNzd29yZCIsIk1vbmVyb1dhbGxldENvbmZpZyIsInBhdGgiLCJnZXRQYXRoIiwiZ2V0UmVndGVzdCIsInNlbmRKc29uUmVxdWVzdCIsImZpbGVuYW1lIiwiZ2V0UGFzc3dvcmQiLCJjbGVhciIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiY3JlYXRlV2FsbGV0IiwiY29uZmlnTm9ybWFsaXplZCIsImdldFNlZWQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRBY2NvdW50TG9va2FoZWFkIiwiZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCIsInNldFBhc3N3b3JkIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldEZyb21TZWVkIiwiY3JlYXRlV2FsbGV0RnJvbUtleXMiLCJjcmVhdGVXYWxsZXRSYW5kb20iLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldFNhdmVDdXJyZW50IiwiZ2V0TGFuZ3VhZ2UiLCJzZXRMYW5ndWFnZSIsIkRFRkFVTFRfTEFOR1VBR0UiLCJwYXJhbXMiLCJsYW5ndWFnZSIsImVyciIsImhhbmRsZUNyZWF0ZVdhbGxldEVycm9yIiwic2VlZCIsInNlZWRfb2Zmc2V0IiwiZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbCIsImdldElzTXVsdGlzaWciLCJyZXN0b3JlX2hlaWdodCIsImF1dG9zYXZlX2N1cnJlbnQiLCJzZXRSZXN0b3JlSGVpZ2h0IiwiYWRkcmVzcyIsInZpZXdrZXkiLCJzcGVuZGtleSIsIm5hbWUiLCJtZXNzYWdlIiwidG9Mb3dlckNhc2UiLCJpbmNsdWRlcyIsIk1vbmVyb1JwY0Vycm9yIiwiZ2V0Q29kZSIsImdldFJwY01ldGhvZCIsImdldFJwY1BhcmFtcyIsImlzVmlld09ubHkiLCJrZXlfdHlwZSIsInVyaU9yQ29ubmVjdGlvbiIsImlzVHJ1c3RlZCIsInNzbE9wdGlvbnMiLCJjb25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIlNzbE9wdGlvbnMiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwidHJ1c3RlZCIsInNzbF9zdXBwb3J0Iiwic3NsX3ByaXZhdGVfa2V5X3BhdGgiLCJnZXRQcml2YXRlS2V5UGF0aCIsInNzbF9jZXJ0aWZpY2F0ZV9wYXRoIiwiZ2V0Q2VydGlmaWNhdGVQYXRoIiwic3NsX2NhX2ZpbGUiLCJnZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUiLCJzc2xfYWxsb3dlZF9maW5nZXJwcmludHMiLCJnZXRBbGxvd2VkRmluZ2VycHJpbnRzIiwic3NsX2FsbG93X2FueV9jZXJ0IiwiZ2V0QWxsb3dBbnlDZXJ0IiwiZ2V0UHJveHlVcmkiLCJzdGFydHVwUHJveHlVcmkiLCJwcm94eSIsImlzU2FtZVByb3h5VXJpIiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJnZXRCYWxhbmNlcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYXNzZXJ0IiwiZXF1YWwiLCJiYWxhbmNlIiwiQmlnSW50IiwidW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudCIsImdldEFjY291bnRzIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImFjY291bnRfaW5kZXgiLCJhZGRyZXNzX2luZGljZXMiLCJyZXNwIiwicmVzdWx0IiwidW5sb2NrZWRfYmFsYW5jZSIsInBlcl9zdWJhZGRyZXNzIiwiYWRkTGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiaW5kZXhPZiIsImdldFZlcnNpb24iLCJNb25lcm9WZXJzaW9uIiwidmVyc2lvbiIsInJlbGVhc2UiLCJrZXkiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiZ2V0QWRkcmVzcyIsInN1YmFkZHJlc3NNYXAiLCJnZXRTdWJhZGRyZXNzZXMiLCJnZXRBZGRyZXNzSW5kZXgiLCJzdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsInNldEFjY291bnRJbmRleCIsImluZGV4IiwibWFqb3IiLCJzZXRJbmRleCIsIm1pbm9yIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJpbnRlZ3JhdGVkQWRkcmVzc1N0ciIsInN0YW5kYXJkX2FkZHJlc3MiLCJwYXltZW50X2lkIiwiaW50ZWdyYXRlZF9hZGRyZXNzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwic2V0U3RhbmRhcmRBZGRyZXNzIiwic2V0UGF5bWVudElkIiwic2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJnZXRIZWlnaHQiLCJoZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsInN0YXJ0X2hlaWdodCIsInBvbGwiLCJNb25lcm9TeW5jUmVzdWx0IiwiYmxvY2tzX2ZldGNoZWQiLCJyZWNlaXZlZF9tb25leSIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJblNlY29uZHMiLCJNYXRoIiwicm91bmQiLCJlbmFibGUiLCJwZXJpb2QiLCJ3YWxsZXRQb2xsZXIiLCJzZXRQZXJpb2RJbk1zIiwiZ2V0U3luY1BlcmlvZEluTXMiLCJzdG9wU3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsImxlbmd0aCIsInR4aWRzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsInNraXBCYWxhbmNlcyIsImFjY291bnRzIiwicnBjQWNjb3VudCIsInN1YmFkZHJlc3NfYWNjb3VudHMiLCJjb252ZXJ0UnBjQWNjb3VudCIsInNldFN1YmFkZHJlc3NlcyIsImdldEluZGV4IiwicHVzaCIsInNldEJhbGFuY2UiLCJzZXRVbmxvY2tlZEJhbGFuY2UiLCJzZXROdW1VbnNwZW50T3V0cHV0cyIsInNldE51bUJsb2Nrc1RvVW5sb2NrIiwiYWxsX2FjY291bnRzIiwicnBjU3ViYWRkcmVzcyIsImNvbnZlcnRScGNTdWJhZGRyZXNzIiwiZ2V0QWNjb3VudEluZGV4IiwidGd0U3ViYWRkcmVzcyIsImdldE51bVVuc3BlbnRPdXRwdXRzIiwiZ2V0QWNjb3VudCIsIkVycm9yIiwiY3JlYXRlQWNjb3VudCIsImxhYmVsIiwiTW9uZXJvQWNjb3VudCIsInByaW1hcnlBZGRyZXNzIiwic3ViYWRkcmVzc0luZGljZXMiLCJhZGRyZXNzX2luZGV4IiwibGlzdGlmeSIsInN1YmFkZHJlc3NlcyIsImFkZHJlc3NlcyIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiZ2V0U3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzZXRBZGRyZXNzIiwic2V0TGFiZWwiLCJzZXRJc1VzZWQiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJnZXRUeHMiLCJxdWVyeSIsImdldFR4c0F1eCIsIm1heEF0dGVtcHRzIiwicXVlcnlOb3JtYWxpemVkIiwibm9ybWFsaXplVHhRdWVyeSIsInRyYW5zZmVyUXVlcnkiLCJnZXRUcmFuc2ZlclF1ZXJ5IiwiaW5wdXRRdWVyeSIsImdldElucHV0UXVlcnkiLCJvdXRwdXRRdWVyeSIsImdldE91dHB1dFF1ZXJ5Iiwic2V0VHJhbnNmZXJRdWVyeSIsInNldElucHV0UXVlcnkiLCJzZXRPdXRwdXRRdWVyeSIsInRyYW5zZmVycyIsImdldFRyYW5zZmVyc0F1eCIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJzZXRUeFF1ZXJ5IiwiZGVjb250ZXh0dWFsaXplIiwiY29weSIsInR4cyIsInR4c1NldCIsIlNldCIsInRyYW5zZmVyIiwiZ2V0VHgiLCJhZGQiLCJ0eE1hcCIsImJsb2NrTWFwIiwidHgiLCJtZXJnZVR4IiwiZ2V0SW5jbHVkZU91dHB1dHMiLCJvdXRwdXRRdWVyeUF1eCIsIk1vbmVyb091dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImdldE91dHB1dHNBdXgiLCJvdXRwdXRUeHMiLCJvdXRwdXQiLCJ0eHNRdWVyaWVkIiwibWVldHNDcml0ZXJpYSIsImdldEJsb2NrIiwic3BsaWNlIiwiZ2V0SXNDb25maXJtZWQiLCJjb25zb2xlIiwiZXJyb3IiLCJnZXRIYXNoZXMiLCJ0eHNCeUlkIiwiTWFwIiwiZ2V0SGFzaCIsIm9yZGVyZWRUeHMiLCJoYXNoIiwiZ2V0VHJhbnNmZXJzIiwibm9ybWFsaXplVHJhbnNmZXJRdWVyeSIsImlzQ29udGV4dHVhbCIsImdldFR4UXVlcnkiLCJmaWx0ZXJUcmFuc2ZlcnMiLCJnZXRPdXRwdXRzIiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJmaWx0ZXJPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsIm91dHB1dHNfZGF0YV9oZXgiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsIm51bV9pbXBvcnRlZCIsImV4cG9ydEtleUltYWdlcyIsInJwY0V4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsIm9mZnNldCIsInJwY0tleUltYWdlcyIsIm1hcCIsImtleUltYWdlIiwia2V5X2ltYWdlIiwiZ2V0SGV4Iiwic2lnbmF0dXJlIiwiZ2V0U2lnbmF0dXJlIiwic2lnbmVkX2tleV9pbWFnZXMiLCJpbXBvcnRSZXN1bHQiLCJNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsInNldEhlaWdodCIsInNldFNwZW50QW1vdW50Iiwic3BlbnQiLCJzZXRVbnNwZW50QW1vdW50IiwidW5zcGVudCIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZ2V0S2V5SW1hZ2VzIiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiZnJvemVuIiwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5IiwicHJpb3JpdHkiLCJjcmVhdGVUeHMiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsInNldENhblNwbGl0IiwiZ2V0UmVsYXkiLCJpc011bHRpc2lnIiwiZ2V0U3ViYWRkcmVzc0luZGljZXMiLCJzbGljZSIsImRlc3RpbmF0aW9ucyIsImRlc3RpbmF0aW9uIiwiZ2V0RGVzdGluYXRpb25zIiwiZ2V0QW1vdW50IiwiYW1vdW50IiwidG9TdHJpbmciLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJzdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzIiwic3ViYWRkcl9pbmRpY2VzIiwiZ2V0UGF5bWVudElkIiwiZG9fbm90X3JlbGF5IiwiZ2V0UHJpb3JpdHkiLCJnZXRfdHhfaGV4IiwiZ2V0X3R4X21ldGFkYXRhIiwiZ2V0X3R4X2tleXMiLCJnZXRfdHhfa2V5IiwibnVtVHhzIiwiZmVlX2xpc3QiLCJmZWUiLCJjb3B5RGVzdGluYXRpb25zIiwiTW9uZXJvVHhXYWxsZXQiLCJpbml0U2VudFR4V2FsbGV0IiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInNldFN1YmFkZHJlc3NJbmRpY2VzIiwiY29udmVydFJwY1NlbnRUeHNUb1R4U2V0IiwiY29udmVydFJwY1R4VG9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJnZXRLZXlJbWFnZSIsInNldEFtb3VudCIsInN3ZWVwVW5sb2NrZWQiLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwiaW5kaWNlcyIsImtleXMiLCJzZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsInJwY1N3ZWVwQWNjb3VudCIsInN3ZWVwRHVzdCIsInJlbGF5IiwidHhTZXQiLCJzZXRJc1JlbGF5ZWQiLCJzZXRJblR4UG9vbCIsImdldElzUmVsYXllZCIsInJlbGF5VHhzIiwidHhzT3JNZXRhZGF0YXMiLCJBcnJheSIsImlzQXJyYXkiLCJ0eE9yTWV0YWRhdGEiLCJtZXRhZGF0YSIsImdldE1ldGFkYXRhIiwiaGV4IiwidHhfaGFzaCIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZF90eHNldCIsImdldFVuc2lnbmVkVHhIZXgiLCJtdWx0aXNpZ190eHNldCIsImdldE11bHRpc2lnVHhIZXgiLCJjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlciIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4IiwiZXhwb3J0X3JhdyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4IiwidHhfZGF0YV9oZXgiLCJ0eF9oYXNoX2xpc3QiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJkYXRhIiwic2lnbmF0dXJlX3R5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImdvb2QiLCJpc0dvb2QiLCJpc09sZCIsIm9sZCIsIlNJR05fV0lUSF9WSUVXX0tFWSIsImdldFR4S2V5IiwidHhIYXNoIiwidHhpZCIsInR4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrIiwiTW9uZXJvQ2hlY2tUeCIsInNldElzR29vZCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJjb25maXJtYXRpb25zIiwiaW5fcG9vbCIsInNldFJlY2VpdmVkQW1vdW50IiwicmVjZWl2ZWQiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJzZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50Iiwic2V0VG90YWxBbW91bnQiLCJ0b3RhbCIsImdldFR4Tm90ZXMiLCJub3RlcyIsInNldFR4Tm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwicnBjRW50cnkiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5Iiwic2V0RGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsInNldF9hZGRyZXNzIiwic2V0X2Rlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInRhZ3MiLCJhY2NvdW50X3RhZ3MiLCJycGNBY2NvdW50VGFnIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJyZWNpcGllbnRfbmFtZSIsImdldFJlY2lwaWVudE5hbWUiLCJ0eF9kZXNjcmlwdGlvbiIsImdldE5vdGUiLCJ1cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInNldFJlY2lwaWVudE5hbWUiLCJzZXROb3RlIiwiZ2V0QXR0cmlidXRlIiwidmFsdWUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInRocmVhZHNfY291bnQiLCJkb19iYWNrZ3JvdW5kX21pbmluZyIsImlnbm9yZV9iYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJtdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiZ2V0TXVsdGlzaWdJbmZvIiwiaW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsInNldElzTXVsdGlzaWciLCJtdWx0aXNpZyIsInNldElzUmVhZHkiLCJyZWFkeSIsInNldFRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldE51bVBhcnRpY2lwYW50cyIsInByZXBhcmVNdWx0aXNpZyIsIm11bHRpc2lnX2luZm8iLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJtc1Jlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsInNldE11bHRpc2lnSGV4IiwiZ2V0TXVsdGlzaWdIZXgiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4IiwicmVmcmVzaEFmdGVySW1wb3J0IiwicmVmcmVzaF9hZnRlcl9pbXBvcnQiLCJuX291dHB1dHMiLCJzaWduTXVsdGlzaWdUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJzaWduUmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0Iiwic2V0U2lnbmVkTXVsdGlzaWdUeEhleCIsInNldFR4SGFzaGVzIiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJvbGRfcGFzc3dvcmQiLCJuZXdfcGFzc3dvcmQiLCJzYXZlIiwiY2xvc2UiLCJpc0Nsb3NlZCIsInN0b3AiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiY3JlYXRlVHgiLCJyZWxheVR4IiwiZ2V0VHhOb3RlIiwic2V0VHhOb3RlIiwibm90ZSIsImNvbm5lY3RUb1dhbGxldFJwYyIsInVyaU9yQ29uZmlnIiwibm9ybWFsaXplQ29uZmlnIiwiY21kIiwic3RhcnRXYWxsZXRScGNQcm9jZXNzIiwiY2hpbGRfcHJvY2VzcyIsIlByb21pc2UiLCJyZXNvbHZlIiwidGhlbiIsImNoaWxkUHJvY2VzcyIsInNwYXduIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidGhhdCIsInJlamVjdCIsIm9uIiwibGluZSIsIkxpYnJhcnlVdGlscyIsImxvZyIsInVyaUxpbmVDb250YWlucyIsInVyaUxpbmVDb250YWluc0lkeCIsImhvc3QiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiem1xVXJpSWR4Iiwiem1xVXJpIiwicHJveHlVcmlJZHgiLCJwcm94eVVyaSIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsIndhbGxldCIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvZGUiLCJvcmlnaW4iLCJnZXRBY2NvdW50SW5kaWNlcyIsInR4UXVlcnkiLCJjYW5CZUNvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNGYWlsZWQiLCJjYW5CZUluVHhQb29sIiwiZ2V0TWF4SGVpZ2h0IiwiZ2V0SXNMb2NrZWQiLCJjYW5CZUluY29taW5nIiwiZ2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJnZXRIYXNEZXN0aW5hdGlvbnMiLCJjYW5CZU91dGdvaW5nIiwiaW4iLCJvdXQiLCJwb29sIiwicGVuZGluZyIsImZhaWxlZCIsImdldE1pbkhlaWdodCIsIm1pbl9oZWlnaHQiLCJtYXhfaGVpZ2h0IiwiZmlsdGVyX2J5X2hlaWdodCIsImdldFN1YmFkZHJlc3NJbmRleCIsInNpemUiLCJmcm9tIiwicnBjVHgiLCJjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIiLCJnZXRPdXRnb2luZ0Ftb3VudCIsIm91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlclRvdGFsIiwidmFsdWVzIiwic29ydCIsImNvbXBhcmVUeHNCeUhlaWdodCIsInNldElzSW5jb21pbmciLCJzZXRJc091dGdvaW5nIiwiY29tcGFyZUluY29taW5nVHJhbnNmZXJzIiwidHJhbnNmZXJfdHlwZSIsImdldElzU3BlbnQiLCJ2ZXJib3NlIiwicnBjT3V0cHV0IiwiY29udmVydFJwY1R4V2l0aE91dHB1dCIsImNvbXBhcmVPdXRwdXRzIiwicnBjSW1hZ2UiLCJNb25lcm9LZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0Iiwic2V0T2Zmc2V0Iiwic2V0S2V5SW1hZ2VzIiwiYmVsb3dfYW1vdW50IiwiZ2V0QmVsb3dBbW91bnQiLCJzZXRJc0xvY2tlZCIsInNldElzQ29uZmlybWVkIiwic2V0UmVsYXkiLCJzZXRJc01pbmVyVHgiLCJzZXRJc0ZhaWxlZCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwic2V0RGVzdGluYXRpb25zIiwic2V0T3V0Z29pbmdUcmFuc2ZlciIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwiZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsIkRhdGUiLCJnZXRUaW1lIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRJc0RvdWJsZVNwZW5kU2VlbiIsImxpc3RlbmVycyIsIldhbGxldFBvbGxlciIsInNldElzUG9sbGluZyIsImlzUG9sbGluZyIsInNlcnZlciIsInByb3h5VG9Xb3JrZXIiLCJzZXRQcmltYXJ5QWRkcmVzcyIsInNldFRhZyIsImdldFRhZyIsInNldFJpbmdTaXplIiwiTW9uZXJvVXRpbHMiLCJSSU5HX1NJWkUiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwic2V0VHgiLCJkZXN0Q29waWVzIiwiZGVzdCIsImNvbnZlcnRScGNUeFNldCIsInJwY01hcCIsIk1vbmVyb1R4U2V0Iiwic2V0TXVsdGlzaWdUeEhleCIsInNldFVuc2lnbmVkVHhIZXgiLCJzZXRTaWduZWRUeEhleCIsInNpZ25lZF90eHNldCIsImdldFNpZ25lZFR4SGV4IiwicnBjVHhzIiwic2V0VHhzIiwic2V0VHhTZXQiLCJzZXRIYXNoIiwic2V0S2V5Iiwic2V0RnVsbEhleCIsInNldE1ldGFkYXRhIiwic2V0RmVlIiwic2V0V2VpZ2h0IiwiaW5wdXRLZXlJbWFnZXNMaXN0IiwiYXNzZXJ0VHJ1ZSIsImdldElucHV0cyIsInNldElucHV0cyIsImlucHV0S2V5SW1hZ2UiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRLZXlJbWFnZSIsInNldEhleCIsImFtb3VudHNCeURlc3RMaXN0IiwiZGVzdGluYXRpb25JZHgiLCJ0eElkeCIsImFtb3VudHNCeURlc3QiLCJpc091dGdvaW5nIiwidHlwZSIsImRlY29kZVJwY1R5cGUiLCJoZWFkZXIiLCJzZXRTaXplIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJzZXRUaW1lc3RhbXAiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwic2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyIsIkRFRkFVTFRfUEFZTUVOVF9JRCIsInJwY0luZGljZXMiLCJycGNJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInJwY0Rlc3RpbmF0aW9uIiwiZGVzdGluYXRpb25LZXkiLCJycGNTb3VyY2UiLCJpbnB1dCIsImdsb2JhbF9pbmRleCIsInB1YmtleSIsInNldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRJbnB1dFN1bSIsInNldE91dHB1dFN1bSIsInNldENoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBbW91bnQiLCJzZXROdW1EdW1teU91dHB1dHMiLCJzZXRFeHRyYUhleCIsImlucHV0S2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsImFtb3VudHMiLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwibWVyZ2UiLCJzZXRJbmNvbWluZ1RyYW5zZmVycyIsInNldElzU3BlbnQiLCJzZXRJc0Zyb3plbiIsInNldE91dHB1dHMiLCJycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0IiwicnBjVHlwZSIsImFUeCIsImFCbG9jayIsInR4MSIsInR4MiIsImRpZmYiLCJ0MSIsInQyIiwibzEiLCJvMiIsImhlaWdodENvbXBhcmlzb24iLCJjb21wYXJlIiwibG9jYWxlQ29tcGFyZSIsImV4cG9ydHMiLCJsb29wZXIiLCJUYXNrTG9vcGVyIiwicHJldkxvY2tlZFR4cyIsInByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyIsInRocmVhZFBvb2wiLCJUaHJlYWRQb29sIiwibnVtUG9sbGluZyIsInN0YXJ0IiwicGVyaW9kSW5NcyIsInN1Ym1pdCIsInByZXZCYWxhbmNlcyIsInByZXZIZWlnaHQiLCJNb25lcm9UeFF1ZXJ5Iiwib25OZXdCbG9jayIsIm1pbkhlaWdodCIsIm1heCIsImxvY2tlZFR4cyIsInNldE1pbkhlaWdodCIsInNldEluY2x1ZGVPdXRwdXRzIiwibm9Mb25nZXJMb2NrZWRIYXNoZXMiLCJwcmV2TG9ja2VkVHgiLCJ1bmxvY2tlZFR4cyIsInNldEhhc2hlcyIsImxvY2tlZFR4Iiwic2VhcmNoU2V0IiwidW5hbm5vdW5jZWQiLCJub3RpZnlPdXRwdXRzIiwidW5sb2NrZWRUeCIsIm1pc3NlZENvbmZpcm0iLCJkZWxldGUiLCJjb25maXJtZWRUeCIsImNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzIiwiYW5ub3VuY2VOZXdCbG9jayIsImdldEZlZSIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwiYmFsYW5jZXMiLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4uL2NvbW1vbi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgU3NsT3B0aW9ucyBmcm9tIFwiLi4vY29tbW9uL1NzbE9wdGlvbnNcIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYXMgYSBjbGllbnQgb2YgbW9uZXJvLXdhbGxldC1ycGMuXG4gKiBcbiAqIEBpbXBsZW1lbnRzIHtNb25lcm9XYWxsZXR9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldFJwYyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgPSAyMDAwMDsgLy8gZGVmYXVsdCBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtcyAoZGVmaW5lZCBieSBERUZBVUxUX0FVVE9fUkVGUkVTSF9QRVJJT0QgaW4gd2FsbGV0X3JwY19zZXJ2ZXIuY3BwKVxuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz47XG4gIHByb3RlY3RlZCBhZGRyZXNzQ2FjaGU6IGFueTtcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW107XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBkYWVtb25Db25uZWN0aW9uOiBNb25lcm9ScGNDb25uZWN0aW9uO1xuICBwcm90ZWN0ZWQgd2FsbGV0UG9sbGVyOiBXYWxsZXRQb2xsZXI7XG4gIHByb3RlY3RlZCBzdGFydHVwUHJveHlVcmk6IHN0cmluZztcbiAgXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTsgLy8gYXZvaWQgdW5lY2Vzc2FyeSByZXF1ZXN0cyBmb3IgYWRkcmVzc2VzXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUlBDIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiAge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkodGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZH0gdGhlIHdhbGxldCdzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBnZXRScGNDb25uZWN0aW9uKCk6IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPk9wZW4gYW4gZXhpc3Rpbmcgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+XG4gICAqIGF3YWl0IHdhbGxldC5vcGVuV2FsbGV0KFwibXl3YWxsZXQxXCIsIFwic3VwZXJzZWNyZXRwYXNzd29yZFwiKTs8YnI+XG4gICAqIDxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXQyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogXCJodHRwOi8vbG9jYWhvc3Q6MzgwODFcIiwgLy8gb3Igb2JqZWN0IHdpdGggdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGV0YyA8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlPGJyPlxuICAgKiB9KTs8YnI+XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1dhbGxldENvbmZpZ30gcGF0aE9yQ29uZmlnICAtIHRoZSB3YWxsZXQncyBuYW1lIG9yIGNvbmZpZ3VyYXRpb24gdG8gb3BlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aE9yQ29uZmlnLnBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGFzc3dvcmQgLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSBwYXRoT3JDb25maWcuc2VydmVyIC0gdXJpIG9yIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gdGhlIHdhbGxldCdzIHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0UnBjPn0gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBvcGVuV2FsbGV0KHBhdGhPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+LCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh0eXBlb2YgcGF0aE9yQ29uZmlnID09PSBcInN0cmluZ1wiID8ge3BhdGg6IHBhdGhPckNvbmZpZywgcGFzc3dvcmQ6IHBhc3N3b3JkID8gcGFzc3dvcmQgOiBcIlwifSA6IHBhdGhPckNvbmZpZyk7XG4gICAgLy8gVE9ETzogZW5zdXJlIG90aGVyIGZpZWxkcyB1bmluaXRpYWxpemVkP1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IG9uIHJwYyBzZXJ2ZXJcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBuYW1lIG9mIHdhbGxldCB0byBvcGVuXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIG9wZW5pbmcgUlBDIHdhbGxldFwiKVxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9wZW5fd2FsbGV0XCIsIHtmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpfSk7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyIG9yIHNlcnZlclxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSAhPSBudWxsKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSAhPSBudWxsKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnLmdldFNlcnZlcigpKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5DcmVhdGUgYW5kIG9wZW4gYSB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48cD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogJnNvbDsmc29sOyBjb25zdHJ1Y3QgY2xpZW50IHRvIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBsZXQgd2FsbGV0UnBjID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+PGJyPlxuICAgKiBcbiAgICogJnNvbDsmc29sOyBjcmVhdGUgYW5kIG9wZW4gd2FsbGV0IG9uIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBhd2FpdCB3YWxsZXRScGMuY3JlYXRlV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0XCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMThsPGJyPlxuICAgKiB9KTtcbiAgICogIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuaXNNdWx0aXNpZ10gLSByZXN0b3JlIG11bHRpc2lnIHdhbGxldCBmcm9tIHNlZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gdG8gYSBtb25lcm8gZGFlbW9uIChvcHRpb25hbCk8YnI+XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVyaV0gLSB1cmkgb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3Qgc2VsZi1zaWduZWQgc2VydmVyIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0cyB0byB0cnVlKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgZXF1aXZhbGVudCBKUyBvYmplY3QgcHJvdmlkaW5nIGRhZW1vbiBjb25maWd1cmF0aW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnNhdmVDdXJyZW50XSAtIHNwZWNpZmllcyBpZiB0aGUgY3VycmVudCBSUEMgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldFJwY30gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXRcIilcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXROZXR3b3JrVHlwZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIG5ldHdvcmtUeXBlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldCBiZWNhdXNlIHNlcnZlcidzIG5ldHdvcmsgdHlwZSBpcyBhbHJlYWR5IHNldFwiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50TG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGNyZWF0aW5nIHdhbGxldHMgd2l0aCBzdWJhZGRyZXNzIGxvb2thaGVhZCBvdmVyIHJwY1wiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0UGFzc3dvcmQoXCJcIik7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWdOb3JtYWxpemVkLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWdOb3JtYWxpemVkKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkN1cnJlbnQgd2FsbGV0IGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTmFtZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0TGFuZ3VhZ2UoKSkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICBsZXQgcGFyYW1zID0geyBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLCBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCkgfTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX3dhbGxldFwiLCBwYXJhbXMpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzdG9yZV9kZXRlcm1pbmlzdGljX3dhbGxldFwiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIHNlZWQ6IGNvbmZpZy5nZXRTZWVkKCksXG4gICAgICAgIHNlZWRfb2Zmc2V0OiBjb25maWcuZ2V0U2VlZE9mZnNldCgpLFxuICAgICAgICBlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiBjb25maWcuZ2V0SXNNdWx0aXNpZygpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZW5lcmF0ZV9mcm9tX2tleXNcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBhZGRyZXNzOiBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSxcbiAgICAgICAgdmlld2tleTogY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCksXG4gICAgICAgIHNwZW5ka2V5OiBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBoYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihuYW1lLCBlcnIpIHtcbiAgICBpZiAoZXJyLm1lc3NhZ2UpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYWxyZWFkeSBleGlzdHNcIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcIndvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJJbnZhbGlkIG1uZW1vbmljXCIsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwge2tleV90eXBlOiBcIm1uZW1vbmljXCJ9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8ga2V5IHJldHJpZXZhbCBzdWNjZWVkcyBpZiBub3QgdmlldyBvbmx5XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yOSkgcmV0dXJuIHRydWU7ICAvLyB3YWxsZXQgaXMgdmlldyBvbmx5XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0xKSByZXR1cm4gZmFsc2U7ICAvLyB3YWxsZXQgaXMgb2ZmbGluZSBidXQgbm90IHZpZXcgb25seVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW3VyaU9yQ29ubmVjdGlvbl0gLSB0aGUgZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNUcnVzdGVkIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaW4gdHJ1c3RlZFxuICAgKiBAcGFyYW0ge1NzbE9wdGlvbnN9IHNzbE9wdGlvbnMgLSBjdXN0b20gU1NMIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IHN0cmluZywgaXNUcnVzdGVkPzogYm9vbGVhbiwgc3NsT3B0aW9ucz86IFNzbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBpZiAoIXNzbE9wdGlvbnMpIHNzbE9wdGlvbnMgPSBuZXcgU3NsT3B0aW9ucygpO1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcImJhZF91cmlcIjsgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogYmFkIGRhZW1vbiB1cmkgbmVjZXNzYXJ5IGZvciBvZmZsaW5lP1xuICAgIHBhcmFtcy51c2VybmFtZSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIHBhcmFtcy5wYXNzd29yZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIHBhcmFtcy50cnVzdGVkID0gaXNUcnVzdGVkO1xuICAgIHBhcmFtcy5zc2xfc3VwcG9ydCA9IFwiYXV0b2RldGVjdFwiO1xuICAgIHBhcmFtcy5zc2xfcHJpdmF0ZV9rZXlfcGF0aCA9IHNzbE9wdGlvbnMuZ2V0UHJpdmF0ZUtleVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NlcnRpZmljYXRlX3BhdGggID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NhX2ZpbGUgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSgpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dlZF9maW5nZXJwcmludHMgPSBzc2xPcHRpb25zLmdldEFsbG93ZWRGaW5nZXJwcmludHMoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93X2FueV9jZXJ0ID0gc3NsT3B0aW9ucy5nZXRBbGxvd0FueUNlcnQoKTtcblxuICAgIC8vIHNldCBwcm94eSB3aGljaCBtdXN0IG1hdGNoIHN0YXJ0dXAgcHJveHkgaWYgYXBwbGljYWJsZVxuICAgIGlmIChjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRob3V0IHByb3h5IFVSSSBiZWNhdXNlIG1vbmVyby13YWxsZXQtcnBjIHdhcyBzdGFydGVkIHdpdGggYSBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgPT09IHVuZGVmaW5lZCkgcGFyYW1zLnByb3h5ID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA6IFwiXCI7XG4gICAgICBlbHNlIGlmICghR2VuVXRpbHMuaXNTYW1lUHJveHlVcmkodGhpcy5zdGFydHVwUHJveHlVcmksIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRoIHByb3h5IFVSSSBcIiArIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSArIFwiIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIGRpZmZlcmVudCBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXBhcmFtcy5wcm94eSkgcGFyYW1zLnByb3h5ID0gXCJcIjtcblxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9kYWVtb25cIiwgcGFyYW1zKTtcbiAgICB0aGlzLmRhZW1vbkNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLmRhZW1vbkNvbm5lY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYSBzaW5nbGUgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gYWNjb3VudCBpbmRleFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIHN1YmFkZHJlc3MgaW5kZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnRbXT59IGlzIHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYW4gYXJyYXksIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZXMoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50W10+IHtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzc0lkeCwgdW5kZWZpbmVkLCBcIk11c3QgcHJvdmlkZSBhY2NvdW50IGluZGV4IHdpdGggc3ViYWRkcmVzcyBpbmRleFwiKTtcbiAgICAgIGxldCBiYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICAgIGJhbGFuY2UgPSBiYWxhbmNlICsgYWNjb3VudC5nZXRCYWxhbmNlKCk7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZSA9IHVubG9ja2VkQmFsYW5jZSArIGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gW2JhbGFuY2UsIHVubG9ja2VkQmFsYW5jZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwYXJhbXMgPSB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgYWRkcmVzc19pbmRpY2VzOiBzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbc3ViYWRkcmVzc0lkeF19O1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQuYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgICBlbHNlIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0udW5sb2NrZWRfYmFsYW5jZSldO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ09NTU9OIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZXNlcnZlUHJvb2YoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBcIlwiLCBcIlwiKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBwcm92aWRlIGJldHRlciB3YXkgdG8ga25vdyBpZiB3YWxsZXQgcnBjIGlzIGNvbm5lY3RlZCB0byBkYWVtb25cbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcImNoZWNrIHJlc2VydmUgZXhwZWN0ZWQgdG8gZmFpbFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMykgdGhyb3cgZTsgLy8gbm8gd2FsbGV0IGZpbGVcbiAgICAgIHJldHVybiBlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRhZW1vblwiKSA8IDA7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwibW5lbW9uaWNcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMuZ2V0U2VlZExhbmd1YWdlKCkgbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IHRoZSBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFuZ3VhZ2VzXCIpKS5yZXN1bHQubGFuZ3VhZ2VzO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwidmlld19rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInNwZW5kX2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgICAgICAgIC8vIHJlY3Vyc2l2ZSBjYWxsIHVzZXMgY2FjaGVcbiAgICB9XG4gICAgbGV0IGFkZHJlc3MgPSBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3NJZHhdO1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XVtzdWJhZGRyZXNzSWR4XTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJlc3M7XG4gIH1cbiAgXG4gIC8vIFRPRE86IHVzZSBjYWNoZVxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggcmVzdWx0IGFuZCBub3JtYWxpemUgZXJyb3IgaWYgYWRkcmVzcyBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgIGxldCByZXNwO1xuICAgIHRyeSB7XG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfaW5kZXhcIiwge2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29udmVydCBycGMgcmVzcG9uc2VcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWFqb3IpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWlub3IpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzU3RyID0gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtzdGFuZGFyZF9hZGRyZXNzOiBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRfaWQ6IHBheW1lbnRJZH0pKS5yZXN1bHQuaW50ZWdyYXRlZF9hZGRyZXNzO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3NTdHIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNwbGl0X2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7aW50ZWdyYXRlZF9hZGRyZXNzOiBpbnRlZ3JhdGVkQWRkcmVzc30pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoKS5zZXRTdGFuZGFyZEFkZHJlc3MocmVzcC5yZXN1bHQuc3RhbmRhcmRfYWRkcmVzcykuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnBheW1lbnRfaWQpLnNldEludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpKS5yZXN1bHQuaGVpZ2h0O1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgdGhlIGNoYWluIGhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhIGhlaWdodCBieSBkYXRlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGFzc2VydCghKGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyKSwgXCJNb25lcm8gV2FsbGV0IFJQQyBkb2VzIG5vdCBzdXBwb3J0IHJlcG9ydGluZyBzeW5jIHByb2dyZXNzXCIpO1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlZnJlc2hcIiwge3N0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHR9KTtcbiAgICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3AucmVzdWx0LmJsb2Nrc19mZXRjaGVkLCByZXNwLnJlc3VsdC5yZWNlaXZlZF9tb25leSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJubyBjb25uZWN0aW9uIHRvIGRhZW1vblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IG1zIHRvIHNlY29uZHMgZm9yIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgc3luY1BlcmlvZEluU2Vjb25kcyA9IE1hdGgucm91bmQoKHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zKSAvIDEwMDApO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgcGVyaW9kOiBzeW5jUGVyaW9kSW5TZWNvbmRzXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlIHN5bmMgcGVyaW9kIGZvciBwb2xsZXJcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluU2Vjb25kcyAqIDEwMDA7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldFBlcmlvZEluTXModGhpcy5zeW5jUGVyaW9kSW5Ncyk7XG4gICAgXG4gICAgLy8gcG9sbCBpZiBsaXN0ZW5pbmdcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuXG4gIGdldFN5bmNQZXJpb2RJbk1zKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3luY1BlcmlvZEluTXM7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwgeyBlbmFibGU6IGZhbHNlIH0pO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdHhIYXNoZXMgfHwgIXR4SGFzaGVzLmxlbmd0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gdHggaGFzaGVzIGdpdmVuIHRvIHNjYW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2Nhbl90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9zcGVudFwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9ibG9ja2NoYWluXCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIGFjY291bnRzIGZyb20gcnBjXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudHNcIiwge3RhZzogdGFnfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYWNjb3VudCBvYmplY3RzIGFuZCBmZXRjaCBzdWJhZGRyZXNzZXMgcGVyIGFjY291bnQgdXNpbmcgZ2V0X2FkZHJlc3NcbiAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBnZXRfYWRkcmVzcyBzaG91bGQgc3VwcG9ydCBhbGxfYWNjb3VudHMgc28gbm90IGNhbGxlZCBvbmNlIHBlciBhY2NvdW50XG4gICAgbGV0IGFjY291bnRzOiBNb25lcm9BY2NvdW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBycGNBY2NvdW50IG9mIHJlc3AucmVzdWx0LnN1YmFkZHJlc3NfYWNjb3VudHMpIHtcbiAgICAgIGxldCBhY2NvdW50ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpO1xuICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnQuZ2V0SW5kZXgoKSwgdW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICBhY2NvdW50cy5wdXNoKGFjY291bnQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgZmllbGRzIGZyb20gZ2V0X2JhbGFuY2UgYWNyb3NzIGFsbCBhY2NvdW50c1xuICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzICYmICFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZldGNoIGFuZCBtZXJnZSBpbmZvIGZyb20gZ2V0X2JhbGFuY2VcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCB7YWxsX2FjY291bnRzOiB0cnVlfSk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIG1lcmdlIGluZm9cbiAgICAgICAgICBsZXQgYWNjb3VudCA9IGFjY291bnRzW3N1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpLCBhY2NvdW50LmdldEluZGV4KCksIFwiUlBDIGFjY291bnRzIGFyZSBvdXQgb2Ygb3JkZXJcIik7ICAvLyB3b3VsZCBuZWVkIHRvIHN3aXRjaCBsb29rdXAgdG8gbG9vcFxuICAgICAgICAgIGxldCB0Z3RTdWJhZGRyZXNzID0gYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKVtzdWJhZGRyZXNzLmdldEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEluZGV4KCksIHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgXCJSUEMgc3ViYWRkcmVzc2VzIGFyZSBvdXQgb2Ygb3JkZXJcIik7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICAvLyBUT0RPOiBnZXRBY2NvdW50QnlJbmRleCgpLCBnZXRBY2NvdW50QnlUYWcoKVxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaWYgKGFjY291bnQuZ2V0SW5kZXgoKSA9PT0gYWNjb3VudElkeCkge1xuICAgICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCBza2lwQmFsYW5jZXMpKTtcbiAgICAgICAgcmV0dXJuIGFjY291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnQgd2l0aCBpbmRleCBcIiArIGFjY291bnRJZHggKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBsYWJlbCA9IGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQ7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWNjb3VudFwiLCB7bGFiZWw6IGxhYmVsfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9BY2NvdW50KHtcbiAgICAgIGluZGV4OiByZXNwLnJlc3VsdC5hY2NvdW50X2luZGV4LFxuICAgICAgcHJpbWFyeUFkZHJlc3M6IHJlc3AucmVzdWx0LmFkZHJlc3MsXG4gICAgICBsYWJlbDogbGFiZWwsXG4gICAgICBiYWxhbmNlOiBCaWdJbnQoMCksXG4gICAgICB1bmxvY2tlZEJhbGFuY2U6IEJpZ0ludCgwKVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggc3ViYWRkcmVzc2VzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcykgcGFyYW1zLmFkZHJlc3NfaW5kZXggPSBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHBhcmFtcyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBzdWJhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgc3ViYWRkcmVzcyBiYWxhbmNlc1xuICAgIGlmICghc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIGJhbGFuY2VzXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gdHJhbnNmZXIgaW5mbyB0byBleGlzdGluZyBzdWJhZGRyZXNzIG9iamVjdFxuICAgICAgICAgIGZvciAobGV0IHRndFN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgICAgICBpZiAodGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpICE9PSBzdWJhZGRyZXNzLmdldEluZGV4KCkpIGNvbnRpbnVlOyAvLyBza2lwIHRvIHN1YmFkZHJlc3Mgd2l0aCBzYW1lIGluZGV4XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIHN1YmFkZHJlc3NNYXAgPSB7fTtcbiAgICAgIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdID0gc3ViYWRkcmVzc01hcDtcbiAgICB9XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgIHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzcy5nZXRJbmRleCgpXSA9IHN1YmFkZHJlc3MuZ2V0QWRkcmVzcygpO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0sIHNraXBCYWxhbmNlcykpWzBdO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgbGFiZWw6IGxhYmVsfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgc3ViYWRkcmVzcyBvYmplY3RcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5hZGRyZXNzX2luZGV4KTtcbiAgICBzdWJhZGRyZXNzLnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgc3ViYWRkcmVzcy5zZXRMYWJlbChsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkKTtcbiAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJc1VzZWQoZmFsc2UpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJsYWJlbF9hZGRyZXNzXCIsIHtpbmRleDoge21ham9yOiBhY2NvdW50SWR4LCBtaW5vcjogc3ViYWRkcmVzc0lkeH0sIGxhYmVsOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICByZXR1cm4gdGhpcy5nZXRUeHNBdXgocXVlcnksIDUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldFR4c0F1eChxdWVyeTogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+IHwgdW5kZWZpbmVkLCBtYXhBdHRlbXB0czogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG5cbiAgICAvLyBjb3B5IHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHRlbXBvcmFyaWx5IGRpc2FibGUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzIGluIG9yZGVyIHRvIGNvbGxlY3QgYWxsIHR4IGluZm9ybWF0aW9uXG4gICAgbGV0IHRyYW5zZmVyUXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIGxldCBpbnB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldElucHV0UXVlcnkoKTtcbiAgICBsZXQgb3V0cHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWxsIHRyYW5zZmVycyB0aGF0IG1lZXQgdHggcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgdGhpcy5nZXRUcmFuc2ZlcnNBdXgobmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkoKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHVuaXF1ZSB0eHMgZnJvbSB0cmFuc2ZlcnMgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGxldCB0eHNTZXQgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoIXR4c1NldC5oYXModHJhbnNmZXIuZ2V0VHgoKSkpIHtcbiAgICAgICAgdHhzLnB1c2godHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICAgIHR4c1NldC5hZGQodHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHR5cGVzIGludG8gbWFwcyBmb3IgbWVyZ2luZyBhbmQgbG9va3VwXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIG91dHB1dHMgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbmNsdWRlT3V0cHV0cygpIHx8IG91dHB1dFF1ZXJ5KSB7XG4gICAgICAgIFxuICAgICAgLy8gZmV0Y2ggb3V0cHV0c1xuICAgICAgbGV0IG91dHB1dFF1ZXJ5QXV4ID0gKG91dHB1dFF1ZXJ5ID8gb3V0cHV0UXVlcnkuY29weSgpIDogbmV3IE1vbmVyb091dHB1dFF1ZXJ5KCkpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSk7XG4gICAgICBsZXQgb3V0cHV0cyA9IGF3YWl0IHRoaXMuZ2V0T3V0cHV0c0F1eChvdXRwdXRRdWVyeUF1eCk7XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIG91dHB1dCB0eHMgb25lIHRpbWUgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgICBsZXQgb3V0cHV0VHhzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgICAgICBpZiAoIW91dHB1dFR4cy5pbmNsdWRlcyhvdXRwdXQuZ2V0VHgoKSkpIHtcbiAgICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeChvdXRwdXQuZ2V0VHgoKSwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgICAgICBvdXRwdXRUeHMucHVzaChvdXRwdXQuZ2V0VHgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmVzdG9yZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXNcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh0cmFuc2ZlclF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeShpbnB1dFF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkob3V0cHV0UXVlcnkpO1xuICAgIFxuICAgIC8vIGZpbHRlciB0eHMgdGhhdCBkb24ndCBtZWV0IHRyYW5zZmVyIHF1ZXJ5XG4gICAgbGV0IHR4c1F1ZXJpZWQgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQubWVldHNDcml0ZXJpYSh0eCkpIHR4c1F1ZXJpZWQucHVzaCh0eCk7XG4gICAgICBlbHNlIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgIH1cbiAgICB0eHMgPSB0eHNRdWVyaWVkO1xuICAgIFxuICAgIC8vIHNwZWNpYWwgY2FzZTogcmUtZmV0Y2ggdHhzIGlmIGluY29uc2lzdGVuY3kgY2F1c2VkIGJ5IG5lZWRpbmcgdG8gbWFrZSBtdWx0aXBsZSBycGMgY2FsbHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCB8fCAhdHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKG1heEF0dGVtcHRzIDw9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVuYWJsZSB0byBidWlsZCBjb25zaXN0ZW50IHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxsc1wiKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluY29uc2lzdGVuY3kgZGV0ZWN0ZWQgYnVpbGRpbmcgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzLCByZS1mZXRjaGluZyB0eHNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFR4c0F1eChxdWVyeU5vcm1hbGl6ZWQsIG1heEF0dGVtcHRzIC0gMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG9yZGVyIHR4cyBpZiB0eCBoYXNoZXMgZ2l2ZW4gdGhlbiByZXR1cm5cbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpICYmIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKS5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgdHhzQnlJZCA9IG5ldyBNYXAoKSAgLy8gc3RvcmUgdHhzIGluIHRlbXBvcmFyeSBtYXAgZm9yIHNvcnRpbmdcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhzQnlJZC5zZXQodHguZ2V0SGFzaCgpLCB0eCk7XG4gICAgICBsZXQgb3JkZXJlZFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaGFzaCBvZiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkpIGlmICh0eHNCeUlkLmdldChoYXNoKSkgb3JkZXJlZFR4cy5wdXNoKHR4c0J5SWQuZ2V0KGhhc2gpKTtcbiAgICAgIHR4cyA9IG9yZGVyZWRUeHM7XG4gICAgfVxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IHRyYW5zZmVycyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIHRyYW5zZmVycywgb3V0cHV0cylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCBvdXRwdXRzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgb3V0cHV0cywgdHJhbnNmZXJzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRPdXRwdXRzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X291dHB1dHNcIiwge2FsbDogYWxsfSkpLnJlc3VsdC5vdXRwdXRzX2RhdGFfaGV4O1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfb3V0cHV0c1wiLCB7b3V0cHV0c19kYXRhX2hleDogb3V0cHV0c0hleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5udW1faW1wb3J0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQ+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSwgb2Zmc2V0ID0gMCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGtleSBpbWFnZXMgdG8gcnBjIHBhcmFtZXRlclxuICAgIGxldCBycGNLZXlJbWFnZXMgPSBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+ICh7a2V5X2ltYWdlOiBrZXlJbWFnZS5nZXRIZXgoKSwgc2lnbmF0dXJlOiBrZXlJbWFnZS5nZXRTaWduYXR1cmUoKX0pKTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9rZXlfaW1hZ2VzXCIsIHtzaWduZWRfa2V5X2ltYWdlczogcnBjS2V5SW1hZ2VzLCBvZmZzZXQ6IG9mZnNldH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gcmVzdWx0XG4gICAgbGV0IGltcG9ydFJlc3VsdCA9IG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCgpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRIZWlnaHQocmVzcC5yZXN1bHQuaGVpZ2h0KTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0U3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFVuc3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnVuc3BlbnQpKTtcbiAgICByZXR1cm4gaW1wb3J0UmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGZhbHNlKSkuZ2V0S2V5SW1hZ2VzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyZWV6ZVwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGhhd1wiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcm96ZW5cIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuZnJvemVuID09PSB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5XCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5wcmlvcml0eTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpID09PSB0cnVlICYmIGF3YWl0IHRoaXMuaXNNdWx0aXNpZygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcmVsYXkgbXVsdGlzaWcgdHJhbnNhY3Rpb24gdW50aWwgY28tc2lnbmVkXCIpO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3NlcyB0byBzZW5kIGZyb21cbiAgICBsZXQgYWNjb3VudElkeCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSBhY2NvdW50IGluZGV4IHRvIHNlbmQgZnJvbVwiKTtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKTsgLy8gZmV0Y2ggYWxsIG9yIGNvcHkgZ2l2ZW4gaW5kaWNlc1xuICAgIFxuICAgIC8vIGJ1aWxkIGNvbmZpZyBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0RGVzdGluYXRpb25zKCkpIHtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIFwiRGVzdGluYXRpb24gYWRkcmVzcyBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSwgXCJEZXN0aW5hdGlvbiBhbW91bnQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBwYXJhbXMuZGVzdGluYXRpb25zLnB1c2goeyBhZGRyZXNzOiBkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIGFtb3VudDogZGVzdGluYXRpb24uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlOyAvLyBwYXJhbSB0byBnZXQgdHgga2V5KHMpIGRlcGVuZHMgaWYgc3BsaXRcbiAgICBlbHNlIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcblxuICAgIC8vIGNhbm5vdCBhcHBseSBzdWJ0cmFjdEZlZUZyb20gd2l0aCBgdHJhbnNmZXJfc3BsaXRgIGNhbGxcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJzdWJ0cmFjdGZlZWZyb20gdHJhbnNmZXJzIGNhbm5vdCBiZSBzcGxpdCBvdmVyIG11bHRpcGxlIHRyYW5zYWN0aW9ucyB5ZXRcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IFwidHJhbnNmZXJfc3BsaXRcIiA6IFwidHJhbnNmZXJcIiwgcGFyYW1zKTtcbiAgICAgIHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIldBTExFVF9SUENfRVJST1JfQ09ERV9XUk9OR19BRERSRVNTXCIpID4gLTEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgZGVzdGluYXRpb24gYWRkcmVzc1wiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgXG4gICAgLy8gcHJlLWluaXRpYWxpemUgdHhzIGlmZiBwcmVzZW50LiBtdWx0aXNpZyBhbmQgdmlldy1vbmx5IHdhbGxldHMgd2lsbCBoYXZlIHR4IHNldCB3aXRob3V0IHRyYW5zYWN0aW9uc1xuICAgIGxldCB0eHM7XG4gICAgbGV0IG51bVR4cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IChyZXN1bHQuZmVlX2xpc3QgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC5mZWVfbGlzdC5sZW5ndGggOiAwKSA6IChyZXN1bHQuZmVlICE9PSB1bmRlZmluZWQgPyAxIDogMCk7XG4gICAgaWYgKG51bVR4cyA+IDApIHR4cyA9IFtdO1xuICAgIGxldCBjb3B5RGVzdGluYXRpb25zID0gbnVtVHhzID09PSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHtcbiAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnTm9ybWFsaXplZCwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpO1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHN1YmFkZHJlc3NJbmRpY2VzLmxlbmd0aCA9PT0gMSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHNldCBmcm9tIHJwYyByZXNwb25zZSB3aXRoIHByZS1pbml0aWFsaXplZCB0eHNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHR4cywgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eHMgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHR4c1swXSwgdHJ1ZSwgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5rZXlfaW1hZ2UgPSBjb25maWcuZ2V0S2V5SW1hZ2UoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfc2luZ2xlXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHR4XG4gICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHgsIHRydWUsIGNvbmZpZyk7XG4gICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkpOyAvLyBpbml0aWFsaXplIGRlc3RpbmF0aW9uIGFtb3VudFxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwOyBkZWZhdWx0IHRvIGFsbCB3aXRoIHVubG9ja2VkIGJhbGFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpOyAgLy8gbWFwcyBlYWNoIGFjY291bnQgaW5kZXggdG8gc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBhY2NvdW50cyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudHModHJ1ZSk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGlmIChhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBlYWNoIGFjY291bnQgYW5kIGNvbGxlY3QgcmVzdWx0aW5nIHR4IHNldHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgICAgXG4gICAgICAvLyBjb3B5IGFuZCBtb2RpZnkgdGhlIG9yaWdpbmFsIGNvbmZpZ1xuICAgICAgbGV0IGNvcHkgPSBjb25maWdOb3JtYWxpemVkLmNvcHkoKTtcbiAgICAgIGNvcHkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgY29weS5zZXRTd2VlcEVhY2hTdWJhZGRyZXNzKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc3dlZXAgYWxsIHN1YmFkZHJlc3NlcyB0b2dldGhlciAgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogY2FuIHRoaXMgcmV2ZWFsIG91dHB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIHdhbGxldD9cbiAgICAgIGlmIChjb3B5LmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSAhPT0gdHJ1ZSkge1xuICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKGluZGljZXMuZ2V0KGFjY291bnRJZHgpKTtcbiAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHlcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSWR4IG9mIGluZGljZXMuZ2V0KGFjY291bnRJZHgpKSB7XG4gICAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbc3ViYWRkcmVzc0lkeF0pO1xuICAgICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHJlbGF5ID09PSB1bmRlZmluZWQpIHJlbGF5ID0gZmFsc2U7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9kdXN0XCIsIHtkb19ub3RfcmVsYXk6ICFyZWxheX0pO1xuICAgIGlmIChyZWxheSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0KTtcbiAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoIXJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHR4LmdldElzUmVsYXllZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eEhhc2hlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykge1xuICAgICAgbGV0IG1ldGFkYXRhID0gdHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwgeyBoZXg6IG1ldGFkYXRhIH0pO1xuICAgICAgdHhIYXNoZXMucHVzaChyZXNwLnJlc3VsdC50eF9oYXNoKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7IC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgcmV0dXJuIHR4SGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlc2NyaWJlX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksXG4gICAgICBtdWx0aXNpZ190eHNldDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdW5zaWduZWRUeEhleCxcbiAgICAgIGV4cG9ydF9yYXc6IHRydWUsXG4gICAgICBnZXRfdHhfa2V5czogdHJ1ZVxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfdHJhbnNmZXJcIiwge1xuICAgICAgdHhfZGF0YV9oZXg6IHNpZ25lZFR4SGV4XG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25cIiwge1xuICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmVfdHlwZTogc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IFwic3BlbmRcIiA6IFwidmlld1wiLFxuICAgICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgICBhZGRyZXNzX2luZGV4OiBzdWJhZGRyZXNzSWR4XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ2ZXJpZnlcIiwge2RhdGE6IG1lc3NhZ2UsIGFkZHJlc3M6IGFkZHJlc3MsIHNpZ25hdHVyZTogc2lnbmF0dXJlfSk7XG4gICAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC5nb29kID8ge2lzR29vZDogcmVzdWx0Lmdvb2QsIGlzT2xkOiByZXN1bHQub2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlX3R5cGUgPT09IFwidmlld1wiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDoge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHtpc0dvb2Q6IGZhbHNlfSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9rZXlcIiwge3R4aWQ6IHR4SGFzaH0pKS5yZXN1bHQudHhfa2V5O1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2gsIHR4X2tleTogdHhLZXksIGFkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3VsdFxuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZCh0cnVlKTtcbiAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBhZGRyZXNzOiBhZGRyZXNzLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzcG9uc2VcbiAgICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgICAgaWYgKGlzR29vZCkge1xuICAgICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMSAmJiBlLm1lc3NhZ2UgPT09IFwiYmFzaWNfc3RyaW5nXCIpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJNdXN0IHByb3ZpZGUgc2lnbmF0dXJlIHRvIGNoZWNrIHR4IHByb29mXCIsIC0xKTtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfc3BlbmRfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfc3BlbmRfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5nb29kO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhbGw6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygpLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gaW50ZXJwcmV0IHJlc3VsdHNcbiAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKCk7XG4gICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgaWYgKGlzR29vZCkge1xuICAgICAgY2hlY2suc2V0VW5jb25maXJtZWRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICAgIGNoZWNrLnNldFRvdGFsQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC50b3RhbCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hlY2s7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXN9KSkucmVzdWx0Lm5vdGVzO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXMsIG5vdGVzOiBub3Rlc30pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfYm9va1wiLCB7ZW50cmllczogZW50cnlJbmRpY2VzfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5lbnRyaWVzKSByZXR1cm4gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5lbnRyaWVzKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoKS5zZXRJbmRleChycGNFbnRyeS5pbmRleCkuc2V0QWRkcmVzcyhycGNFbnRyeS5hZGRyZXNzKS5zZXREZXNjcmlwdGlvbihycGNFbnRyeS5kZXNjcmlwdGlvbikuc2V0UGF5bWVudElkKHJwY0VudHJ5LnBheW1lbnRfaWQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhZGRfYWRkcmVzc19ib29rXCIsIHthZGRyZXNzOiBhZGRyZXNzLCBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb259KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5kZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImVkaXRfYWRkcmVzc19ib29rXCIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHNldF9hZGRyZXNzOiBzZXRBZGRyZXNzLFxuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHNldF9kZXNjcmlwdGlvbjogc2V0RGVzY3JpcHRpb24sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVsZXRlX2FkZHJlc3NfYm9va1wiLCB7aW5kZXg6IGVudHJ5SWR4fSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0YWdfYWNjb3VudHNcIiwge3RhZzogdGFnLCBhY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidW50YWdfYWNjb3VudHNcIiwge2FjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBsZXQgdGFncyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRfdGFnc1wiKTtcbiAgICBpZiAocmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICBmb3IgKGxldCBycGNBY2NvdW50VGFnIG9mIHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgICB0YWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoe1xuICAgICAgICAgIHRhZzogcnBjQWNjb3VudFRhZy50YWcgPyBycGNBY2NvdW50VGFnLnRhZyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYWJlbDogcnBjQWNjb3VudFRhZy5sYWJlbCA/IHJwY0FjY291bnRUYWcubGFiZWwgOiB1bmRlZmluZWQsXG4gICAgICAgICAgYWNjb3VudEluZGljZXM6IHJwY0FjY291bnRUYWcuYWNjb3VudHNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFncztcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hY2NvdW50X3RhZ19kZXNjcmlwdGlvblwiLCB7dGFnOiB0YWcsIGRlc2NyaXB0aW9uOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfdXJpXCIsIHtcbiAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksXG4gICAgICBhbW91bnQ6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSA/IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKS50b1N0cmluZygpIDogdW5kZWZpbmVkLFxuICAgICAgcGF5bWVudF9pZDogY29uZmlnLmdldFBheW1lbnRJZCgpLFxuICAgICAgcmVjaXBpZW50X25hbWU6IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCksXG4gICAgICB0eF9kZXNjcmlwdGlvbjogY29uZmlnLmdldE5vdGUoKVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC51cmk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBhc3NlcnQodXJpLCBcIk11c3QgcHJvdmlkZSBVUkkgdG8gcGFyc2VcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwYXJzZV91cmlcIiwge3VyaTogdXJpfSk7XG4gICAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyh7YWRkcmVzczogcmVzcC5yZXN1bHQudXJpLmFkZHJlc3MsIGFtb3VudDogQmlnSW50KHJlc3AucmVzdWx0LnVyaS5hbW91bnQpfSk7XG4gICAgY29uZmlnLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC51cmkucGF5bWVudF9pZCk7XG4gICAgY29uZmlnLnNldFJlY2lwaWVudE5hbWUocmVzcC5yZXN1bHQudXJpLnJlY2lwaWVudF9uYW1lKTtcbiAgICBjb25maWcuc2V0Tm90ZShyZXNwLnJlc3VsdC51cmkudHhfZGVzY3JpcHRpb24pO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpKSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UGF5bWVudElkKCkpIGNvbmZpZy5zZXRQYXltZW50SWQodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSkgY29uZmlnLnNldFJlY2lwaWVudE5hbWUodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldE5vdGUoKSkgY29uZmlnLnNldE5vdGUodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hdHRyaWJ1dGVcIiwge2tleToga2V5fSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQudmFsdWUgPT09IFwiXCIgPyB1bmRlZmluZWQgOiByZXNwLnJlc3VsdC52YWx1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC00NSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXksIHZhbHVlOiB2YWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdGFydF9taW5pbmdcIiwge1xuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBiYWNrZ3JvdW5kTWluaW5nLFxuICAgICAgaWdub3JlX2JhdHRlcnk6IGlnbm9yZUJhdHRlcnlcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX21pbmluZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbXBvcnRfbmVlZGVkID09PSB0cnVlO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImlzX211bHRpc2lnXCIpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgaW5mbyA9IG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oKTtcbiAgICBpbmZvLnNldElzTXVsdGlzaWcocmVzdWx0Lm11bHRpc2lnKTtcbiAgICBpbmZvLnNldElzUmVhZHkocmVzdWx0LnJlYWR5KTtcbiAgICBpbmZvLnNldFRocmVzaG9sZChyZXN1bHQudGhyZXNob2xkKTtcbiAgICBpbmZvLnNldE51bVBhcnRpY2lwYW50cyhyZXN1bHQudG90YWwpO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInByZXBhcmVfbXVsdGlzaWdcIiwge2VuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IHRydWV9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9tdWx0aXNpZ1wiLCB7XG4gICAgICBtdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLFxuICAgICAgdGhyZXNob2xkOiB0aHJlc2hvbGQsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICB9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzXCIsIHttdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCBtc1Jlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoKTtcbiAgICBtc1Jlc3VsdC5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm8pO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRBZGRyZXNzKCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKG1zUmVzdWx0LmdldE11bHRpc2lnSGV4KCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiBtc1Jlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9tdWx0aXNpZ19pbmZvXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmZvO1xuICB9XG5cbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHJlZnJlc2hBZnRlckltcG9ydD86IGJvb2xlYW4pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmIChyZWZyZXNoQWZ0ZXJJbXBvcnQgPT09IHVuZGVmaW5lZCkgcmVmcmVzaEFmdGVySW1wb3J0ID0gdHJ1ZTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfbXVsdGlzaWdfaW5mb1wiLCB7aW5mbzogbXVsdGlzaWdIZXhlcywgcmVmcmVzaF9hZnRlcl9pbXBvcnQ6IHJlZnJlc2hBZnRlckltcG9ydH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5uX291dHB1dHM7XG4gIH1cblxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl9tdWx0aXNpZ1wiLCB7dHhfZGF0YV9oZXg6IG11bHRpc2lnVHhIZXh9KTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IHNpZ25SZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KCk7XG4gICAgc2lnblJlc3VsdC5zZXRTaWduZWRNdWx0aXNpZ1R4SGV4KHJlc3VsdC50eF9kYXRhX2hleCk7XG4gICAgc2lnblJlc3VsdC5zZXRUeEhhc2hlcyhyZXN1bHQudHhfaGFzaF9saXN0KTtcbiAgICByZXR1cm4gc2lnblJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogc2lnbmVkTXVsdGlzaWdUeEhleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hhbmdlX3dhbGxldF9wYXNzd29yZFwiLCB7b2xkX3Bhc3N3b3JkOiBvbGRQYXNzd29yZCB8fCBcIlwiLCBuZXdfcGFzc3dvcmQ6IG5ld1Bhc3N3b3JkIHx8IFwiXCJ9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9yZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2Uoc2F2ZSk7XG4gICAgaWYgKHNhdmUgPT09IHVuZGVmaW5lZCkgc2F2ZSA9IGZhbHNlO1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjbG9zZV93YWxsZXRcIiwge2F1dG9zYXZlX2N1cnJlbnQ6IHNhdmV9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMyAmJiBlLm1lc3NhZ2UuaW5kZXhPZihcIk5vIHdhbGxldCBmaWxlXCIpID4gLTE7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNhdmUgYW5kIGNsb3NlIHRoZSBjdXJyZW50IHdhbGxldCBhbmQgc3RvcCB0aGUgUlBDIHNlcnZlci5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX3dhbGxldFwiKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cblxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdfHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTsgfVxuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXR8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb1dhbGxldFJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9XYWxsZXRScGMuc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZyk7XG4gICAgZWxzZSByZXR1cm4gbmV3IE1vbmVyb1dhbGxldFJwYyhjb25maWcpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRfcHJvY2VzcyA9IGF3YWl0IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gICAgY29uc3QgY2hpbGRQcm9jZXNzID0gY2hpbGRfcHJvY2Vzcy5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7XG4gICAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIExBTkc6ICdlbl9VUy5VVEYtOCcgfSAvLyBzY3JhcGUgb3V0cHV0IGluIGVuZ2xpc2hcbiAgICB9KTtcbiAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyby13YWxsZXQtcnBjXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcIlN0YXJ0aW5nIHdhbGxldCBSUEMgc2VydmVyXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lLCBwYXNzd29yZCwgem1xIHB1Ymxpc2ggdXJpLCBhbmQgcHJveHkgdXJpIGZyb20gcGFyYW1zXG4gICAgICAgICAgICBsZXQgdXNlclBhc3NJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1sb2dpblwiKTtcbiAgICAgICAgICAgIGxldCB1c2VyUGFzcyA9IHVzZXJQYXNzSWR4ID49IDAgPyBjb25maWcuY21kW3VzZXJQYXNzSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKDAsIHVzZXJQYXNzLmluZGV4T2YoJzonKSk7XG4gICAgICAgICAgICBsZXQgcGFzc3dvcmQgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKHVzZXJQYXNzLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHptcVVyaUlkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tem1xLXB1YlwiKTtcbiAgICAgICAgICAgIGxldCB6bXFVcmkgPSB6bXFVcmlJZHggPj0gMCA/IGNvbmZpZy5jbWRbem1xVXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgcHJveHlVcmlJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXByb3h5XCIpO1xuICAgICAgICAgICAgdGhpcy5zdGFydHVwUHJveHlVcmkgPSBwcm94eVVyaUlkeCA+PSAwID8gY29uZmlnLmNtZFtwcm94eVVyaUlkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBjcmVhdGUgY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcuY29weSgpLnNldFNlcnZlcih7dXJpOiB1cmksIHVzZXJuYW1lOiB1c2VybmFtZSwgcGFzc3dvcmQ6IHBhc3N3b3JkLCB6bXFVcmk6IHptcVVyaSwgcHJveHlVcmk6IHRoaXMuc3RhcnR1cFByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQ6IGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZH0pO1xuICAgICAgICAgICAgY29uZmlnLmNtZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRScGMuY29ubmVjdFRvV2FsbGV0UnBjKGNvbmZpZyk7XG4gICAgICAgICAgICB3YWxsZXQucHJvY2VzcyA9IGNoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUod2FsbGV0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiRU5PRU5UXCIpID49IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBleGlzdCBhdCBwYXRoICdcIiArIGNvbmZpZy5jbWRbMF0gKyBcIidcIikpO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgdW5jYXVnaHQgZXhjZXB0aW9uXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGZ1bmN0aW9uKGVyciwgb3JpZ2luKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuY2F1Z2h0IGV4Y2VwdGlvbiBpbiBtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNsZWFyKCkge1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3NDYWNoZTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHRoaXMucGF0aCA9IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFjY291bnRJbmRpY2VzKGdldFN1YmFkZHJlc3NJbmRpY2VzPzogYW55KSB7XG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgZ2V0U3ViYWRkcmVzc0luZGljZXMgPyBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnQuZ2V0SW5kZXgoKSkgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnRJZHgpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4fSk7XG4gICAgZm9yIChsZXQgYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goYWRkcmVzcy5hZGRyZXNzX2luZGV4KTtcbiAgICByZXR1cm4gc3ViYWRkcmVzc0luZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRUcmFuc2ZlcnNBdXgocXVlcnk6IE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBwYXJhbXMgZm9yIGdldF90cmFuc2ZlcnMgcnBjIGNhbGxcbiAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKTtcbiAgICBsZXQgY2FuQmVDb25maXJtZWQgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc1JlbGF5ZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5UeFBvb2wgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldElzTG9ja2VkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluY29taW5nID0gcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IHRydWUgJiYgcXVlcnkuZ2V0SGFzRGVzdGluYXRpb25zKCkgIT09IHRydWU7XG4gICAgbGV0IGNhbkJlT3V0Z29pbmcgPSBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gdHJ1ZTtcblxuICAgIC8vIGNoZWNrIGlmIGZldGNoaW5nIHBvb2wgdHhzIGNvbnRyYWRpY3RlZCBieSBjb25maWd1cmF0aW9uXG4gICAgaWYgKHR4UXVlcnkuZ2V0SW5UeFBvb2woKSA9PT0gdHJ1ZSAmJiAhY2FuQmVJblR4UG9vbCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IGZldGNoIHBvb2wgdHJhbnNhY3Rpb25zIGJlY2F1c2UgaXQgY29udHJhZGljdHMgY29uZmlndXJhdGlvblwiKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuaW4gPSBjYW5CZUluY29taW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5vdXQgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5wb29sID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5wZW5kaW5nID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5mYWlsZWQgPSB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT0gdHJ1ZTtcbiAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSA+IDApIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAtIDE7IC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IHdhbGxldDI6OmdldF9wYXltZW50cygpIG1pbl9oZWlnaHQgaXMgZXhjbHVzaXZlLCBzbyBtYW51YWxseSBvZmZzZXQgdG8gbWF0Y2ggaW50ZW5kZWQgcmFuZ2UgKGlzc3VlcyAjNTc1MSwgIzU1OTgpXG4gICAgICBlbHNlIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKTtcbiAgICB9XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLm1heF9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1heEhlaWdodCgpO1xuICAgIHBhcmFtcy5maWx0ZXJfYnlfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkIHx8IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpID09PSB1bmRlZmluZWQgJiYgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgcGFyYW1zLmFsbF9hY2NvdW50cyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gcXVlcnkuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgICBcbiAgICAgIC8vIHNldCBzdWJhZGRyZXNzIGluZGljZXMgcGFyYW1cbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzLnNpemUpIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gYnVpbGQgdHhzIHVzaW5nIGBnZXRfdHJhbnNmZXJzYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhyZXNwLnJlc3VsdCkpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AucmVzdWx0W2tleV0pIHtcbiAgICAgICAgLy9pZiAocnBjVHgudHhpZCA9PT0gcXVlcnkuZGVidWdUeElkKSBjb25zb2xlLmxvZyhycGNUeCk7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgpO1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkgYXNzZXJ0KHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCkgPiAtMSk7XG4gICAgICAgIFxuICAgICAgICAvLyByZXBsYWNlIHRyYW5zZmVyIGFtb3VudCB3aXRoIGRlc3RpbmF0aW9uIHN1bVxuICAgICAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBjb25maXJtZWQgdHggZnJvbS90byBzYW1lIGFjY291bnQgaGFzIGFtb3VudCAwIGJ1dCBjYWNoZWQgdHJhbnNmZXJzXG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJc1JlbGF5ZWQoKSAmJiAhdHguZ2V0SXNGYWlsZWQoKSAmJlxuICAgICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpICYmIHR4LmdldE91dGdvaW5nQW1vdW50KCkgPT09IDBuKSB7XG4gICAgICAgICAgbGV0IG91dGdvaW5nVHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICAgICAgbGV0IHRyYW5zZmVyVG90YWwgPSBCaWdJbnQoMCk7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2Ygb3V0Z29pbmdUcmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHJhbnNmZXJUb3RhbCA9IHRyYW5zZmVyVG90YWwgKyBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKTtcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KHRyYW5zZmVyVG90YWwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBtZXJnZSB0eFxuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZpbHRlciBhbmQgcmV0dXJuIHRyYW5zZmVyc1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gdHggaXMgbm90IGluY29taW5nL291dGdvaW5nIHVubGVzcyBhbHJlYWR5IHNldFxuICAgICAgaWYgKHR4LmdldElzSW5jb21pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0luY29taW5nKGZhbHNlKTtcbiAgICAgIGlmICh0eC5nZXRJc091dGdvaW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNPdXRnb2luZyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCB0cmFuc2ZlcnMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnkpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIHR4cyB3aXRob3V0IHJlcXVlc3RlZCB0cmFuc2ZlclxuICAgICAgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPdXRwdXRzQXV4KHF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBiZSBxdWVyaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaW5kaWNlcy5zZXQocXVlcnkuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzLnNpemUgPyBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKSA6IHVuZGVmaW5lZCk7ICAvLyB1bmRlZmluZWQgd2lsbCBmZXRjaCBmcm9tIGFsbCBzdWJhZGRyZXNzZXNcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0LmVxdWFsKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpLCB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIilcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgfHwgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDAsIFwiUXVlcnkgc3BlY2lmaWVzIHN1YmFkZHJlc3MgaW5kaWNlcyBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBpbmRpY2VzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50SW5kaWNlcygpOyAgLy8gZmV0Y2ggYWxsIGFjY291bnQgaW5kaWNlcyB3aXRob3V0IHN1YmFkZHJlc3Nlc1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4cyB3aXRoIG91dHB1dHMgZm9yIGVhY2ggaW5kaWNhdGVkIGFjY291bnQgdXNpbmcgYGluY29taW5nX3RyYW5zZmVyc2AgcnBjIGNhbGxcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMudHJhbnNmZXJfdHlwZSA9IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gdHJ1ZSA/IFwidW5hdmFpbGFibGVcIiA6IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gZmFsc2UgPyBcImF2YWlsYWJsZVwiIDogXCJhbGxcIjtcbiAgICBwYXJhbXMudmVyYm9zZSA9IHRydWU7XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gaW5kaWNlcy5nZXQoYWNjb3VudElkeCk7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImluY29taW5nX3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgICAgXG4gICAgICAvLyBjb252ZXJ0IHJlc3BvbnNlIHRvIHR4cyB3aXRoIG91dHB1dHMgYW5kIG1lcmdlXG4gICAgICBpZiAocmVzcC5yZXN1bHQudHJhbnNmZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgZm9yIChsZXQgcnBjT3V0cHV0IG9mIHJlc3AucmVzdWx0LnRyYW5zZmVycykge1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aE91dHB1dChycGNPdXRwdXQpO1xuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzXG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gc29ydCBvdXRwdXRzXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHR4LmdldE91dHB1dHMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlT3V0cHV0cyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnkpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIGV4Y2x1ZGVkIHR4cyBmcm9tIGJsb2NrXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbW1vbiBtZXRob2QgdG8gZ2V0IGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0gYWxsIC0gcGVjaWZpZXMgdG8gZ2V0IGFsbCB4b3Igb25seSBuZXcgaW1hZ2VzIGZyb20gbGFzdCBpbXBvcnRcbiAgICogQHJldHVybiB7TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHR9IHRoZSBrZXkgaW1hZ2VzIGFuZCB0aGVpciBvZmZzZXQgYW1vbmcgdGhlIHdhbGxldCdzIG91dHB1dHNcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X2tleV9pbWFnZXNcIiwge2FsbDogYWxsfSk7XG4gICAgbGV0IGtleUltYWdlcyA9IChyZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcyB8fCBbXSkubWFwKHJwY0ltYWdlID0+IG5ldyBNb25lcm9LZXlJbWFnZShycGNJbWFnZS5rZXlfaW1hZ2UsIHJwY0ltYWdlLnNpZ25hdHVyZSkpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQoKS5zZXRPZmZzZXQocmVzcC5yZXN1bHQub2Zmc2V0KS5zZXRLZXlJbWFnZXMoa2V5SW1hZ2VzKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHJwY1N3ZWVwQWNjb3VudChjb25maWc6IE1vbmVyb1R4Q29uZmlnKSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFuIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJFbXB0eSBsaXN0IGdpdmVuIGZvciBzdWJhZGRyZXNzZXMgaW5kaWNlcyB0byBzd2VlcFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyB3aXRoIFJQQyBgc3dlZXBfYWxsYFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwaW5nIG91dHB1dCBkb2VzIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBhbGwgc3ViYWRkcmVzc2VzIGlmIG5vdCBvdGhlcndpc2UgZGVmaW5lZFxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXMoW10pO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gc3ViYWRkcmVzc2VzIHRvIHN3ZWVwIGZyb21cIik7XG4gICAgXG4gICAgLy8gY29tbW9uIGNvbmZpZyBwYXJhbXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9ICFyZWxheTtcbiAgICBwYXJhbXMuYmVsb3dfYW1vdW50ID0gY29uZmlnLmdldEJlbG93QW1vdW50KCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gaW52b2tlIHdhbGxldCBycGMgYHN3ZWVwX2FsbGBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2FsbFwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHVuZGVmaW5lZCwgY29uZmlnKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICBsZXQgdHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgoY29uZmlnLmdldEFjY291bnRJbmRleCgpKTtcbiAgICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbZGVzdGluYXRpb25dKTtcbiAgICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgICAgaWYgKHR4LmdldFJlbGF5KCkpIHtcbiAgICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMud2FsbGV0UG9sbGVyID0gbmV3IFdhbGxldFBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICAvKipcbiAgICogUG9sbCBpZiBsaXN0ZW5pbmcuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcG9sbCgpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndhbGxldFBvbGxlci5pc1BvbGxpbmcpIGF3YWl0IHRoaXMud2FsbGV0UG9sbGVyLnBvbGwoKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb1dhbGxldENvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIgfHwgKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICBlbHNlIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvV2FsbGV0Q29uZmlnO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGNyaXRlcmlhIHdoaWNoIHJlcXVpcmVzIGxvb2tpbmcgdXAgb3RoZXIgdHJhbnNmZXJzL291dHB1dHMgdG9cbiAgICogZnVsZmlsbCBxdWVyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gcXVlcnkgLSB0aGUgcXVlcnkgdG8gZGVjb250ZXh0dWFsaXplXG4gICAqIEByZXR1cm4ge01vbmVyb1R4UXVlcnl9IGEgcmVmZXJlbmNlIHRvIHRoZSBxdWVyeSBmb3IgY29udmVuaWVuY2VcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb250ZXh0dWFsaXplKHF1ZXJ5KSB7XG4gICAgcXVlcnkuc2V0SXNJbmNvbWluZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElzT3V0Z29pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzQ29udGV4dHVhbChxdWVyeSkge1xuICAgIGlmICghcXVlcnkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIXF1ZXJ5LmdldFR4UXVlcnkoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNJbmNvbWluZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNPdXRnb2luZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0T3V0cHV0UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciBvdXRwdXRzXG4gICAgfSBlbHNlIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb091dHB1dFF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldFRyYW5zZmVyUXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicXVlcnkgbXVzdCBiZSB0eCBvciB0cmFuc2ZlciBxdWVyeVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpIHtcbiAgICBsZXQgYWNjb3VudCA9IG5ldyBNb25lcm9BY2NvdW50KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0FjY291bnQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQWNjb3VudFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIGFjY291bnQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIGFjY291bnQuc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBhY2NvdW50LnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFzZV9hZGRyZXNzXCIpIGFjY291bnQuc2V0UHJpbWFyeUFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YWdcIikgYWNjb3VudC5zZXRUYWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IH0gLy8gbGFiZWwgYmVsb25ncyB0byBmaXJzdCBzdWJhZGRyZXNzXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBhY2NvdW50IGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSBhY2NvdW50LmdldFRhZygpKSBhY2NvdW50LnNldFRhZyh1bmRlZmluZWQpO1xuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpIHtcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N1YmFkZHJlc3MpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3ViYWRkcmVzc1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc19pbmRleFwiKSBzdWJhZGRyZXNzLnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBzdWJhZGRyZXNzLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3Vuc3BlbnRfb3V0cHV0c1wiKSBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyBpZiAodmFsKSBzdWJhZGRyZXNzLnNldExhYmVsKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VkXCIpIHN1YmFkZHJlc3Muc2V0SXNVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tzX3RvX3VubG9ja1wiKSBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT0gXCJ0aW1lX3RvX3VubG9ja1wiKSB7fSAgLy8gaWdub3JpbmdcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHN1YmFkZHJlc3MgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHNlbnQgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgY29weURlc3RpbmF0aW9ucyBhZnRlciA+MTguMy4xIHdoZW4gc3VidHJhY3RGZWVGcm9tIGZ1bGx5IHN1cHBvcnRlZFxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc2VuZCBjb25maWdcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gW3R4XSAtIGV4aXN0aW5nIHRyYW5zYWN0aW9uIHRvIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvcHlEZXN0aW5hdGlvbnMgLSBjb3BpZXMgY29uZmlnIGRlc3RpbmF0aW9ucyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgc2VuZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBpbml0U2VudFR4V2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4sIHR4LCBjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgIHR4LnNldEluVHhQb29sKHJlbGF5KTtcbiAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICB0eC5zZXRSaW5nU2l6ZShNb25lcm9VdGlscy5SSU5HX1NJWkUpO1xuICAgIGxldCB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgdHJhbnNmZXIuc2V0VHgodHgpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApKTsgLy8gd2Uga25vdyBzcmMgc3ViYWRkcmVzcyBpbmRpY2VzIGlmZiBjb25maWcgc3BlY2lmaWVzIDFcbiAgICBpZiAoY29weURlc3RpbmF0aW9ucykge1xuICAgICAgbGV0IGRlc3RDb3BpZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGRlc3Qgb2YgY29uZmlnLmdldERlc3RpbmF0aW9ucygpKSBkZXN0Q29waWVzLnB1c2goZGVzdC5jb3B5KCkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RDb3BpZXMpO1xuICAgIH1cbiAgICB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkge1xuICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgaWYgKHR4LmdldElzRG91YmxlU3BlbmRTZWVuKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHR4IHNldCBmcm9tIGEgUlBDIG1hcCBleGNsdWRpbmcgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY01hcCAtIG1hcCB0byBpbml0aWFsaXplIHRoZSB0eCBzZXQgZnJvbVxuICAgKiBAcmV0dXJuIE1vbmVyb1R4U2V0IC0gaW5pdGlhbGl6ZWQgdHggc2V0XG4gICAqIEByZXR1cm4gdGhlIHJlc3VsdGluZyB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4U2V0KHJwY01hcCkge1xuICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldCgpO1xuICAgIHR4U2V0LnNldE11bHRpc2lnVHhIZXgocnBjTWFwLm11bHRpc2lnX3R4c2V0KTtcbiAgICB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHJwY01hcC51bnNpZ25lZF90eHNldCk7XG4gICAgdHhTZXQuc2V0U2lnbmVkVHhIZXgocnBjTWFwLnNpZ25lZF90eHNldCk7XG4gICAgaWYgKHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldE11bHRpc2lnVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0VW5zaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRTaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0U2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBNb25lcm9UeFNldCBmcm9tIGEgbGlzdCBvZiBycGMgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4cyAtIHJwYyB0eHMgdG8gaW5pdGlhbGl6ZSB0aGUgc2V0IGZyb21cbiAgICogQHBhcmFtIHR4cyAtIGV4aXN0aW5nIHR4cyB0byBmdXJ0aGVyIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGNvbnZlcnRlZCB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJwY1R4czogYW55LCB0eHM/OiBhbnksIGNvbmZpZz86IGFueSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHNoYXJlZCB0eCBzZXRcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4cyk7XG5cbiAgICAvLyBnZXQgbnVtYmVyIG9mIHR4c1xuICAgIGxldCBudW1UeHMgPSBycGNUeHMuZmVlX2xpc3QgPyBycGNUeHMuZmVlX2xpc3QubGVuZ3RoIDogcnBjVHhzLnR4X2hhc2hfbGlzdCA/IHJwY1R4cy50eF9oYXNoX2xpc3QubGVuZ3RoIDogMDtcbiAgICBcbiAgICAvLyBkb25lIGlmIHJwYyByZXNwb25zZSBjb250YWlucyBubyB0eHNcbiAgICBpZiAobnVtVHhzID09PSAwKSB7XG4gICAgICBhc3NlcnQuZXF1YWwodHhzLCB1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIHR4U2V0O1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBpZiBub25lIGdpdmVuXG4gICAgaWYgKHR4cykgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHR4cy5wdXNoKG5ldyBNb25lcm9UeFdhbGxldCgpKTtcbiAgICB9XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIH1cbiAgICB0eFNldC5zZXRUeHModHhzKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJwYyBsaXN0c1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeHMpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4X2hhc2hfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEhhc2godmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEtleSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JfbGlzdFwiIHx8IGtleSA9PT0gXCJ0eF9yYXdfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZ1bGxIZXgodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0TWV0YWRhdGEodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZlZShCaWdJbnQodmFsW2ldKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRXZWlnaHQodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfbGlzdFwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT0gdW5kZWZpbmVkKSB0eHNbaV0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgfHwga2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgfHwga2V5ID09PSBcInNpZ25lZF90eHNldFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNfbGlzdFwiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlc0xpc3QgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRLZXlJbWFnZXNMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eHNbaV0uZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgICAgdHhzW2ldLnNldElucHV0cyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlc0xpc3RbaV1bXCJrZXlfaW1hZ2VzXCJdKSB7XG4gICAgICAgICAgICB0eHNbaV0uZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RfbGlzdFwiKSB7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0TGlzdCA9IHZhbDtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uSWR4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IGFtb3VudHNCeURlc3RMaXN0Lmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gYW1vdW50c0J5RGVzdExpc3RbdHhJZHhdW1wiYW1vdW50c1wiXTtcbiAgICAgICAgICBpZiAodHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCkgdHhzW3R4SWR4XS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW3R4SWR4XSkpO1xuICAgICAgICAgIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHNCeURlc3QpIHtcbiAgICAgICAgICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID09PSAxKSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpOyAvLyBzd2VlcGluZyBjYW4gY3JlYXRlIG11bHRpcGxlIHR4cyB3aXRoIG9uZSBhZGRyZXNzXG4gICAgICAgICAgICBlbHNlIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtkZXN0aW5hdGlvbklkeCsrXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHJwYyB0eCB3aXRoIGEgdHJhbnNmZXIgdG8gYSB0eCBzZXQgd2l0aCBhIHR4IGFuZCB0cmFuc2Zlci5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgaW5pdGlhbGl6ZWQgdHggc2V0IHdpdGggYSB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhUb1R4U2V0KHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKSB7XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeCk7XG4gICAgdHhTZXQuc2V0VHhzKFtNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKS5zZXRUeFNldCh0eFNldCldKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBCdWlsZHMgYSBNb25lcm9UeFdhbGxldCBmcm9tIGEgUlBDIHR4LlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gaXMgdGhlIGluaXRpYWxpemVkIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeDogYW55LCB0eD86IGFueSwgaXNPdXRnb2luZz86IGFueSwgY29uZmlnPzogYW55KSB7ICAvLyBUT0RPOiBjaGFuZ2UgZXZlcnl0aGluZyB0byBzYWZlIHNldFxuICAgICAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHRvIHJldHVyblxuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzdGF0ZSBmcm9tIHJwYyB0eXBlXG4gICAgaWYgKHJwY1R4LnR5cGUgIT09IHVuZGVmaW5lZCkgaXNPdXRnb2luZyA9IE1vbmVyb1dhbGxldFJwYy5kZWNvZGVScGNUeXBlKHJwY1R4LnR5cGUsIHR4KTtcbiAgICBlbHNlIGFzc2VydC5lcXVhbCh0eXBlb2YgaXNPdXRnb2luZywgXCJib29sZWFuXCIsIFwiTXVzdCBpbmRpY2F0ZSBpZiB0eCBpcyBvdXRnb2luZyAodHJ1ZSkgeG9yIGluY29taW5nIChmYWxzZSkgc2luY2UgdW5rbm93blwiKTtcbiAgICBcbiAgICAvLyBUT0RPOiBzYWZlIHNldFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGZpZWxkcyAgVE9ETzogc2VlbXMgdGhpcyBzaG91bGQgYmUgcGFydCBvZiBjb21tb24gZnVuY3Rpb24gd2l0aCBEYWVtb25ScGMuY29udmVydFJwY1R4XG4gICAgbGV0IGhlYWRlcjtcbiAgICBsZXQgdHJhbnNmZXI7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4aWRcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSB0eC5zZXRGZWUoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdGVcIikgeyBpZiAodmFsKSB0eC5zZXROb3RlKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlcIikgdHguc2V0S2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHlwZVwiKSB7IH0gLy8gdHlwZSBhbHJlYWR5IGhhbmRsZWRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9zaXplXCIpIHR4LnNldFNpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSB0eC5zZXRVbmxvY2tUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIHR4LnNldFdlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JcIikgdHguc2V0RnVsbEhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhXCIpIHR4LnNldE1ldGFkYXRhKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kX3NlZW5cIikgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIiB8fCBrZXkgPT09IFwiaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGltZXN0YW1wXCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldFRpbWVzdGFtcCh2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHRpbWVzdGFtcCBvZiB1bmNvbmZpcm1lZCB0eCBpcyBjdXJyZW50IHJlcXVlc3QgdGltZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29uZmlybWF0aW9uc1wiKSB0eC5zZXROdW1Db25maXJtYXRpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VnZ2VzdGVkX2NvbmZpcm1hdGlvbnNfdGhyZXNob2xkXCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHRyYW5zZmVyLnNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c1wiKSB7fSAgLy8gaWdub3JpbmcsIGFtb3VudHMgc3VtIHRvIGFtb3VudFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikge1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldEFkZHJlc3ModmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBheW1lbnRfaWRcIikge1xuICAgICAgICBpZiAoXCJcIiAhPT0gdmFsICYmIE1vbmVyb1R4V2FsbGV0LkRFRkFVTFRfUEFZTUVOVF9JRCAhPT0gdmFsKSB0eC5zZXRQYXltZW50SWQodmFsKTsgIC8vIGRlZmF1bHQgaXMgdW5kZWZpbmVkXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSBhc3NlcnQocnBjVHguc3ViYWRkcl9pbmRpY2VzKTsgIC8vIGhhbmRsZWQgYnkgc3ViYWRkcl9pbmRpY2VzXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRpY2VzXCIpIHtcbiAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGxldCBycGNJbmRpY2VzID0gdmFsO1xuICAgICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgocnBjSW5kaWNlc1swXS5tYWpvcik7XG4gICAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgZm9yIChsZXQgcnBjSW5kZXggb2YgcnBjSW5kaWNlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChycGNJbmRleC5taW5vcik7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFzc2VydC5lcXVhbChycGNJbmRpY2VzLmxlbmd0aCwgMSk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGV4KHJwY0luZGljZXNbMF0ubWlub3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGVzdGluYXRpb25zXCIgfHwga2V5ID09IFwicmVjaXBpZW50c1wiKSB7XG4gICAgICAgIGFzc2VydChpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBycGNEZXN0aW5hdGlvbiBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgZGVzdGluYXRpb24gPSBuZXcgTW9uZXJvRGVzdGluYXRpb24oKTtcbiAgICAgICAgICBkZXN0aW5hdGlvbnMucHVzaChkZXN0aW5hdGlvbik7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb25LZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzdGluYXRpb24pKSB7XG4gICAgICAgICAgICBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYWRkcmVzc1wiKSBkZXN0aW5hdGlvbi5zZXRBZGRyZXNzKHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSk7XG4gICAgICAgICAgICBlbHNlIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhbW91bnRcIikgZGVzdGluYXRpb24uc2V0QW1vdW50KEJpZ0ludChycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pKTtcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5yZWNvZ25pemVkIHRyYW5zYWN0aW9uIGRlc3RpbmF0aW9uIGZpZWxkOiBcIiArIGRlc3RpbmF0aW9uS2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoe3R4OiB0eH0pO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdGluYXRpb25zKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzb3VyY2VzXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgcnBjU291cmNlIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBpbnB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgaW5wdXQuc2V0QW1vdW50KEJpZ0ludChycGNTb3VyY2UuYW1vdW50KSk7XG4gICAgICAgICAgaW5wdXQuc2V0SW5kZXgocnBjU291cmNlLmdsb2JhbF9pbmRleCk7XG4gICAgICAgICAgaWYgKHJwY1NvdXJjZS5wdWJrZXkgIT09IHVuZGVmaW5lZCkgaW5wdXQuc2V0U3RlYWx0aFB1YmxpY0tleShycGNTb3VyY2UucHVia2V5LnN1YnN0cmluZygwLCA2NCkpOyAvLyBkZXN0IGtleSBvZiBkZXN0fHxtYXNrXG4gICAgICAgICAgdHguZ2V0SW5wdXRzKCkucHVzaChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfaW5cIikgdHguc2V0SW5wdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9vdXRcIikgdHguc2V0T3V0cHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYWRkcmVzc1wiKSB0eC5zZXRDaGFuZ2VBZGRyZXNzKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2Ftb3VudFwiKSB0eC5zZXRDaGFuZ2VBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImR1bW15X291dHB1dHNcIikgdHguc2V0TnVtRHVtbXlPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXh0cmFcIikgdHguc2V0RXh0cmFIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyaW5nX3NpemVcIikgdHguc2V0UmluZ1NpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzXCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzID0gdmFsLmtleV9pbWFnZXM7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHR4LnNldElucHV0cyhbXSk7XG4gICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXMpIHtcbiAgICAgICAgICB0eC5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RcIikge1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IHZhbC5hbW91bnRzO1xuICAgICAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCwgYW1vdW50c0J5RGVzdC5sZW5ndGgpO1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbaV0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50c0J5RGVzdFtpXSkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQgd2l0aCB0cmFuc2ZlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBsaW5rIGJsb2NrIGFuZCB0eFxuICAgIGlmIChoZWFkZXIpIHR4LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jayhoZWFkZXIpLnNldFR4cyhbdHhdKSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmaW5hbCBmaWVsZHNcbiAgICBpZiAodHJhbnNmZXIpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpID09PSB1bmRlZmluZWQpIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIGlmICghdHJhbnNmZXIuZ2V0VHgoKS5nZXRJc0NvbmZpcm1lZCgpKSB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSkge1xuICAgICAgICAgIGlmICh0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyh1bmRlZmluZWQpOyAvLyBvdmVyd3JpdGUgdG8gYXZvaWQgcmVjb25jaWxlIGVycm9yIFRPRE86IHJlbW92ZSBhZnRlciA+MTguMy4xIHdoZW4gYW1vdW50c19ieV9kZXN0IHN1cHBvcnRlZFxuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5tZXJnZSh0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgICAgIHR4LnNldEluY29taW5nVHJhbnNmZXJzKFt0cmFuc2Zlcl0pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gaW5pdGlhbGl6ZWQgdHJhbnNhY3Rpb25cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aE91dHB1dChycGNPdXRwdXQpIHtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh7dHg6IHR4fSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50XCIpIG91dHB1dC5zZXRJc1NwZW50KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5X2ltYWdlXCIpIHsgaWYgKFwiXCIgIT09IHZhbCkgb3V0cHV0LnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSh2YWwpKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdsb2JhbF9pbmRleFwiKSBvdXRwdXQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcm96ZW5cIikgb3V0cHV0LnNldElzRnJvemVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHVia2V5XCIpIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSB7XG4gICAgICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgodmFsLm1ham9yKTtcbiAgICAgICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleCh2YWwubWlub3IpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB0eC5zZXRCbG9jaygobmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KHZhbCkgYXMgTW9uZXJvQmxvY2spLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHdpdGggb3V0cHV0XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRlc2NcIikge1xuICAgICAgICB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICBmb3IgKGxldCB0eE1hcCBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHR4TWFwLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgICAgICB0eFNldC5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1bW1hcnlcIikgeyB9IC8vIFRPRE86IHN1cHBvcnQgdHggc2V0IHN1bW1hcnkgZmllbGRzP1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZGVzY2RyaWJlIHRyYW5zZmVyIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZXMgYSBcInR5cGVcIiBmcm9tIG1vbmVyby13YWxsZXQtcnBjIHRvIGluaXRpYWxpemUgdHlwZSBhbmQgc3RhdGVcbiAgICogZmllbGRzIGluIHRoZSBnaXZlbiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHRoZXNlIHNob3VsZCBiZSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R5cGUgaXMgdGhlIHR5cGUgdG8gZGVjb2RlXG4gICAqIEBwYXJhbSB0eCBpcyB0aGUgdHJhbnNhY3Rpb24gdG8gZGVjb2RlIGtub3duIGZpZWxkcyB0b1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBycGMgdHlwZSBpbmRpY2F0ZXMgb3V0Z29pbmcgeG9yIGluY29taW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29kZVJwY1R5cGUocnBjVHlwZSwgdHgpIHtcbiAgICBsZXQgaXNPdXRnb2luZztcbiAgICBpZiAocnBjVHlwZSA9PT0gXCJpblwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwib3V0XCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBvb2xcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7ICAvLyBUT0RPOiBidXQgY291bGQgaXQgYmU/XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiYmxvY2tcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkpIHtcbiAgICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2QmFsYW5jZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIGxldCBtaXNzZWRDb25maXJtID0gdW5sb2NrZWRUeC5nZXRJc0NvbmZpcm1lZCgpICYmICF0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zLmhhcyh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zLmRlbGV0ZSh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmIChtaXNzZWRDb25maXJtKSB7IC8vIGFubm91bmNlIG1pc3NlZCBjb25maXJtIHRyYW5zaXRpb24gaWYgdHggdW5sb2NrZWQgYmV0d2VlbiBwb2xsc1xuICAgICAgICAgICAgbGV0IGNvbmZpcm1lZFR4ID0gdW5sb2NrZWRUeC5jb3B5KCkuc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICAgICAgICBjb25maXJtZWRUeC5zZXRCbG9jayh1bmxvY2tlZFR4LmdldEJsb2NrKCkuY29weSgpLnNldFR4cyhbY29uZmlybWVkVHhdKSk7XG4gICAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHMoY29uZmlybWVkVHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGlmICh0aGF0LmlzUG9sbGluZykgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHBvbGwgd2FsbGV0ICdcIiArIGF3YWl0IHRoYXQud2FsbGV0LmdldFBhdGgoKSArIFwiJzogXCIgKyBlcnIubWVzc2FnZSk7IC8vIGlnbm9yZSBlcnJvcnMgZnJvbSBwb2xscyBzdHJhZ2dsaW5nIGFmdGVyIHRoZSB3YWxsZXQgaXMgY2xvc2VkXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG5vdGlmeU91dHB1dHModHgpIHtcbiAgXG4gICAgLy8gbm90aWZ5IHNwZW50IG91dHB1dHMgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdHggaW5wdXRzIHNvIHByb3ZpZGluZyBvbmUgaW5wdXQgd2l0aCBvdXRnb2luZyBhbW91bnRcbiAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydCh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAuc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSArIHR4LmdldEZlZSgpKVxuICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxID8gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKClbMF0gOiB1bmRlZmluZWQpIC8vIGluaXRpYWxpemUgaWYgdHJhbnNmZXIgc291cmNlZCBmcm9tIHNpbmdsZSBzdWJhZGRyZXNzXG4gICAgICAgICAgLnNldFR4KHR4KTtcbiAgICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSByZWNlaXZlZCBvdXRwdXRzXG4gICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dHB1dHMoKS5sZW5ndGggPiAwKSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogb3V0cHV0cyBvbmx5IHJldHVybmVkIGZvciBjb25maXJtZWQgdHhzXG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHVuY29uZmlybWVkIHJlY2VpdmVkIG91dHB1dHMgc28gdXNpbmcgaW5jb21pbmcgdHJhbnNmZXIgdmFsdWVzXG4gICAgICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgICBvdXRwdXRzLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHJhbnNmZXIuZ2V0QWNjb3VudEluZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHJhbnNmZXIuZ2V0U3ViYWRkcmVzc0luZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRBbW91bnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpXG4gICAgICAgICAgICAgIC5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICAgIHR4LnNldE91dHB1dHMob3V0cHV0cyk7XG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBnZXRUeCh0eHMsIHR4SGFzaCkge1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykgaWYgKHR4SGFzaCA9PT0gdHguZ2V0SGFzaCgpKSByZXR1cm4gdHg7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCkge1xuICAgIGxldCBiYWxhbmNlcyA9IGF3YWl0IHRoaXMud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgaWYgKGJhbGFuY2VzWzBdICE9PSB0aGlzLnByZXZCYWxhbmNlc1swXSB8fCBiYWxhbmNlc1sxXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMV0pIHtcbiAgICAgIHRoaXMucHJldkJhbGFuY2VzID0gYmFsYW5jZXM7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChiYWxhbmNlc1swXSwgYmFsYW5jZXNbMV0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsV0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksY0FBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssaUJBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLHVCQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxZQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxrQkFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsbUJBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGNBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLGtCQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxZQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYSx1QkFBQSxHQUFBZCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWMsd0JBQUEsR0FBQWYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFlLGVBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0IsMkJBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsMkJBQUEsR0FBQWxCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0IsbUJBQUEsR0FBQW5CLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBbUIseUJBQUEsR0FBQXBCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBb0IseUJBQUEsR0FBQXJCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBcUIsdUJBQUEsR0FBQXRCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBc0Isa0JBQUEsR0FBQXZCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBdUIsbUJBQUEsR0FBQXhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBd0Isb0JBQUEsR0FBQXpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBeUIsZUFBQSxHQUFBMUIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUEwQixpQkFBQSxHQUFBM0Isc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUEyQixpQkFBQSxHQUFBNUIsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBNEIsb0JBQUEsR0FBQTdCLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQTZCLGVBQUEsR0FBQTlCLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQThCLGNBQUEsR0FBQS9CLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBK0IsWUFBQSxHQUFBaEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFnQyxlQUFBLEdBQUFqQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlDLFlBQUEsR0FBQWxDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0MsY0FBQSxHQUFBbkMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtQyxhQUFBLEdBQUFwQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW9DLG1CQUFBLEdBQUFyQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFDLHFCQUFBLEdBQUF0QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXNDLDJCQUFBLEdBQUF2QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXVDLDZCQUFBLEdBQUF4QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXdDLFdBQUEsR0FBQXpDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBeUMsV0FBQSxHQUFBMUMsc0JBQUEsQ0FBQUMsT0FBQSwwQkFBOEMsU0FBQTBDLHdCQUFBQyxDQUFBLEVBQUFDLENBQUEsNEJBQUFDLE9BQUEsTUFBQUMsQ0FBQSxPQUFBRCxPQUFBLEdBQUFFLENBQUEsT0FBQUYsT0FBQSxXQUFBSCx1QkFBQSxZQUFBQSxDQUFBQyxDQUFBLEVBQUFDLENBQUEsUUFBQUEsQ0FBQSxJQUFBRCxDQUFBLElBQUFBLENBQUEsQ0FBQUssVUFBQSxTQUFBTCxDQUFBLEtBQUFNLENBQUEsQ0FBQUMsQ0FBQSxDQUFBQyxDQUFBLEtBQUFDLFNBQUEsUUFBQUMsT0FBQSxFQUFBVixDQUFBLGdCQUFBQSxDQUFBLHVCQUFBQSxDQUFBLHlCQUFBQSxDQUFBLFNBQUFRLENBQUEsS0FBQUYsQ0FBQSxHQUFBTCxDQUFBLEdBQUFHLENBQUEsR0FBQUQsQ0FBQSxPQUFBRyxDQUFBLENBQUFLLEdBQUEsQ0FBQVgsQ0FBQSxVQUFBTSxDQUFBLENBQUFNLEdBQUEsQ0FBQVosQ0FBQSxDQUFBTSxDQUFBLEVBQUFPLEdBQUEsQ0FBQWIsQ0FBQSxFQUFBUSxDQUFBLGNBQUFQLENBQUEsSUFBQUQsQ0FBQSxnQkFBQUMsQ0FBQSxPQUFBYSxjQUFBLENBQUFDLElBQUEsQ0FBQWYsQ0FBQSxFQUFBQyxDQUFBLE9BQUFNLENBQUEsSUFBQUQsQ0FBQSxHQUFBVSxNQUFBLENBQUFDLGNBQUEsS0FBQUQsTUFBQSxDQUFBRSx3QkFBQSxDQUFBbEIsQ0FBQSxFQUFBQyxDQUFBLE9BQUFNLENBQUEsQ0FBQUssR0FBQSxJQUFBTCxDQUFBLENBQUFNLEdBQUEsSUFBQVAsQ0FBQSxDQUFBRSxDQUFBLEVBQUFQLENBQUEsRUFBQU0sQ0FBQSxJQUFBQyxDQUFBLENBQUFQLENBQUEsSUFBQUQsQ0FBQSxDQUFBQyxDQUFBLFVBQUFPLENBQUEsSUFBQVIsQ0FBQSxFQUFBQyxDQUFBOzs7QUFHOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDZSxNQUFNa0IsZUFBZSxTQUFTQyxxQkFBWSxDQUFDOztFQUV4RDtFQUNBLE9BQTBCQyx5QkFBeUIsR0FBRyxLQUFLLENBQUMsQ0FBQzs7RUFFN0Q7Ozs7Ozs7Ozs7O0VBV0E7RUFDQUMsV0FBV0EsQ0FBQ0MsTUFBMEIsRUFBRTtJQUN0QyxLQUFLLENBQUMsQ0FBQztJQUNQLElBQUksQ0FBQ0EsTUFBTSxHQUFHQSxNQUFNO0lBQ3BCLElBQUksQ0FBQ0MsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsSUFBSSxDQUFDQyxjQUFjLEdBQUdOLGVBQWUsQ0FBQ0UseUJBQXlCO0VBQ2pFOztFQUVBOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUssVUFBVUEsQ0FBQSxFQUFpQjtJQUN6QixPQUFPLElBQUksQ0FBQ0MsT0FBTztFQUNyQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNQyxXQUFXQSxDQUFDQyxLQUFLLEdBQUcsS0FBSyxFQUFnQztJQUM3RCxJQUFJLElBQUksQ0FBQ0YsT0FBTyxLQUFLRyxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHVEQUF1RCxDQUFDO0lBQzlHLElBQUlDLGFBQWEsR0FBR0MsaUJBQVEsQ0FBQ0MsU0FBUyxDQUFDLElBQUksQ0FBQ0MsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUMzRCxLQUFLLElBQUlDLFFBQVEsSUFBSUosYUFBYSxFQUFFLE1BQU0sSUFBSSxDQUFDSyxjQUFjLENBQUNELFFBQVEsQ0FBQztJQUN2RSxPQUFPSCxpQkFBUSxDQUFDSyxXQUFXLENBQUMsSUFBSSxDQUFDWCxPQUFPLEVBQUVFLEtBQUssR0FBRyxTQUFTLEdBQUdDLFNBQVMsQ0FBQztFQUMxRTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VTLGdCQUFnQkEsQ0FBQSxFQUFvQztJQUNsRCxPQUFPLElBQUksQ0FBQ2hCLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDO0VBQ2hDOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1DLFVBQVVBLENBQUNDLFlBQWtELEVBQUVDLFFBQWlCLEVBQTRCOztJQUVoSDtJQUNBLElBQUlwQixNQUFNLEdBQUcsSUFBSXFCLDJCQUFrQixDQUFDLE9BQU9GLFlBQVksS0FBSyxRQUFRLEdBQUcsRUFBQ0csSUFBSSxFQUFFSCxZQUFZLEVBQUVDLFFBQVEsRUFBRUEsUUFBUSxHQUFHQSxRQUFRLEdBQUcsRUFBRSxFQUFDLEdBQUdELFlBQVksQ0FBQztJQUMvSTs7SUFFQTtJQUNBLElBQUksQ0FBQ25CLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJZixvQkFBVyxDQUFDLHFDQUFxQyxDQUFDO0lBQ25GLElBQUlSLE1BQU0sQ0FBQ3dCLFVBQVUsQ0FBQyxDQUFDLEtBQUtqQixTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHFEQUFxRCxDQUFDO0lBQ25ILE1BQU0sSUFBSSxDQUFDUixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUNDLFFBQVEsRUFBRTFCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUVILFFBQVEsRUFBRXBCLE1BQU0sQ0FBQzJCLFdBQVcsQ0FBQyxDQUFDLEVBQUMsQ0FBQztJQUMxSCxNQUFNLElBQUksQ0FBQ0MsS0FBSyxDQUFDLENBQUM7SUFDbEIsSUFBSSxDQUFDTixJQUFJLEdBQUd0QixNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQzs7SUFFNUI7SUFDQSxJQUFJdkIsTUFBTSxDQUFDNkIsb0JBQW9CLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtNQUN6QyxJQUFJN0IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUlULG9CQUFXLENBQUMsdUVBQXVFLENBQUM7TUFDdEgsTUFBTSxJQUFJLENBQUNzQixvQkFBb0IsQ0FBQzlCLE1BQU0sQ0FBQzZCLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUNoRSxDQUFDLE1BQU0sSUFBSTdCLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFO01BQ3JDLE1BQU0sSUFBSSxDQUFDYyxtQkFBbUIsQ0FBQy9CLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDcEQ7O0lBRUEsT0FBTyxJQUFJO0VBQ2I7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTWUsWUFBWUEsQ0FBQ2hDLE1BQW1DLEVBQTRCOztJQUVoRjtJQUNBLElBQUlBLE1BQU0sS0FBS08sU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyxzQ0FBc0MsQ0FBQztJQUN2RixNQUFNeUIsZ0JBQWdCLEdBQUcsSUFBSVosMkJBQWtCLENBQUNyQixNQUFNLENBQUM7SUFDdkQsSUFBSWlDLGdCQUFnQixDQUFDQyxPQUFPLENBQUMsQ0FBQyxLQUFLM0IsU0FBUyxLQUFLMEIsZ0JBQWdCLENBQUNFLGlCQUFpQixDQUFDLENBQUMsS0FBSzVCLFNBQVMsSUFBSTBCLGdCQUFnQixDQUFDRyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUs3QixTQUFTLElBQUkwQixnQkFBZ0IsQ0FBQ0ksa0JBQWtCLENBQUMsQ0FBQyxLQUFLOUIsU0FBUyxDQUFDLEVBQUU7TUFDak4sTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDREQUE0RCxDQUFDO0lBQ3JGO0lBQ0EsSUFBSXlCLGdCQUFnQixDQUFDVCxVQUFVLENBQUMsQ0FBQyxLQUFLakIsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyxzREFBc0QsQ0FBQztJQUM5SCxJQUFJeUIsZ0JBQWdCLENBQUNLLGNBQWMsQ0FBQyxDQUFDLEtBQUsvQixTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLGtHQUFrRyxDQUFDO0lBQzlLLElBQUl5QixnQkFBZ0IsQ0FBQ00sbUJBQW1CLENBQUMsQ0FBQyxLQUFLaEMsU0FBUyxJQUFJMEIsZ0JBQWdCLENBQUNPLHNCQUFzQixDQUFDLENBQUMsS0FBS2pDLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsd0ZBQXdGLENBQUM7SUFDcE8sSUFBSXlCLGdCQUFnQixDQUFDTixXQUFXLENBQUMsQ0FBQyxLQUFLcEIsU0FBUyxFQUFFMEIsZ0JBQWdCLENBQUNRLFdBQVcsQ0FBQyxFQUFFLENBQUM7O0lBRWxGO0lBQ0EsSUFBSVIsZ0JBQWdCLENBQUNKLG9CQUFvQixDQUFDLENBQUMsRUFBRTtNQUMzQyxJQUFJSSxnQkFBZ0IsQ0FBQ2hCLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJVCxvQkFBVyxDQUFDLHdFQUF3RSxDQUFDO01BQ2pJeUIsZ0JBQWdCLENBQUNTLFNBQVMsQ0FBQzFDLE1BQU0sQ0FBQzZCLG9CQUFvQixDQUFDLENBQUMsQ0FBQ2MsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUMzRTs7SUFFQTtJQUNBLElBQUlWLGdCQUFnQixDQUFDQyxPQUFPLENBQUMsQ0FBQyxLQUFLM0IsU0FBUyxFQUFFLE1BQU0sSUFBSSxDQUFDcUMsb0JBQW9CLENBQUNYLGdCQUFnQixDQUFDLENBQUM7SUFDM0YsSUFBSUEsZ0JBQWdCLENBQUNJLGtCQUFrQixDQUFDLENBQUMsS0FBSzlCLFNBQVMsSUFBSTBCLGdCQUFnQixDQUFDRSxpQkFBaUIsQ0FBQyxDQUFDLEtBQUs1QixTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUNzQyxvQkFBb0IsQ0FBQ1osZ0JBQWdCLENBQUMsQ0FBQztJQUNqSyxNQUFNLElBQUksQ0FBQ2Esa0JBQWtCLENBQUNiLGdCQUFnQixDQUFDOztJQUVwRDtJQUNBLElBQUlBLGdCQUFnQixDQUFDSixvQkFBb0IsQ0FBQyxDQUFDLEVBQUU7TUFDM0MsTUFBTSxJQUFJLENBQUNDLG9CQUFvQixDQUFDRyxnQkFBZ0IsQ0FBQ0osb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUMsTUFBTSxJQUFJSSxnQkFBZ0IsQ0FBQ2hCLFNBQVMsQ0FBQyxDQUFDLEVBQUU7TUFDdkMsTUFBTSxJQUFJLENBQUNjLG1CQUFtQixDQUFDRSxnQkFBZ0IsQ0FBQ2hCLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDOUQ7O0lBRUEsT0FBTyxJQUFJO0VBQ2I7O0VBRUEsTUFBZ0I2QixrQkFBa0JBLENBQUM5QyxNQUEwQixFQUFFO0lBQzdELElBQUlBLE1BQU0sQ0FBQytDLGFBQWEsQ0FBQyxDQUFDLEtBQUt4QyxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHVEQUF1RCxDQUFDO0lBQ3hILElBQUlSLE1BQU0sQ0FBQ2dELGdCQUFnQixDQUFDLENBQUMsS0FBS3pDLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsMERBQTBELENBQUM7SUFDOUgsSUFBSVIsTUFBTSxDQUFDaUQsY0FBYyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUUsTUFBTSxJQUFJekMsb0JBQVcsQ0FBQyxtRUFBbUUsQ0FBQztJQUNqSSxJQUFJLENBQUNSLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJZixvQkFBVyxDQUFDLHlCQUF5QixDQUFDO0lBQ3ZFLElBQUksQ0FBQ1IsTUFBTSxDQUFDa0QsV0FBVyxDQUFDLENBQUMsRUFBRWxELE1BQU0sQ0FBQ21ELFdBQVcsQ0FBQ3RELHFCQUFZLENBQUN1RCxnQkFBZ0IsQ0FBQztJQUM1RSxJQUFJQyxNQUFNLEdBQUcsRUFBRTNCLFFBQVEsRUFBRTFCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUVILFFBQVEsRUFBRXBCLE1BQU0sQ0FBQzJCLFdBQVcsQ0FBQyxDQUFDLEVBQUUyQixRQUFRLEVBQUV0RCxNQUFNLENBQUNrRCxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0csSUFBSTtNQUNGLE1BQU0sSUFBSSxDQUFDbEQsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsRUFBRTRCLE1BQU0sQ0FBQztJQUN4RSxDQUFDLENBQUMsT0FBT0UsR0FBUSxFQUFFO01BQ2pCLElBQUksQ0FBQ0MsdUJBQXVCLENBQUN4RCxNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQyxFQUFFZ0MsR0FBRyxDQUFDO0lBQ3JEO0lBQ0EsTUFBTSxJQUFJLENBQUMzQixLQUFLLENBQUMsQ0FBQztJQUNsQixJQUFJLENBQUNOLElBQUksR0FBR3RCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDO0lBQzVCLE9BQU8sSUFBSTtFQUNiOztFQUVBLE1BQWdCcUIsb0JBQW9CQSxDQUFDNUMsTUFBMEIsRUFBRTtJQUMvRCxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUNBLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyw4QkFBOEIsRUFBRTtRQUM1RUMsUUFBUSxFQUFFMUIsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUM7UUFDMUJILFFBQVEsRUFBRXBCLE1BQU0sQ0FBQzJCLFdBQVcsQ0FBQyxDQUFDO1FBQzlCOEIsSUFBSSxFQUFFekQsTUFBTSxDQUFDa0MsT0FBTyxDQUFDLENBQUM7UUFDdEJ3QixXQUFXLEVBQUUxRCxNQUFNLENBQUMrQyxhQUFhLENBQUMsQ0FBQztRQUNuQ1ksNEJBQTRCLEVBQUUzRCxNQUFNLENBQUM0RCxhQUFhLENBQUMsQ0FBQztRQUNwREMsY0FBYyxFQUFFN0QsTUFBTSxDQUFDZ0QsZ0JBQWdCLENBQUMsQ0FBQztRQUN6Q00sUUFBUSxFQUFFdEQsTUFBTSxDQUFDa0QsV0FBVyxDQUFDLENBQUM7UUFDOUJZLGdCQUFnQixFQUFFOUQsTUFBTSxDQUFDaUQsY0FBYyxDQUFDO01BQzFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxPQUFPTSxHQUFRLEVBQUU7TUFDakIsSUFBSSxDQUFDQyx1QkFBdUIsQ0FBQ3hELE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUVnQyxHQUFHLENBQUM7SUFDckQ7SUFDQSxNQUFNLElBQUksQ0FBQzNCLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQ04sSUFBSSxHQUFHdEIsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUM7SUFDNUIsT0FBTyxJQUFJO0VBQ2I7O0VBRUEsTUFBZ0JzQixvQkFBb0JBLENBQUM3QyxNQUEwQixFQUFFO0lBQy9ELElBQUlBLE1BQU0sQ0FBQytDLGFBQWEsQ0FBQyxDQUFDLEtBQUt4QyxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDBEQUEwRCxDQUFDO0lBQzNILElBQUlSLE1BQU0sQ0FBQ2dELGdCQUFnQixDQUFDLENBQUMsS0FBS3pDLFNBQVMsRUFBRVAsTUFBTSxDQUFDK0QsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLElBQUkvRCxNQUFNLENBQUNrRCxXQUFXLENBQUMsQ0FBQyxLQUFLM0MsU0FBUyxFQUFFUCxNQUFNLENBQUNtRCxXQUFXLENBQUN0RCxxQkFBWSxDQUFDdUQsZ0JBQWdCLENBQUM7SUFDekYsSUFBSTtNQUNGLE1BQU0sSUFBSSxDQUFDcEQsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG9CQUFvQixFQUFFO1FBQ2xFQyxRQUFRLEVBQUUxQixNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQztRQUMxQkgsUUFBUSxFQUFFcEIsTUFBTSxDQUFDMkIsV0FBVyxDQUFDLENBQUM7UUFDOUJxQyxPQUFPLEVBQUVoRSxNQUFNLENBQUNtQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25DOEIsT0FBTyxFQUFFakUsTUFBTSxDQUFDb0MsaUJBQWlCLENBQUMsQ0FBQztRQUNuQzhCLFFBQVEsRUFBRWxFLE1BQU0sQ0FBQ3FDLGtCQUFrQixDQUFDLENBQUM7UUFDckN3QixjQUFjLEVBQUU3RCxNQUFNLENBQUNnRCxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDYyxnQkFBZ0IsRUFBRTlELE1BQU0sQ0FBQ2lELGNBQWMsQ0FBQztNQUMxQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsT0FBT00sR0FBUSxFQUFFO01BQ2pCLElBQUksQ0FBQ0MsdUJBQXVCLENBQUN4RCxNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQyxFQUFFZ0MsR0FBRyxDQUFDO0lBQ3JEO0lBQ0EsTUFBTSxJQUFJLENBQUMzQixLQUFLLENBQUMsQ0FBQztJQUNsQixJQUFJLENBQUNOLElBQUksR0FBR3RCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDO0lBQzVCLE9BQU8sSUFBSTtFQUNiOztFQUVVaUMsdUJBQXVCQSxDQUFDVyxJQUFJLEVBQUVaLEdBQUcsRUFBRTtJQUMzQyxJQUFJQSxHQUFHLENBQUNhLE9BQU8sRUFBRTtNQUNmLElBQUliLEdBQUcsQ0FBQ2EsT0FBTyxDQUFDQyxXQUFXLENBQUMsQ0FBQyxDQUFDQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLElBQUlDLHVCQUFjLENBQUMseUJBQXlCLEdBQUdKLElBQUksRUFBRVosR0FBRyxDQUFDaUIsT0FBTyxDQUFDLENBQUMsRUFBRWpCLEdBQUcsQ0FBQ2tCLFlBQVksQ0FBQyxDQUFDLEVBQUVsQixHQUFHLENBQUNtQixZQUFZLENBQUMsQ0FBQyxDQUFDO01BQzNLLElBQUluQixHQUFHLENBQUNhLE9BQU8sQ0FBQ0MsV0FBVyxDQUFDLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLCtCQUErQixDQUFDLEVBQUUsTUFBTSxJQUFJQyx1QkFBYyxDQUFDLGtCQUFrQixFQUFFaEIsR0FBRyxDQUFDaUIsT0FBTyxDQUFDLENBQUMsRUFBRWpCLEdBQUcsQ0FBQ2tCLFlBQVksQ0FBQyxDQUFDLEVBQUVsQixHQUFHLENBQUNtQixZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzlLO0lBQ0EsTUFBTW5CLEdBQUc7RUFDWDs7RUFFQSxNQUFNb0IsVUFBVUEsQ0FBQSxFQUFxQjtJQUNuQyxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUMzRSxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUNtRCxRQUFRLEVBQUUsVUFBVSxFQUFDLENBQUM7TUFDbEYsT0FBTyxLQUFLLENBQUMsQ0FBQztJQUNoQixDQUFDLENBQUMsT0FBT25HLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsQ0FBQytGLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBRTtNQUN2QyxJQUFJL0YsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQyxDQUFFO01BQ3ZDLE1BQU0vRixDQUFDO0lBQ1Q7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1zRCxtQkFBbUJBLENBQUM4QyxlQUF1RCxFQUFFQyxTQUFtQixFQUFFQyxVQUF1QixFQUFpQjtJQUM5SSxJQUFJQyxVQUFVLEdBQUcsQ0FBQ0gsZUFBZSxHQUFHdEUsU0FBUyxHQUFHc0UsZUFBZSxZQUFZSSw0QkFBbUIsR0FBR0osZUFBZSxHQUFHLElBQUlJLDRCQUFtQixDQUFDSixlQUFlLENBQUM7SUFDM0osSUFBSSxDQUFDRSxVQUFVLEVBQUVBLFVBQVUsR0FBRyxJQUFJRyxtQkFBVSxDQUFDLENBQUM7SUFDOUMsSUFBSTdCLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQ1csT0FBTyxHQUFHZ0IsVUFBVSxHQUFHQSxVQUFVLENBQUNHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7SUFDL0Q5QixNQUFNLENBQUMrQixRQUFRLEdBQUdKLFVBQVUsR0FBR0EsVUFBVSxDQUFDSyxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDNURoQyxNQUFNLENBQUNqQyxRQUFRLEdBQUc0RCxVQUFVLEdBQUdBLFVBQVUsQ0FBQ3JELFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRTtJQUM1RDBCLE1BQU0sQ0FBQ2lDLE9BQU8sR0FBR1IsU0FBUztJQUMxQnpCLE1BQU0sQ0FBQ2tDLFdBQVcsR0FBRyxZQUFZO0lBQ2pDbEMsTUFBTSxDQUFDbUMsb0JBQW9CLEdBQUdULFVBQVUsQ0FBQ1UsaUJBQWlCLENBQUMsQ0FBQztJQUM1RHBDLE1BQU0sQ0FBQ3FDLG9CQUFvQixHQUFJWCxVQUFVLENBQUNZLGtCQUFrQixDQUFDLENBQUM7SUFDOUR0QyxNQUFNLENBQUN1QyxXQUFXLEdBQUdiLFVBQVUsQ0FBQ2MsMkJBQTJCLENBQUMsQ0FBQztJQUM3RHhDLE1BQU0sQ0FBQ3lDLHdCQUF3QixHQUFHZixVQUFVLENBQUNnQixzQkFBc0IsQ0FBQyxDQUFDO0lBQ3JFMUMsTUFBTSxDQUFDMkMsa0JBQWtCLEdBQUdqQixVQUFVLENBQUNrQixlQUFlLENBQUMsQ0FBQzs7SUFFeEQ7SUFDQSxJQUFJakIsVUFBVSxJQUFJQSxVQUFVLENBQUNrQixXQUFXLENBQUMsQ0FBQyxLQUFLM0YsU0FBUyxFQUFFO01BQ3hELElBQUksSUFBSSxDQUFDNEYsZUFBZSxLQUFLNUYsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyx5R0FBeUcsR0FBRyxJQUFJLENBQUMyRixlQUFlLENBQUM7SUFDak0sQ0FBQyxNQUFNO01BQ0wsSUFBSSxJQUFJLENBQUNBLGVBQWUsS0FBSzVGLFNBQVMsRUFBRThDLE1BQU0sQ0FBQytDLEtBQUssR0FBR3BCLFVBQVUsR0FBR0EsVUFBVSxDQUFDa0IsV0FBVyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7TUFDN0YsSUFBSSxDQUFDeEYsaUJBQVEsQ0FBQzJGLGNBQWMsQ0FBQyxJQUFJLENBQUNGLGVBQWUsRUFBRW5CLFVBQVUsQ0FBQ2tCLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNqRixNQUFNLElBQUkxRixvQkFBVyxDQUFDLDhDQUE4QyxHQUFHd0UsVUFBVSxDQUFDa0IsV0FBVyxDQUFDLENBQUMsR0FBRyxxRUFBcUUsR0FBRyxJQUFJLENBQUNDLGVBQWUsQ0FBQztNQUNqTTtJQUNGO0lBQ0EsSUFBSSxDQUFDOUMsTUFBTSxDQUFDK0MsS0FBSyxFQUFFL0MsTUFBTSxDQUFDK0MsS0FBSyxHQUFHLEVBQUU7O0lBRXBDLE1BQU0sSUFBSSxDQUFDcEcsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFlBQVksRUFBRTRCLE1BQU0sQ0FBQztJQUNuRSxJQUFJLENBQUNpRCxnQkFBZ0IsR0FBR3RCLFVBQVU7RUFDcEM7O0VBRUEsTUFBTXVCLG1CQUFtQkEsQ0FBQSxFQUFpQztJQUN4RCxPQUFPLElBQUksQ0FBQ0QsZ0JBQWdCO0VBQzlCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUUsV0FBV0EsQ0FBQ0MsVUFBbUIsRUFBRUMsYUFBc0IsRUFBcUI7SUFDaEYsSUFBSUQsVUFBVSxLQUFLbEcsU0FBUyxFQUFFO01BQzVCb0csZUFBTSxDQUFDQyxLQUFLLENBQUNGLGFBQWEsRUFBRW5HLFNBQVMsRUFBRSxrREFBa0QsQ0FBQztNQUMxRixJQUFJc0csT0FBTyxHQUFHQyxNQUFNLENBQUMsQ0FBQyxDQUFDO01BQ3ZCLElBQUlDLGVBQWUsR0FBR0QsTUFBTSxDQUFDLENBQUMsQ0FBQztNQUMvQixLQUFLLElBQUlFLE9BQU8sSUFBSSxNQUFNLElBQUksQ0FBQ0MsV0FBVyxDQUFDLENBQUMsRUFBRTtRQUM1Q0osT0FBTyxHQUFHQSxPQUFPLEdBQUdHLE9BQU8sQ0FBQ0UsVUFBVSxDQUFDLENBQUM7UUFDeENILGVBQWUsR0FBR0EsZUFBZSxHQUFHQyxPQUFPLENBQUNHLGtCQUFrQixDQUFDLENBQUM7TUFDbEU7TUFDQSxPQUFPLENBQUNOLE9BQU8sRUFBRUUsZUFBZSxDQUFDO0lBQ25DLENBQUMsTUFBTTtNQUNMLElBQUkxRCxNQUFNLEdBQUcsRUFBQytELGFBQWEsRUFBRVgsVUFBVSxFQUFFWSxlQUFlLEVBQUVYLGFBQWEsS0FBS25HLFNBQVMsR0FBR0EsU0FBUyxHQUFHLENBQUNtRyxhQUFhLENBQUMsRUFBQztNQUNwSCxJQUFJWSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxFQUFFNEIsTUFBTSxDQUFDO01BQy9FLElBQUlxRCxhQUFhLEtBQUtuRyxTQUFTLEVBQUUsT0FBTyxDQUFDdUcsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ1YsT0FBTyxDQUFDLEVBQUVDLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUNDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztNQUN2RyxPQUFPLENBQUNWLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUNFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQ1osT0FBTyxDQUFDLEVBQUVDLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUNFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0QsZ0JBQWdCLENBQUMsQ0FBQztJQUNySDtFQUNGOztFQUVBOztFQUVBLE1BQU1FLFdBQVdBLENBQUM3RyxRQUE4QixFQUFpQjtJQUMvRCxNQUFNLEtBQUssQ0FBQzZHLFdBQVcsQ0FBQzdHLFFBQVEsQ0FBQztJQUNqQyxJQUFJLENBQUM4RyxnQkFBZ0IsQ0FBQyxDQUFDO0VBQ3pCOztFQUVBLE1BQU03RyxjQUFjQSxDQUFDRCxRQUFRLEVBQWlCO0lBQzVDLE1BQU0sS0FBSyxDQUFDQyxjQUFjLENBQUNELFFBQVEsQ0FBQztJQUNwQyxJQUFJLENBQUM4RyxnQkFBZ0IsQ0FBQyxDQUFDO0VBQ3pCOztFQUVBLE1BQU1DLG1CQUFtQkEsQ0FBQSxFQUFxQjtJQUM1QyxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUNDLGlCQUFpQixDQUFDLE1BQU0sSUFBSSxDQUFDMUYsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQ3RFLE1BQU0sSUFBSTNCLG9CQUFXLENBQUMsZ0NBQWdDLENBQUM7SUFDekQsQ0FBQyxDQUFDLE9BQU8vQixDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVkrQixvQkFBVyxJQUFJL0IsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxNQUFNL0YsQ0FBQyxDQUFDLENBQUM7TUFDOUQsT0FBT0EsQ0FBQyxDQUFDMkYsT0FBTyxDQUFDMEQsT0FBTyxDQUFDLDZCQUE2QixDQUFDLEdBQUcsQ0FBQztJQUM3RDtFQUNGOztFQUVBLE1BQU1DLFVBQVVBLENBQUEsRUFBMkI7SUFDekMsSUFBSVQsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGFBQWEsQ0FBQztJQUN2RSxPQUFPLElBQUl1RyxzQkFBYSxDQUFDVixJQUFJLENBQUNDLE1BQU0sQ0FBQ1UsT0FBTyxFQUFFWCxJQUFJLENBQUNDLE1BQU0sQ0FBQ1csT0FBTyxDQUFDO0VBQ3BFOztFQUVBLE1BQU0zRyxPQUFPQSxDQUFBLEVBQW9CO0lBQy9CLE9BQU8sSUFBSSxDQUFDRCxJQUFJO0VBQ2xCOztFQUVBLE1BQU1ZLE9BQU9BLENBQUEsRUFBb0I7SUFDL0IsSUFBSW9GLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRW1ELFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQy9GLE9BQU8wQyxJQUFJLENBQUNDLE1BQU0sQ0FBQ1ksR0FBRztFQUN4Qjs7RUFFQSxNQUFNQyxlQUFlQSxDQUFBLEVBQW9CO0lBQ3ZDLElBQUksT0FBTSxJQUFJLENBQUNsRyxPQUFPLENBQUMsQ0FBQyxNQUFLM0IsU0FBUyxFQUFFLE9BQU9BLFNBQVM7SUFDeEQsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLGlEQUFpRCxDQUFDO0VBQzFFOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNNkgsZ0JBQWdCQSxDQUFBLEVBQUc7SUFDdkIsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDckksTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsQ0FBQyxFQUFFOEYsTUFBTSxDQUFDZSxTQUFTO0VBQzFGOztFQUVBLE1BQU1sRyxpQkFBaUJBLENBQUEsRUFBb0I7SUFDekMsSUFBSWtGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRW1ELFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQy9GLE9BQU8wQyxJQUFJLENBQUNDLE1BQU0sQ0FBQ1ksR0FBRztFQUN4Qjs7RUFFQSxNQUFNOUYsa0JBQWtCQSxDQUFBLEVBQW9CO0lBQzFDLElBQUlpRixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUVtRCxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUNoRyxPQUFPMEMsSUFBSSxDQUFDQyxNQUFNLENBQUNZLEdBQUc7RUFDeEI7O0VBRUEsTUFBTUksVUFBVUEsQ0FBQzlCLFVBQWtCLEVBQUVDLGFBQXFCLEVBQW1CO0lBQzNFLElBQUk4QixhQUFhLEdBQUcsSUFBSSxDQUFDdkksWUFBWSxDQUFDd0csVUFBVSxDQUFDO0lBQ2pELElBQUksQ0FBQytCLGFBQWEsRUFBRTtNQUNsQixNQUFNLElBQUksQ0FBQ0MsZUFBZSxDQUFDaEMsVUFBVSxFQUFFbEcsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUU7TUFDMUQsT0FBTyxJQUFJLENBQUNnSSxVQUFVLENBQUM5QixVQUFVLEVBQUVDLGFBQWEsQ0FBQyxDQUFDLENBQVE7SUFDNUQ7SUFDQSxJQUFJMUMsT0FBTyxHQUFHd0UsYUFBYSxDQUFDOUIsYUFBYSxDQUFDO0lBQzFDLElBQUksQ0FBQzFDLE9BQU8sRUFBRTtNQUNaLE1BQU0sSUFBSSxDQUFDeUUsZUFBZSxDQUFDaEMsVUFBVSxFQUFFbEcsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUU7TUFDMUQsT0FBTyxJQUFJLENBQUNOLFlBQVksQ0FBQ3dHLFVBQVUsQ0FBQyxDQUFDQyxhQUFhLENBQUM7SUFDckQ7SUFDQSxPQUFPMUMsT0FBTztFQUNoQjs7RUFFQTtFQUNBLE1BQU0wRSxlQUFlQSxDQUFDMUUsT0FBZSxFQUE2Qjs7SUFFaEU7SUFDQSxJQUFJc0QsSUFBSTtJQUNSLElBQUk7TUFDRkEsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG1CQUFtQixFQUFFLEVBQUN1QyxPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDO0lBQy9GLENBQUMsQ0FBQyxPQUFPdkYsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUloRSxvQkFBVyxDQUFDL0IsQ0FBQyxDQUFDMkYsT0FBTyxDQUFDO01BQ3hELE1BQU0zRixDQUFDO0lBQ1Q7O0lBRUE7SUFDQSxJQUFJa0ssVUFBVSxHQUFHLElBQUlDLHlCQUFnQixDQUFDLEVBQUM1RSxPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDO0lBQ3pEMkUsVUFBVSxDQUFDRSxlQUFlLENBQUN2QixJQUFJLENBQUNDLE1BQU0sQ0FBQ3VCLEtBQUssQ0FBQ0MsS0FBSyxDQUFDO0lBQ25ESixVQUFVLENBQUNLLFFBQVEsQ0FBQzFCLElBQUksQ0FBQ0MsTUFBTSxDQUFDdUIsS0FBSyxDQUFDRyxLQUFLLENBQUM7SUFDNUMsT0FBT04sVUFBVTtFQUNuQjs7RUFFQSxNQUFNTyxvQkFBb0JBLENBQUNDLGVBQXdCLEVBQUVDLFNBQWtCLEVBQW9DO0lBQ3pHLElBQUk7TUFDRixJQUFJQyxvQkFBb0IsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDckosTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLHlCQUF5QixFQUFFLEVBQUM2SCxnQkFBZ0IsRUFBRUgsZUFBZSxFQUFFSSxVQUFVLEVBQUVILFNBQVMsRUFBQyxDQUFDLEVBQUU3QixNQUFNLENBQUNpQyxrQkFBa0I7TUFDM0wsT0FBTyxNQUFNLElBQUksQ0FBQ0MsdUJBQXVCLENBQUNKLG9CQUFvQixDQUFDO0lBQ2pFLENBQUMsQ0FBQyxPQUFPNUssQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDMkYsT0FBTyxDQUFDRSxRQUFRLENBQUMsb0JBQW9CLENBQUMsRUFBRSxNQUFNLElBQUk5RCxvQkFBVyxDQUFDLHNCQUFzQixHQUFHNEksU0FBUyxDQUFDO01BQ3ZHLE1BQU0zSyxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNZ0wsdUJBQXVCQSxDQUFDQyxpQkFBeUIsRUFBb0M7SUFDekYsSUFBSXBDLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQywwQkFBMEIsRUFBRSxFQUFDK0gsa0JBQWtCLEVBQUVFLGlCQUFpQixFQUFDLENBQUM7SUFDN0gsT0FBTyxJQUFJQyxnQ0FBdUIsQ0FBQyxDQUFDLENBQUNDLGtCQUFrQixDQUFDdEMsSUFBSSxDQUFDQyxNQUFNLENBQUMrQixnQkFBZ0IsQ0FBQyxDQUFDTyxZQUFZLENBQUN2QyxJQUFJLENBQUNDLE1BQU0sQ0FBQ2dDLFVBQVUsQ0FBQyxDQUFDTyxvQkFBb0IsQ0FBQ0osaUJBQWlCLENBQUM7RUFDcEs7O0VBRUEsTUFBTUssU0FBU0EsQ0FBQSxFQUFvQjtJQUNqQyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMvSixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsWUFBWSxDQUFDLEVBQUU4RixNQUFNLENBQUN5QyxNQUFNO0VBQ3BGOztFQUVBLE1BQU1DLGVBQWVBLENBQUEsRUFBb0I7SUFDdkMsTUFBTSxJQUFJekosb0JBQVcsQ0FBQyw2REFBNkQsQ0FBQztFQUN0Rjs7RUFFQSxNQUFNMEosZUFBZUEsQ0FBQ0MsSUFBWSxFQUFFQyxLQUFhLEVBQUVDLEdBQVcsRUFBbUI7SUFDL0UsTUFBTSxJQUFJN0osb0JBQVcsQ0FBQyw2REFBNkQsQ0FBQztFQUN0Rjs7RUFFQSxNQUFNOEosSUFBSUEsQ0FBQ0MscUJBQXFELEVBQUVDLFdBQW9CLEVBQTZCO0lBQ2pILElBQUE3RCxlQUFNLEVBQUMsRUFBRTRELHFCQUFxQixZQUFZRSw2QkFBb0IsQ0FBQyxFQUFFLDREQUE0RCxDQUFDO0lBQzlILElBQUk7TUFDRixJQUFJbkQsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUFDaUosWUFBWSxFQUFFRixXQUFXLEVBQUMsQ0FBQztNQUNoRyxNQUFNLElBQUksQ0FBQ0csSUFBSSxDQUFDLENBQUM7TUFDakIsT0FBTyxJQUFJQyx5QkFBZ0IsQ0FBQ3RELElBQUksQ0FBQ0MsTUFBTSxDQUFDc0QsY0FBYyxFQUFFdkQsSUFBSSxDQUFDQyxNQUFNLENBQUN1RCxjQUFjLENBQUM7SUFDckYsQ0FBQyxDQUFDLE9BQU92SCxHQUFRLEVBQUU7TUFDakIsSUFBSUEsR0FBRyxDQUFDYSxPQUFPLEtBQUsseUJBQXlCLEVBQUUsTUFBTSxJQUFJNUQsb0JBQVcsQ0FBQyxtQ0FBbUMsQ0FBQztNQUN6RyxNQUFNK0MsR0FBRztJQUNYO0VBQ0Y7O0VBRUEsTUFBTXdILFlBQVlBLENBQUM3SyxjQUF1QixFQUFpQjs7SUFFekQ7SUFDQSxJQUFJOEssbUJBQW1CLEdBQUdDLElBQUksQ0FBQ0MsS0FBSyxDQUFDLENBQUNoTCxjQUFjLEtBQUtLLFNBQVMsR0FBR1gsZUFBZSxDQUFDRSx5QkFBeUIsR0FBR0ksY0FBYyxJQUFJLElBQUksQ0FBQzs7SUFFeEk7SUFDQSxNQUFNLElBQUksQ0FBQ0YsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGNBQWMsRUFBRTtNQUM1RDBKLE1BQU0sRUFBRSxJQUFJO01BQ1pDLE1BQU0sRUFBRUo7SUFDVixDQUFDLENBQUM7O0lBRUY7SUFDQSxJQUFJLENBQUM5SyxjQUFjLEdBQUc4SyxtQkFBbUIsR0FBRyxJQUFJO0lBQ2hELElBQUksSUFBSSxDQUFDSyxZQUFZLEtBQUs5SyxTQUFTLEVBQUUsSUFBSSxDQUFDOEssWUFBWSxDQUFDQyxhQUFhLENBQUMsSUFBSSxDQUFDcEwsY0FBYyxDQUFDOztJQUV6RjtJQUNBLE1BQU0sSUFBSSxDQUFDeUssSUFBSSxDQUFDLENBQUM7RUFDbkI7O0VBRUFZLGlCQUFpQkEsQ0FBQSxFQUFXO0lBQzFCLE9BQU8sSUFBSSxDQUFDckwsY0FBYztFQUM1Qjs7RUFFQSxNQUFNc0wsV0FBV0EsQ0FBQSxFQUFrQjtJQUNqQyxPQUFPLElBQUksQ0FBQ3hMLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBRTBKLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0VBQ25GOztFQUVBLE1BQU1NLE9BQU9BLENBQUNDLFFBQWtCLEVBQWlCO0lBQy9DLElBQUksQ0FBQ0EsUUFBUSxJQUFJLENBQUNBLFFBQVEsQ0FBQ0MsTUFBTSxFQUFFLE1BQU0sSUFBSW5MLG9CQUFXLENBQUMsNEJBQTRCLENBQUM7SUFDdEYsTUFBTSxJQUFJLENBQUNSLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxTQUFTLEVBQUUsRUFBQ21LLEtBQUssRUFBRUYsUUFBUSxFQUFDLENBQUM7SUFDM0UsTUFBTSxJQUFJLENBQUNmLElBQUksQ0FBQyxDQUFDO0VBQ25COztFQUVBLE1BQU1rQixXQUFXQSxDQUFBLEVBQWtCO0lBQ2pDLE1BQU0sSUFBSSxDQUFDN0wsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGNBQWMsRUFBRWxCLFNBQVMsQ0FBQztFQUMxRTs7RUFFQSxNQUFNdUwsZ0JBQWdCQSxDQUFBLEVBQWtCO0lBQ3RDLE1BQU0sSUFBSSxDQUFDOUwsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG1CQUFtQixFQUFFbEIsU0FBUyxDQUFDO0VBQy9FOztFQUVBLE1BQU0yRyxVQUFVQSxDQUFDVCxVQUFtQixFQUFFQyxhQUFzQixFQUFtQjtJQUM3RSxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUNGLFdBQVcsQ0FBQ0MsVUFBVSxFQUFFQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDL0Q7O0VBRUEsTUFBTVMsa0JBQWtCQSxDQUFDVixVQUFtQixFQUFFQyxhQUFzQixFQUFtQjtJQUNyRixPQUFPLENBQUMsTUFBTSxJQUFJLENBQUNGLFdBQVcsQ0FBQ0MsVUFBVSxFQUFFQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDL0Q7O0VBRUEsTUFBTU8sV0FBV0EsQ0FBQzhFLG1CQUE2QixFQUFFQyxHQUFZLEVBQUVDLFlBQXNCLEVBQTRCOztJQUUvRztJQUNBLElBQUkzRSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUN1SyxHQUFHLEVBQUVBLEdBQUcsRUFBQyxDQUFDOztJQUVwRjtJQUNBO0lBQ0EsSUFBSUUsUUFBeUIsR0FBRyxFQUFFO0lBQ2xDLEtBQUssSUFBSUMsVUFBVSxJQUFJN0UsSUFBSSxDQUFDQyxNQUFNLENBQUM2RSxtQkFBbUIsRUFBRTtNQUN0RCxJQUFJcEYsT0FBTyxHQUFHcEgsZUFBZSxDQUFDeU0saUJBQWlCLENBQUNGLFVBQVUsQ0FBQztNQUMzRCxJQUFJSixtQkFBbUIsRUFBRS9FLE9BQU8sQ0FBQ3NGLGVBQWUsQ0FBQyxNQUFNLElBQUksQ0FBQzdELGVBQWUsQ0FBQ3pCLE9BQU8sQ0FBQ3VGLFFBQVEsQ0FBQyxDQUFDLEVBQUVoTSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7TUFDakgyTCxRQUFRLENBQUNNLElBQUksQ0FBQ3hGLE9BQU8sQ0FBQztJQUN4Qjs7SUFFQTtJQUNBLElBQUkrRSxtQkFBbUIsSUFBSSxDQUFDRSxZQUFZLEVBQUU7O01BRXhDO01BQ0EsS0FBSyxJQUFJakYsT0FBTyxJQUFJa0YsUUFBUSxFQUFFO1FBQzVCLEtBQUssSUFBSXZELFVBQVUsSUFBSTNCLE9BQU8sQ0FBQ3lCLGVBQWUsQ0FBQyxDQUFDLEVBQUU7VUFDaERFLFVBQVUsQ0FBQzhELFVBQVUsQ0FBQzNGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUNoQzZCLFVBQVUsQ0FBQytELGtCQUFrQixDQUFDNUYsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3hDNkIsVUFBVSxDQUFDZ0Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1VBQ2xDaEUsVUFBVSxDQUFDaUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQ3BDO01BQ0Y7O01BRUE7TUFDQXRGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxhQUFhLEVBQUUsRUFBQ29MLFlBQVksRUFBRSxJQUFJLEVBQUMsQ0FBQztNQUN6RixJQUFJdkYsSUFBSSxDQUFDQyxNQUFNLENBQUNFLGNBQWMsRUFBRTtRQUM5QixLQUFLLElBQUlxRixhQUFhLElBQUl4RixJQUFJLENBQUNDLE1BQU0sQ0FBQ0UsY0FBYyxFQUFFO1VBQ3BELElBQUlrQixVQUFVLEdBQUcvSSxlQUFlLENBQUNtTixvQkFBb0IsQ0FBQ0QsYUFBYSxDQUFDOztVQUVwRTtVQUNBLElBQUk5RixPQUFPLEdBQUdrRixRQUFRLENBQUN2RCxVQUFVLENBQUNxRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1VBQ3BEckcsZUFBTSxDQUFDQyxLQUFLLENBQUMrQixVQUFVLENBQUNxRSxlQUFlLENBQUMsQ0FBQyxFQUFFaEcsT0FBTyxDQUFDdUYsUUFBUSxDQUFDLENBQUMsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDLENBQUU7VUFDbEcsSUFBSVUsYUFBYSxHQUFHakcsT0FBTyxDQUFDeUIsZUFBZSxDQUFDLENBQUMsQ0FBQ0UsVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsQ0FBQztVQUNwRTVGLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDK0IsVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsRUFBRVUsYUFBYSxDQUFDVixRQUFRLENBQUMsQ0FBQyxFQUFFLG1DQUFtQyxDQUFDO1VBQ2xHLElBQUk1RCxVQUFVLENBQUN6QixVQUFVLENBQUMsQ0FBQyxLQUFLM0csU0FBUyxFQUFFME0sYUFBYSxDQUFDUixVQUFVLENBQUM5RCxVQUFVLENBQUN6QixVQUFVLENBQUMsQ0FBQyxDQUFDO1VBQzVGLElBQUl5QixVQUFVLENBQUN4QixrQkFBa0IsQ0FBQyxDQUFDLEtBQUs1RyxTQUFTLEVBQUUwTSxhQUFhLENBQUNQLGtCQUFrQixDQUFDL0QsVUFBVSxDQUFDeEIsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1VBQ3BILElBQUl3QixVQUFVLENBQUN1RSxvQkFBb0IsQ0FBQyxDQUFDLEtBQUszTSxTQUFTLEVBQUUwTSxhQUFhLENBQUNOLG9CQUFvQixDQUFDaEUsVUFBVSxDQUFDdUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQzVIO01BQ0Y7SUFDRjs7SUFFQSxPQUFPaEIsUUFBUTtFQUNqQjs7RUFFQTtFQUNBLE1BQU1pQixVQUFVQSxDQUFDMUcsVUFBa0IsRUFBRXNGLG1CQUE2QixFQUFFRSxZQUFzQixFQUEwQjtJQUNsSCxJQUFBdEYsZUFBTSxFQUFDRixVQUFVLElBQUksQ0FBQyxDQUFDO0lBQ3ZCLEtBQUssSUFBSU8sT0FBTyxJQUFJLE1BQU0sSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQyxFQUFFO01BQzVDLElBQUlELE9BQU8sQ0FBQ3VGLFFBQVEsQ0FBQyxDQUFDLEtBQUs5RixVQUFVLEVBQUU7UUFDckMsSUFBSXNGLG1CQUFtQixFQUFFL0UsT0FBTyxDQUFDc0YsZUFBZSxDQUFDLE1BQU0sSUFBSSxDQUFDN0QsZUFBZSxDQUFDaEMsVUFBVSxFQUFFbEcsU0FBUyxFQUFFMEwsWUFBWSxDQUFDLENBQUM7UUFDakgsT0FBT2pGLE9BQU87TUFDaEI7SUFDRjtJQUNBLE1BQU0sSUFBSW9HLEtBQUssQ0FBQyxxQkFBcUIsR0FBRzNHLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQztFQUN6RTs7RUFFQSxNQUFNNEcsYUFBYUEsQ0FBQ0MsS0FBYyxFQUEwQjtJQUMxREEsS0FBSyxHQUFHQSxLQUFLLEdBQUdBLEtBQUssR0FBRy9NLFNBQVM7SUFDakMsSUFBSStHLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFDNkwsS0FBSyxFQUFFQSxLQUFLLEVBQUMsQ0FBQztJQUMxRixPQUFPLElBQUlDLHNCQUFhLENBQUM7TUFDdkJ6RSxLQUFLLEVBQUV4QixJQUFJLENBQUNDLE1BQU0sQ0FBQ0gsYUFBYTtNQUNoQ29HLGNBQWMsRUFBRWxHLElBQUksQ0FBQ0MsTUFBTSxDQUFDdkQsT0FBTztNQUNuQ3NKLEtBQUssRUFBRUEsS0FBSztNQUNaekcsT0FBTyxFQUFFQyxNQUFNLENBQUMsQ0FBQyxDQUFDO01BQ2xCQyxlQUFlLEVBQUVELE1BQU0sQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU0yQixlQUFlQSxDQUFDaEMsVUFBa0IsRUFBRWdILGlCQUE0QixFQUFFeEIsWUFBc0IsRUFBK0I7O0lBRTNIO0lBQ0EsSUFBSTVJLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQytELGFBQWEsR0FBR1gsVUFBVTtJQUNqQyxJQUFJZ0gsaUJBQWlCLEVBQUVwSyxNQUFNLENBQUNxSyxhQUFhLEdBQUdoTixpQkFBUSxDQUFDaU4sT0FBTyxDQUFDRixpQkFBaUIsQ0FBQztJQUNqRixJQUFJbkcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGFBQWEsRUFBRTRCLE1BQU0sQ0FBQzs7SUFFL0U7SUFDQSxJQUFJdUssWUFBWSxHQUFHLEVBQUU7SUFDckIsS0FBSyxJQUFJZCxhQUFhLElBQUl4RixJQUFJLENBQUNDLE1BQU0sQ0FBQ3NHLFNBQVMsRUFBRTtNQUMvQyxJQUFJbEYsVUFBVSxHQUFHL0ksZUFBZSxDQUFDbU4sb0JBQW9CLENBQUNELGFBQWEsQ0FBQztNQUNwRW5FLFVBQVUsQ0FBQ0UsZUFBZSxDQUFDcEMsVUFBVSxDQUFDO01BQ3RDbUgsWUFBWSxDQUFDcEIsSUFBSSxDQUFDN0QsVUFBVSxDQUFDO0lBQy9COztJQUVBO0lBQ0EsSUFBSSxDQUFDc0QsWUFBWSxFQUFFOztNQUVqQjtNQUNBLEtBQUssSUFBSXRELFVBQVUsSUFBSWlGLFlBQVksRUFBRTtRQUNuQ2pGLFVBQVUsQ0FBQzhELFVBQVUsQ0FBQzNGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQzZCLFVBQVUsQ0FBQytELGtCQUFrQixDQUFDNUYsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDNkIsVUFBVSxDQUFDZ0Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQ2xDaEUsVUFBVSxDQUFDaUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO01BQ3BDOztNQUVBO01BQ0F0RixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxFQUFFNEIsTUFBTSxDQUFDO01BQzNFLElBQUlpRSxJQUFJLENBQUNDLE1BQU0sQ0FBQ0UsY0FBYyxFQUFFO1FBQzlCLEtBQUssSUFBSXFGLGFBQWEsSUFBSXhGLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLEVBQUU7VUFDcEQsSUFBSWtCLFVBQVUsR0FBRy9JLGVBQWUsQ0FBQ21OLG9CQUFvQixDQUFDRCxhQUFhLENBQUM7O1VBRXBFO1VBQ0EsS0FBSyxJQUFJRyxhQUFhLElBQUlXLFlBQVksRUFBRTtZQUN0QyxJQUFJWCxhQUFhLENBQUNWLFFBQVEsQ0FBQyxDQUFDLEtBQUs1RCxVQUFVLENBQUM0RCxRQUFRLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQztZQUNsRSxJQUFJNUQsVUFBVSxDQUFDekIsVUFBVSxDQUFDLENBQUMsS0FBSzNHLFNBQVMsRUFBRTBNLGFBQWEsQ0FBQ1IsVUFBVSxDQUFDOUQsVUFBVSxDQUFDekIsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM1RixJQUFJeUIsVUFBVSxDQUFDeEIsa0JBQWtCLENBQUMsQ0FBQyxLQUFLNUcsU0FBUyxFQUFFME0sYUFBYSxDQUFDUCxrQkFBa0IsQ0FBQy9ELFVBQVUsQ0FBQ3hCLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNwSCxJQUFJd0IsVUFBVSxDQUFDdUUsb0JBQW9CLENBQUMsQ0FBQyxLQUFLM00sU0FBUyxFQUFFME0sYUFBYSxDQUFDTixvQkFBb0IsQ0FBQ2hFLFVBQVUsQ0FBQ3VFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUMxSCxJQUFJdkUsVUFBVSxDQUFDbUYsb0JBQW9CLENBQUMsQ0FBQyxLQUFLdk4sU0FBUyxFQUFFME0sYUFBYSxDQUFDTCxvQkFBb0IsQ0FBQ2pFLFVBQVUsQ0FBQ21GLG9CQUFvQixDQUFDLENBQUMsQ0FBQztVQUM1SDtRQUNGO01BQ0Y7SUFDRjs7SUFFQTtJQUNBLElBQUl0RixhQUFhLEdBQUcsSUFBSSxDQUFDdkksWUFBWSxDQUFDd0csVUFBVSxDQUFDO0lBQ2pELElBQUksQ0FBQytCLGFBQWEsRUFBRTtNQUNsQkEsYUFBYSxHQUFHLENBQUMsQ0FBQztNQUNsQixJQUFJLENBQUN2SSxZQUFZLENBQUN3RyxVQUFVLENBQUMsR0FBRytCLGFBQWE7SUFDL0M7SUFDQSxLQUFLLElBQUlHLFVBQVUsSUFBSWlGLFlBQVksRUFBRTtNQUNuQ3BGLGFBQWEsQ0FBQ0csVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHNUQsVUFBVSxDQUFDSixVQUFVLENBQUMsQ0FBQztJQUNoRTs7SUFFQTtJQUNBLE9BQU9xRixZQUFZO0VBQ3JCOztFQUVBLE1BQU1HLGFBQWFBLENBQUN0SCxVQUFrQixFQUFFQyxhQUFxQixFQUFFdUYsWUFBc0IsRUFBNkI7SUFDaEgsSUFBQXRGLGVBQU0sRUFBQ0YsVUFBVSxJQUFJLENBQUMsQ0FBQztJQUN2QixJQUFBRSxlQUFNLEVBQUNELGFBQWEsSUFBSSxDQUFDLENBQUM7SUFDMUIsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDK0IsZUFBZSxDQUFDaEMsVUFBVSxFQUFFLENBQUNDLGFBQWEsQ0FBQyxFQUFFdUYsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ25GOztFQUVBLE1BQU0rQixnQkFBZ0JBLENBQUN2SCxVQUFrQixFQUFFNkcsS0FBYyxFQUE2Qjs7SUFFcEY7SUFDQSxJQUFJaEcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEVBQUMyRixhQUFhLEVBQUVYLFVBQVUsRUFBRTZHLEtBQUssRUFBRUEsS0FBSyxFQUFDLENBQUM7O0lBRXJIO0lBQ0EsSUFBSTNFLFVBQVUsR0FBRyxJQUFJQyx5QkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZDRCxVQUFVLENBQUNFLGVBQWUsQ0FBQ3BDLFVBQVUsQ0FBQztJQUN0Q2tDLFVBQVUsQ0FBQ0ssUUFBUSxDQUFDMUIsSUFBSSxDQUFDQyxNQUFNLENBQUNtRyxhQUFhLENBQUM7SUFDOUMvRSxVQUFVLENBQUNzRixVQUFVLENBQUMzRyxJQUFJLENBQUNDLE1BQU0sQ0FBQ3ZELE9BQU8sQ0FBQztJQUMxQzJFLFVBQVUsQ0FBQ3VGLFFBQVEsQ0FBQ1osS0FBSyxHQUFHQSxLQUFLLEdBQUcvTSxTQUFTLENBQUM7SUFDOUNvSSxVQUFVLENBQUM4RCxVQUFVLENBQUMzRixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEM2QixVQUFVLENBQUMrRCxrQkFBa0IsQ0FBQzVGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QzZCLFVBQVUsQ0FBQ2dFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUNsQ2hFLFVBQVUsQ0FBQ3dGLFNBQVMsQ0FBQyxLQUFLLENBQUM7SUFDM0J4RixVQUFVLENBQUNpRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDbEMsT0FBT2pFLFVBQVU7RUFDbkI7O0VBRUEsTUFBTXlGLGtCQUFrQkEsQ0FBQzNILFVBQWtCLEVBQUVDLGFBQXFCLEVBQUU0RyxLQUFhLEVBQWlCO0lBQ2hHLE1BQU0sSUFBSSxDQUFDdE4sTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsRUFBRSxFQUFDcUgsS0FBSyxFQUFFLEVBQUNDLEtBQUssRUFBRXRDLFVBQVUsRUFBRXdDLEtBQUssRUFBRXZDLGFBQWEsRUFBQyxFQUFFNEcsS0FBSyxFQUFFQSxLQUFLLEVBQUMsQ0FBQztFQUNsSTs7RUFFQSxNQUFNZSxNQUFNQSxDQUFDQyxLQUF5QyxFQUE2QjtJQUNqRixPQUFPLElBQUksQ0FBQ0MsU0FBUyxDQUFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDO0VBQ2pDOztFQUVBLE1BQWdCQyxTQUFTQSxDQUFDRCxLQUFvRCxFQUFFRSxXQUFtQixFQUE2Qjs7SUFFOUg7SUFDQSxNQUFNQyxlQUFlLEdBQUc1TyxxQkFBWSxDQUFDNk8sZ0JBQWdCLENBQUNKLEtBQUssQ0FBQzs7SUFFNUQ7SUFDQSxJQUFJSyxhQUFhLEdBQUdGLGVBQWUsQ0FBQ0csZ0JBQWdCLENBQUMsQ0FBQztJQUN0RCxJQUFJQyxVQUFVLEdBQUdKLGVBQWUsQ0FBQ0ssYUFBYSxDQUFDLENBQUM7SUFDaEQsSUFBSUMsV0FBVyxHQUFHTixlQUFlLENBQUNPLGNBQWMsQ0FBQyxDQUFDO0lBQ2xEUCxlQUFlLENBQUNRLGdCQUFnQixDQUFDMU8sU0FBUyxDQUFDO0lBQzNDa08sZUFBZSxDQUFDUyxhQUFhLENBQUMzTyxTQUFTLENBQUM7SUFDeENrTyxlQUFlLENBQUNVLGNBQWMsQ0FBQzVPLFNBQVMsQ0FBQzs7SUFFekM7SUFDQSxJQUFJNk8sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDQyxlQUFlLENBQUMsSUFBSUMsNEJBQW1CLENBQUMsQ0FBQyxDQUFDQyxVQUFVLENBQUMzUCxlQUFlLENBQUM0UCxlQUFlLENBQUNmLGVBQWUsQ0FBQ2dCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUV6STtJQUNBLElBQUlDLEdBQUcsR0FBRyxFQUFFO0lBQ1osSUFBSUMsTUFBTSxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLEtBQUssSUFBSUMsUUFBUSxJQUFJVCxTQUFTLEVBQUU7TUFDOUIsSUFBSSxDQUFDTyxNQUFNLENBQUN2USxHQUFHLENBQUN5USxRQUFRLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNqQ0osR0FBRyxDQUFDbEQsSUFBSSxDQUFDcUQsUUFBUSxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzFCSCxNQUFNLENBQUNJLEdBQUcsQ0FBQ0YsUUFBUSxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDO01BQzlCO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJRSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSUMsUUFBUSxHQUFHLENBQUMsQ0FBQztJQUNqQixLQUFLLElBQUlDLEVBQUUsSUFBSVIsR0FBRyxFQUFFO01BQ2xCOVAsZUFBZSxDQUFDdVEsT0FBTyxDQUFDRCxFQUFFLEVBQUVGLEtBQUssRUFBRUMsUUFBUSxDQUFDO0lBQzlDOztJQUVBO0lBQ0EsSUFBSXhCLGVBQWUsQ0FBQzJCLGlCQUFpQixDQUFDLENBQUMsSUFBSXJCLFdBQVcsRUFBRTs7TUFFdEQ7TUFDQSxJQUFJc0IsY0FBYyxHQUFHLENBQUN0QixXQUFXLEdBQUdBLFdBQVcsQ0FBQ1UsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJYSwwQkFBaUIsQ0FBQyxDQUFDLEVBQUVmLFVBQVUsQ0FBQzNQLGVBQWUsQ0FBQzRQLGVBQWUsQ0FBQ2YsZUFBZSxDQUFDZ0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3JKLElBQUljLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQ0MsYUFBYSxDQUFDSCxjQUFjLENBQUM7O01BRXREO01BQ0EsSUFBSUksU0FBUyxHQUFHLEVBQUU7TUFDbEIsS0FBSyxJQUFJQyxNQUFNLElBQUlILE9BQU8sRUFBRTtRQUMxQixJQUFJLENBQUNFLFNBQVMsQ0FBQ25NLFFBQVEsQ0FBQ29NLE1BQU0sQ0FBQ1osS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1VBQ3ZDbFEsZUFBZSxDQUFDdVEsT0FBTyxDQUFDTyxNQUFNLENBQUNaLEtBQUssQ0FBQyxDQUFDLEVBQUVFLEtBQUssRUFBRUMsUUFBUSxDQUFDO1VBQ3hEUSxTQUFTLENBQUNqRSxJQUFJLENBQUNrRSxNQUFNLENBQUNaLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEM7TUFDRjtJQUNGOztJQUVBO0lBQ0FyQixlQUFlLENBQUNRLGdCQUFnQixDQUFDTixhQUFhLENBQUM7SUFDL0NGLGVBQWUsQ0FBQ1MsYUFBYSxDQUFDTCxVQUFVLENBQUM7SUFDekNKLGVBQWUsQ0FBQ1UsY0FBYyxDQUFDSixXQUFXLENBQUM7O0lBRTNDO0lBQ0EsSUFBSTRCLFVBQVUsR0FBRyxFQUFFO0lBQ25CLEtBQUssSUFBSVQsRUFBRSxJQUFJUixHQUFHLEVBQUU7TUFDbEIsSUFBSWpCLGVBQWUsQ0FBQ21DLGFBQWEsQ0FBQ1YsRUFBRSxDQUFDLEVBQUVTLFVBQVUsQ0FBQ25FLElBQUksQ0FBQzBELEVBQUUsQ0FBQyxDQUFDO01BQ3RELElBQUlBLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBS3RRLFNBQVMsRUFBRTJQLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3hDLE1BQU0sQ0FBQyxDQUFDLENBQUN5QyxNQUFNLENBQUNaLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3hDLE1BQU0sQ0FBQyxDQUFDLENBQUN2RyxPQUFPLENBQUNvSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUc7SUFDQVIsR0FBRyxHQUFHaUIsVUFBVTs7SUFFaEI7SUFDQSxLQUFLLElBQUlULEVBQUUsSUFBSVIsR0FBRyxFQUFFO01BQ2xCLElBQUlRLEVBQUUsQ0FBQ2EsY0FBYyxDQUFDLENBQUMsSUFBSWIsRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxLQUFLdFEsU0FBUyxJQUFJLENBQUMyUCxFQUFFLENBQUNhLGNBQWMsQ0FBQyxDQUFDLElBQUliLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBS3RRLFNBQVMsRUFBRTtRQUM3RyxJQUFJaU8sV0FBVyxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUloTyxvQkFBVyxDQUFDLHdEQUF3RCxDQUFDO1FBQ3JHd1EsT0FBTyxDQUFDQyxLQUFLLENBQUMsOEVBQThFLENBQUM7UUFDN0YsT0FBTyxJQUFJLENBQUMxQyxTQUFTLENBQUNFLGVBQWUsRUFBRUQsV0FBVyxHQUFHLENBQUMsQ0FBQztNQUN6RDtJQUNGOztJQUVBO0lBQ0EsSUFBSUMsZUFBZSxDQUFDeUMsU0FBUyxDQUFDLENBQUMsSUFBSXpDLGVBQWUsQ0FBQ3lDLFNBQVMsQ0FBQyxDQUFDLENBQUN2RixNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQ3pFLElBQUl3RixPQUFPLEdBQUcsSUFBSUMsR0FBRyxDQUFDLENBQUMsRUFBRTtNQUN6QixLQUFLLElBQUlsQixFQUFFLElBQUlSLEdBQUcsRUFBRXlCLE9BQU8sQ0FBQzdSLEdBQUcsQ0FBQzRRLEVBQUUsQ0FBQ21CLE9BQU8sQ0FBQyxDQUFDLEVBQUVuQixFQUFFLENBQUM7TUFDakQsSUFBSW9CLFVBQVUsR0FBRyxFQUFFO01BQ25CLEtBQUssSUFBSUMsSUFBSSxJQUFJOUMsZUFBZSxDQUFDeUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJQyxPQUFPLENBQUM5UixHQUFHLENBQUNrUyxJQUFJLENBQUMsRUFBRUQsVUFBVSxDQUFDOUUsSUFBSSxDQUFDMkUsT0FBTyxDQUFDOVIsR0FBRyxDQUFDa1MsSUFBSSxDQUFDLENBQUM7TUFDdkc3QixHQUFHLEdBQUc0QixVQUFVO0lBQ2xCO0lBQ0EsT0FBTzVCLEdBQUc7RUFDWjs7RUFFQSxNQUFNOEIsWUFBWUEsQ0FBQ2xELEtBQW9DLEVBQTZCOztJQUVsRjtJQUNBLE1BQU1HLGVBQWUsR0FBRzVPLHFCQUFZLENBQUM0UixzQkFBc0IsQ0FBQ25ELEtBQUssQ0FBQzs7SUFFbEU7SUFDQSxJQUFJLENBQUMxTyxlQUFlLENBQUM4UixZQUFZLENBQUNqRCxlQUFlLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ1ksZUFBZSxDQUFDWixlQUFlLENBQUM7O0lBRWhHO0lBQ0EsSUFBSVcsU0FBUyxHQUFHLEVBQUU7SUFDbEIsS0FBSyxJQUFJYyxFQUFFLElBQUksTUFBTSxJQUFJLENBQUM3QixNQUFNLENBQUNJLGVBQWUsQ0FBQ2tELFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUM5RCxLQUFLLElBQUk5QixRQUFRLElBQUlLLEVBQUUsQ0FBQzBCLGVBQWUsQ0FBQ25ELGVBQWUsQ0FBQyxFQUFFO1FBQ3hEVyxTQUFTLENBQUM1QyxJQUFJLENBQUNxRCxRQUFRLENBQUM7TUFDMUI7SUFDRjs7SUFFQSxPQUFPVCxTQUFTO0VBQ2xCOztFQUVBLE1BQU15QyxVQUFVQSxDQUFDdkQsS0FBa0MsRUFBaUM7O0lBRWxGO0lBQ0EsTUFBTUcsZUFBZSxHQUFHNU8scUJBQVksQ0FBQ2lTLG9CQUFvQixDQUFDeEQsS0FBSyxDQUFDOztJQUVoRTtJQUNBLElBQUksQ0FBQzFPLGVBQWUsQ0FBQzhSLFlBQVksQ0FBQ2pELGVBQWUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDK0IsYUFBYSxDQUFDL0IsZUFBZSxDQUFDOztJQUU5RjtJQUNBLElBQUk4QixPQUFPLEdBQUcsRUFBRTtJQUNoQixLQUFLLElBQUlMLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQzdCLE1BQU0sQ0FBQ0ksZUFBZSxDQUFDa0QsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQzlELEtBQUssSUFBSWpCLE1BQU0sSUFBSVIsRUFBRSxDQUFDNkIsYUFBYSxDQUFDdEQsZUFBZSxDQUFDLEVBQUU7UUFDcEQ4QixPQUFPLENBQUMvRCxJQUFJLENBQUNrRSxNQUFNLENBQUM7TUFDdEI7SUFDRjs7SUFFQSxPQUFPSCxPQUFPO0VBQ2hCOztFQUVBLE1BQU15QixhQUFhQSxDQUFDQyxHQUFHLEdBQUcsS0FBSyxFQUFtQjtJQUNoRCxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUNqUyxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsRUFBQ3dRLEdBQUcsRUFBRUEsR0FBRyxFQUFDLENBQUMsRUFBRTFLLE1BQU0sQ0FBQzJLLGdCQUFnQjtFQUM5Rzs7RUFFQSxNQUFNQyxhQUFhQSxDQUFDQyxVQUFrQixFQUFtQjtJQUN2RCxJQUFJOUssSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEVBQUN5USxnQkFBZ0IsRUFBRUUsVUFBVSxFQUFDLENBQUM7SUFDMUcsT0FBTzlLLElBQUksQ0FBQ0MsTUFBTSxDQUFDOEssWUFBWTtFQUNqQzs7RUFFQSxNQUFNQyxlQUFlQSxDQUFDTCxHQUFHLEdBQUcsS0FBSyxFQUF1QztJQUN0RSxPQUFPLE1BQU0sSUFBSSxDQUFDTSxrQkFBa0IsQ0FBQ04sR0FBRyxDQUFDO0VBQzNDOztFQUVBLE1BQU1PLGVBQWVBLENBQUNDLFNBQTJCLEVBQUVDLE1BQU0sR0FBRyxDQUFDLEVBQXVDOztJQUVsRztJQUNBLElBQUlDLFlBQVksR0FBR0YsU0FBUyxDQUFDRyxHQUFHLENBQUMsQ0FBQUMsUUFBUSxNQUFLLEVBQUNDLFNBQVMsRUFBRUQsUUFBUSxDQUFDRSxNQUFNLENBQUMsQ0FBQyxFQUFFQyxTQUFTLEVBQUVILFFBQVEsQ0FBQ0ksWUFBWSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7O0lBRWxIO0lBQ0EsSUFBSTNMLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxFQUFDeVIsaUJBQWlCLEVBQUVQLFlBQVksRUFBRUQsTUFBTSxFQUFFQSxNQUFNLEVBQUMsQ0FBQzs7SUFFaEk7SUFDQSxJQUFJUyxZQUFZLEdBQUcsSUFBSUMsbUNBQTBCLENBQUMsQ0FBQztJQUNuREQsWUFBWSxDQUFDRSxTQUFTLENBQUMvTCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3lDLE1BQU0sQ0FBQztJQUMxQ21KLFlBQVksQ0FBQ0csY0FBYyxDQUFDeE0sTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ2dNLEtBQUssQ0FBQyxDQUFDO0lBQ3RESixZQUFZLENBQUNLLGdCQUFnQixDQUFDMU0sTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ2tNLE9BQU8sQ0FBQyxDQUFDO0lBQzFELE9BQU9OLFlBQVk7RUFDckI7O0VBRUEsTUFBTU8sNkJBQTZCQSxDQUFBLEVBQThCO0lBQy9ELE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQ25CLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFb0IsWUFBWSxDQUFDLENBQUM7RUFDOUQ7O0VBRUEsTUFBTUMsWUFBWUEsQ0FBQ2YsUUFBZ0IsRUFBaUI7SUFDbEQsT0FBTyxJQUFJLENBQUM3UyxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUNxUixTQUFTLEVBQUVELFFBQVEsRUFBQyxDQUFDO0VBQ2pGOztFQUVBLE1BQU1nQixVQUFVQSxDQUFDaEIsUUFBZ0IsRUFBaUI7SUFDaEQsT0FBTyxJQUFJLENBQUM3UyxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUNxUixTQUFTLEVBQUVELFFBQVEsRUFBQyxDQUFDO0VBQy9FOztFQUVBLE1BQU1pQixjQUFjQSxDQUFDakIsUUFBZ0IsRUFBb0I7SUFDdkQsSUFBSXZMLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBQ3FSLFNBQVMsRUFBRUQsUUFBUSxFQUFDLENBQUM7SUFDekYsT0FBT3ZMLElBQUksQ0FBQ0MsTUFBTSxDQUFDd00sTUFBTSxLQUFLLElBQUk7RUFDcEM7O0VBRUEsTUFBTUMscUJBQXFCQSxDQUFBLEVBQThCO0lBQ3ZELElBQUkxTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsMEJBQTBCLENBQUM7SUFDcEYsT0FBTzZGLElBQUksQ0FBQ0MsTUFBTSxDQUFDME0sUUFBUTtFQUM3Qjs7RUFFQSxNQUFNQyxTQUFTQSxDQUFDbFUsTUFBK0IsRUFBNkI7O0lBRTFFO0lBQ0EsTUFBTWlDLGdCQUFnQixHQUFHcEMscUJBQVksQ0FBQ3NVLHdCQUF3QixDQUFDblUsTUFBTSxDQUFDO0lBQ3RFLElBQUlpQyxnQkFBZ0IsQ0FBQ21TLFdBQVcsQ0FBQyxDQUFDLEtBQUs3VCxTQUFTLEVBQUUwQixnQkFBZ0IsQ0FBQ29TLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDcEYsSUFBSXBTLGdCQUFnQixDQUFDcVMsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJLEtBQUksTUFBTSxJQUFJLENBQUNDLFVBQVUsQ0FBQyxDQUFDLEdBQUUsTUFBTSxJQUFJL1Qsb0JBQVcsQ0FBQyxtREFBbUQsQ0FBQzs7SUFFL0k7SUFDQSxJQUFJaUcsVUFBVSxHQUFHeEUsZ0JBQWdCLENBQUMrSyxlQUFlLENBQUMsQ0FBQztJQUNuRCxJQUFJdkcsVUFBVSxLQUFLbEcsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyw2Q0FBNkMsQ0FBQztJQUNsRyxJQUFJaU4saUJBQWlCLEdBQUd4TCxnQkFBZ0IsQ0FBQ3VTLG9CQUFvQixDQUFDLENBQUMsS0FBS2pVLFNBQVMsR0FBR0EsU0FBUyxHQUFHMEIsZ0JBQWdCLENBQUN1UyxvQkFBb0IsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUU5STtJQUNBLElBQUlwUixNQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCQSxNQUFNLENBQUNxUixZQUFZLEdBQUcsRUFBRTtJQUN4QixLQUFLLElBQUlDLFdBQVcsSUFBSTFTLGdCQUFnQixDQUFDMlMsZUFBZSxDQUFDLENBQUMsRUFBRTtNQUMxRCxJQUFBak8sZUFBTSxFQUFDZ08sV0FBVyxDQUFDcE0sVUFBVSxDQUFDLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQztNQUN0RSxJQUFBNUIsZUFBTSxFQUFDZ08sV0FBVyxDQUFDRSxTQUFTLENBQUMsQ0FBQyxFQUFFLG1DQUFtQyxDQUFDO01BQ3BFeFIsTUFBTSxDQUFDcVIsWUFBWSxDQUFDbEksSUFBSSxDQUFDLEVBQUV4SSxPQUFPLEVBQUUyUSxXQUFXLENBQUNwTSxVQUFVLENBQUMsQ0FBQyxFQUFFdU0sTUFBTSxFQUFFSCxXQUFXLENBQUNFLFNBQVMsQ0FBQyxDQUFDLENBQUNFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdHO0lBQ0EsSUFBSTlTLGdCQUFnQixDQUFDK1Msa0JBQWtCLENBQUMsQ0FBQyxFQUFFM1IsTUFBTSxDQUFDNFIseUJBQXlCLEdBQUdoVCxnQkFBZ0IsQ0FBQytTLGtCQUFrQixDQUFDLENBQUM7SUFDbkgzUixNQUFNLENBQUMrRCxhQUFhLEdBQUdYLFVBQVU7SUFDakNwRCxNQUFNLENBQUM2UixlQUFlLEdBQUd6SCxpQkFBaUI7SUFDMUNwSyxNQUFNLENBQUNrRyxVQUFVLEdBQUd0SCxnQkFBZ0IsQ0FBQ2tULFlBQVksQ0FBQyxDQUFDO0lBQ25EOVIsTUFBTSxDQUFDK1IsWUFBWSxHQUFHblQsZ0JBQWdCLENBQUNxUyxRQUFRLENBQUMsQ0FBQyxLQUFLLElBQUk7SUFDMUQsSUFBQTNOLGVBQU0sRUFBQzFFLGdCQUFnQixDQUFDb1QsV0FBVyxDQUFDLENBQUMsS0FBSzlVLFNBQVMsSUFBSTBCLGdCQUFnQixDQUFDb1QsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUlwVCxnQkFBZ0IsQ0FBQ29ULFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xJaFMsTUFBTSxDQUFDNFEsUUFBUSxHQUFHaFMsZ0JBQWdCLENBQUNvVCxXQUFXLENBQUMsQ0FBQztJQUNoRGhTLE1BQU0sQ0FBQ2lTLFVBQVUsR0FBRyxJQUFJO0lBQ3hCalMsTUFBTSxDQUFDa1MsZUFBZSxHQUFHLElBQUk7SUFDN0IsSUFBSXRULGdCQUFnQixDQUFDbVMsV0FBVyxDQUFDLENBQUMsRUFBRS9RLE1BQU0sQ0FBQ21TLFdBQVcsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUFBLEtBQzFEblMsTUFBTSxDQUFDb1MsVUFBVSxHQUFHLElBQUk7O0lBRTdCO0lBQ0EsSUFBSXhULGdCQUFnQixDQUFDbVMsV0FBVyxDQUFDLENBQUMsSUFBSW5TLGdCQUFnQixDQUFDK1Msa0JBQWtCLENBQUMsQ0FBQyxJQUFJL1MsZ0JBQWdCLENBQUMrUyxrQkFBa0IsQ0FBQyxDQUFDLENBQUNySixNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQy9ILE1BQU0sSUFBSW5MLG9CQUFXLENBQUMsMEVBQTBFLENBQUM7SUFDbkc7O0lBRUE7SUFDQSxJQUFJK0csTUFBTTtJQUNWLElBQUk7TUFDRixJQUFJRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUNRLGdCQUFnQixDQUFDbVMsV0FBVyxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsR0FBRyxVQUFVLEVBQUUvUSxNQUFNLENBQUM7TUFDaElrRSxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTtJQUN0QixDQUFDLENBQUMsT0FBT2hFLEdBQVEsRUFBRTtNQUNqQixJQUFJQSxHQUFHLENBQUNhLE9BQU8sQ0FBQzBELE9BQU8sQ0FBQyxxQ0FBcUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSXRILG9CQUFXLENBQUMsNkJBQTZCLENBQUM7TUFDekgsTUFBTStDLEdBQUc7SUFDWDs7SUFFQTtJQUNBLElBQUltTSxHQUFHO0lBQ1AsSUFBSWdHLE1BQU0sR0FBR3pULGdCQUFnQixDQUFDbVMsV0FBVyxDQUFDLENBQUMsR0FBSTdNLE1BQU0sQ0FBQ29PLFFBQVEsS0FBS3BWLFNBQVMsR0FBR2dILE1BQU0sQ0FBQ29PLFFBQVEsQ0FBQ2hLLE1BQU0sR0FBRyxDQUFDLEdBQUtwRSxNQUFNLENBQUNxTyxHQUFHLEtBQUtyVixTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUU7SUFDL0ksSUFBSW1WLE1BQU0sR0FBRyxDQUFDLEVBQUVoRyxHQUFHLEdBQUcsRUFBRTtJQUN4QixJQUFJbUcsZ0JBQWdCLEdBQUdILE1BQU0sS0FBSyxDQUFDO0lBQ25DLEtBQUssSUFBSTFXLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRzBXLE1BQU0sRUFBRTFXLENBQUMsRUFBRSxFQUFFO01BQy9CLElBQUlrUixFQUFFLEdBQUcsSUFBSTRGLHVCQUFjLENBQUMsQ0FBQztNQUM3QmxXLGVBQWUsQ0FBQ21XLGdCQUFnQixDQUFDOVQsZ0JBQWdCLEVBQUVpTyxFQUFFLEVBQUUyRixnQkFBZ0IsQ0FBQztNQUN4RTNGLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ25OLGVBQWUsQ0FBQ3BDLFVBQVUsQ0FBQztNQUNwRCxJQUFJZ0gsaUJBQWlCLEtBQUtsTixTQUFTLElBQUlrTixpQkFBaUIsQ0FBQzlCLE1BQU0sS0FBSyxDQUFDLEVBQUV1RSxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNDLG9CQUFvQixDQUFDeEksaUJBQWlCLENBQUM7TUFDdklpQyxHQUFHLENBQUNsRCxJQUFJLENBQUMwRCxFQUFFLENBQUM7SUFDZDs7SUFFQTtJQUNBLElBQUlqTyxnQkFBZ0IsQ0FBQ3FTLFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUMzSixJQUFJLENBQUMsQ0FBQzs7SUFFbEQ7SUFDQSxJQUFJMUksZ0JBQWdCLENBQUNtUyxXQUFXLENBQUMsQ0FBQyxFQUFFLE9BQU94VSxlQUFlLENBQUNzVyx3QkFBd0IsQ0FBQzNPLE1BQU0sRUFBRW1JLEdBQUcsRUFBRXpOLGdCQUFnQixDQUFDLENBQUNvTSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3ZILE9BQU96TyxlQUFlLENBQUN1VyxtQkFBbUIsQ0FBQzVPLE1BQU0sRUFBRW1JLEdBQUcsS0FBS25QLFNBQVMsR0FBR0EsU0FBUyxHQUFHbVAsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRXpOLGdCQUFnQixDQUFDLENBQUNvTSxNQUFNLENBQUMsQ0FBQztFQUNsSTs7RUFFQSxNQUFNK0gsV0FBV0EsQ0FBQ3BXLE1BQStCLEVBQTJCOztJQUUxRTtJQUNBQSxNQUFNLEdBQUdILHFCQUFZLENBQUN3VywwQkFBMEIsQ0FBQ3JXLE1BQU0sQ0FBQzs7SUFFeEQ7SUFDQSxJQUFJcUQsTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDVyxPQUFPLEdBQUdoRSxNQUFNLENBQUM0VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDck0sVUFBVSxDQUFDLENBQUM7SUFDekRsRixNQUFNLENBQUMrRCxhQUFhLEdBQUdwSCxNQUFNLENBQUNnTixlQUFlLENBQUMsQ0FBQztJQUMvQzNKLE1BQU0sQ0FBQzZSLGVBQWUsR0FBR2xWLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUM7SUFDdERuUixNQUFNLENBQUN5UCxTQUFTLEdBQUc5UyxNQUFNLENBQUNzVyxXQUFXLENBQUMsQ0FBQztJQUN2Q2pULE1BQU0sQ0FBQytSLFlBQVksR0FBR3BWLE1BQU0sQ0FBQ3NVLFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSTtJQUNoRCxJQUFBM04sZUFBTSxFQUFDM0csTUFBTSxDQUFDcVYsV0FBVyxDQUFDLENBQUMsS0FBSzlVLFNBQVMsSUFBSVAsTUFBTSxDQUFDcVYsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUlyVixNQUFNLENBQUNxVixXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwR2hTLE1BQU0sQ0FBQzRRLFFBQVEsR0FBR2pVLE1BQU0sQ0FBQ3FWLFdBQVcsQ0FBQyxDQUFDO0lBQ3RDaFMsTUFBTSxDQUFDa0csVUFBVSxHQUFHdkosTUFBTSxDQUFDbVYsWUFBWSxDQUFDLENBQUM7SUFDekM5UixNQUFNLENBQUNvUyxVQUFVLEdBQUcsSUFBSTtJQUN4QnBTLE1BQU0sQ0FBQ2lTLFVBQVUsR0FBRyxJQUFJO0lBQ3hCalMsTUFBTSxDQUFDa1MsZUFBZSxHQUFHLElBQUk7O0lBRTdCO0lBQ0EsSUFBSWpPLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxjQUFjLEVBQUU0QixNQUFNLENBQUM7SUFDaEYsSUFBSWtFLE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNOztJQUV4QjtJQUNBLElBQUl2SCxNQUFNLENBQUNzVSxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDM0osSUFBSSxDQUFDLENBQUM7O0lBRXhDO0lBQ0EsSUFBSXVGLEVBQUUsR0FBR3RRLGVBQWUsQ0FBQ21XLGdCQUFnQixDQUFDL1YsTUFBTSxFQUFFTyxTQUFTLEVBQUUsSUFBSSxDQUFDO0lBQ2xFWCxlQUFlLENBQUN1VyxtQkFBbUIsQ0FBQzVPLE1BQU0sRUFBRTJJLEVBQUUsRUFBRSxJQUFJLEVBQUVsUSxNQUFNLENBQUM7SUFDN0RrUSxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNwQixlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDMkIsU0FBUyxDQUFDckcsRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDbkIsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0YsT0FBTzNFLEVBQUU7RUFDWDs7RUFFQSxNQUFNc0csYUFBYUEsQ0FBQ3hXLE1BQStCLEVBQTZCOztJQUU5RTtJQUNBLE1BQU1pQyxnQkFBZ0IsR0FBR3BDLHFCQUFZLENBQUM0Vyw0QkFBNEIsQ0FBQ3pXLE1BQU0sQ0FBQzs7SUFFMUU7SUFDQSxJQUFJMFcsT0FBTyxHQUFHLElBQUl0RixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUU7SUFDMUIsSUFBSW5QLGdCQUFnQixDQUFDK0ssZUFBZSxDQUFDLENBQUMsS0FBS3pNLFNBQVMsRUFBRTtNQUNwRCxJQUFJMEIsZ0JBQWdCLENBQUN1UyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtqVSxTQUFTLEVBQUU7UUFDekRtVyxPQUFPLENBQUNwWCxHQUFHLENBQUMyQyxnQkFBZ0IsQ0FBQytLLGVBQWUsQ0FBQyxDQUFDLEVBQUUvSyxnQkFBZ0IsQ0FBQ3VTLG9CQUFvQixDQUFDLENBQUMsQ0FBQztNQUMxRixDQUFDLE1BQU07UUFDTCxJQUFJL0csaUJBQWlCLEdBQUcsRUFBRTtRQUMxQmlKLE9BQU8sQ0FBQ3BYLEdBQUcsQ0FBQzJDLGdCQUFnQixDQUFDK0ssZUFBZSxDQUFDLENBQUMsRUFBRVMsaUJBQWlCLENBQUM7UUFDbEUsS0FBSyxJQUFJOUUsVUFBVSxJQUFJLE1BQU0sSUFBSSxDQUFDRixlQUFlLENBQUN4RyxnQkFBZ0IsQ0FBQytLLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRTtVQUNyRixJQUFJckUsVUFBVSxDQUFDeEIsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRXNHLGlCQUFpQixDQUFDakIsSUFBSSxDQUFDN0QsVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN6RjtNQUNGO0lBQ0YsQ0FBQyxNQUFNO01BQ0wsSUFBSUwsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDakYsV0FBVyxDQUFDLElBQUksQ0FBQztNQUMzQyxLQUFLLElBQUlELE9BQU8sSUFBSWtGLFFBQVEsRUFBRTtRQUM1QixJQUFJbEYsT0FBTyxDQUFDRyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1VBQ3JDLElBQUlzRyxpQkFBaUIsR0FBRyxFQUFFO1VBQzFCaUosT0FBTyxDQUFDcFgsR0FBRyxDQUFDMEgsT0FBTyxDQUFDdUYsUUFBUSxDQUFDLENBQUMsRUFBRWtCLGlCQUFpQixDQUFDO1VBQ2xELEtBQUssSUFBSTlFLFVBQVUsSUFBSTNCLE9BQU8sQ0FBQ3lCLGVBQWUsQ0FBQyxDQUFDLEVBQUU7WUFDaEQsSUFBSUUsVUFBVSxDQUFDeEIsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRXNHLGlCQUFpQixDQUFDakIsSUFBSSxDQUFDN0QsVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsQ0FBQztVQUN6RjtRQUNGO01BQ0Y7SUFDRjs7SUFFQTtJQUNBLElBQUltRCxHQUFHLEdBQUcsRUFBRTtJQUNaLEtBQUssSUFBSWpKLFVBQVUsSUFBSWlRLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDLENBQUMsRUFBRTs7TUFFckM7TUFDQSxJQUFJbEgsSUFBSSxHQUFHeE4sZ0JBQWdCLENBQUN3TixJQUFJLENBQUMsQ0FBQztNQUNsQ0EsSUFBSSxDQUFDNUcsZUFBZSxDQUFDcEMsVUFBVSxDQUFDO01BQ2hDZ0osSUFBSSxDQUFDbUgsc0JBQXNCLENBQUMsS0FBSyxDQUFDOztNQUVsQztNQUNBLElBQUluSCxJQUFJLENBQUNvSCxzQkFBc0IsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQzFDcEgsSUFBSSxDQUFDd0csb0JBQW9CLENBQUNTLE9BQU8sQ0FBQ3JYLEdBQUcsQ0FBQ29ILFVBQVUsQ0FBQyxDQUFDO1FBQ2xELEtBQUssSUFBSXlKLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQzRHLGVBQWUsQ0FBQ3JILElBQUksQ0FBQyxFQUFFQyxHQUFHLENBQUNsRCxJQUFJLENBQUMwRCxFQUFFLENBQUM7TUFDL0Q7O01BRUE7TUFBQSxLQUNLO1FBQ0gsS0FBSyxJQUFJeEosYUFBYSxJQUFJZ1EsT0FBTyxDQUFDclgsR0FBRyxDQUFDb0gsVUFBVSxDQUFDLEVBQUU7VUFDakRnSixJQUFJLENBQUN3RyxvQkFBb0IsQ0FBQyxDQUFDdlAsYUFBYSxDQUFDLENBQUM7VUFDMUMsS0FBSyxJQUFJd0osRUFBRSxJQUFJLE1BQU0sSUFBSSxDQUFDNEcsZUFBZSxDQUFDckgsSUFBSSxDQUFDLEVBQUVDLEdBQUcsQ0FBQ2xELElBQUksQ0FBQzBELEVBQUUsQ0FBQztRQUMvRDtNQUNGO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJak8sZ0JBQWdCLENBQUNxUyxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDM0osSUFBSSxDQUFDLENBQUM7SUFDbEQsT0FBTytFLEdBQUc7RUFDWjs7RUFFQSxNQUFNcUgsU0FBU0EsQ0FBQ0MsS0FBZSxFQUE2QjtJQUMxRCxJQUFJQSxLQUFLLEtBQUt6VyxTQUFTLEVBQUV5VyxLQUFLLEdBQUcsS0FBSztJQUN0QyxJQUFJMVAsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFDMlQsWUFBWSxFQUFFLENBQUM0QixLQUFLLEVBQUMsQ0FBQztJQUM5RixJQUFJQSxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUNyTSxJQUFJLENBQUMsQ0FBQztJQUM1QixJQUFJcEQsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07SUFDeEIsSUFBSTBQLEtBQUssR0FBR3JYLGVBQWUsQ0FBQ3NXLHdCQUF3QixDQUFDM08sTUFBTSxDQUFDO0lBQzVELElBQUkwUCxLQUFLLENBQUM1SSxNQUFNLENBQUMsQ0FBQyxLQUFLOU4sU0FBUyxFQUFFLE9BQU8sRUFBRTtJQUMzQyxLQUFLLElBQUkyUCxFQUFFLElBQUkrRyxLQUFLLENBQUM1SSxNQUFNLENBQUMsQ0FBQyxFQUFFO01BQzdCNkIsRUFBRSxDQUFDZ0gsWUFBWSxDQUFDLENBQUNGLEtBQUssQ0FBQztNQUN2QjlHLEVBQUUsQ0FBQ2lILFdBQVcsQ0FBQ2pILEVBQUUsQ0FBQ2tILFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDbkM7SUFDQSxPQUFPSCxLQUFLLENBQUM1SSxNQUFNLENBQUMsQ0FBQztFQUN2Qjs7RUFFQSxNQUFNZ0osUUFBUUEsQ0FBQ0MsY0FBMkMsRUFBcUI7SUFDN0UsSUFBQTNRLGVBQU0sRUFBQzRRLEtBQUssQ0FBQ0MsT0FBTyxDQUFDRixjQUFjLENBQUMsRUFBRSx5REFBeUQsQ0FBQztJQUNoRyxJQUFJNUwsUUFBUSxHQUFHLEVBQUU7SUFDakIsS0FBSyxJQUFJK0wsWUFBWSxJQUFJSCxjQUFjLEVBQUU7TUFDdkMsSUFBSUksUUFBUSxHQUFHRCxZQUFZLFlBQVkzQix1QkFBYyxHQUFHMkIsWUFBWSxDQUFDRSxXQUFXLENBQUMsQ0FBQyxHQUFHRixZQUFZO01BQ2pHLElBQUluUSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsVUFBVSxFQUFFLEVBQUVtVyxHQUFHLEVBQUVGLFFBQVEsQ0FBQyxDQUFDLENBQUM7TUFDdkZoTSxRQUFRLENBQUNjLElBQUksQ0FBQ2xGLElBQUksQ0FBQ0MsTUFBTSxDQUFDc1EsT0FBTyxDQUFDO0lBQ3BDO0lBQ0EsTUFBTSxJQUFJLENBQUNsTixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsT0FBT2UsUUFBUTtFQUNqQjs7RUFFQSxNQUFNb00sYUFBYUEsQ0FBQ2IsS0FBa0IsRUFBd0I7SUFDNUQsSUFBSTNQLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRTtNQUM1RXNXLGNBQWMsRUFBRWQsS0FBSyxDQUFDZSxnQkFBZ0IsQ0FBQyxDQUFDO01BQ3hDQyxjQUFjLEVBQUVoQixLQUFLLENBQUNpQixnQkFBZ0IsQ0FBQztJQUN6QyxDQUFDLENBQUM7SUFDRixPQUFPdFksZUFBZSxDQUFDdVksMEJBQTBCLENBQUM3USxJQUFJLENBQUNDLE1BQU0sQ0FBQztFQUNoRTs7RUFFQSxNQUFNNlEsT0FBT0EsQ0FBQ0MsYUFBcUIsRUFBd0I7SUFDekQsSUFBSS9RLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxlQUFlLEVBQUU7TUFDeEVzVyxjQUFjLEVBQUVNLGFBQWE7TUFDN0JDLFVBQVUsRUFBRSxJQUFJO01BQ2hCOUMsV0FBVyxFQUFFO0lBQ2YsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxJQUFJLENBQUM3SyxJQUFJLENBQUMsQ0FBQztJQUNqQixPQUFPL0ssZUFBZSxDQUFDc1csd0JBQXdCLENBQUM1TyxJQUFJLENBQUNDLE1BQU0sQ0FBQztFQUM5RDs7RUFFQSxNQUFNZ1IsU0FBU0EsQ0FBQ0MsV0FBbUIsRUFBcUI7SUFDdEQsSUFBSWxSLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRTtNQUMxRWdYLFdBQVcsRUFBRUQ7SUFDZixDQUFDLENBQUM7SUFDRixNQUFNLElBQUksQ0FBQzdOLElBQUksQ0FBQyxDQUFDO0lBQ2pCLE9BQU9yRCxJQUFJLENBQUNDLE1BQU0sQ0FBQ21SLFlBQVk7RUFDakM7O0VBRUEsTUFBTUMsV0FBV0EsQ0FBQ3ZVLE9BQWUsRUFBRXdVLGFBQWEsR0FBR0MsbUNBQTBCLENBQUNDLG1CQUFtQixFQUFFclMsVUFBVSxHQUFHLENBQUMsRUFBRUMsYUFBYSxHQUFHLENBQUMsRUFBbUI7SUFDckosSUFBSVksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLE1BQU0sRUFBRTtNQUM3RHNYLElBQUksRUFBRTNVLE9BQU87TUFDYjRVLGNBQWMsRUFBRUosYUFBYSxLQUFLQyxtQ0FBMEIsQ0FBQ0MsbUJBQW1CLEdBQUcsT0FBTyxHQUFHLE1BQU07TUFDbkcxUixhQUFhLEVBQUVYLFVBQVU7TUFDekJpSCxhQUFhLEVBQUVoSDtJQUNuQixDQUFDLENBQUM7SUFDRixPQUFPWSxJQUFJLENBQUNDLE1BQU0sQ0FBQ3lMLFNBQVM7RUFDOUI7O0VBRUEsTUFBTWlHLGFBQWFBLENBQUM3VSxPQUFlLEVBQUVKLE9BQWUsRUFBRWdQLFNBQWlCLEVBQXlDO0lBQzlHLElBQUk7TUFDRixJQUFJMUwsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFDc1gsSUFBSSxFQUFFM1UsT0FBTyxFQUFFSixPQUFPLEVBQUVBLE9BQU8sRUFBRWdQLFNBQVMsRUFBRUEsU0FBUyxFQUFDLENBQUM7TUFDM0gsSUFBSXpMLE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNO01BQ3hCLE9BQU8sSUFBSTJSLHFDQUE0QjtRQUNyQzNSLE1BQU0sQ0FBQzRSLElBQUksR0FBRyxFQUFDQyxNQUFNLEVBQUU3UixNQUFNLENBQUM0UixJQUFJLEVBQUVFLEtBQUssRUFBRTlSLE1BQU0sQ0FBQytSLEdBQUcsRUFBRVYsYUFBYSxFQUFFclIsTUFBTSxDQUFDeVIsY0FBYyxLQUFLLE1BQU0sR0FBR0gsbUNBQTBCLENBQUNVLGtCQUFrQixHQUFHVixtQ0FBMEIsQ0FBQ0MsbUJBQW1CLEVBQUU3USxPQUFPLEVBQUVWLE1BQU0sQ0FBQ1UsT0FBTyxFQUFDLEdBQUcsRUFBQ21SLE1BQU0sRUFBRSxLQUFLO01BQ3BQLENBQUM7SUFDSCxDQUFDLENBQUMsT0FBTzNhLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsQ0FBQytGLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJMFUscUNBQTRCLENBQUMsRUFBQ0UsTUFBTSxFQUFFLEtBQUssRUFBQyxDQUFDO01BQ2hGLE1BQU0zYSxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNK2EsUUFBUUEsQ0FBQ0MsTUFBYyxFQUFtQjtJQUM5QyxJQUFJO01BQ0YsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDelosTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFDaVksSUFBSSxFQUFFRCxNQUFNLEVBQUMsQ0FBQyxFQUFFbFMsTUFBTSxDQUFDb1MsTUFBTTtJQUNwRyxDQUFDLENBQUMsT0FBT2xiLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWThGLHVCQUFjLElBQUk5RixDQUFDLENBQUMrRixPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJL0YsQ0FBQyxDQUFDMkYsT0FBTyxDQUFDRSxRQUFRLENBQUMsMEJBQTBCLENBQUMsRUFBRTdGLENBQUMsR0FBRyxJQUFJOEYsdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRTlGLENBQUMsQ0FBQytGLE9BQU8sQ0FBQyxDQUFDLEVBQUUvRixDQUFDLENBQUNnRyxZQUFZLENBQUMsQ0FBQyxFQUFFaEcsQ0FBQyxDQUFDaUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDak4sTUFBTWpHLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU1tYixVQUFVQSxDQUFDSCxNQUFjLEVBQUVJLEtBQWEsRUFBRTdWLE9BQWUsRUFBMEI7SUFDdkYsSUFBSTs7TUFFRjtNQUNBLElBQUlzRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUNpWSxJQUFJLEVBQUVELE1BQU0sRUFBRUUsTUFBTSxFQUFFRSxLQUFLLEVBQUU3VixPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDOztNQUV6SDtNQUNBLElBQUk4VixLQUFLLEdBQUcsSUFBSUMsc0JBQWEsQ0FBQyxDQUFDO01BQy9CRCxLQUFLLENBQUNFLFNBQVMsQ0FBQyxJQUFJLENBQUM7TUFDckJGLEtBQUssQ0FBQ0csbUJBQW1CLENBQUMzUyxJQUFJLENBQUNDLE1BQU0sQ0FBQzJTLGFBQWEsQ0FBQztNQUNwREosS0FBSyxDQUFDM0MsV0FBVyxDQUFDN1AsSUFBSSxDQUFDQyxNQUFNLENBQUM0UyxPQUFPLENBQUM7TUFDdENMLEtBQUssQ0FBQ00saUJBQWlCLENBQUN0VCxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDOFMsUUFBUSxDQUFDLENBQUM7TUFDckQsT0FBT1AsS0FBSztJQUNkLENBQUMsQ0FBQyxPQUFPcmIsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZOEYsdUJBQWMsSUFBSTlGLENBQUMsQ0FBQytGLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUkvRixDQUFDLENBQUMyRixPQUFPLENBQUNFLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFN0YsQ0FBQyxHQUFHLElBQUk4Rix1QkFBYyxDQUFDLDRCQUE0QixFQUFFOUYsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsRUFBRS9GLENBQUMsQ0FBQ2dHLFlBQVksQ0FBQyxDQUFDLEVBQUVoRyxDQUFDLENBQUNpRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNqTixNQUFNakcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTTZiLFVBQVVBLENBQUNiLE1BQWMsRUFBRXpWLE9BQWUsRUFBRUksT0FBZ0IsRUFBbUI7SUFDbkYsSUFBSTtNQUNGLElBQUlrRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUNpWSxJQUFJLEVBQUVELE1BQU0sRUFBRXpWLE9BQU8sRUFBRUEsT0FBTyxFQUFFSSxPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDO01BQzVILE9BQU9rRCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3lMLFNBQVM7SUFDOUIsQ0FBQyxDQUFDLE9BQU92VSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVk4Rix1QkFBYyxJQUFJOUYsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSS9GLENBQUMsQ0FBQzJGLE9BQU8sQ0FBQ0UsUUFBUSxDQUFDLDBCQUEwQixDQUFDLEVBQUU3RixDQUFDLEdBQUcsSUFBSThGLHVCQUFjLENBQUMsNEJBQTRCLEVBQUU5RixDQUFDLENBQUMrRixPQUFPLENBQUMsQ0FBQyxFQUFFL0YsQ0FBQyxDQUFDZ0csWUFBWSxDQUFDLENBQUMsRUFBRWhHLENBQUMsQ0FBQ2lHLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQ2pOLE1BQU1qRyxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNOGIsWUFBWUEsQ0FBQ2QsTUFBYyxFQUFFelYsT0FBZSxFQUFFSSxPQUEyQixFQUFFNE8sU0FBaUIsRUFBMEI7SUFDMUgsSUFBSTs7TUFFRjtNQUNBLElBQUkxTCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsZ0JBQWdCLEVBQUU7UUFDekVpWSxJQUFJLEVBQUVELE1BQU07UUFDWnpWLE9BQU8sRUFBRUEsT0FBTztRQUNoQkksT0FBTyxFQUFFQSxPQUFPO1FBQ2hCNE8sU0FBUyxFQUFFQTtNQUNiLENBQUMsQ0FBQzs7TUFFRjtNQUNBLElBQUlvRyxNQUFNLEdBQUc5UixJQUFJLENBQUNDLE1BQU0sQ0FBQzRSLElBQUk7TUFDN0IsSUFBSVcsS0FBSyxHQUFHLElBQUlDLHNCQUFhLENBQUMsQ0FBQztNQUMvQkQsS0FBSyxDQUFDRSxTQUFTLENBQUNaLE1BQU0sQ0FBQztNQUN2QixJQUFJQSxNQUFNLEVBQUU7UUFDVlUsS0FBSyxDQUFDRyxtQkFBbUIsQ0FBQzNTLElBQUksQ0FBQ0MsTUFBTSxDQUFDMlMsYUFBYSxDQUFDO1FBQ3BESixLQUFLLENBQUMzQyxXQUFXLENBQUM3UCxJQUFJLENBQUNDLE1BQU0sQ0FBQzRTLE9BQU8sQ0FBQztRQUN0Q0wsS0FBSyxDQUFDTSxpQkFBaUIsQ0FBQ3RULE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUM4UyxRQUFRLENBQUMsQ0FBQztNQUN2RDtNQUNBLE9BQU9QLEtBQUs7SUFDZCxDQUFDLENBQUMsT0FBT3JiLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWThGLHVCQUFjLElBQUk5RixDQUFDLENBQUMrRixPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJL0YsQ0FBQyxDQUFDMkYsT0FBTyxLQUFLLGNBQWMsRUFBRTNGLENBQUMsR0FBRyxJQUFJOEYsdUJBQWMsQ0FBQywwQ0FBMEMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUM3SixJQUFJOUYsQ0FBQyxZQUFZOEYsdUJBQWMsSUFBSTlGLENBQUMsQ0FBQytGLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUkvRixDQUFDLENBQUMyRixPQUFPLENBQUNFLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFN0YsQ0FBQyxHQUFHLElBQUk4Rix1QkFBYyxDQUFDLDRCQUE0QixFQUFFOUYsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsRUFBRS9GLENBQUMsQ0FBQ2dHLFlBQVksQ0FBQyxDQUFDLEVBQUVoRyxDQUFDLENBQUNpRyxZQUFZLENBQUMsQ0FBQyxDQUFDO01BQzlNLE1BQU1qRyxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNK2IsYUFBYUEsQ0FBQ2YsTUFBYyxFQUFFclYsT0FBZ0IsRUFBbUI7SUFDckUsSUFBSTtNQUNGLElBQUlrRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsaUJBQWlCLEVBQUUsRUFBQ2lZLElBQUksRUFBRUQsTUFBTSxFQUFFclYsT0FBTyxFQUFFQSxPQUFPLEVBQUMsQ0FBQztNQUM3RyxPQUFPa0QsSUFBSSxDQUFDQyxNQUFNLENBQUN5TCxTQUFTO0lBQzlCLENBQUMsQ0FBQyxPQUFPdlUsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZOEYsdUJBQWMsSUFBSTlGLENBQUMsQ0FBQytGLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUkvRixDQUFDLENBQUMyRixPQUFPLENBQUNFLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFN0YsQ0FBQyxHQUFHLElBQUk4Rix1QkFBYyxDQUFDLDRCQUE0QixFQUFFOUYsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsRUFBRS9GLENBQUMsQ0FBQ2dHLFlBQVksQ0FBQyxDQUFDLEVBQUVoRyxDQUFDLENBQUNpRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNqTixNQUFNakcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTWdjLGVBQWVBLENBQUNoQixNQUFjLEVBQUVyVixPQUEyQixFQUFFNE8sU0FBaUIsRUFBb0I7SUFDdEcsSUFBSTtNQUNGLElBQUkxTCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsbUJBQW1CLEVBQUU7UUFDNUVpWSxJQUFJLEVBQUVELE1BQU07UUFDWnJWLE9BQU8sRUFBRUEsT0FBTztRQUNoQjRPLFNBQVMsRUFBRUE7TUFDYixDQUFDLENBQUM7TUFDRixPQUFPMUwsSUFBSSxDQUFDQyxNQUFNLENBQUM0UixJQUFJO0lBQ3pCLENBQUMsQ0FBQyxPQUFPMWEsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZOEYsdUJBQWMsSUFBSTlGLENBQUMsQ0FBQytGLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUkvRixDQUFDLENBQUMyRixPQUFPLENBQUNFLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFN0YsQ0FBQyxHQUFHLElBQUk4Rix1QkFBYyxDQUFDLDRCQUE0QixFQUFFOUYsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsRUFBRS9GLENBQUMsQ0FBQ2dHLFlBQVksQ0FBQyxDQUFDLEVBQUVoRyxDQUFDLENBQUNpRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNqTixNQUFNakcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTWljLHFCQUFxQkEsQ0FBQ3RXLE9BQWdCLEVBQW1CO0lBQzdELElBQUlrRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsbUJBQW1CLEVBQUU7TUFDNUV3USxHQUFHLEVBQUUsSUFBSTtNQUNUN04sT0FBTyxFQUFFQTtJQUNYLENBQUMsQ0FBQztJQUNGLE9BQU9rRCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3lMLFNBQVM7RUFDOUI7O0VBRUEsTUFBTTJILHNCQUFzQkEsQ0FBQ2xVLFVBQWtCLEVBQUVxTyxNQUFjLEVBQUUxUSxPQUFnQixFQUFtQjtJQUNsRyxJQUFJa0QsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG1CQUFtQixFQUFFO01BQzVFMkYsYUFBYSxFQUFFWCxVQUFVO01BQ3pCcU8sTUFBTSxFQUFFQSxNQUFNLENBQUNDLFFBQVEsQ0FBQyxDQUFDO01BQ3pCM1EsT0FBTyxFQUFFQTtJQUNYLENBQUMsQ0FBQztJQUNGLE9BQU9rRCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3lMLFNBQVM7RUFDOUI7O0VBRUEsTUFBTW5MLGlCQUFpQkEsQ0FBQzdELE9BQWUsRUFBRUksT0FBMkIsRUFBRTRPLFNBQWlCLEVBQStCOztJQUVwSDtJQUNBLElBQUkxTCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMscUJBQXFCLEVBQUU7TUFDOUV1QyxPQUFPLEVBQUVBLE9BQU87TUFDaEJJLE9BQU8sRUFBRUEsT0FBTztNQUNoQjRPLFNBQVMsRUFBRUE7SUFDYixDQUFDLENBQUM7O0lBRUY7SUFDQSxJQUFJb0csTUFBTSxHQUFHOVIsSUFBSSxDQUFDQyxNQUFNLENBQUM0UixJQUFJO0lBQzdCLElBQUlXLEtBQUssR0FBRyxJQUFJYywyQkFBa0IsQ0FBQyxDQUFDO0lBQ3BDZCxLQUFLLENBQUNFLFNBQVMsQ0FBQ1osTUFBTSxDQUFDO0lBQ3ZCLElBQUlBLE1BQU0sRUFBRTtNQUNWVSxLQUFLLENBQUNlLHlCQUF5QixDQUFDL1QsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ2dNLEtBQUssQ0FBQyxDQUFDO01BQzFEdUcsS0FBSyxDQUFDZ0IsY0FBYyxDQUFDaFUsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ3dULEtBQUssQ0FBQyxDQUFDO0lBQ2pEO0lBQ0EsT0FBT2pCLEtBQUs7RUFDZDs7RUFFQSxNQUFNa0IsVUFBVUEsQ0FBQ3RQLFFBQWtCLEVBQXFCO0lBQ3RELE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQzFMLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQ21LLEtBQUssRUFBRUYsUUFBUSxFQUFDLENBQUMsRUFBRW5FLE1BQU0sQ0FBQzBULEtBQUs7RUFDeEc7O0VBRUEsTUFBTUMsVUFBVUEsQ0FBQ3hQLFFBQWtCLEVBQUV1UCxLQUFlLEVBQWlCO0lBQ25FLE1BQU0sSUFBSSxDQUFDamIsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGNBQWMsRUFBRSxFQUFDbUssS0FBSyxFQUFFRixRQUFRLEVBQUV1UCxLQUFLLEVBQUVBLEtBQUssRUFBQyxDQUFDO0VBQ2hHOztFQUVBLE1BQU1FLHFCQUFxQkEsQ0FBQ0MsWUFBdUIsRUFBcUM7SUFDdEYsSUFBSTlULElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFDNFosT0FBTyxFQUFFRCxZQUFZLEVBQUMsQ0FBQztJQUNyRyxJQUFJLENBQUM5VCxJQUFJLENBQUNDLE1BQU0sQ0FBQzhULE9BQU8sRUFBRSxPQUFPLEVBQUU7SUFDbkMsSUFBSUEsT0FBTyxHQUFHLEVBQUU7SUFDaEIsS0FBSyxJQUFJQyxRQUFRLElBQUloVSxJQUFJLENBQUNDLE1BQU0sQ0FBQzhULE9BQU8sRUFBRTtNQUN4Q0EsT0FBTyxDQUFDN08sSUFBSSxDQUFDLElBQUkrTywrQkFBc0IsQ0FBQyxDQUFDLENBQUN2UyxRQUFRLENBQUNzUyxRQUFRLENBQUN4UyxLQUFLLENBQUMsQ0FBQ21GLFVBQVUsQ0FBQ3FOLFFBQVEsQ0FBQ3RYLE9BQU8sQ0FBQyxDQUFDd1gsY0FBYyxDQUFDRixRQUFRLENBQUNHLFdBQVcsQ0FBQyxDQUFDNVIsWUFBWSxDQUFDeVIsUUFBUSxDQUFDL1IsVUFBVSxDQUFDLENBQUM7SUFDeks7SUFDQSxPQUFPOFIsT0FBTztFQUNoQjs7RUFFQSxNQUFNSyxtQkFBbUJBLENBQUMxWCxPQUFlLEVBQUV5WCxXQUFvQixFQUFtQjtJQUNoRixJQUFJblUsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGtCQUFrQixFQUFFLEVBQUN1QyxPQUFPLEVBQUVBLE9BQU8sRUFBRXlYLFdBQVcsRUFBRUEsV0FBVyxFQUFDLENBQUM7SUFDMUgsT0FBT25VLElBQUksQ0FBQ0MsTUFBTSxDQUFDdUIsS0FBSztFQUMxQjs7RUFFQSxNQUFNNlMsb0JBQW9CQSxDQUFDN1MsS0FBYSxFQUFFbUYsVUFBbUIsRUFBRWpLLE9BQTJCLEVBQUV3WCxjQUF1QixFQUFFQyxXQUErQixFQUFpQjtJQUNuSyxJQUFJblUsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG1CQUFtQixFQUFFO01BQzVFcUgsS0FBSyxFQUFFQSxLQUFLO01BQ1o4UyxXQUFXLEVBQUUzTixVQUFVO01BQ3ZCakssT0FBTyxFQUFFQSxPQUFPO01BQ2hCNlgsZUFBZSxFQUFFTCxjQUFjO01BQy9CQyxXQUFXLEVBQUVBO0lBQ2YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUssc0JBQXNCQSxDQUFDQyxRQUFnQixFQUFpQjtJQUM1RCxNQUFNLElBQUksQ0FBQy9iLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxFQUFDcUgsS0FBSyxFQUFFaVQsUUFBUSxFQUFDLENBQUM7RUFDekY7O0VBRUEsTUFBTUMsV0FBV0EsQ0FBQ2hRLEdBQUcsRUFBRWlRLGNBQWMsRUFBRTtJQUNyQyxNQUFNLElBQUksQ0FBQ2pjLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQ3VLLEdBQUcsRUFBRUEsR0FBRyxFQUFFRSxRQUFRLEVBQUUrUCxjQUFjLEVBQUMsQ0FBQztFQUNyRzs7RUFFQSxNQUFNQyxhQUFhQSxDQUFDRCxjQUF3QixFQUFpQjtJQUMzRCxNQUFNLElBQUksQ0FBQ2pjLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFDeUssUUFBUSxFQUFFK1AsY0FBYyxFQUFDLENBQUM7RUFDN0Y7O0VBRUEsTUFBTUUsY0FBY0EsQ0FBQSxFQUFnQztJQUNsRCxJQUFJQyxJQUFJLEdBQUcsRUFBRTtJQUNiLElBQUk5VSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsa0JBQWtCLENBQUM7SUFDNUUsSUFBSTZGLElBQUksQ0FBQ0MsTUFBTSxDQUFDOFUsWUFBWSxFQUFFO01BQzVCLEtBQUssSUFBSUMsYUFBYSxJQUFJaFYsSUFBSSxDQUFDQyxNQUFNLENBQUM4VSxZQUFZLEVBQUU7UUFDbERELElBQUksQ0FBQzVQLElBQUksQ0FBQyxJQUFJK1AseUJBQWdCLENBQUM7VUFDN0J2USxHQUFHLEVBQUVzUSxhQUFhLENBQUN0USxHQUFHLEdBQUdzUSxhQUFhLENBQUN0USxHQUFHLEdBQUd6TCxTQUFTO1VBQ3REK00sS0FBSyxFQUFFZ1AsYUFBYSxDQUFDaFAsS0FBSyxHQUFHZ1AsYUFBYSxDQUFDaFAsS0FBSyxHQUFHL00sU0FBUztVQUM1RDBiLGNBQWMsRUFBRUssYUFBYSxDQUFDcFE7UUFDaEMsQ0FBQyxDQUFDLENBQUM7TUFDTDtJQUNGO0lBQ0EsT0FBT2tRLElBQUk7RUFDYjs7RUFFQSxNQUFNSSxrQkFBa0JBLENBQUN4USxHQUFXLEVBQUVzQixLQUFhLEVBQWlCO0lBQ2xFLE1BQU0sSUFBSSxDQUFDdE4sTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLDZCQUE2QixFQUFFLEVBQUN1SyxHQUFHLEVBQUVBLEdBQUcsRUFBRXlQLFdBQVcsRUFBRW5PLEtBQUssRUFBQyxDQUFDO0VBQzlHOztFQUVBLE1BQU1tUCxhQUFhQSxDQUFDemMsTUFBc0IsRUFBbUI7SUFDM0RBLE1BQU0sR0FBR0gscUJBQVksQ0FBQ3NVLHdCQUF3QixDQUFDblUsTUFBTSxDQUFDO0lBQ3RELElBQUlzSCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsVUFBVSxFQUFFO01BQ25FdUMsT0FBTyxFQUFFaEUsTUFBTSxDQUFDNFUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ3JNLFVBQVUsQ0FBQyxDQUFDO01BQ2pEdU0sTUFBTSxFQUFFOVUsTUFBTSxDQUFDNFUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0MsU0FBUyxDQUFDLENBQUMsR0FBRzdVLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLFNBQVMsQ0FBQyxDQUFDLENBQUNFLFFBQVEsQ0FBQyxDQUFDLEdBQUd4VSxTQUFTO01BQ2hIZ0osVUFBVSxFQUFFdkosTUFBTSxDQUFDbVYsWUFBWSxDQUFDLENBQUM7TUFDakN1SCxjQUFjLEVBQUUxYyxNQUFNLENBQUMyYyxnQkFBZ0IsQ0FBQyxDQUFDO01BQ3pDQyxjQUFjLEVBQUU1YyxNQUFNLENBQUM2YyxPQUFPLENBQUM7SUFDakMsQ0FBQyxDQUFDO0lBQ0YsT0FBT3ZWLElBQUksQ0FBQ0MsTUFBTSxDQUFDdVYsR0FBRztFQUN4Qjs7RUFFQSxNQUFNQyxlQUFlQSxDQUFDRCxHQUFXLEVBQTJCO0lBQzFELElBQUFuVyxlQUFNLEVBQUNtVyxHQUFHLEVBQUUsMkJBQTJCLENBQUM7SUFDeEMsSUFBSXhWLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBQ3FiLEdBQUcsRUFBRUEsR0FBRyxFQUFDLENBQUM7SUFDakYsSUFBSTljLE1BQU0sR0FBRyxJQUFJZ2QsdUJBQWMsQ0FBQyxFQUFDaFosT0FBTyxFQUFFc0QsSUFBSSxDQUFDQyxNQUFNLENBQUN1VixHQUFHLENBQUM5WSxPQUFPLEVBQUU4USxNQUFNLEVBQUVoTyxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDdVYsR0FBRyxDQUFDaEksTUFBTSxDQUFDLEVBQUMsQ0FBQztJQUMzRzlVLE1BQU0sQ0FBQzZKLFlBQVksQ0FBQ3ZDLElBQUksQ0FBQ0MsTUFBTSxDQUFDdVYsR0FBRyxDQUFDdlQsVUFBVSxDQUFDO0lBQy9DdkosTUFBTSxDQUFDaWQsZ0JBQWdCLENBQUMzVixJQUFJLENBQUNDLE1BQU0sQ0FBQ3VWLEdBQUcsQ0FBQ0osY0FBYyxDQUFDO0lBQ3ZEMWMsTUFBTSxDQUFDa2QsT0FBTyxDQUFDNVYsSUFBSSxDQUFDQyxNQUFNLENBQUN1VixHQUFHLENBQUNGLGNBQWMsQ0FBQztJQUM5QyxJQUFJLEVBQUUsS0FBSzVjLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNyTSxVQUFVLENBQUMsQ0FBQyxFQUFFdkksTUFBTSxDQUFDNFUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzNHLFVBQVUsQ0FBQzFOLFNBQVMsQ0FBQztJQUN0RyxJQUFJLEVBQUUsS0FBS1AsTUFBTSxDQUFDbVYsWUFBWSxDQUFDLENBQUMsRUFBRW5WLE1BQU0sQ0FBQzZKLFlBQVksQ0FBQ3RKLFNBQVMsQ0FBQztJQUNoRSxJQUFJLEVBQUUsS0FBS1AsTUFBTSxDQUFDMmMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFM2MsTUFBTSxDQUFDaWQsZ0JBQWdCLENBQUMxYyxTQUFTLENBQUM7SUFDeEUsSUFBSSxFQUFFLEtBQUtQLE1BQU0sQ0FBQzZjLE9BQU8sQ0FBQyxDQUFDLEVBQUU3YyxNQUFNLENBQUNrZCxPQUFPLENBQUMzYyxTQUFTLENBQUM7SUFDdEQsT0FBT1AsTUFBTTtFQUNmOztFQUVBLE1BQU1tZCxZQUFZQSxDQUFDaFYsR0FBVyxFQUFtQjtJQUMvQyxJQUFJO01BQ0YsSUFBSWIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsRUFBRSxFQUFDMEcsR0FBRyxFQUFFQSxHQUFHLEVBQUMsQ0FBQztNQUNyRixPQUFPYixJQUFJLENBQUNDLE1BQU0sQ0FBQzZWLEtBQUssS0FBSyxFQUFFLEdBQUc3YyxTQUFTLEdBQUcrRyxJQUFJLENBQUNDLE1BQU0sQ0FBQzZWLEtBQUs7SUFDakUsQ0FBQyxDQUFDLE9BQU8zZSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVk4Rix1QkFBYyxJQUFJOUYsQ0FBQyxDQUFDK0YsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxPQUFPakUsU0FBUztNQUN4RSxNQUFNOUIsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTTRlLFlBQVlBLENBQUNsVixHQUFXLEVBQUVtVixHQUFXLEVBQWlCO0lBQzFELE1BQU0sSUFBSSxDQUFDdGQsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsRUFBRSxFQUFDMEcsR0FBRyxFQUFFQSxHQUFHLEVBQUVpVixLQUFLLEVBQUVFLEdBQUcsRUFBQyxDQUFDO0VBQ3hGOztFQUVBLE1BQU1DLFdBQVdBLENBQUNDLFVBQWtCLEVBQUVDLGdCQUEwQixFQUFFQyxhQUF1QixFQUFpQjtJQUN4RyxNQUFNLElBQUksQ0FBQzFkLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxjQUFjLEVBQUU7TUFDNURrYyxhQUFhLEVBQUVILFVBQVU7TUFDekJJLG9CQUFvQixFQUFFSCxnQkFBZ0I7TUFDdENJLGNBQWMsRUFBRUg7SUFDbEIsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUksVUFBVUEsQ0FBQSxFQUFrQjtJQUNoQyxNQUFNLElBQUksQ0FBQzlkLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxhQUFhLENBQUM7RUFDOUQ7O0VBRUEsTUFBTXNjLHNCQUFzQkEsQ0FBQSxFQUFxQjtJQUMvQyxJQUFJelcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGFBQWEsQ0FBQztJQUN2RSxPQUFPNkYsSUFBSSxDQUFDQyxNQUFNLENBQUN5VyxzQkFBc0IsS0FBSyxJQUFJO0VBQ3BEOztFQUVBLE1BQU1DLGVBQWVBLENBQUEsRUFBZ0M7SUFDbkQsSUFBSTNXLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxhQUFhLENBQUM7SUFDdkUsSUFBSThGLE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNO0lBQ3hCLElBQUkyVyxJQUFJLEdBQUcsSUFBSUMsMkJBQWtCLENBQUMsQ0FBQztJQUNuQ0QsSUFBSSxDQUFDRSxhQUFhLENBQUM3VyxNQUFNLENBQUM4VyxRQUFRLENBQUM7SUFDbkNILElBQUksQ0FBQ0ksVUFBVSxDQUFDL1csTUFBTSxDQUFDZ1gsS0FBSyxDQUFDO0lBQzdCTCxJQUFJLENBQUNNLFlBQVksQ0FBQ2pYLE1BQU0sQ0FBQ2tYLFNBQVMsQ0FBQztJQUNuQ1AsSUFBSSxDQUFDUSxrQkFBa0IsQ0FBQ25YLE1BQU0sQ0FBQ3dULEtBQUssQ0FBQztJQUNyQyxPQUFPbUQsSUFBSTtFQUNiOztFQUVBLE1BQU1TLGVBQWVBLENBQUEsRUFBb0I7SUFDdkMsSUFBSXJYLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFDa0MsNEJBQTRCLEVBQUUsSUFBSSxFQUFDLENBQUM7SUFDbEgsSUFBSSxDQUFDMUQsWUFBWSxHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJc0gsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07SUFDeEIsT0FBT0EsTUFBTSxDQUFDcVgsYUFBYTtFQUM3Qjs7RUFFQSxNQUFNQyxZQUFZQSxDQUFDQyxhQUF1QixFQUFFTCxTQUFpQixFQUFFcmQsUUFBZ0IsRUFBbUI7SUFDaEcsSUFBSWtHLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxlQUFlLEVBQUU7TUFDeEVtZCxhQUFhLEVBQUVFLGFBQWE7TUFDNUJMLFNBQVMsRUFBRUEsU0FBUztNQUNwQnJkLFFBQVEsRUFBRUE7SUFDWixDQUFDLENBQUM7SUFDRixJQUFJLENBQUNuQixZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLE9BQU9xSCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3FYLGFBQWE7RUFDbEM7O0VBRUEsTUFBTUcsb0JBQW9CQSxDQUFDRCxhQUF1QixFQUFFMWQsUUFBZ0IsRUFBcUM7SUFDdkcsSUFBSWtHLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSxFQUFDbWQsYUFBYSxFQUFFRSxhQUFhLEVBQUUxZCxRQUFRLEVBQUVBLFFBQVEsRUFBQyxDQUFDO0lBQ3RJLElBQUksQ0FBQ25CLFlBQVksR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSStlLFFBQVEsR0FBRyxJQUFJQyxpQ0FBd0IsQ0FBQyxDQUFDO0lBQzdDRCxRQUFRLENBQUMvUSxVQUFVLENBQUMzRyxJQUFJLENBQUNDLE1BQU0sQ0FBQ3ZELE9BQU8sQ0FBQztJQUN4Q2diLFFBQVEsQ0FBQ0UsY0FBYyxDQUFDNVgsSUFBSSxDQUFDQyxNQUFNLENBQUNxWCxhQUFhLENBQUM7SUFDbEQsSUFBSUksUUFBUSxDQUFDelcsVUFBVSxDQUFDLENBQUMsQ0FBQ29ELE1BQU0sS0FBSyxDQUFDLEVBQUVxVCxRQUFRLENBQUMvUSxVQUFVLENBQUMxTixTQUFTLENBQUM7SUFDdEUsSUFBSXllLFFBQVEsQ0FBQ0csY0FBYyxDQUFDLENBQUMsQ0FBQ3hULE1BQU0sS0FBSyxDQUFDLEVBQUVxVCxRQUFRLENBQUNFLGNBQWMsQ0FBQzNlLFNBQVMsQ0FBQztJQUM5RSxPQUFPeWUsUUFBUTtFQUNqQjs7RUFFQSxNQUFNSSxpQkFBaUJBLENBQUEsRUFBb0I7SUFDekMsSUFBSTlYLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQztJQUNoRixPQUFPNkYsSUFBSSxDQUFDQyxNQUFNLENBQUMyVyxJQUFJO0VBQ3pCOztFQUVBLE1BQU1tQixpQkFBaUJBLENBQUNQLGFBQXVCLEVBQUVRLGtCQUE0QixFQUFtQjtJQUM5RixJQUFJQSxrQkFBa0IsS0FBSy9lLFNBQVMsRUFBRStlLGtCQUFrQixHQUFHLElBQUk7SUFDL0QsSUFBSSxDQUFDNWUsaUJBQVEsQ0FBQzhXLE9BQU8sQ0FBQ3NILGFBQWEsQ0FBQyxFQUFFLE1BQU0sSUFBSXRlLG9CQUFXLENBQUMsOENBQThDLENBQUM7SUFDM0csSUFBSThHLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxzQkFBc0IsRUFBRSxFQUFDeWMsSUFBSSxFQUFFWSxhQUFhLEVBQUVTLG9CQUFvQixFQUFFRCxrQkFBa0IsRUFBQyxDQUFDO0lBQ2pKLE9BQU9oWSxJQUFJLENBQUNDLE1BQU0sQ0FBQ2lZLFNBQVM7RUFDOUI7O0VBRUEsTUFBTUMsaUJBQWlCQSxDQUFDQyxhQUFxQixFQUFxQztJQUNoRixJQUFJcFksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsRUFBRSxFQUFDZ1gsV0FBVyxFQUFFaUgsYUFBYSxFQUFDLENBQUM7SUFDdkcsSUFBSW5ZLE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNO0lBQ3hCLElBQUlvWSxVQUFVLEdBQUcsSUFBSUMsaUNBQXdCLENBQUMsQ0FBQztJQUMvQ0QsVUFBVSxDQUFDRSxzQkFBc0IsQ0FBQ3RZLE1BQU0sQ0FBQ2tSLFdBQVcsQ0FBQztJQUNyRGtILFVBQVUsQ0FBQ0csV0FBVyxDQUFDdlksTUFBTSxDQUFDbVIsWUFBWSxDQUFDO0lBQzNDLE9BQU9pSCxVQUFVO0VBQ25COztFQUVBLE1BQU1JLG1CQUFtQkEsQ0FBQ0MsbUJBQTJCLEVBQXFCO0lBQ3hFLElBQUkxWSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsaUJBQWlCLEVBQUUsRUFBQ2dYLFdBQVcsRUFBRXVILG1CQUFtQixFQUFDLENBQUM7SUFDL0csT0FBTzFZLElBQUksQ0FBQ0MsTUFBTSxDQUFDbVIsWUFBWTtFQUNqQzs7RUFFQSxNQUFNdUgsY0FBY0EsQ0FBQ0MsV0FBbUIsRUFBRUMsV0FBbUIsRUFBaUI7SUFDNUUsT0FBTyxJQUFJLENBQUNuZ0IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLHdCQUF3QixFQUFFLEVBQUMyZSxZQUFZLEVBQUVGLFdBQVcsSUFBSSxFQUFFLEVBQUVHLFlBQVksRUFBRUYsV0FBVyxJQUFJLEVBQUUsRUFBQyxDQUFDO0VBQzlJOztFQUVBLE1BQU1HLElBQUlBLENBQUEsRUFBa0I7SUFDMUIsTUFBTSxJQUFJLENBQUN0Z0IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLE9BQU8sQ0FBQztFQUN4RDs7RUFFQSxNQUFNOGUsS0FBS0EsQ0FBQ0QsSUFBSSxHQUFHLEtBQUssRUFBaUI7SUFDdkMsTUFBTSxLQUFLLENBQUNDLEtBQUssQ0FBQ0QsSUFBSSxDQUFDO0lBQ3ZCLElBQUlBLElBQUksS0FBSy9mLFNBQVMsRUFBRStmLElBQUksR0FBRyxLQUFLO0lBQ3BDLE1BQU0sSUFBSSxDQUFDMWUsS0FBSyxDQUFDLENBQUM7SUFDbEIsTUFBTSxJQUFJLENBQUM1QixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUNxQyxnQkFBZ0IsRUFBRXdjLElBQUksRUFBQyxDQUFDO0VBQ3pGOztFQUVBLE1BQU1FLFFBQVFBLENBQUEsRUFBcUI7SUFDakMsSUFBSTtNQUNGLE1BQU0sSUFBSSxDQUFDcmUsaUJBQWlCLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsT0FBTzFELENBQU0sRUFBRTtNQUNmLE9BQU9BLENBQUMsWUFBWThGLHVCQUFjLElBQUk5RixDQUFDLENBQUMrRixPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJL0YsQ0FBQyxDQUFDMkYsT0FBTyxDQUFDMEQsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZHO0lBQ0EsT0FBTyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0yWSxJQUFJQSxDQUFBLEVBQWtCO0lBQzFCLE1BQU0sSUFBSSxDQUFDN2UsS0FBSyxDQUFDLENBQUM7SUFDbEIsTUFBTSxJQUFJLENBQUM1QixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxDQUFDO0VBQzlEOztFQUVBOztFQUVBLE1BQU1xTSxvQkFBb0JBLENBQUEsRUFBZ0MsQ0FBRSxPQUFPLEtBQUssQ0FBQ0Esb0JBQW9CLENBQUMsQ0FBQyxDQUFFO0VBQ2pHLE1BQU1nQyxLQUFLQSxDQUFDMkosTUFBYyxFQUFxQyxDQUFFLE9BQU8sS0FBSyxDQUFDM0osS0FBSyxDQUFDMkosTUFBTSxDQUFDLENBQUU7RUFDN0YsTUFBTWlILG9CQUFvQkEsQ0FBQ3BTLEtBQW1DLEVBQXFDLENBQUUsT0FBTyxLQUFLLENBQUNvUyxvQkFBb0IsQ0FBQ3BTLEtBQUssQ0FBQyxDQUFFO0VBQy9JLE1BQU1xUyxvQkFBb0JBLENBQUNyUyxLQUFtQyxFQUFFLENBQUUsT0FBTyxLQUFLLENBQUNxUyxvQkFBb0IsQ0FBQ3JTLEtBQUssQ0FBQyxDQUFFO0VBQzVHLE1BQU1zUyxRQUFRQSxDQUFDNWdCLE1BQStCLEVBQTJCLENBQUUsT0FBTyxLQUFLLENBQUM0Z0IsUUFBUSxDQUFDNWdCLE1BQU0sQ0FBQyxDQUFFO0VBQzFHLE1BQU02Z0IsT0FBT0EsQ0FBQ3BKLFlBQXFDLEVBQW1CLENBQUUsT0FBTyxLQUFLLENBQUNvSixPQUFPLENBQUNwSixZQUFZLENBQUMsQ0FBRTtFQUM1RyxNQUFNcUosU0FBU0EsQ0FBQ3JILE1BQWMsRUFBbUIsQ0FBRSxPQUFPLEtBQUssQ0FBQ3FILFNBQVMsQ0FBQ3JILE1BQU0sQ0FBQyxDQUFFO0VBQ25GLE1BQU1zSCxTQUFTQSxDQUFDdEgsTUFBYyxFQUFFdUgsSUFBWSxFQUFpQixDQUFFLE9BQU8sS0FBSyxDQUFDRCxTQUFTLENBQUN0SCxNQUFNLEVBQUV1SCxJQUFJLENBQUMsQ0FBRTs7RUFFckc7O0VBRUEsYUFBYUMsa0JBQWtCQSxDQUFDQyxXQUEyRixFQUFFOWIsUUFBaUIsRUFBRWhFLFFBQWlCLEVBQTRCO0lBQzNMLElBQUlwQixNQUFNLEdBQUdKLGVBQWUsQ0FBQ3VoQixlQUFlLENBQUNELFdBQVcsRUFBRTliLFFBQVEsRUFBRWhFLFFBQVEsQ0FBQztJQUM3RSxJQUFJcEIsTUFBTSxDQUFDb2hCLEdBQUcsRUFBRSxPQUFPeGhCLGVBQWUsQ0FBQ3loQixxQkFBcUIsQ0FBQ3JoQixNQUFNLENBQUMsQ0FBQztJQUNoRSxPQUFPLElBQUlKLGVBQWUsQ0FBQ0ksTUFBTSxDQUFDO0VBQ3pDOztFQUVBLGFBQXVCcWhCLHFCQUFxQkEsQ0FBQ3JoQixNQUFtQyxFQUE0QjtJQUMxRyxJQUFBMkcsZUFBTSxFQUFDakcsaUJBQVEsQ0FBQzhXLE9BQU8sQ0FBQ3hYLE1BQU0sQ0FBQ29oQixHQUFHLENBQUMsRUFBRSx3REFBd0QsQ0FBQzs7SUFFOUY7SUFDQSxJQUFJRSxhQUFhLEdBQUcsTUFBQUMsT0FBQSxDQUFBQyxPQUFBLEdBQUFDLElBQUEsT0FBQWpqQix1QkFBQSxDQUFBMUMsT0FBQSxDQUFhLGVBQWUsR0FBQztJQUNqRCxNQUFNNGxCLFlBQVksR0FBR0osYUFBYSxDQUFDSyxLQUFLLENBQUMzaEIsTUFBTSxDQUFDb2hCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRXBoQixNQUFNLENBQUNvaEIsR0FBRyxDQUFDM00sS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQzNFbU4sR0FBRyxFQUFFLEVBQUUsR0FBR3hoQixPQUFPLENBQUN3aEIsR0FBRyxFQUFFQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDLENBQUM7SUFDRkgsWUFBWSxDQUFDSSxNQUFNLENBQUNDLFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFDdkNMLFlBQVksQ0FBQ00sTUFBTSxDQUFDRCxXQUFXLENBQUMsTUFBTSxDQUFDOztJQUV2QztJQUNBLElBQUlqRixHQUFHO0lBQ1AsSUFBSW1GLElBQUksR0FBRyxJQUFJO0lBQ2YsSUFBSXZSLE1BQU0sR0FBRyxFQUFFO0lBQ2YsSUFBSTtNQUNGLE9BQU8sTUFBTSxJQUFJNlEsT0FBTyxDQUFDLFVBQVNDLE9BQU8sRUFBRVUsTUFBTSxFQUFFOztRQUVqRDtRQUNBUixZQUFZLENBQUNJLE1BQU0sQ0FBQ0ssRUFBRSxDQUFDLE1BQU0sRUFBRSxnQkFBZXBKLElBQUksRUFBRTtVQUNsRCxJQUFJcUosSUFBSSxHQUFHckosSUFBSSxDQUFDaEUsUUFBUSxDQUFDLENBQUM7VUFDMUJzTixxQkFBWSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxFQUFFRixJQUFJLENBQUM7VUFDekIxUixNQUFNLElBQUkwUixJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7O1VBRXZCO1VBQ0EsSUFBSUcsZUFBZSxHQUFHLGFBQWE7VUFDbkMsSUFBSUMsa0JBQWtCLEdBQUdKLElBQUksQ0FBQ3RhLE9BQU8sQ0FBQ3lhLGVBQWUsQ0FBQztVQUN0RCxJQUFJQyxrQkFBa0IsSUFBSSxDQUFDLEVBQUU7WUFDM0IsSUFBSUMsSUFBSSxHQUFHTCxJQUFJLENBQUNNLFNBQVMsQ0FBQ0Ysa0JBQWtCLEdBQUdELGVBQWUsQ0FBQzVXLE1BQU0sRUFBRXlXLElBQUksQ0FBQ08sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdGLElBQUlDLGVBQWUsR0FBR1IsSUFBSSxDQUFDUyxPQUFPLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsSUFBSUMsSUFBSSxHQUFHSCxlQUFlLENBQUNGLFNBQVMsQ0FBQ0UsZUFBZSxDQUFDRCxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFFLElBQUlLLE1BQU0sR0FBR2hqQixNQUFNLENBQUNvaEIsR0FBRyxDQUFDdFosT0FBTyxDQUFDLFdBQVcsQ0FBQztZQUM1QyxJQUFJbWIsVUFBVSxHQUFHRCxNQUFNLElBQUksQ0FBQyxHQUFHLFNBQVMsSUFBSWhqQixNQUFNLENBQUNvaEIsR0FBRyxDQUFDNEIsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDM2UsV0FBVyxDQUFDLENBQUMsR0FBRyxLQUFLO1lBQ3hGeVksR0FBRyxHQUFHLENBQUNtRyxVQUFVLEdBQUcsT0FBTyxHQUFHLE1BQU0sSUFBSSxLQUFLLEdBQUdSLElBQUksR0FBRyxHQUFHLEdBQUdNLElBQUk7VUFDbkU7O1VBRUE7VUFDQSxJQUFJWCxJQUFJLENBQUN0YSxPQUFPLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLEVBQUU7O1lBRW5EO1lBQ0EsSUFBSW9iLFdBQVcsR0FBR2xqQixNQUFNLENBQUNvaEIsR0FBRyxDQUFDdFosT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUNuRCxJQUFJcWIsUUFBUSxHQUFHRCxXQUFXLElBQUksQ0FBQyxHQUFHbGpCLE1BQU0sQ0FBQ29oQixHQUFHLENBQUM4QixXQUFXLEdBQUcsQ0FBQyxDQUFDLEdBQUczaUIsU0FBUztZQUN6RSxJQUFJNkUsUUFBUSxHQUFHK2QsUUFBUSxLQUFLNWlCLFNBQVMsR0FBR0EsU0FBUyxHQUFHNGlCLFFBQVEsQ0FBQ1QsU0FBUyxDQUFDLENBQUMsRUFBRVMsUUFBUSxDQUFDcmIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hHLElBQUkxRyxRQUFRLEdBQUcraEIsUUFBUSxLQUFLNWlCLFNBQVMsR0FBR0EsU0FBUyxHQUFHNGlCLFFBQVEsQ0FBQ1QsU0FBUyxDQUFDUyxRQUFRLENBQUNyYixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pHLElBQUlzYixTQUFTLEdBQUdwakIsTUFBTSxDQUFDb2hCLEdBQUcsQ0FBQ3RaLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFDL0MsSUFBSXViLE1BQU0sR0FBR0QsU0FBUyxJQUFJLENBQUMsR0FBR3BqQixNQUFNLENBQUNvaEIsR0FBRyxDQUFDZ0MsU0FBUyxHQUFHLENBQUMsQ0FBQyxHQUFHN2lCLFNBQVM7WUFDbkUsSUFBSStpQixXQUFXLEdBQUd0akIsTUFBTSxDQUFDb2hCLEdBQUcsQ0FBQ3RaLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDL0MsSUFBSSxDQUFDM0IsZUFBZSxHQUFHbWQsV0FBVyxJQUFJLENBQUMsR0FBR3RqQixNQUFNLENBQUNvaEIsR0FBRyxDQUFDa0MsV0FBVyxHQUFHLENBQUMsQ0FBQyxHQUFHL2lCLFNBQVM7O1lBRWpGO1lBQ0FQLE1BQU0sR0FBR0EsTUFBTSxDQUFDeVAsSUFBSSxDQUFDLENBQUMsQ0FBQy9NLFNBQVMsQ0FBQyxFQUFDb2EsR0FBRyxFQUFFQSxHQUFHLEVBQUUxWCxRQUFRLEVBQUVBLFFBQVEsRUFBRWhFLFFBQVEsRUFBRUEsUUFBUSxFQUFFaWlCLE1BQU0sRUFBRUEsTUFBTSxFQUFFRSxRQUFRLEVBQUUsSUFBSSxDQUFDcGQsZUFBZSxFQUFFcWQsa0JBQWtCLEVBQUV4akIsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsR0FBR2pCLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUN3aUIscUJBQXFCLENBQUMsQ0FBQyxHQUFHbGpCLFNBQVMsRUFBQyxDQUFDO1lBQ3JPUCxNQUFNLENBQUNvaEIsR0FBRyxHQUFHN2dCLFNBQVM7WUFDdEIsSUFBSW1qQixNQUFNLEdBQUcsTUFBTTlqQixlQUFlLENBQUNxaEIsa0JBQWtCLENBQUNqaEIsTUFBTSxDQUFDO1lBQzdEMGpCLE1BQU0sQ0FBQ3RqQixPQUFPLEdBQUdzaEIsWUFBWTs7WUFFN0I7WUFDQSxJQUFJLENBQUNpQyxVQUFVLEdBQUcsSUFBSTtZQUN0Qm5DLE9BQU8sQ0FBQ2tDLE1BQU0sQ0FBQztVQUNqQjtRQUNGLENBQUMsQ0FBQzs7UUFFRjtRQUNBaEMsWUFBWSxDQUFDTSxNQUFNLENBQUNHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBU3BKLElBQUksRUFBRTtVQUM1QyxJQUFJc0oscUJBQVksQ0FBQ3VCLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFNVMsT0FBTyxDQUFDQyxLQUFLLENBQUM4SCxJQUFJLENBQUM7UUFDMUQsQ0FBQyxDQUFDOztRQUVGO1FBQ0EySSxZQUFZLENBQUNTLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBUzBCLElBQUksRUFBRTtVQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDRixVQUFVLEVBQUV6QixNQUFNLENBQUMsSUFBSTFoQixvQkFBVyxDQUFDLHNEQUFzRCxHQUFHcWpCLElBQUksSUFBSW5ULE1BQU0sR0FBRyxPQUFPLEdBQUdBLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pKLENBQUMsQ0FBQzs7UUFFRjtRQUNBZ1IsWUFBWSxDQUFDUyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVM1ZSxHQUFHLEVBQUU7VUFDckMsSUFBSUEsR0FBRyxDQUFDYSxPQUFPLENBQUMwRCxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFb2EsTUFBTSxDQUFDLElBQUkxaEIsb0JBQVcsQ0FBQyw0Q0FBNEMsR0FBR1IsTUFBTSxDQUFDb2hCLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztVQUNuSSxJQUFJLENBQUMsSUFBSSxDQUFDdUMsVUFBVSxFQUFFekIsTUFBTSxDQUFDM2UsR0FBRyxDQUFDO1FBQ25DLENBQUMsQ0FBQzs7UUFFRjtRQUNBbWUsWUFBWSxDQUFDUyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsVUFBUzVlLEdBQUcsRUFBRXVnQixNQUFNLEVBQUU7VUFDekQ5UyxPQUFPLENBQUNDLEtBQUssQ0FBQyxtREFBbUQsR0FBRzFOLEdBQUcsQ0FBQ2EsT0FBTyxDQUFDO1VBQ2hGNE0sT0FBTyxDQUFDQyxLQUFLLENBQUM2UyxNQUFNLENBQUM7VUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQ0gsVUFBVSxFQUFFekIsTUFBTSxDQUFDM2UsR0FBRyxDQUFDO1FBQ25DLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxPQUFPQSxHQUFRLEVBQUU7TUFDakIsTUFBTSxJQUFJL0Msb0JBQVcsQ0FBQytDLEdBQUcsQ0FBQ2EsT0FBTyxDQUFDO0lBQ3BDO0VBQ0Y7O0VBRUEsTUFBZ0J4QyxLQUFLQSxDQUFBLEVBQUc7SUFDdEIsSUFBSSxDQUFDK0YsZ0JBQWdCLENBQUMsQ0FBQztJQUN2QixPQUFPLElBQUksQ0FBQzFILFlBQVk7SUFDeEIsSUFBSSxDQUFDQSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksQ0FBQ3FCLElBQUksR0FBR2YsU0FBUztFQUN2Qjs7RUFFQSxNQUFnQndqQixpQkFBaUJBLENBQUN2UCxvQkFBMEIsRUFBRTtJQUM1RCxJQUFJa0MsT0FBTyxHQUFHLElBQUl0RixHQUFHLENBQUMsQ0FBQztJQUN2QixLQUFLLElBQUlwSyxPQUFPLElBQUksTUFBTSxJQUFJLENBQUNDLFdBQVcsQ0FBQyxDQUFDLEVBQUU7TUFDNUN5UCxPQUFPLENBQUNwWCxHQUFHLENBQUMwSCxPQUFPLENBQUN1RixRQUFRLENBQUMsQ0FBQyxFQUFFaUksb0JBQW9CLEdBQUcsTUFBTSxJQUFJLENBQUNBLG9CQUFvQixDQUFDeE4sT0FBTyxDQUFDdUYsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHaE0sU0FBUyxDQUFDO0lBQ3pIO0lBQ0EsT0FBT21XLE9BQU87RUFDaEI7O0VBRUEsTUFBZ0JsQyxvQkFBb0JBLENBQUMvTixVQUFVLEVBQUU7SUFDL0MsSUFBSWdILGlCQUFpQixHQUFHLEVBQUU7SUFDMUIsSUFBSW5HLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxhQUFhLEVBQUUsRUFBQzJGLGFBQWEsRUFBRVgsVUFBVSxFQUFDLENBQUM7SUFDcEcsS0FBSyxJQUFJekMsT0FBTyxJQUFJc0QsSUFBSSxDQUFDQyxNQUFNLENBQUNzRyxTQUFTLEVBQUVKLGlCQUFpQixDQUFDakIsSUFBSSxDQUFDeEksT0FBTyxDQUFDMEosYUFBYSxDQUFDO0lBQ3hGLE9BQU9ELGlCQUFpQjtFQUMxQjs7RUFFQSxNQUFnQjRCLGVBQWVBLENBQUNmLEtBQTBCLEVBQUU7O0lBRTFEO0lBQ0EsSUFBSTBWLE9BQU8sR0FBRzFWLEtBQUssQ0FBQ3FELFVBQVUsQ0FBQyxDQUFDO0lBQ2hDLElBQUlzUyxjQUFjLEdBQUdELE9BQU8sQ0FBQ2pULGNBQWMsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJaVQsT0FBTyxDQUFDRSxXQUFXLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSUYsT0FBTyxDQUFDRyxXQUFXLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSUgsT0FBTyxDQUFDNU0sWUFBWSxDQUFDLENBQUMsS0FBSyxLQUFLO0lBQy9KLElBQUlnTixhQUFhLEdBQUdKLE9BQU8sQ0FBQ2pULGNBQWMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJaVQsT0FBTyxDQUFDRSxXQUFXLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSUYsT0FBTyxDQUFDRyxXQUFXLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSUgsT0FBTyxDQUFDamEsU0FBUyxDQUFDLENBQUMsS0FBS3hKLFNBQVMsSUFBSXlqQixPQUFPLENBQUNLLFlBQVksQ0FBQyxDQUFDLEtBQUs5akIsU0FBUyxJQUFJeWpCLE9BQU8sQ0FBQ00sV0FBVyxDQUFDLENBQUMsS0FBSyxLQUFLO0lBQzFPLElBQUlDLGFBQWEsR0FBR2pXLEtBQUssQ0FBQ2tXLGFBQWEsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJbFcsS0FBSyxDQUFDbVcsYUFBYSxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUluVyxLQUFLLENBQUNvVyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUssSUFBSTtJQUM1SCxJQUFJQyxhQUFhLEdBQUdyVyxLQUFLLENBQUNtVyxhQUFhLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSW5XLEtBQUssQ0FBQ2tXLGFBQWEsQ0FBQyxDQUFDLEtBQUssSUFBSTs7SUFFckY7SUFDQSxJQUFJUixPQUFPLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUNFLGFBQWEsRUFBRTtNQUNwRCxNQUFNLElBQUk1akIsb0JBQVcsQ0FBQyxxRUFBcUUsQ0FBQztJQUM5Rjs7SUFFQSxJQUFJNkMsTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDdWhCLEVBQUUsR0FBR0wsYUFBYSxJQUFJTixjQUFjO0lBQzNDNWdCLE1BQU0sQ0FBQ3doQixHQUFHLEdBQUdGLGFBQWEsSUFBSVYsY0FBYztJQUM1QzVnQixNQUFNLENBQUN5aEIsSUFBSSxHQUFHUCxhQUFhLElBQUlILGFBQWE7SUFDNUMvZ0IsTUFBTSxDQUFDMGhCLE9BQU8sR0FBR0osYUFBYSxJQUFJUCxhQUFhO0lBQy9DL2dCLE1BQU0sQ0FBQzJoQixNQUFNLEdBQUdoQixPQUFPLENBQUNHLFdBQVcsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJSCxPQUFPLENBQUNqVCxjQUFjLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSWlULE9BQU8sQ0FBQ0UsV0FBVyxDQUFDLENBQUMsSUFBSSxJQUFJO0lBQ3JILElBQUlGLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLEtBQUsxa0IsU0FBUyxFQUFFO01BQ3hDLElBQUl5akIsT0FBTyxDQUFDaUIsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUU1aEIsTUFBTSxDQUFDNmhCLFVBQVUsR0FBR2xCLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFBQSxLQUMzRTVoQixNQUFNLENBQUM2aEIsVUFBVSxHQUFHbEIsT0FBTyxDQUFDaUIsWUFBWSxDQUFDLENBQUM7SUFDakQ7SUFDQSxJQUFJakIsT0FBTyxDQUFDSyxZQUFZLENBQUMsQ0FBQyxLQUFLOWpCLFNBQVMsRUFBRThDLE1BQU0sQ0FBQzhoQixVQUFVLEdBQUduQixPQUFPLENBQUNLLFlBQVksQ0FBQyxDQUFDO0lBQ3BGaGhCLE1BQU0sQ0FBQytoQixnQkFBZ0IsR0FBR3BCLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLEtBQUsxa0IsU0FBUyxJQUFJeWpCLE9BQU8sQ0FBQ0ssWUFBWSxDQUFDLENBQUMsS0FBSzlqQixTQUFTO0lBQ3RHLElBQUkrTixLQUFLLENBQUN0QixlQUFlLENBQUMsQ0FBQyxLQUFLek0sU0FBUyxFQUFFO01BQ3pDLElBQUFvRyxlQUFNLEVBQUMySCxLQUFLLENBQUMrVyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUs5a0IsU0FBUyxJQUFJK04sS0FBSyxDQUFDa0csb0JBQW9CLENBQUMsQ0FBQyxLQUFLalUsU0FBUyxFQUFFLDZEQUE2RCxDQUFDO01BQzdKOEMsTUFBTSxDQUFDd0osWUFBWSxHQUFHLElBQUk7SUFDNUIsQ0FBQyxNQUFNO01BQ0x4SixNQUFNLENBQUMrRCxhQUFhLEdBQUdrSCxLQUFLLENBQUN0QixlQUFlLENBQUMsQ0FBQzs7TUFFOUM7TUFDQSxJQUFJUyxpQkFBaUIsR0FBRyxJQUFJbUMsR0FBRyxDQUFDLENBQUM7TUFDakMsSUFBSXRCLEtBQUssQ0FBQytXLGtCQUFrQixDQUFDLENBQUMsS0FBSzlrQixTQUFTLEVBQUVrTixpQkFBaUIsQ0FBQ3NDLEdBQUcsQ0FBQ3pCLEtBQUssQ0FBQytXLGtCQUFrQixDQUFDLENBQUMsQ0FBQztNQUMvRixJQUFJL1csS0FBSyxDQUFDa0csb0JBQW9CLENBQUMsQ0FBQyxLQUFLalUsU0FBUyxFQUFFK04sS0FBSyxDQUFDa0csb0JBQW9CLENBQUMsQ0FBQyxDQUFDNUIsR0FBRyxDQUFDLENBQUFsTSxhQUFhLEtBQUkrRyxpQkFBaUIsQ0FBQ3NDLEdBQUcsQ0FBQ3JKLGFBQWEsQ0FBQyxDQUFDO01BQ3ZJLElBQUkrRyxpQkFBaUIsQ0FBQzZYLElBQUksRUFBRWppQixNQUFNLENBQUM2UixlQUFlLEdBQUdxQyxLQUFLLENBQUNnTyxJQUFJLENBQUM5WCxpQkFBaUIsQ0FBQztJQUNwRjs7SUFFQTtJQUNBLElBQUl1QyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSUMsUUFBUSxHQUFHLENBQUMsQ0FBQzs7SUFFakI7SUFDQSxJQUFJM0ksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsRUFBRTRCLE1BQU0sQ0FBQztJQUNqRixLQUFLLElBQUk4RSxHQUFHLElBQUkxSSxNQUFNLENBQUNrWCxJQUFJLENBQUNyUCxJQUFJLENBQUNDLE1BQU0sQ0FBQyxFQUFFO01BQ3hDLEtBQUssSUFBSWllLEtBQUssSUFBSWxlLElBQUksQ0FBQ0MsTUFBTSxDQUFDWSxHQUFHLENBQUMsRUFBRTtRQUNsQztRQUNBLElBQUkrSCxFQUFFLEdBQUd0USxlQUFlLENBQUM2bEIsd0JBQXdCLENBQUNELEtBQUssQ0FBQztRQUN4RCxJQUFJdFYsRUFBRSxDQUFDYSxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUFwSyxlQUFNLEVBQUN1SixFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUN4QyxNQUFNLENBQUMsQ0FBQyxDQUFDdkcsT0FBTyxDQUFDb0ksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7O1FBRXhFO1FBQ0E7UUFDQSxJQUFJQSxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLEtBQUt6VixTQUFTLElBQUkyUCxFQUFFLENBQUNrSCxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUNsSCxFQUFFLENBQUNpVSxXQUFXLENBQUMsQ0FBQztRQUNoRmpVLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3BCLGVBQWUsQ0FBQyxDQUFDLElBQUkxRSxFQUFFLENBQUN3VixpQkFBaUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1VBQy9FLElBQUlDLGdCQUFnQixHQUFHelYsRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQztVQUMvQyxJQUFJNFAsYUFBYSxHQUFHOWUsTUFBTSxDQUFDLENBQUMsQ0FBQztVQUM3QixLQUFLLElBQUk2TixXQUFXLElBQUlnUixnQkFBZ0IsQ0FBQy9RLGVBQWUsQ0FBQyxDQUFDLEVBQUVnUixhQUFhLEdBQUdBLGFBQWEsR0FBR2pSLFdBQVcsQ0FBQ0UsU0FBUyxDQUFDLENBQUM7VUFDbkgzRSxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNPLFNBQVMsQ0FBQ3FQLGFBQWEsQ0FBQztRQUNuRDs7UUFFQTtRQUNBaG1CLGVBQWUsQ0FBQ3VRLE9BQU8sQ0FBQ0QsRUFBRSxFQUFFRixLQUFLLEVBQUVDLFFBQVEsQ0FBQztNQUM5QztJQUNGOztJQUVBO0lBQ0EsSUFBSVAsR0FBcUIsR0FBR2pRLE1BQU0sQ0FBQ29tQixNQUFNLENBQUM3VixLQUFLLENBQUM7SUFDaEROLEdBQUcsQ0FBQ29XLElBQUksQ0FBQ2xtQixlQUFlLENBQUNtbUIsa0JBQWtCLENBQUM7O0lBRTVDO0lBQ0EsSUFBSTNXLFNBQVMsR0FBRyxFQUFFO0lBQ2xCLEtBQUssSUFBSWMsRUFBRSxJQUFJUixHQUFHLEVBQUU7O01BRWxCO01BQ0EsSUFBSVEsRUFBRSxDQUFDc1UsYUFBYSxDQUFDLENBQUMsS0FBS2prQixTQUFTLEVBQUUyUCxFQUFFLENBQUM4VixhQUFhLENBQUMsS0FBSyxDQUFDO01BQzdELElBQUk5VixFQUFFLENBQUN1VSxhQUFhLENBQUMsQ0FBQyxLQUFLbGtCLFNBQVMsRUFBRTJQLEVBQUUsQ0FBQytWLGFBQWEsQ0FBQyxLQUFLLENBQUM7O01BRTdEO01BQ0EsSUFBSS9WLEVBQUUsQ0FBQ3dRLG9CQUFvQixDQUFDLENBQUMsS0FBS25nQixTQUFTLEVBQUUyUCxFQUFFLENBQUN3USxvQkFBb0IsQ0FBQyxDQUFDLENBQUNvRixJQUFJLENBQUNsbUIsZUFBZSxDQUFDc21CLHdCQUF3QixDQUFDOztNQUVySDtNQUNBLEtBQUssSUFBSXJXLFFBQVEsSUFBSUssRUFBRSxDQUFDMEIsZUFBZSxDQUFDdEQsS0FBSyxDQUFDLEVBQUU7UUFDOUNjLFNBQVMsQ0FBQzVDLElBQUksQ0FBQ3FELFFBQVEsQ0FBQztNQUMxQjs7TUFFQTtNQUNBLElBQUlLLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBS3RRLFNBQVMsSUFBSTJQLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsS0FBS3pWLFNBQVMsSUFBSTJQLEVBQUUsQ0FBQ3dRLG9CQUFvQixDQUFDLENBQUMsS0FBS25nQixTQUFTLEVBQUU7UUFDcEgyUCxFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUN4QyxNQUFNLENBQUMsQ0FBQyxDQUFDeUMsTUFBTSxDQUFDWixFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUN4QyxNQUFNLENBQUMsQ0FBQyxDQUFDdkcsT0FBTyxDQUFDb0ksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO01BQ3RFO0lBQ0Y7O0lBRUEsT0FBT2QsU0FBUztFQUNsQjs7RUFFQSxNQUFnQm9CLGFBQWFBLENBQUNsQyxLQUFLLEVBQUU7O0lBRW5DO0lBQ0EsSUFBSW9JLE9BQU8sR0FBRyxJQUFJdEYsR0FBRyxDQUFDLENBQUM7SUFDdkIsSUFBSTlDLEtBQUssQ0FBQ3RCLGVBQWUsQ0FBQyxDQUFDLEtBQUt6TSxTQUFTLEVBQUU7TUFDekMsSUFBSWtOLGlCQUFpQixHQUFHLElBQUltQyxHQUFHLENBQUMsQ0FBQztNQUNqQyxJQUFJdEIsS0FBSyxDQUFDK1csa0JBQWtCLENBQUMsQ0FBQyxLQUFLOWtCLFNBQVMsRUFBRWtOLGlCQUFpQixDQUFDc0MsR0FBRyxDQUFDekIsS0FBSyxDQUFDK1csa0JBQWtCLENBQUMsQ0FBQyxDQUFDO01BQy9GLElBQUkvVyxLQUFLLENBQUNrRyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtqVSxTQUFTLEVBQUUrTixLQUFLLENBQUNrRyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM1QixHQUFHLENBQUMsQ0FBQWxNLGFBQWEsS0FBSStHLGlCQUFpQixDQUFDc0MsR0FBRyxDQUFDckosYUFBYSxDQUFDLENBQUM7TUFDdklnUSxPQUFPLENBQUNwWCxHQUFHLENBQUNnUCxLQUFLLENBQUN0QixlQUFlLENBQUMsQ0FBQyxFQUFFUyxpQkFBaUIsQ0FBQzZYLElBQUksR0FBRy9OLEtBQUssQ0FBQ2dPLElBQUksQ0FBQzlYLGlCQUFpQixDQUFDLEdBQUdsTixTQUFTLENBQUMsQ0FBQyxDQUFFO0lBQzdHLENBQUMsTUFBTTtNQUNMb0csZUFBTSxDQUFDQyxLQUFLLENBQUMwSCxLQUFLLENBQUMrVyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUU5a0IsU0FBUyxFQUFFLDZEQUE2RCxDQUFDO01BQ2xILElBQUFvRyxlQUFNLEVBQUMySCxLQUFLLENBQUNrRyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtqVSxTQUFTLElBQUkrTixLQUFLLENBQUNrRyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM3SSxNQUFNLEtBQUssQ0FBQyxFQUFFLDZEQUE2RCxDQUFDO01BQzlKK0ssT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDcU4saUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUU7SUFDN0M7O0lBRUE7SUFDQSxJQUFJL1QsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLElBQUlDLFFBQVEsR0FBRyxDQUFDLENBQUM7O0lBRWpCO0lBQ0EsSUFBSTVNLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQzhpQixhQUFhLEdBQUc3WCxLQUFLLENBQUM4WCxVQUFVLENBQUMsQ0FBQyxLQUFLLElBQUksR0FBRyxhQUFhLEdBQUc5WCxLQUFLLENBQUM4WCxVQUFVLENBQUMsQ0FBQyxLQUFLLEtBQUssR0FBRyxXQUFXLEdBQUcsS0FBSztJQUN2SC9pQixNQUFNLENBQUNnakIsT0FBTyxHQUFHLElBQUk7SUFDckIsS0FBSyxJQUFJNWYsVUFBVSxJQUFJaVEsT0FBTyxDQUFDQyxJQUFJLENBQUMsQ0FBQyxFQUFFOztNQUVyQztNQUNBdFQsTUFBTSxDQUFDK0QsYUFBYSxHQUFHWCxVQUFVO01BQ2pDcEQsTUFBTSxDQUFDNlIsZUFBZSxHQUFHd0IsT0FBTyxDQUFDclgsR0FBRyxDQUFDb0gsVUFBVSxDQUFDO01BQ2hELElBQUlhLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxvQkFBb0IsRUFBRTRCLE1BQU0sQ0FBQzs7TUFFdEY7TUFDQSxJQUFJaUUsSUFBSSxDQUFDQyxNQUFNLENBQUM2SCxTQUFTLEtBQUs3TyxTQUFTLEVBQUU7TUFDekMsS0FBSyxJQUFJK2xCLFNBQVMsSUFBSWhmLElBQUksQ0FBQ0MsTUFBTSxDQUFDNkgsU0FBUyxFQUFFO1FBQzNDLElBQUljLEVBQUUsR0FBR3RRLGVBQWUsQ0FBQzJtQixzQkFBc0IsQ0FBQ0QsU0FBUyxDQUFDO1FBQzFEMW1CLGVBQWUsQ0FBQ3VRLE9BQU8sQ0FBQ0QsRUFBRSxFQUFFRixLQUFLLEVBQUVDLFFBQVEsQ0FBQztNQUM5QztJQUNGOztJQUVBO0lBQ0EsSUFBSVAsR0FBcUIsR0FBR2pRLE1BQU0sQ0FBQ29tQixNQUFNLENBQUM3VixLQUFLLENBQUM7SUFDaEROLEdBQUcsQ0FBQ29XLElBQUksQ0FBQ2xtQixlQUFlLENBQUNtbUIsa0JBQWtCLENBQUM7O0lBRTVDO0lBQ0EsSUFBSXhWLE9BQU8sR0FBRyxFQUFFO0lBQ2hCLEtBQUssSUFBSUwsRUFBRSxJQUFJUixHQUFHLEVBQUU7O01BRWxCO01BQ0EsSUFBSVEsRUFBRSxDQUFDMkIsVUFBVSxDQUFDLENBQUMsS0FBS3RSLFNBQVMsRUFBRTJQLEVBQUUsQ0FBQzJCLFVBQVUsQ0FBQyxDQUFDLENBQUNpVSxJQUFJLENBQUNsbUIsZUFBZSxDQUFDNG1CLGNBQWMsQ0FBQzs7TUFFdkY7TUFDQSxLQUFLLElBQUk5VixNQUFNLElBQUlSLEVBQUUsQ0FBQzZCLGFBQWEsQ0FBQ3pELEtBQUssQ0FBQyxFQUFFaUMsT0FBTyxDQUFDL0QsSUFBSSxDQUFDa0UsTUFBTSxDQUFDOztNQUVoRTtNQUNBLElBQUlSLEVBQUUsQ0FBQzJCLFVBQVUsQ0FBQyxDQUFDLEtBQUt0UixTQUFTLElBQUkyUCxFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLEtBQUt0USxTQUFTLEVBQUU7UUFDaEUyUCxFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUN4QyxNQUFNLENBQUMsQ0FBQyxDQUFDeUMsTUFBTSxDQUFDWixFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUN4QyxNQUFNLENBQUMsQ0FBQyxDQUFDdkcsT0FBTyxDQUFDb0ksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO01BQ3RFO0lBQ0Y7SUFDQSxPQUFPSyxPQUFPO0VBQ2hCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQWdCZ0Msa0JBQWtCQSxDQUFDTixHQUFHLEVBQXVDO0lBQzNFLElBQUkzSyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsbUJBQW1CLEVBQUUsRUFBQ3dRLEdBQUcsRUFBRUEsR0FBRyxFQUFDLENBQUM7SUFDekYsSUFBSVEsU0FBUyxHQUFHLENBQUNuTCxJQUFJLENBQUNDLE1BQU0sQ0FBQzJMLGlCQUFpQixJQUFJLEVBQUUsRUFBRU4sR0FBRyxDQUFDLENBQUE2VCxRQUFRLEtBQUksSUFBSUMsdUJBQWMsQ0FBQ0QsUUFBUSxDQUFDM1QsU0FBUyxFQUFFMlQsUUFBUSxDQUFDelQsU0FBUyxDQUFDLENBQUM7SUFDakksT0FBTyxJQUFJMlQsbUNBQTBCLENBQUMsQ0FBQyxDQUFDQyxTQUFTLENBQUN0ZixJQUFJLENBQUNDLE1BQU0sQ0FBQ21MLE1BQU0sQ0FBQyxDQUFDbVUsWUFBWSxDQUFDcFUsU0FBUyxDQUFDO0VBQy9GOztFQUVBLE1BQWdCcUUsZUFBZUEsQ0FBQzlXLE1BQXNCLEVBQUU7O0lBRXREO0lBQ0EsSUFBSUEsTUFBTSxLQUFLTyxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDJCQUEyQixDQUFDO0lBQzVFLElBQUlSLE1BQU0sQ0FBQ2dOLGVBQWUsQ0FBQyxDQUFDLEtBQUt6TSxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDZDQUE2QyxDQUFDO0lBQ2hILElBQUlSLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLEtBQUtyVSxTQUFTLElBQUlQLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUNqSixNQUFNLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSW5MLG9CQUFXLENBQUMsa0RBQWtELENBQUM7SUFDN0osSUFBSVIsTUFBTSxDQUFDNFUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ3JNLFVBQVUsQ0FBQyxDQUFDLEtBQUtoSSxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDhDQUE4QyxDQUFDO0lBQ2pJLElBQUlSLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLFNBQVMsQ0FBQyxDQUFDLEtBQUt0VSxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHVDQUF1QyxDQUFDO0lBQ3pILElBQUlSLE1BQU0sQ0FBQ3NXLFdBQVcsQ0FBQyxDQUFDLEtBQUsvVixTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDBFQUEwRSxDQUFDO0lBQ3pJLElBQUlSLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUMsS0FBS2pVLFNBQVMsSUFBSVAsTUFBTSxDQUFDd1Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDN0ksTUFBTSxLQUFLLENBQUMsRUFBRSxNQUFNLElBQUluTCxvQkFBVyxDQUFDLG9EQUFvRCxDQUFDO0lBQzFLLElBQUlSLE1BQU0sQ0FBQzZXLHNCQUFzQixDQUFDLENBQUMsRUFBRSxNQUFNLElBQUlyVyxvQkFBVyxDQUFDLG1EQUFtRCxDQUFDO0lBQy9HLElBQUlSLE1BQU0sQ0FBQ2dWLGtCQUFrQixDQUFDLENBQUMsS0FBS3pVLFNBQVMsSUFBSVAsTUFBTSxDQUFDZ1Ysa0JBQWtCLENBQUMsQ0FBQyxDQUFDckosTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLElBQUluTCxvQkFBVyxDQUFDLHFFQUFxRSxDQUFDOztJQUVyTDtJQUNBLElBQUlSLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUMsS0FBS2pVLFNBQVMsRUFBRTtNQUMvQ1AsTUFBTSxDQUFDaVcsb0JBQW9CLENBQUMsRUFBRSxDQUFDO01BQy9CLEtBQUssSUFBSXROLFVBQVUsSUFBSSxNQUFNLElBQUksQ0FBQ0YsZUFBZSxDQUFDekksTUFBTSxDQUFDZ04sZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzNFaE4sTUFBTSxDQUFDd1Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDaEksSUFBSSxDQUFDN0QsVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsQ0FBQztNQUMzRDtJQUNGO0lBQ0EsSUFBSXZNLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUMsQ0FBQzdJLE1BQU0sS0FBSyxDQUFDLEVBQUUsTUFBTSxJQUFJbkwsb0JBQVcsQ0FBQywrQkFBK0IsQ0FBQzs7SUFFdEc7SUFDQSxJQUFJNkMsTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQixJQUFJMlQsS0FBSyxHQUFHaFgsTUFBTSxDQUFDc1UsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJO0lBQ3RDalIsTUFBTSxDQUFDK0QsYUFBYSxHQUFHcEgsTUFBTSxDQUFDZ04sZUFBZSxDQUFDLENBQUM7SUFDL0MzSixNQUFNLENBQUM2UixlQUFlLEdBQUdsVixNQUFNLENBQUN3VSxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3REblIsTUFBTSxDQUFDVyxPQUFPLEdBQUdoRSxNQUFNLENBQUM0VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDck0sVUFBVSxDQUFDLENBQUM7SUFDekQsSUFBQTVCLGVBQU0sRUFBQzNHLE1BQU0sQ0FBQ3FWLFdBQVcsQ0FBQyxDQUFDLEtBQUs5VSxTQUFTLElBQUlQLE1BQU0sQ0FBQ3FWLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJclYsTUFBTSxDQUFDcVYsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEdoUyxNQUFNLENBQUM0USxRQUFRLEdBQUdqVSxNQUFNLENBQUNxVixXQUFXLENBQUMsQ0FBQztJQUN0Q2hTLE1BQU0sQ0FBQ2tHLFVBQVUsR0FBR3ZKLE1BQU0sQ0FBQ21WLFlBQVksQ0FBQyxDQUFDO0lBQ3pDOVIsTUFBTSxDQUFDK1IsWUFBWSxHQUFHLENBQUM0QixLQUFLO0lBQzVCM1QsTUFBTSxDQUFDeWpCLFlBQVksR0FBRzltQixNQUFNLENBQUMrbUIsY0FBYyxDQUFDLENBQUM7SUFDN0MxakIsTUFBTSxDQUFDbVMsV0FBVyxHQUFHLElBQUk7SUFDekJuUyxNQUFNLENBQUNpUyxVQUFVLEdBQUcsSUFBSTtJQUN4QmpTLE1BQU0sQ0FBQ2tTLGVBQWUsR0FBRyxJQUFJOztJQUU3QjtJQUNBLElBQUlqTyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsV0FBVyxFQUFFNEIsTUFBTSxDQUFDO0lBQzdFLElBQUlrRSxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTs7SUFFeEI7SUFDQSxJQUFJMFAsS0FBSyxHQUFHclgsZUFBZSxDQUFDc1csd0JBQXdCLENBQUMzTyxNQUFNLEVBQUVoSCxTQUFTLEVBQUVQLE1BQU0sQ0FBQzs7SUFFL0U7SUFDQSxLQUFLLElBQUlrUSxFQUFFLElBQUkrRyxLQUFLLENBQUM1SSxNQUFNLENBQUMsQ0FBQyxFQUFFO01BQzdCNkIsRUFBRSxDQUFDOFcsV0FBVyxDQUFDLElBQUksQ0FBQztNQUNwQjlXLEVBQUUsQ0FBQytXLGNBQWMsQ0FBQyxLQUFLLENBQUM7TUFDeEIvVyxFQUFFLENBQUMrSixtQkFBbUIsQ0FBQyxDQUFDLENBQUM7TUFDekIvSixFQUFFLENBQUNnWCxRQUFRLENBQUNsUSxLQUFLLENBQUM7TUFDbEI5RyxFQUFFLENBQUNpSCxXQUFXLENBQUNILEtBQUssQ0FBQztNQUNyQjlHLEVBQUUsQ0FBQ2dILFlBQVksQ0FBQ0YsS0FBSyxDQUFDO01BQ3RCOUcsRUFBRSxDQUFDaVgsWUFBWSxDQUFDLEtBQUssQ0FBQztNQUN0QmpYLEVBQUUsQ0FBQ2tYLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckIsSUFBSXZYLFFBQVEsR0FBR0ssRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQztNQUN2Q25HLFFBQVEsQ0FBQ2hILGVBQWUsQ0FBQzdJLE1BQU0sQ0FBQ2dOLGVBQWUsQ0FBQyxDQUFDLENBQUM7TUFDbEQsSUFBSWhOLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUMsQ0FBQzdJLE1BQU0sS0FBSyxDQUFDLEVBQUVrRSxRQUFRLENBQUNvRyxvQkFBb0IsQ0FBQ2pXLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUMsQ0FBQztNQUM1RyxJQUFJRyxXQUFXLEdBQUcsSUFBSTBTLDBCQUFpQixDQUFDcm5CLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNyTSxVQUFVLENBQUMsQ0FBQyxFQUFFekIsTUFBTSxDQUFDK0ksUUFBUSxDQUFDZ0YsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQy9HaEYsUUFBUSxDQUFDeVgsZUFBZSxDQUFDLENBQUMzUyxXQUFXLENBQUMsQ0FBQztNQUN2Q3pFLEVBQUUsQ0FBQ3FYLG1CQUFtQixDQUFDMVgsUUFBUSxDQUFDO01BQ2hDSyxFQUFFLENBQUNyRyxZQUFZLENBQUM3SixNQUFNLENBQUNtVixZQUFZLENBQUMsQ0FBQyxDQUFDO01BQ3RDLElBQUlqRixFQUFFLENBQUNzWCxhQUFhLENBQUMsQ0FBQyxLQUFLam5CLFNBQVMsRUFBRTJQLEVBQUUsQ0FBQ3VYLGFBQWEsQ0FBQyxFQUFFLENBQUM7TUFDMUQsSUFBSXZYLEVBQUUsQ0FBQ29FLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDakIsSUFBSXBFLEVBQUUsQ0FBQ3dYLHVCQUF1QixDQUFDLENBQUMsS0FBS25uQixTQUFTLEVBQUUyUCxFQUFFLENBQUN5WCx1QkFBdUIsQ0FBQyxDQUFDLElBQUlDLElBQUksQ0FBQyxDQUFDLENBQUNDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO1FBQ3BHLElBQUkzWCxFQUFFLENBQUM0WCxvQkFBb0IsQ0FBQyxDQUFDLEtBQUt2bkIsU0FBUyxFQUFFMlAsRUFBRSxDQUFDNlgsb0JBQW9CLENBQUMsS0FBSyxDQUFDO01BQzdFO0lBQ0Y7SUFDQSxPQUFPOVEsS0FBSyxDQUFDNUksTUFBTSxDQUFDLENBQUM7RUFDdkI7O0VBRVUxRyxnQkFBZ0JBLENBQUEsRUFBRztJQUMzQixJQUFJLElBQUksQ0FBQzBELFlBQVksSUFBSTlLLFNBQVMsSUFBSSxJQUFJLENBQUN5bkIsU0FBUyxDQUFDcmMsTUFBTSxFQUFFLElBQUksQ0FBQ04sWUFBWSxHQUFHLElBQUk0YyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQ3ZHLElBQUksSUFBSSxDQUFDNWMsWUFBWSxLQUFLOUssU0FBUyxFQUFFLElBQUksQ0FBQzhLLFlBQVksQ0FBQzZjLFlBQVksQ0FBQyxJQUFJLENBQUNGLFNBQVMsQ0FBQ3JjLE1BQU0sR0FBRyxDQUFDLENBQUM7RUFDaEc7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsTUFBZ0JoQixJQUFJQSxDQUFBLEVBQUc7SUFDckIsSUFBSSxJQUFJLENBQUNVLFlBQVksS0FBSzlLLFNBQVMsSUFBSSxJQUFJLENBQUM4SyxZQUFZLENBQUM4YyxTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUM5YyxZQUFZLENBQUNWLElBQUksQ0FBQyxDQUFDO0VBQ3BHOztFQUVBOztFQUVBLE9BQWlCd1csZUFBZUEsQ0FBQ0QsV0FBMkYsRUFBRTliLFFBQWlCLEVBQUVoRSxRQUFpQixFQUFzQjtJQUN0TCxJQUFJcEIsTUFBK0MsR0FBR08sU0FBUztJQUMvRCxJQUFJLE9BQU8yZ0IsV0FBVyxLQUFLLFFBQVEsSUFBS0EsV0FBVyxDQUFrQ3BFLEdBQUcsRUFBRTljLE1BQU0sR0FBRyxJQUFJcUIsMkJBQWtCLENBQUMsRUFBQyttQixNQUFNLEVBQUUsSUFBSW5qQiw0QkFBbUIsQ0FBQ2ljLFdBQVcsRUFBMkM5YixRQUFRLEVBQUVoRSxRQUFRLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDbE8sSUFBSVYsaUJBQVEsQ0FBQzhXLE9BQU8sQ0FBQzBKLFdBQVcsQ0FBQyxFQUFFbGhCLE1BQU0sR0FBRyxJQUFJcUIsMkJBQWtCLENBQUMsRUFBQytmLEdBQUcsRUFBRUYsV0FBdUIsRUFBQyxDQUFDLENBQUM7SUFDbkdsaEIsTUFBTSxHQUFHLElBQUlxQiwyQkFBa0IsQ0FBQzZmLFdBQTBDLENBQUM7SUFDaEYsSUFBSWxoQixNQUFNLENBQUNxb0IsYUFBYSxLQUFLOW5CLFNBQVMsRUFBRVAsTUFBTSxDQUFDcW9CLGFBQWEsR0FBRyxJQUFJO0lBQ25FLE9BQU9yb0IsTUFBTTtFQUNmOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJ3UCxlQUFlQSxDQUFDbEIsS0FBSyxFQUFFO0lBQ3RDQSxLQUFLLENBQUMwWCxhQUFhLENBQUN6bEIsU0FBUyxDQUFDO0lBQzlCK04sS0FBSyxDQUFDMlgsYUFBYSxDQUFDMWxCLFNBQVMsQ0FBQztJQUM5QitOLEtBQUssQ0FBQ1csZ0JBQWdCLENBQUMxTyxTQUFTLENBQUM7SUFDakMrTixLQUFLLENBQUNZLGFBQWEsQ0FBQzNPLFNBQVMsQ0FBQztJQUM5QitOLEtBQUssQ0FBQ2EsY0FBYyxDQUFDNU8sU0FBUyxDQUFDO0lBQy9CLE9BQU8rTixLQUFLO0VBQ2Q7O0VBRUEsT0FBaUJvRCxZQUFZQSxDQUFDcEQsS0FBSyxFQUFFO0lBQ25DLElBQUksQ0FBQ0EsS0FBSyxFQUFFLE9BQU8sS0FBSztJQUN4QixJQUFJLENBQUNBLEtBQUssQ0FBQ3FELFVBQVUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxLQUFLO0lBQ3JDLElBQUlyRCxLQUFLLENBQUNxRCxVQUFVLENBQUMsQ0FBQyxDQUFDNlMsYUFBYSxDQUFDLENBQUMsS0FBS2prQixTQUFTLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQztJQUNuRSxJQUFJK04sS0FBSyxDQUFDcUQsVUFBVSxDQUFDLENBQUMsQ0FBQzhTLGFBQWEsQ0FBQyxDQUFDLEtBQUtsa0IsU0FBUyxFQUFFLE9BQU8sSUFBSTtJQUNqRSxJQUFJK04sS0FBSyxZQUFZZ0IsNEJBQW1CLEVBQUU7TUFDeEMsSUFBSWhCLEtBQUssQ0FBQ3FELFVBQVUsQ0FBQyxDQUFDLENBQUMzQyxjQUFjLENBQUMsQ0FBQyxLQUFLek8sU0FBUyxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUM7SUFDdEUsQ0FBQyxNQUFNLElBQUkrTixLQUFLLFlBQVlnQywwQkFBaUIsRUFBRTtNQUM3QyxJQUFJaEMsS0FBSyxDQUFDcUQsVUFBVSxDQUFDLENBQUMsQ0FBQy9DLGdCQUFnQixDQUFDLENBQUMsS0FBS3JPLFNBQVMsRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDO0lBQ3hFLENBQUMsTUFBTTtNQUNMLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyxvQ0FBb0MsQ0FBQztJQUM3RDtJQUNBLE9BQU8sS0FBSztFQUNkOztFQUVBLE9BQWlCNkwsaUJBQWlCQSxDQUFDRixVQUFVLEVBQUU7SUFDN0MsSUFBSW5GLE9BQU8sR0FBRyxJQUFJdUcsc0JBQWEsQ0FBQyxDQUFDO0lBQ2pDLEtBQUssSUFBSXBGLEdBQUcsSUFBSTFJLE1BQU0sQ0FBQ2tYLElBQUksQ0FBQ3hLLFVBQVUsQ0FBQyxFQUFFO01BQ3ZDLElBQUltUixHQUFHLEdBQUduUixVQUFVLENBQUNoRSxHQUFHLENBQUM7TUFDekIsSUFBSUEsR0FBRyxLQUFLLGVBQWUsRUFBRW5CLE9BQU8sQ0FBQ2dDLFFBQVEsQ0FBQ3NVLEdBQUcsQ0FBQyxDQUFDO01BQzlDLElBQUluVixHQUFHLEtBQUssU0FBUyxFQUFFbkIsT0FBTyxDQUFDeUYsVUFBVSxDQUFDM0YsTUFBTSxDQUFDd1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUN2RCxJQUFJblYsR0FBRyxLQUFLLGtCQUFrQixFQUFFbkIsT0FBTyxDQUFDMEYsa0JBQWtCLENBQUM1RixNQUFNLENBQUN3VyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ3hFLElBQUluVixHQUFHLEtBQUssY0FBYyxFQUFFbkIsT0FBTyxDQUFDc2hCLGlCQUFpQixDQUFDaEwsR0FBRyxDQUFDLENBQUM7TUFDM0QsSUFBSW5WLEdBQUcsS0FBSyxLQUFLLEVBQUVuQixPQUFPLENBQUN1aEIsTUFBTSxDQUFDakwsR0FBRyxDQUFDLENBQUM7TUFDdkMsSUFBSW5WLEdBQUcsS0FBSyxPQUFPLEVBQUUsQ0FBRSxDQUFDLENBQUM7TUFBQSxLQUN6QjZJLE9BQU8sQ0FBQ3NSLEdBQUcsQ0FBQyw4Q0FBOEMsR0FBR25hLEdBQUcsR0FBRyxJQUFJLEdBQUdtVixHQUFHLENBQUM7SUFDckY7SUFDQSxJQUFJLEVBQUUsS0FBS3RXLE9BQU8sQ0FBQ3doQixNQUFNLENBQUMsQ0FBQyxFQUFFeGhCLE9BQU8sQ0FBQ3VoQixNQUFNLENBQUNob0IsU0FBUyxDQUFDO0lBQ3RELE9BQU95RyxPQUFPO0VBQ2hCOztFQUVBLE9BQWlCK0Ysb0JBQW9CQSxDQUFDRCxhQUFhLEVBQUU7SUFDbkQsSUFBSW5FLFVBQVUsR0FBRyxJQUFJQyx5QkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZDLEtBQUssSUFBSVQsR0FBRyxJQUFJMUksTUFBTSxDQUFDa1gsSUFBSSxDQUFDN0osYUFBYSxDQUFDLEVBQUU7TUFDMUMsSUFBSXdRLEdBQUcsR0FBR3hRLGFBQWEsQ0FBQzNFLEdBQUcsQ0FBQztNQUM1QixJQUFJQSxHQUFHLEtBQUssZUFBZSxFQUFFUSxVQUFVLENBQUNFLGVBQWUsQ0FBQ3lVLEdBQUcsQ0FBQyxDQUFDO01BQ3hELElBQUluVixHQUFHLEtBQUssZUFBZSxFQUFFUSxVQUFVLENBQUNLLFFBQVEsQ0FBQ3NVLEdBQUcsQ0FBQyxDQUFDO01BQ3RELElBQUluVixHQUFHLEtBQUssU0FBUyxFQUFFUSxVQUFVLENBQUNzRixVQUFVLENBQUNxUCxHQUFHLENBQUMsQ0FBQztNQUNsRCxJQUFJblYsR0FBRyxLQUFLLFNBQVMsRUFBRVEsVUFBVSxDQUFDOEQsVUFBVSxDQUFDM0YsTUFBTSxDQUFDd1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUMxRCxJQUFJblYsR0FBRyxLQUFLLGtCQUFrQixFQUFFUSxVQUFVLENBQUMrRCxrQkFBa0IsQ0FBQzVGLE1BQU0sQ0FBQ3dXLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDM0UsSUFBSW5WLEdBQUcsS0FBSyxxQkFBcUIsRUFBRVEsVUFBVSxDQUFDZ0Usb0JBQW9CLENBQUMyUSxHQUFHLENBQUMsQ0FBQztNQUN4RSxJQUFJblYsR0FBRyxLQUFLLE9BQU8sRUFBRSxDQUFFLElBQUltVixHQUFHLEVBQUUzVSxVQUFVLENBQUN1RixRQUFRLENBQUNvUCxHQUFHLENBQUMsQ0FBRSxDQUFDO01BQzNELElBQUluVixHQUFHLEtBQUssTUFBTSxFQUFFUSxVQUFVLENBQUN3RixTQUFTLENBQUNtUCxHQUFHLENBQUMsQ0FBQztNQUM5QyxJQUFJblYsR0FBRyxLQUFLLGtCQUFrQixFQUFFUSxVQUFVLENBQUNpRSxvQkFBb0IsQ0FBQzBRLEdBQUcsQ0FBQyxDQUFDO01BQ3JFLElBQUluVixHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUU7TUFBQSxLQUNqQzZJLE9BQU8sQ0FBQ3NSLEdBQUcsQ0FBQyxpREFBaUQsR0FBR25hLEdBQUcsR0FBRyxJQUFJLEdBQUdtVixHQUFHLENBQUM7SUFDeEY7SUFDQSxPQUFPM1UsVUFBVTtFQUNuQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCb04sZ0JBQWdCQSxDQUFDL1YsTUFBK0IsRUFBRWtRLEVBQUUsRUFBRTJGLGdCQUFnQixFQUFFO0lBQ3ZGLElBQUksQ0FBQzNGLEVBQUUsRUFBRUEsRUFBRSxHQUFHLElBQUk0Rix1QkFBYyxDQUFDLENBQUM7SUFDbEMsSUFBSWtCLEtBQUssR0FBR2hYLE1BQU0sQ0FBQ3NVLFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSTtJQUN0Q3BFLEVBQUUsQ0FBQytWLGFBQWEsQ0FBQyxJQUFJLENBQUM7SUFDdEIvVixFQUFFLENBQUMrVyxjQUFjLENBQUMsS0FBSyxDQUFDO0lBQ3hCL1csRUFBRSxDQUFDK0osbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBQ3pCL0osRUFBRSxDQUFDaUgsV0FBVyxDQUFDSCxLQUFLLENBQUM7SUFDckI5RyxFQUFFLENBQUNnWCxRQUFRLENBQUNsUSxLQUFLLENBQUM7SUFDbEI5RyxFQUFFLENBQUNnSCxZQUFZLENBQUNGLEtBQUssQ0FBQztJQUN0QjlHLEVBQUUsQ0FBQ2lYLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDdEJqWCxFQUFFLENBQUNrWCxXQUFXLENBQUMsS0FBSyxDQUFDO0lBQ3JCbFgsRUFBRSxDQUFDOFcsV0FBVyxDQUFDLElBQUksQ0FBQztJQUNwQjlXLEVBQUUsQ0FBQ3VZLFdBQVcsQ0FBQ0Msb0JBQVcsQ0FBQ0MsU0FBUyxDQUFDO0lBQ3JDLElBQUk5WSxRQUFRLEdBQUcsSUFBSStZLCtCQUFzQixDQUFDLENBQUM7SUFDM0MvWSxRQUFRLENBQUNnWixLQUFLLENBQUMzWSxFQUFFLENBQUM7SUFDbEIsSUFBSWxRLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUMsSUFBSXhVLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUMsQ0FBQzdJLE1BQU0sS0FBSyxDQUFDLEVBQUVrRSxRQUFRLENBQUNvRyxvQkFBb0IsQ0FBQ2pXLE1BQU0sQ0FBQ3dVLG9CQUFvQixDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4SixJQUFJb0IsZ0JBQWdCLEVBQUU7TUFDcEIsSUFBSWlULFVBQVUsR0FBRyxFQUFFO01BQ25CLEtBQUssSUFBSUMsSUFBSSxJQUFJL29CLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLEVBQUVrVSxVQUFVLENBQUN0YyxJQUFJLENBQUN1YyxJQUFJLENBQUN0WixJQUFJLENBQUMsQ0FBQyxDQUFDO01BQ3ZFSSxRQUFRLENBQUN5WCxlQUFlLENBQUN3QixVQUFVLENBQUM7SUFDdEM7SUFDQTVZLEVBQUUsQ0FBQ3FYLG1CQUFtQixDQUFDMVgsUUFBUSxDQUFDO0lBQ2hDSyxFQUFFLENBQUNyRyxZQUFZLENBQUM3SixNQUFNLENBQUNtVixZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLElBQUlqRixFQUFFLENBQUNzWCxhQUFhLENBQUMsQ0FBQyxLQUFLam5CLFNBQVMsRUFBRTJQLEVBQUUsQ0FBQ3VYLGFBQWEsQ0FBQyxFQUFFLENBQUM7SUFDMUQsSUFBSXpuQixNQUFNLENBQUNzVSxRQUFRLENBQUMsQ0FBQyxFQUFFO01BQ3JCLElBQUlwRSxFQUFFLENBQUN3WCx1QkFBdUIsQ0FBQyxDQUFDLEtBQUtubkIsU0FBUyxFQUFFMlAsRUFBRSxDQUFDeVgsdUJBQXVCLENBQUMsQ0FBQyxJQUFJQyxJQUFJLENBQUMsQ0FBQyxDQUFDQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNwRyxJQUFJM1gsRUFBRSxDQUFDNFgsb0JBQW9CLENBQUMsQ0FBQyxLQUFLdm5CLFNBQVMsRUFBRTJQLEVBQUUsQ0FBQzZYLG9CQUFvQixDQUFDLEtBQUssQ0FBQztJQUM3RTtJQUNBLE9BQU83WCxFQUFFO0VBQ1g7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFpQjhZLGVBQWVBLENBQUNDLE1BQU0sRUFBRTtJQUN2QyxJQUFJaFMsS0FBSyxHQUFHLElBQUlpUyxvQkFBVyxDQUFDLENBQUM7SUFDN0JqUyxLQUFLLENBQUNrUyxnQkFBZ0IsQ0FBQ0YsTUFBTSxDQUFDaFIsY0FBYyxDQUFDO0lBQzdDaEIsS0FBSyxDQUFDbVMsZ0JBQWdCLENBQUNILE1BQU0sQ0FBQ2xSLGNBQWMsQ0FBQztJQUM3Q2QsS0FBSyxDQUFDb1MsY0FBYyxDQUFDSixNQUFNLENBQUNLLFlBQVksQ0FBQztJQUN6QyxJQUFJclMsS0FBSyxDQUFDaUIsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLM1gsU0FBUyxJQUFJMFcsS0FBSyxDQUFDaUIsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDdk0sTUFBTSxLQUFLLENBQUMsRUFBRXNMLEtBQUssQ0FBQ2tTLGdCQUFnQixDQUFDNW9CLFNBQVMsQ0FBQztJQUN0SCxJQUFJMFcsS0FBSyxDQUFDZSxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUt6WCxTQUFTLElBQUkwVyxLQUFLLENBQUNlLGdCQUFnQixDQUFDLENBQUMsQ0FBQ3JNLE1BQU0sS0FBSyxDQUFDLEVBQUVzTCxLQUFLLENBQUNtUyxnQkFBZ0IsQ0FBQzdvQixTQUFTLENBQUM7SUFDdEgsSUFBSTBXLEtBQUssQ0FBQ3NTLGNBQWMsQ0FBQyxDQUFDLEtBQUtocEIsU0FBUyxJQUFJMFcsS0FBSyxDQUFDc1MsY0FBYyxDQUFDLENBQUMsQ0FBQzVkLE1BQU0sS0FBSyxDQUFDLEVBQUVzTCxLQUFLLENBQUNvUyxjQUFjLENBQUM5b0IsU0FBUyxDQUFDO0lBQ2hILE9BQU8wVyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCZix3QkFBd0JBLENBQUNzVCxNQUFXLEVBQUU5WixHQUFTLEVBQUUxUCxNQUFZLEVBQUU7O0lBRTlFO0lBQ0EsSUFBSWlYLEtBQUssR0FBR3JYLGVBQWUsQ0FBQ29wQixlQUFlLENBQUNRLE1BQU0sQ0FBQzs7SUFFbkQ7SUFDQSxJQUFJOVQsTUFBTSxHQUFHOFQsTUFBTSxDQUFDN1QsUUFBUSxHQUFHNlQsTUFBTSxDQUFDN1QsUUFBUSxDQUFDaEssTUFBTSxHQUFHNmQsTUFBTSxDQUFDOVEsWUFBWSxHQUFHOFEsTUFBTSxDQUFDOVEsWUFBWSxDQUFDL00sTUFBTSxHQUFHLENBQUM7O0lBRTVHO0lBQ0EsSUFBSStKLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDaEIvTyxlQUFNLENBQUNDLEtBQUssQ0FBQzhJLEdBQUcsRUFBRW5QLFNBQVMsQ0FBQztNQUM1QixPQUFPMFcsS0FBSztJQUNkOztJQUVBO0lBQ0EsSUFBSXZILEdBQUcsRUFBRXVILEtBQUssQ0FBQ3dTLE1BQU0sQ0FBQy9aLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCO01BQ0hBLEdBQUcsR0FBRyxFQUFFO01BQ1IsS0FBSyxJQUFJMVEsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHMFcsTUFBTSxFQUFFMVcsQ0FBQyxFQUFFLEVBQUUwUSxHQUFHLENBQUNsRCxJQUFJLENBQUMsSUFBSXNKLHVCQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ2pFO0lBQ0EsS0FBSyxJQUFJNUYsRUFBRSxJQUFJUixHQUFHLEVBQUU7TUFDbEJRLEVBQUUsQ0FBQ3daLFFBQVEsQ0FBQ3pTLEtBQUssQ0FBQztNQUNsQi9HLEVBQUUsQ0FBQytWLGFBQWEsQ0FBQyxJQUFJLENBQUM7SUFDeEI7SUFDQWhQLEtBQUssQ0FBQ3dTLE1BQU0sQ0FBQy9aLEdBQUcsQ0FBQzs7SUFFakI7SUFDQSxLQUFLLElBQUl2SCxHQUFHLElBQUkxSSxNQUFNLENBQUNrWCxJQUFJLENBQUM2UyxNQUFNLENBQUMsRUFBRTtNQUNuQyxJQUFJbE0sR0FBRyxHQUFHa00sTUFBTSxDQUFDcmhCLEdBQUcsQ0FBQztNQUNyQixJQUFJQSxHQUFHLEtBQUssY0FBYyxFQUFFLEtBQUssSUFBSW5KLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3NlLEdBQUcsQ0FBQzNSLE1BQU0sRUFBRTNNLENBQUMsRUFBRSxFQUFFMFEsR0FBRyxDQUFDMVEsQ0FBQyxDQUFDLENBQUMycUIsT0FBTyxDQUFDck0sR0FBRyxDQUFDdGUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNuRixJQUFJbUosR0FBRyxLQUFLLGFBQWEsRUFBRSxLQUFLLElBQUluSixDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdzZSxHQUFHLENBQUMzUixNQUFNLEVBQUUzTSxDQUFDLEVBQUUsRUFBRTBRLEdBQUcsQ0FBQzFRLENBQUMsQ0FBQyxDQUFDNHFCLE1BQU0sQ0FBQ3RNLEdBQUcsQ0FBQ3RlLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDdEYsSUFBSW1KLEdBQUcsS0FBSyxjQUFjLElBQUlBLEdBQUcsS0FBSyxhQUFhLEVBQUUsS0FBSyxJQUFJbkosQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHc2UsR0FBRyxDQUFDM1IsTUFBTSxFQUFFM00sQ0FBQyxFQUFFLEVBQUUwUSxHQUFHLENBQUMxUSxDQUFDLENBQUMsQ0FBQzZxQixVQUFVLENBQUN2TSxHQUFHLENBQUN0ZSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3BILElBQUltSixHQUFHLEtBQUssa0JBQWtCLEVBQUUsS0FBSyxJQUFJbkosQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHc2UsR0FBRyxDQUFDM1IsTUFBTSxFQUFFM00sQ0FBQyxFQUFFLEVBQUUwUSxHQUFHLENBQUMxUSxDQUFDLENBQUMsQ0FBQzhxQixXQUFXLENBQUN4TSxHQUFHLENBQUN0ZSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2hHLElBQUltSixHQUFHLEtBQUssVUFBVSxFQUFFLEtBQUssSUFBSW5KLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3NlLEdBQUcsQ0FBQzNSLE1BQU0sRUFBRTNNLENBQUMsRUFBRSxFQUFFMFEsR0FBRyxDQUFDMVEsQ0FBQyxDQUFDLENBQUMrcUIsTUFBTSxDQUFDampCLE1BQU0sQ0FBQ3dXLEdBQUcsQ0FBQ3RlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMzRixJQUFJbUosR0FBRyxLQUFLLGFBQWEsRUFBRSxLQUFLLElBQUluSixDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdzZSxHQUFHLENBQUMzUixNQUFNLEVBQUUzTSxDQUFDLEVBQUUsRUFBRTBRLEdBQUcsQ0FBQzFRLENBQUMsQ0FBQyxDQUFDZ3JCLFNBQVMsQ0FBQzFNLEdBQUcsQ0FBQ3RlLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDekYsSUFBSW1KLEdBQUcsS0FBSyxhQUFhLEVBQUU7UUFDOUIsS0FBSyxJQUFJbkosQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHc2UsR0FBRyxDQUFDM1IsTUFBTSxFQUFFM00sQ0FBQyxFQUFFLEVBQUU7VUFDbkMsSUFBSTBRLEdBQUcsQ0FBQzFRLENBQUMsQ0FBQyxDQUFDZ1gsbUJBQW1CLENBQUMsQ0FBQyxJQUFJelYsU0FBUyxFQUFFbVAsR0FBRyxDQUFDMVEsQ0FBQyxDQUFDLENBQUN1b0IsbUJBQW1CLENBQUMsSUFBSXFCLCtCQUFzQixDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDblosR0FBRyxDQUFDMVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUNySDBRLEdBQUcsQ0FBQzFRLENBQUMsQ0FBQyxDQUFDZ1gsbUJBQW1CLENBQUMsQ0FBQyxDQUFDTyxTQUFTLENBQUN6UCxNQUFNLENBQUN3VyxHQUFHLENBQUN0ZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hEO01BQ0YsQ0FBQztNQUNJLElBQUltSixHQUFHLEtBQUssZ0JBQWdCLElBQUlBLEdBQUcsS0FBSyxnQkFBZ0IsSUFBSUEsR0FBRyxLQUFLLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUFBLEtBQ3ZGLElBQUlBLEdBQUcsS0FBSyx1QkFBdUIsRUFBRTtRQUN4QyxJQUFJOGhCLGtCQUFrQixHQUFHM00sR0FBRztRQUM1QixLQUFLLElBQUl0ZSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdpckIsa0JBQWtCLENBQUN0ZSxNQUFNLEVBQUUzTSxDQUFDLEVBQUUsRUFBRTtVQUNsRDBCLGlCQUFRLENBQUN3cEIsVUFBVSxDQUFDeGEsR0FBRyxDQUFDMVEsQ0FBQyxDQUFDLENBQUNtckIsU0FBUyxDQUFDLENBQUMsS0FBSzVwQixTQUFTLENBQUM7VUFDckRtUCxHQUFHLENBQUMxUSxDQUFDLENBQUMsQ0FBQ29yQixTQUFTLENBQUMsRUFBRSxDQUFDO1VBQ3BCLEtBQUssSUFBSUMsYUFBYSxJQUFJSixrQkFBa0IsQ0FBQ2pyQixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUM3RDBRLEdBQUcsQ0FBQzFRLENBQUMsQ0FBQyxDQUFDbXJCLFNBQVMsQ0FBQyxDQUFDLENBQUMzZCxJQUFJLENBQUMsSUFBSThkLDJCQUFrQixDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLElBQUk3RCx1QkFBYyxDQUFDLENBQUMsQ0FBQzhELE1BQU0sQ0FBQ0gsYUFBYSxDQUFDLENBQUMsQ0FBQ3hCLEtBQUssQ0FBQ25aLEdBQUcsQ0FBQzFRLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDekg7UUFDRjtNQUNGLENBQUM7TUFDSSxJQUFJbUosR0FBRyxLQUFLLHNCQUFzQixFQUFFO1FBQ3ZDLElBQUlzaUIsaUJBQWlCLEdBQUduTixHQUFHO1FBQzNCLElBQUlvTixjQUFjLEdBQUcsQ0FBQztRQUN0QixLQUFLLElBQUlDLEtBQUssR0FBRyxDQUFDLEVBQUVBLEtBQUssR0FBR0YsaUJBQWlCLENBQUM5ZSxNQUFNLEVBQUVnZixLQUFLLEVBQUUsRUFBRTtVQUM3RCxJQUFJQyxhQUFhLEdBQUdILGlCQUFpQixDQUFDRSxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUM7VUFDdkQsSUFBSWpiLEdBQUcsQ0FBQ2liLEtBQUssQ0FBQyxDQUFDM1UsbUJBQW1CLENBQUMsQ0FBQyxLQUFLelYsU0FBUyxFQUFFbVAsR0FBRyxDQUFDaWIsS0FBSyxDQUFDLENBQUNwRCxtQkFBbUIsQ0FBQyxJQUFJcUIsK0JBQXNCLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUNuWixHQUFHLENBQUNpYixLQUFLLENBQUMsQ0FBQyxDQUFDO1VBQ2xJamIsR0FBRyxDQUFDaWIsS0FBSyxDQUFDLENBQUMzVSxtQkFBbUIsQ0FBQyxDQUFDLENBQUNzUixlQUFlLENBQUMsRUFBRSxDQUFDO1VBQ3BELEtBQUssSUFBSXhTLE1BQU0sSUFBSThWLGFBQWEsRUFBRTtZQUNoQyxJQUFJNXFCLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUNqSixNQUFNLEtBQUssQ0FBQyxFQUFFK0QsR0FBRyxDQUFDaWIsS0FBSyxDQUFDLENBQUMzVSxtQkFBbUIsQ0FBQyxDQUFDLENBQUNwQixlQUFlLENBQUMsQ0FBQyxDQUFDcEksSUFBSSxDQUFDLElBQUk2YSwwQkFBaUIsQ0FBQ3JuQixNQUFNLENBQUM0VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDck0sVUFBVSxDQUFDLENBQUMsRUFBRXpCLE1BQU0sQ0FBQ2dPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUEsS0FDaExwRixHQUFHLENBQUNpYixLQUFLLENBQUMsQ0FBQzNVLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3BCLGVBQWUsQ0FBQyxDQUFDLENBQUNwSSxJQUFJLENBQUMsSUFBSTZhLDBCQUFpQixDQUFDcm5CLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUM4VixjQUFjLEVBQUUsQ0FBQyxDQUFDbmlCLFVBQVUsQ0FBQyxDQUFDLEVBQUV6QixNQUFNLENBQUNnTyxNQUFNLENBQUMsQ0FBQyxDQUFDO1VBQzlKO1FBQ0Y7TUFDRixDQUFDO01BQ0k5RCxPQUFPLENBQUNzUixHQUFHLENBQUMsa0RBQWtELEdBQUduYSxHQUFHLEdBQUcsSUFBSSxHQUFHbVYsR0FBRyxDQUFDO0lBQ3pGOztJQUVBLE9BQU9yRyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJkLG1CQUFtQkEsQ0FBQ3FQLEtBQUssRUFBRXRWLEVBQUUsRUFBRTJhLFVBQVUsRUFBRTdxQixNQUFNLEVBQUU7SUFDbEUsSUFBSWlYLEtBQUssR0FBR3JYLGVBQWUsQ0FBQ29wQixlQUFlLENBQUN4RCxLQUFLLENBQUM7SUFDbER2TyxLQUFLLENBQUN3UyxNQUFNLENBQUMsQ0FBQzdwQixlQUFlLENBQUM2bEIsd0JBQXdCLENBQUNELEtBQUssRUFBRXRWLEVBQUUsRUFBRTJhLFVBQVUsRUFBRTdxQixNQUFNLENBQUMsQ0FBQzBwQixRQUFRLENBQUN6UyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3ZHLE9BQU9BLEtBQUs7RUFDZDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFpQndPLHdCQUF3QkEsQ0FBQ0QsS0FBVSxFQUFFdFYsRUFBUSxFQUFFMmEsVUFBZ0IsRUFBRTdxQixNQUFZLEVBQUUsQ0FBRzs7SUFFakc7SUFDQSxJQUFJLENBQUNrUSxFQUFFLEVBQUVBLEVBQUUsR0FBRyxJQUFJNEYsdUJBQWMsQ0FBQyxDQUFDOztJQUVsQztJQUNBLElBQUkwUCxLQUFLLENBQUNzRixJQUFJLEtBQUt2cUIsU0FBUyxFQUFFc3FCLFVBQVUsR0FBR2pyQixlQUFlLENBQUNtckIsYUFBYSxDQUFDdkYsS0FBSyxDQUFDc0YsSUFBSSxFQUFFNWEsRUFBRSxDQUFDLENBQUM7SUFDcEZ2SixlQUFNLENBQUNDLEtBQUssQ0FBQyxPQUFPaWtCLFVBQVUsRUFBRSxTQUFTLEVBQUUsMkVBQTJFLENBQUM7O0lBRTVIO0lBQ0E7SUFDQSxJQUFJRyxNQUFNO0lBQ1YsSUFBSW5iLFFBQVE7SUFDWixLQUFLLElBQUkxSCxHQUFHLElBQUkxSSxNQUFNLENBQUNrWCxJQUFJLENBQUM2TyxLQUFLLENBQUMsRUFBRTtNQUNsQyxJQUFJbEksR0FBRyxHQUFHa0ksS0FBSyxDQUFDcmQsR0FBRyxDQUFDO01BQ3BCLElBQUlBLEdBQUcsS0FBSyxNQUFNLEVBQUUrSCxFQUFFLENBQUN5WixPQUFPLENBQUNyTSxHQUFHLENBQUMsQ0FBQztNQUMvQixJQUFJblYsR0FBRyxLQUFLLFNBQVMsRUFBRStILEVBQUUsQ0FBQ3laLE9BQU8sQ0FBQ3JNLEdBQUcsQ0FBQyxDQUFDO01BQ3ZDLElBQUluVixHQUFHLEtBQUssS0FBSyxFQUFFK0gsRUFBRSxDQUFDNlosTUFBTSxDQUFDampCLE1BQU0sQ0FBQ3dXLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDMUMsSUFBSW5WLEdBQUcsS0FBSyxNQUFNLEVBQUUsQ0FBRSxJQUFJbVYsR0FBRyxFQUFFcE4sRUFBRSxDQUFDZ04sT0FBTyxDQUFDSSxHQUFHLENBQUMsQ0FBRSxDQUFDO01BQ2pELElBQUluVixHQUFHLEtBQUssUUFBUSxFQUFFK0gsRUFBRSxDQUFDMFosTUFBTSxDQUFDdE0sR0FBRyxDQUFDLENBQUM7TUFDckMsSUFBSW5WLEdBQUcsS0FBSyxNQUFNLEVBQUUsQ0FBRSxDQUFDLENBQUM7TUFBQSxLQUN4QixJQUFJQSxHQUFHLEtBQUssU0FBUyxFQUFFK0gsRUFBRSxDQUFDK2EsT0FBTyxDQUFDM04sR0FBRyxDQUFDLENBQUM7TUFDdkMsSUFBSW5WLEdBQUcsS0FBSyxhQUFhLEVBQUUrSCxFQUFFLENBQUN1WCxhQUFhLENBQUNuSyxHQUFHLENBQUMsQ0FBQztNQUNqRCxJQUFJblYsR0FBRyxLQUFLLFFBQVEsRUFBRStILEVBQUUsQ0FBQzhaLFNBQVMsQ0FBQzFNLEdBQUcsQ0FBQyxDQUFDO01BQ3hDLElBQUluVixHQUFHLEtBQUssUUFBUSxFQUFFK0gsRUFBRSxDQUFDOFcsV0FBVyxDQUFDMUosR0FBRyxDQUFDLENBQUM7TUFDMUMsSUFBSW5WLEdBQUcsS0FBSyxTQUFTLEVBQUUrSCxFQUFFLENBQUMyWixVQUFVLENBQUN2TSxHQUFHLENBQUMsQ0FBQztNQUMxQyxJQUFJblYsR0FBRyxLQUFLLGFBQWEsRUFBRStILEVBQUUsQ0FBQzRaLFdBQVcsQ0FBQ3hNLEdBQUcsQ0FBQyxDQUFDO01BQy9DLElBQUluVixHQUFHLEtBQUssbUJBQW1CLEVBQUUrSCxFQUFFLENBQUM2WCxvQkFBb0IsQ0FBQ3pLLEdBQUcsQ0FBQyxDQUFDO01BQzlELElBQUluVixHQUFHLEtBQUssY0FBYyxJQUFJQSxHQUFHLEtBQUssUUFBUSxFQUFFO1FBQ25ELElBQUkrSCxFQUFFLENBQUNhLGNBQWMsQ0FBQyxDQUFDLEVBQUU7VUFDdkIsSUFBSSxDQUFDaWEsTUFBTSxFQUFFQSxNQUFNLEdBQUcsSUFBSUUsMEJBQWlCLENBQUMsQ0FBQztVQUM3Q0YsTUFBTSxDQUFDM1gsU0FBUyxDQUFDaUssR0FBRyxDQUFDO1FBQ3ZCO01BQ0YsQ0FBQztNQUNJLElBQUluVixHQUFHLEtBQUssV0FBVyxFQUFFO1FBQzVCLElBQUkrSCxFQUFFLENBQUNhLGNBQWMsQ0FBQyxDQUFDLEVBQUU7VUFDdkIsSUFBSSxDQUFDaWEsTUFBTSxFQUFFQSxNQUFNLEdBQUcsSUFBSUUsMEJBQWlCLENBQUMsQ0FBQztVQUM3Q0YsTUFBTSxDQUFDRyxZQUFZLENBQUM3TixHQUFHLENBQUM7UUFDMUIsQ0FBQyxNQUFNOztVQUNMO1FBQUEsQ0FFSixDQUFDO01BQ0ksSUFBSW5WLEdBQUcsS0FBSyxlQUFlLEVBQUUrSCxFQUFFLENBQUMrSixtQkFBbUIsQ0FBQ3FELEdBQUcsQ0FBQyxDQUFDO01BQ3pELElBQUluVixHQUFHLEtBQUssbUNBQW1DLEVBQUU7UUFDcEQsSUFBSTBILFFBQVEsS0FBS3RQLFNBQVMsRUFBRXNQLFFBQVEsR0FBRyxDQUFDZ2IsVUFBVSxHQUFHLElBQUlqQywrQkFBc0IsQ0FBQyxDQUFDLEdBQUcsSUFBSXdDLCtCQUFzQixDQUFDLENBQUMsRUFBRXZDLEtBQUssQ0FBQzNZLEVBQUUsQ0FBQztRQUMzSCxJQUFJLENBQUMyYSxVQUFVLEVBQUVoYixRQUFRLENBQUN3Yiw0QkFBNEIsQ0FBQy9OLEdBQUcsQ0FBQztNQUM3RCxDQUFDO01BQ0ksSUFBSW5WLEdBQUcsS0FBSyxRQUFRLEVBQUU7UUFDekIsSUFBSTBILFFBQVEsS0FBS3RQLFNBQVMsRUFBRXNQLFFBQVEsR0FBRyxDQUFDZ2IsVUFBVSxHQUFHLElBQUlqQywrQkFBc0IsQ0FBQyxDQUFDLEdBQUcsSUFBSXdDLCtCQUFzQixDQUFDLENBQUMsRUFBRXZDLEtBQUssQ0FBQzNZLEVBQUUsQ0FBQztRQUMzSEwsUUFBUSxDQUFDMEcsU0FBUyxDQUFDelAsTUFBTSxDQUFDd1csR0FBRyxDQUFDLENBQUM7TUFDakMsQ0FBQztNQUNJLElBQUluVixHQUFHLEtBQUssU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFFO01BQUEsS0FDM0IsSUFBSUEsR0FBRyxLQUFLLFNBQVMsRUFBRTtRQUMxQixJQUFJLENBQUMwaUIsVUFBVSxFQUFFO1VBQ2YsSUFBSSxDQUFDaGIsUUFBUSxFQUFFQSxRQUFRLEdBQUcsSUFBSXViLCtCQUFzQixDQUFDLENBQUMsQ0FBQ3ZDLEtBQUssQ0FBQzNZLEVBQUUsQ0FBQztVQUNoRUwsUUFBUSxDQUFDNUIsVUFBVSxDQUFDcVAsR0FBRyxDQUFDO1FBQzFCO01BQ0YsQ0FBQztNQUNJLElBQUluVixHQUFHLEtBQUssWUFBWSxFQUFFO1FBQzdCLElBQUksRUFBRSxLQUFLbVYsR0FBRyxJQUFJeEgsdUJBQWMsQ0FBQ3dWLGtCQUFrQixLQUFLaE8sR0FBRyxFQUFFcE4sRUFBRSxDQUFDckcsWUFBWSxDQUFDeVQsR0FBRyxDQUFDLENBQUMsQ0FBRTtNQUN0RixDQUFDO01BQ0ksSUFBSW5WLEdBQUcsS0FBSyxlQUFlLEVBQUUsSUFBQXhCLGVBQU0sRUFBQzZlLEtBQUssQ0FBQ3RRLGVBQWUsQ0FBQyxDQUFDLENBQUU7TUFBQSxLQUM3RCxJQUFJL00sR0FBRyxLQUFLLGlCQUFpQixFQUFFO1FBQ2xDLElBQUksQ0FBQzBILFFBQVEsRUFBRUEsUUFBUSxHQUFHLENBQUNnYixVQUFVLEdBQUcsSUFBSWpDLCtCQUFzQixDQUFDLENBQUMsR0FBRyxJQUFJd0MsK0JBQXNCLENBQUMsQ0FBQyxFQUFFdkMsS0FBSyxDQUFDM1ksRUFBRSxDQUFDO1FBQzlHLElBQUlxYixVQUFVLEdBQUdqTyxHQUFHO1FBQ3BCek4sUUFBUSxDQUFDaEgsZUFBZSxDQUFDMGlCLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQ3hpQixLQUFLLENBQUM7UUFDN0MsSUFBSThoQixVQUFVLEVBQUU7VUFDZCxJQUFJcGQsaUJBQWlCLEdBQUcsRUFBRTtVQUMxQixLQUFLLElBQUkrZCxRQUFRLElBQUlELFVBQVUsRUFBRTlkLGlCQUFpQixDQUFDakIsSUFBSSxDQUFDZ2YsUUFBUSxDQUFDdmlCLEtBQUssQ0FBQztVQUN2RTRHLFFBQVEsQ0FBQ29HLG9CQUFvQixDQUFDeEksaUJBQWlCLENBQUM7UUFDbEQsQ0FBQyxNQUFNO1VBQ0w5RyxlQUFNLENBQUNDLEtBQUssQ0FBQzJrQixVQUFVLENBQUM1ZixNQUFNLEVBQUUsQ0FBQyxDQUFDO1VBQ2xDa0UsUUFBUSxDQUFDNGIsa0JBQWtCLENBQUNGLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQ3RpQixLQUFLLENBQUM7UUFDbEQ7TUFDRixDQUFDO01BQ0ksSUFBSWQsR0FBRyxLQUFLLGNBQWMsSUFBSUEsR0FBRyxJQUFJLFlBQVksRUFBRTtRQUN0RCxJQUFBeEIsZUFBTSxFQUFDa2tCLFVBQVUsQ0FBQztRQUNsQixJQUFJblcsWUFBWSxHQUFHLEVBQUU7UUFDckIsS0FBSyxJQUFJZ1gsY0FBYyxJQUFJcE8sR0FBRyxFQUFFO1VBQzlCLElBQUkzSSxXQUFXLEdBQUcsSUFBSTBTLDBCQUFpQixDQUFDLENBQUM7VUFDekMzUyxZQUFZLENBQUNsSSxJQUFJLENBQUNtSSxXQUFXLENBQUM7VUFDOUIsS0FBSyxJQUFJZ1gsY0FBYyxJQUFJbHNCLE1BQU0sQ0FBQ2tYLElBQUksQ0FBQytVLGNBQWMsQ0FBQyxFQUFFO1lBQ3RELElBQUlDLGNBQWMsS0FBSyxTQUFTLEVBQUVoWCxXQUFXLENBQUMxRyxVQUFVLENBQUN5ZCxjQUFjLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDcEYsSUFBSUEsY0FBYyxLQUFLLFFBQVEsRUFBRWhYLFdBQVcsQ0FBQzRCLFNBQVMsQ0FBQ3pQLE1BQU0sQ0FBQzRrQixjQUFjLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRixNQUFNLElBQUluckIsb0JBQVcsQ0FBQyw4Q0FBOEMsR0FBR21yQixjQUFjLENBQUM7VUFDN0Y7UUFDRjtRQUNBLElBQUk5YixRQUFRLEtBQUt0UCxTQUFTLEVBQUVzUCxRQUFRLEdBQUcsSUFBSStZLCtCQUFzQixDQUFDLEVBQUMxWSxFQUFFLEVBQUVBLEVBQUUsRUFBQyxDQUFDO1FBQzNFTCxRQUFRLENBQUN5WCxlQUFlLENBQUM1UyxZQUFZLENBQUM7TUFDeEMsQ0FBQztNQUNJLElBQUl2TSxHQUFHLEtBQUssU0FBUyxFQUFFO1FBQzFCekgsaUJBQVEsQ0FBQ3dwQixVQUFVLENBQUNoYSxFQUFFLENBQUNpYSxTQUFTLENBQUMsQ0FBQyxLQUFLNXBCLFNBQVMsQ0FBQztRQUNqRDJQLEVBQUUsQ0FBQ2thLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFDaEIsS0FBSyxJQUFJd0IsU0FBUyxJQUFJdE8sR0FBRyxFQUFFO1VBQ3pCLElBQUl1TyxLQUFLLEdBQUcsSUFBSXZCLDJCQUFrQixDQUFDLENBQUMsQ0FBQ3pCLEtBQUssQ0FBQzNZLEVBQUUsQ0FBQztVQUM5QzJiLEtBQUssQ0FBQ3RWLFNBQVMsQ0FBQ3pQLE1BQU0sQ0FBQzhrQixTQUFTLENBQUM5VyxNQUFNLENBQUMsQ0FBQztVQUN6QytXLEtBQUssQ0FBQzdpQixRQUFRLENBQUM0aUIsU0FBUyxDQUFDRSxZQUFZLENBQUM7VUFDdEMsSUFBSUYsU0FBUyxDQUFDRyxNQUFNLEtBQUt4ckIsU0FBUyxFQUFFc3JCLEtBQUssQ0FBQ0csbUJBQW1CLENBQUNKLFNBQVMsQ0FBQ0csTUFBTSxDQUFDckosU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDbEd4UyxFQUFFLENBQUNpYSxTQUFTLENBQUMsQ0FBQyxDQUFDM2QsSUFBSSxDQUFDcWYsS0FBSyxDQUFDO1FBQzVCO01BQ0YsQ0FBQztNQUNJLElBQUkxakIsR0FBRyxLQUFLLGdCQUFnQixJQUFJbVYsR0FBRyxLQUFLL2MsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQUEsS0FDdEQsSUFBSTRILEdBQUcsS0FBSyxnQkFBZ0IsSUFBSW1WLEdBQUcsS0FBSy9jLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUFBLEtBQ3RELElBQUk0SCxHQUFHLEtBQUssV0FBVyxFQUFFK0gsRUFBRSxDQUFDK2IsV0FBVyxDQUFDbmxCLE1BQU0sQ0FBQ3dXLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDckQsSUFBSW5WLEdBQUcsS0FBSyxZQUFZLEVBQUUrSCxFQUFFLENBQUNnYyxZQUFZLENBQUNwbEIsTUFBTSxDQUFDd1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUN2RCxJQUFJblYsR0FBRyxLQUFLLGdCQUFnQixFQUFFK0gsRUFBRSxDQUFDaWMsZ0JBQWdCLENBQUM3TyxHQUFHLEtBQUssRUFBRSxHQUFHL2MsU0FBUyxHQUFHK2MsR0FBRyxDQUFDLENBQUM7TUFDaEYsSUFBSW5WLEdBQUcsS0FBSyxlQUFlLEVBQUUrSCxFQUFFLENBQUNrYyxlQUFlLENBQUN0bEIsTUFBTSxDQUFDd1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUM3RCxJQUFJblYsR0FBRyxLQUFLLGVBQWUsRUFBRStILEVBQUUsQ0FBQ21jLGtCQUFrQixDQUFDL08sR0FBRyxDQUFDLENBQUM7TUFDeEQsSUFBSW5WLEdBQUcsS0FBSyxPQUFPLEVBQUUrSCxFQUFFLENBQUNvYyxXQUFXLENBQUNoUCxHQUFHLENBQUMsQ0FBQztNQUN6QyxJQUFJblYsR0FBRyxLQUFLLFdBQVcsRUFBRStILEVBQUUsQ0FBQ3VZLFdBQVcsQ0FBQ25MLEdBQUcsQ0FBQyxDQUFDO01BQzdDLElBQUluVixHQUFHLEtBQUssa0JBQWtCLEVBQUU7UUFDbkMsSUFBSW9rQixjQUFjLEdBQUdqUCxHQUFHLENBQUNrUCxVQUFVO1FBQ25DOXJCLGlCQUFRLENBQUN3cEIsVUFBVSxDQUFDaGEsRUFBRSxDQUFDaWEsU0FBUyxDQUFDLENBQUMsS0FBSzVwQixTQUFTLENBQUM7UUFDakQyUCxFQUFFLENBQUNrYSxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQ2hCLEtBQUssSUFBSUMsYUFBYSxJQUFJa0MsY0FBYyxFQUFFO1VBQ3hDcmMsRUFBRSxDQUFDaWEsU0FBUyxDQUFDLENBQUMsQ0FBQzNkLElBQUksQ0FBQyxJQUFJOGQsMkJBQWtCLENBQUMsQ0FBQyxDQUFDQyxXQUFXLENBQUMsSUFBSTdELHVCQUFjLENBQUMsQ0FBQyxDQUFDOEQsTUFBTSxDQUFDSCxhQUFhLENBQUMsQ0FBQyxDQUFDeEIsS0FBSyxDQUFDM1ksRUFBRSxDQUFDLENBQUM7UUFDakg7TUFDRixDQUFDO01BQ0ksSUFBSS9ILEdBQUcsS0FBSyxpQkFBaUIsRUFBRTtRQUNsQ3pILGlCQUFRLENBQUN3cEIsVUFBVSxDQUFDVyxVQUFVLENBQUM7UUFDL0IsSUFBSUQsYUFBYSxHQUFHdE4sR0FBRyxDQUFDbVAsT0FBTztRQUMvQjlsQixlQUFNLENBQUNDLEtBQUssQ0FBQzVHLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUNqSixNQUFNLEVBQUVpZixhQUFhLENBQUNqZixNQUFNLENBQUM7UUFDbkUsSUFBSWtFLFFBQVEsS0FBS3RQLFNBQVMsRUFBRXNQLFFBQVEsR0FBRyxJQUFJK1ksK0JBQXNCLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMzWSxFQUFFLENBQUM7UUFDN0VMLFFBQVEsQ0FBQ3lYLGVBQWUsQ0FBQyxFQUFFLENBQUM7UUFDNUIsS0FBSyxJQUFJdG9CLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR2dCLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUNqSixNQUFNLEVBQUUzTSxDQUFDLEVBQUUsRUFBRTtVQUN4RDZRLFFBQVEsQ0FBQytFLGVBQWUsQ0FBQyxDQUFDLENBQUNwSSxJQUFJLENBQUMsSUFBSTZhLDBCQUFpQixDQUFDcm5CLE1BQU0sQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDLENBQUM1VixDQUFDLENBQUMsQ0FBQ3VKLFVBQVUsQ0FBQyxDQUFDLEVBQUV6QixNQUFNLENBQUM4akIsYUFBYSxDQUFDNXJCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1SDtNQUNGLENBQUM7TUFDSWdTLE9BQU8sQ0FBQ3NSLEdBQUcsQ0FBQyxnRUFBZ0UsR0FBR25hLEdBQUcsR0FBRyxJQUFJLEdBQUdtVixHQUFHLENBQUM7SUFDdkc7O0lBRUE7SUFDQSxJQUFJME4sTUFBTSxFQUFFOWEsRUFBRSxDQUFDd2MsUUFBUSxDQUFDLElBQUlDLG9CQUFXLENBQUMzQixNQUFNLENBQUMsQ0FBQ3ZCLE1BQU0sQ0FBQyxDQUFDdlosRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFFN0Q7SUFDQSxJQUFJTCxRQUFRLEVBQUU7TUFDWixJQUFJSyxFQUFFLENBQUNhLGNBQWMsQ0FBQyxDQUFDLEtBQUt4USxTQUFTLEVBQUUyUCxFQUFFLENBQUMrVyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQy9ELElBQUksQ0FBQ3BYLFFBQVEsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQ2lCLGNBQWMsQ0FBQyxDQUFDLEVBQUViLEVBQUUsQ0FBQytKLG1CQUFtQixDQUFDLENBQUMsQ0FBQztNQUNqRSxJQUFJNFEsVUFBVSxFQUFFO1FBQ2QzYSxFQUFFLENBQUMrVixhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUkvVixFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLEVBQUU7VUFDNUIsSUFBSW5HLFFBQVEsQ0FBQytFLGVBQWUsQ0FBQyxDQUFDLEVBQUUxRSxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNzUixlQUFlLENBQUMvbUIsU0FBUyxDQUFDLENBQUMsQ0FBQztVQUNyRjJQLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQzRXLEtBQUssQ0FBQy9jLFFBQVEsQ0FBQztRQUMxQyxDQUFDO1FBQ0lLLEVBQUUsQ0FBQ3FYLG1CQUFtQixDQUFDMVgsUUFBUSxDQUFDO01BQ3ZDLENBQUMsTUFBTTtRQUNMSyxFQUFFLENBQUM4VixhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ3RCOVYsRUFBRSxDQUFDMmMsb0JBQW9CLENBQUMsQ0FBQ2hkLFFBQVEsQ0FBQyxDQUFDO01BQ3JDO0lBQ0Y7O0lBRUE7SUFDQSxPQUFPSyxFQUFFO0VBQ1g7O0VBRUEsT0FBaUJxVyxzQkFBc0JBLENBQUNELFNBQVMsRUFBRTs7SUFFakQ7SUFDQSxJQUFJcFcsRUFBRSxHQUFHLElBQUk0Rix1QkFBYyxDQUFDLENBQUM7SUFDN0I1RixFQUFFLENBQUMrVyxjQUFjLENBQUMsSUFBSSxDQUFDO0lBQ3ZCL1csRUFBRSxDQUFDaUgsV0FBVyxDQUFDLEtBQUssQ0FBQztJQUNyQmpILEVBQUUsQ0FBQ2dILFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDckJoSCxFQUFFLENBQUNrWCxXQUFXLENBQUMsS0FBSyxDQUFDOztJQUVyQjtJQUNBLElBQUkxVyxNQUFNLEdBQUcsSUFBSTRaLDJCQUFrQixDQUFDLEVBQUNwYSxFQUFFLEVBQUVBLEVBQUUsRUFBQyxDQUFDO0lBQzdDLEtBQUssSUFBSS9ILEdBQUcsSUFBSTFJLE1BQU0sQ0FBQ2tYLElBQUksQ0FBQzJQLFNBQVMsQ0FBQyxFQUFFO01BQ3RDLElBQUloSixHQUFHLEdBQUdnSixTQUFTLENBQUNuZSxHQUFHLENBQUM7TUFDeEIsSUFBSUEsR0FBRyxLQUFLLFFBQVEsRUFBRXVJLE1BQU0sQ0FBQzZGLFNBQVMsQ0FBQ3pQLE1BQU0sQ0FBQ3dXLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDL0MsSUFBSW5WLEdBQUcsS0FBSyxPQUFPLEVBQUV1SSxNQUFNLENBQUNvYyxVQUFVLENBQUN4UCxHQUFHLENBQUMsQ0FBQztNQUM1QyxJQUFJblYsR0FBRyxLQUFLLFdBQVcsRUFBRSxDQUFFLElBQUksRUFBRSxLQUFLbVYsR0FBRyxFQUFFNU0sTUFBTSxDQUFDNlosV0FBVyxDQUFDLElBQUk3RCx1QkFBYyxDQUFDcEosR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDO01BQ3pGLElBQUluVixHQUFHLEtBQUssY0FBYyxFQUFFdUksTUFBTSxDQUFDMUgsUUFBUSxDQUFDc1UsR0FBRyxDQUFDLENBQUM7TUFDakQsSUFBSW5WLEdBQUcsS0FBSyxTQUFTLEVBQUUrSCxFQUFFLENBQUN5WixPQUFPLENBQUNyTSxHQUFHLENBQUMsQ0FBQztNQUN2QyxJQUFJblYsR0FBRyxLQUFLLFVBQVUsRUFBRStILEVBQUUsQ0FBQzhXLFdBQVcsQ0FBQyxDQUFDMUosR0FBRyxDQUFDLENBQUM7TUFDN0MsSUFBSW5WLEdBQUcsS0FBSyxRQUFRLEVBQUV1SSxNQUFNLENBQUNxYyxXQUFXLENBQUN6UCxHQUFHLENBQUMsQ0FBQztNQUM5QyxJQUFJblYsR0FBRyxLQUFLLFFBQVEsRUFBRXVJLE1BQU0sQ0FBQ3NiLG1CQUFtQixDQUFDMU8sR0FBRyxDQUFDLENBQUM7TUFDdEQsSUFBSW5WLEdBQUcsS0FBSyxlQUFlLEVBQUU7UUFDaEN1SSxNQUFNLENBQUM3SCxlQUFlLENBQUN5VSxHQUFHLENBQUN2VSxLQUFLLENBQUM7UUFDakMySCxNQUFNLENBQUMrYSxrQkFBa0IsQ0FBQ25PLEdBQUcsQ0FBQ3JVLEtBQUssQ0FBQztNQUN0QyxDQUFDO01BQ0ksSUFBSWQsR0FBRyxLQUFLLGNBQWMsRUFBRStILEVBQUUsQ0FBQ3djLFFBQVEsQ0FBRSxJQUFJQyxvQkFBVyxDQUFDLENBQUMsQ0FBQ3RaLFNBQVMsQ0FBQ2lLLEdBQUcsQ0FBQyxDQUFpQm1NLE1BQU0sQ0FBQyxDQUFDdlosRUFBRSxDQUFhLENBQUMsQ0FBQyxDQUFDO01BQ3BIYyxPQUFPLENBQUNzUixHQUFHLENBQUMsa0RBQWtELEdBQUduYSxHQUFHLEdBQUcsSUFBSSxHQUFHbVYsR0FBRyxDQUFDO0lBQ3pGOztJQUVBO0lBQ0FwTixFQUFFLENBQUM4YyxVQUFVLENBQUMsQ0FBQ3RjLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZCLE9BQU9SLEVBQUU7RUFDWDs7RUFFQSxPQUFpQmlJLDBCQUEwQkEsQ0FBQzhVLHlCQUF5QixFQUFFO0lBQ3JFLElBQUloVyxLQUFLLEdBQUcsSUFBSWlTLG9CQUFXLENBQUMsQ0FBQztJQUM3QixLQUFLLElBQUkvZ0IsR0FBRyxJQUFJMUksTUFBTSxDQUFDa1gsSUFBSSxDQUFDc1cseUJBQXlCLENBQUMsRUFBRTtNQUN0RCxJQUFJM1AsR0FBRyxHQUFHMlAseUJBQXlCLENBQUM5a0IsR0FBRyxDQUFDO01BQ3hDLElBQUlBLEdBQUcsS0FBSyxNQUFNLEVBQUU7UUFDbEI4TyxLQUFLLENBQUN3UyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ2hCLEtBQUssSUFBSXpaLEtBQUssSUFBSXNOLEdBQUcsRUFBRTtVQUNyQixJQUFJcE4sRUFBRSxHQUFHdFEsZUFBZSxDQUFDNmxCLHdCQUF3QixDQUFDelYsS0FBSyxFQUFFelAsU0FBUyxFQUFFLElBQUksQ0FBQztVQUN6RTJQLEVBQUUsQ0FBQ3daLFFBQVEsQ0FBQ3pTLEtBQUssQ0FBQztVQUNsQkEsS0FBSyxDQUFDNUksTUFBTSxDQUFDLENBQUMsQ0FBQzdCLElBQUksQ0FBQzBELEVBQUUsQ0FBQztRQUN6QjtNQUNGLENBQUM7TUFDSSxJQUFJL0gsR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFFLENBQUMsQ0FBQztNQUFBLEtBQzNCNkksT0FBTyxDQUFDc1IsR0FBRyxDQUFDLHlEQUF5RCxHQUFHbmEsR0FBRyxHQUFHLElBQUksR0FBR21WLEdBQUcsQ0FBQztJQUNoRztJQUNBLE9BQU9yRyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFpQjhULGFBQWFBLENBQUNtQyxPQUFPLEVBQUVoZCxFQUFFLEVBQUU7SUFDMUMsSUFBSTJhLFVBQVU7SUFDZCxJQUFJcUMsT0FBTyxLQUFLLElBQUksRUFBRTtNQUNwQnJDLFVBQVUsR0FBRyxLQUFLO01BQ2xCM2EsRUFBRSxDQUFDK1csY0FBYyxDQUFDLElBQUksQ0FBQztNQUN2Qi9XLEVBQUUsQ0FBQ2lILFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJqSCxFQUFFLENBQUNnSCxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ3JCaEgsRUFBRSxDQUFDZ1gsUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQmhYLEVBQUUsQ0FBQ2tYLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJsWCxFQUFFLENBQUNpWCxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQ3hCLENBQUMsTUFBTSxJQUFJK0YsT0FBTyxLQUFLLEtBQUssRUFBRTtNQUM1QnJDLFVBQVUsR0FBRyxJQUFJO01BQ2pCM2EsRUFBRSxDQUFDK1csY0FBYyxDQUFDLElBQUksQ0FBQztNQUN2Qi9XLEVBQUUsQ0FBQ2lILFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJqSCxFQUFFLENBQUNnSCxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ3JCaEgsRUFBRSxDQUFDZ1gsUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQmhYLEVBQUUsQ0FBQ2tYLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJsWCxFQUFFLENBQUNpWCxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQ3hCLENBQUMsTUFBTSxJQUFJK0YsT0FBTyxLQUFLLE1BQU0sRUFBRTtNQUM3QnJDLFVBQVUsR0FBRyxLQUFLO01BQ2xCM2EsRUFBRSxDQUFDK1csY0FBYyxDQUFDLEtBQUssQ0FBQztNQUN4Qi9XLEVBQUUsQ0FBQ2lILFdBQVcsQ0FBQyxJQUFJLENBQUM7TUFDcEJqSCxFQUFFLENBQUNnSCxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ3JCaEgsRUFBRSxDQUFDZ1gsUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQmhYLEVBQUUsQ0FBQ2tYLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJsWCxFQUFFLENBQUNpWCxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBRTtJQUMzQixDQUFDLE1BQU0sSUFBSStGLE9BQU8sS0FBSyxTQUFTLEVBQUU7TUFDaENyQyxVQUFVLEdBQUcsSUFBSTtNQUNqQjNhLEVBQUUsQ0FBQytXLGNBQWMsQ0FBQyxLQUFLLENBQUM7TUFDeEIvVyxFQUFFLENBQUNpSCxXQUFXLENBQUMsSUFBSSxDQUFDO01BQ3BCakgsRUFBRSxDQUFDZ0gsWUFBWSxDQUFDLElBQUksQ0FBQztNQUNyQmhILEVBQUUsQ0FBQ2dYLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDakJoWCxFQUFFLENBQUNrWCxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCbFgsRUFBRSxDQUFDaVgsWUFBWSxDQUFDLEtBQUssQ0FBQztJQUN4QixDQUFDLE1BQU0sSUFBSStGLE9BQU8sS0FBSyxPQUFPLEVBQUU7TUFDOUJyQyxVQUFVLEdBQUcsS0FBSztNQUNsQjNhLEVBQUUsQ0FBQytXLGNBQWMsQ0FBQyxJQUFJLENBQUM7TUFDdkIvVyxFQUFFLENBQUNpSCxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCakgsRUFBRSxDQUFDZ0gsWUFBWSxDQUFDLElBQUksQ0FBQztNQUNyQmhILEVBQUUsQ0FBQ2dYLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDakJoWCxFQUFFLENBQUNrWCxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCbFgsRUFBRSxDQUFDaVgsWUFBWSxDQUFDLElBQUksQ0FBQztJQUN2QixDQUFDLE1BQU0sSUFBSStGLE9BQU8sS0FBSyxRQUFRLEVBQUU7TUFDL0JyQyxVQUFVLEdBQUcsSUFBSTtNQUNqQjNhLEVBQUUsQ0FBQytXLGNBQWMsQ0FBQyxLQUFLLENBQUM7TUFDeEIvVyxFQUFFLENBQUNpSCxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCakgsRUFBRSxDQUFDZ0gsWUFBWSxDQUFDLEtBQUssQ0FBQztNQUN0QmhILEVBQUUsQ0FBQ2dYLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDakJoWCxFQUFFLENBQUNrWCxXQUFXLENBQUMsSUFBSSxDQUFDO01BQ3BCbFgsRUFBRSxDQUFDaVgsWUFBWSxDQUFDLEtBQUssQ0FBQztJQUN4QixDQUFDLE1BQU07TUFDTCxNQUFNLElBQUkzbUIsb0JBQVcsQ0FBQyw4QkFBOEIsR0FBRzBzQixPQUFPLENBQUM7SUFDakU7SUFDQSxPQUFPckMsVUFBVTtFQUNuQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCMWEsT0FBT0EsQ0FBQ0QsRUFBRSxFQUFFRixLQUFLLEVBQUVDLFFBQVEsRUFBRTtJQUM1QyxJQUFBdEosZUFBTSxFQUFDdUosRUFBRSxDQUFDbUIsT0FBTyxDQUFDLENBQUMsS0FBSzlRLFNBQVMsQ0FBQzs7SUFFbEM7SUFDQSxJQUFJNHNCLEdBQUcsR0FBR25kLEtBQUssQ0FBQ0UsRUFBRSxDQUFDbUIsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM3QixJQUFJOGIsR0FBRyxLQUFLNXNCLFNBQVMsRUFBRXlQLEtBQUssQ0FBQ0UsRUFBRSxDQUFDbUIsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHbkIsRUFBRSxDQUFDLENBQUM7SUFBQSxLQUM1Q2lkLEdBQUcsQ0FBQ1AsS0FBSyxDQUFDMWMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFFcEI7SUFDQSxJQUFJQSxFQUFFLENBQUNuRyxTQUFTLENBQUMsQ0FBQyxLQUFLeEosU0FBUyxFQUFFO01BQ2hDLElBQUk2c0IsTUFBTSxHQUFHbmQsUUFBUSxDQUFDQyxFQUFFLENBQUNuRyxTQUFTLENBQUMsQ0FBQyxDQUFDO01BQ3JDLElBQUlxakIsTUFBTSxLQUFLN3NCLFNBQVMsRUFBRTBQLFFBQVEsQ0FBQ0MsRUFBRSxDQUFDbkcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHbUcsRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFBQSxLQUMvRHVjLE1BQU0sQ0FBQ1IsS0FBSyxDQUFDMWMsRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQztFQUNGOztFQUVBO0FBQ0Y7QUFDQTtFQUNFLE9BQWlCa1Ysa0JBQWtCQSxDQUFDc0gsR0FBRyxFQUFFQyxHQUFHLEVBQUU7SUFDNUMsSUFBSUQsR0FBRyxDQUFDdGpCLFNBQVMsQ0FBQyxDQUFDLEtBQUt4SixTQUFTLElBQUkrc0IsR0FBRyxDQUFDdmpCLFNBQVMsQ0FBQyxDQUFDLEtBQUt4SixTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUFBLEtBQ3pFLElBQUk4c0IsR0FBRyxDQUFDdGpCLFNBQVMsQ0FBQyxDQUFDLEtBQUt4SixTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBRztJQUFBLEtBQy9DLElBQUkrc0IsR0FBRyxDQUFDdmpCLFNBQVMsQ0FBQyxDQUFDLEtBQUt4SixTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFFO0lBQ3BELElBQUlndEIsSUFBSSxHQUFHRixHQUFHLENBQUN0akIsU0FBUyxDQUFDLENBQUMsR0FBR3VqQixHQUFHLENBQUN2akIsU0FBUyxDQUFDLENBQUM7SUFDNUMsSUFBSXdqQixJQUFJLEtBQUssQ0FBQyxFQUFFLE9BQU9BLElBQUk7SUFDM0IsT0FBT0YsR0FBRyxDQUFDeGMsUUFBUSxDQUFDLENBQUMsQ0FBQ3hDLE1BQU0sQ0FBQyxDQUFDLENBQUN2RyxPQUFPLENBQUN1bEIsR0FBRyxDQUFDLEdBQUdDLEdBQUcsQ0FBQ3pjLFFBQVEsQ0FBQyxDQUFDLENBQUN4QyxNQUFNLENBQUMsQ0FBQyxDQUFDdkcsT0FBTyxDQUFDd2xCLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdEY7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBT3BILHdCQUF3QkEsQ0FBQ3NILEVBQUUsRUFBRUMsRUFBRSxFQUFFO0lBQ3RDLElBQUlELEVBQUUsQ0FBQ3hnQixlQUFlLENBQUMsQ0FBQyxHQUFHeWdCLEVBQUUsQ0FBQ3pnQixlQUFlLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDdEQsSUFBSXdnQixFQUFFLENBQUN4Z0IsZUFBZSxDQUFDLENBQUMsS0FBS3lnQixFQUFFLENBQUN6Z0IsZUFBZSxDQUFDLENBQUMsRUFBRSxPQUFPd2dCLEVBQUUsQ0FBQ25JLGtCQUFrQixDQUFDLENBQUMsR0FBR29JLEVBQUUsQ0FBQ3BJLGtCQUFrQixDQUFDLENBQUM7SUFDaEgsT0FBTyxDQUFDO0VBQ1Y7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBaUJtQixjQUFjQSxDQUFDa0gsRUFBRSxFQUFFQyxFQUFFLEVBQUU7O0lBRXRDO0lBQ0EsSUFBSUMsZ0JBQWdCLEdBQUdodUIsZUFBZSxDQUFDbW1CLGtCQUFrQixDQUFDMkgsRUFBRSxDQUFDNWQsS0FBSyxDQUFDLENBQUMsRUFBRTZkLEVBQUUsQ0FBQzdkLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDakYsSUFBSThkLGdCQUFnQixLQUFLLENBQUMsRUFBRSxPQUFPQSxnQkFBZ0I7O0lBRW5EO0lBQ0EsSUFBSUMsT0FBTyxHQUFHSCxFQUFFLENBQUMxZ0IsZUFBZSxDQUFDLENBQUMsR0FBRzJnQixFQUFFLENBQUMzZ0IsZUFBZSxDQUFDLENBQUM7SUFDekQsSUFBSTZnQixPQUFPLEtBQUssQ0FBQyxFQUFFLE9BQU9BLE9BQU87SUFDakNBLE9BQU8sR0FBR0gsRUFBRSxDQUFDckksa0JBQWtCLENBQUMsQ0FBQyxHQUFHc0ksRUFBRSxDQUFDdEksa0JBQWtCLENBQUMsQ0FBQztJQUMzRCxJQUFJd0ksT0FBTyxLQUFLLENBQUMsRUFBRSxPQUFPQSxPQUFPO0lBQ2pDQSxPQUFPLEdBQUdILEVBQUUsQ0FBQ25oQixRQUFRLENBQUMsQ0FBQyxHQUFHb2hCLEVBQUUsQ0FBQ3BoQixRQUFRLENBQUMsQ0FBQztJQUN2QyxJQUFJc2hCLE9BQU8sS0FBSyxDQUFDLEVBQUUsT0FBT0EsT0FBTztJQUNqQyxPQUFPSCxFQUFFLENBQUNwWCxXQUFXLENBQUMsQ0FBQyxDQUFDdkQsTUFBTSxDQUFDLENBQUMsQ0FBQythLGFBQWEsQ0FBQ0gsRUFBRSxDQUFDclgsV0FBVyxDQUFDLENBQUMsQ0FBQ3ZELE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDM0U7QUFDRjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBSkFnYixPQUFBLENBQUE1dUIsT0FBQSxHQUFBUyxlQUFBO0FBS0EsTUFBTXFvQixZQUFZLENBQUM7O0VBRWpCOzs7Ozs7Ozs7Ozs7RUFZQWxvQixXQUFXQSxDQUFDMmpCLE1BQU0sRUFBRTtJQUNsQixJQUFJekIsSUFBSSxHQUFHLElBQUk7SUFDZixJQUFJLENBQUN5QixNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDc0ssTUFBTSxHQUFHLElBQUlDLG1CQUFVLENBQUMsa0JBQWlCLENBQUUsTUFBTWhNLElBQUksQ0FBQ3RYLElBQUksQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDO0lBQ3JFLElBQUksQ0FBQ3VqQixhQUFhLEdBQUcsRUFBRTtJQUN2QixJQUFJLENBQUNDLDRCQUE0QixHQUFHLElBQUl2ZSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDd2UsMEJBQTBCLEdBQUcsSUFBSXhlLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUN5ZSxVQUFVLEdBQUcsSUFBSUMsbUJBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLElBQUksQ0FBQ0MsVUFBVSxHQUFHLENBQUM7RUFDckI7O0VBRUFyRyxZQUFZQSxDQUFDQyxTQUFTLEVBQUU7SUFDdEIsSUFBSSxDQUFDQSxTQUFTLEdBQUdBLFNBQVM7SUFDMUIsSUFBSUEsU0FBUyxFQUFFLElBQUksQ0FBQzZGLE1BQU0sQ0FBQ1EsS0FBSyxDQUFDLElBQUksQ0FBQzlLLE1BQU0sQ0FBQ25ZLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELElBQUksQ0FBQ3lpQixNQUFNLENBQUN2TixJQUFJLENBQUMsQ0FBQztFQUN6Qjs7RUFFQW5WLGFBQWFBLENBQUNtakIsVUFBVSxFQUFFO0lBQ3hCLElBQUksQ0FBQ1QsTUFBTSxDQUFDMWlCLGFBQWEsQ0FBQ21qQixVQUFVLENBQUM7RUFDdkM7O0VBRUEsTUFBTTlqQixJQUFJQSxDQUFBLEVBQUc7O0lBRVg7SUFDQSxJQUFJLElBQUksQ0FBQzRqQixVQUFVLEdBQUcsQ0FBQyxFQUFFO0lBQ3pCLElBQUksQ0FBQ0EsVUFBVSxFQUFFOztJQUVqQjtJQUNBLElBQUl0TSxJQUFJLEdBQUcsSUFBSTtJQUNmLE9BQU8sSUFBSSxDQUFDb00sVUFBVSxDQUFDSyxNQUFNLENBQUMsa0JBQWlCO01BQzdDLElBQUk7O1FBRUY7UUFDQSxJQUFJLE1BQU16TSxJQUFJLENBQUN5QixNQUFNLENBQUNsRCxRQUFRLENBQUMsQ0FBQyxFQUFFO1VBQ2hDeUIsSUFBSSxDQUFDc00sVUFBVSxFQUFFO1VBQ2pCO1FBQ0Y7O1FBRUE7UUFDQSxJQUFJdE0sSUFBSSxDQUFDME0sWUFBWSxLQUFLcHVCLFNBQVMsRUFBRTtVQUNuQzBoQixJQUFJLENBQUMyTSxVQUFVLEdBQUcsTUFBTTNNLElBQUksQ0FBQ3lCLE1BQU0sQ0FBQzNaLFNBQVMsQ0FBQyxDQUFDO1VBQy9Da1ksSUFBSSxDQUFDaU0sYUFBYSxHQUFHLE1BQU1qTSxJQUFJLENBQUN5QixNQUFNLENBQUNyVixNQUFNLENBQUMsSUFBSXdnQixzQkFBYSxDQUFDLENBQUMsQ0FBQzdILFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztVQUNwRi9FLElBQUksQ0FBQzBNLFlBQVksR0FBRyxNQUFNMU0sSUFBSSxDQUFDeUIsTUFBTSxDQUFDbGQsV0FBVyxDQUFDLENBQUM7VUFDbkR5YixJQUFJLENBQUNzTSxVQUFVLEVBQUU7VUFDakI7UUFDRjs7UUFFQTtRQUNBLElBQUl2a0IsTUFBTSxHQUFHLE1BQU1pWSxJQUFJLENBQUN5QixNQUFNLENBQUMzWixTQUFTLENBQUMsQ0FBQztRQUMxQyxJQUFJa1ksSUFBSSxDQUFDMk0sVUFBVSxLQUFLNWtCLE1BQU0sRUFBRTtVQUM5QixLQUFLLElBQUloTCxDQUFDLEdBQUdpakIsSUFBSSxDQUFDMk0sVUFBVSxFQUFFNXZCLENBQUMsR0FBR2dMLE1BQU0sRUFBRWhMLENBQUMsRUFBRSxFQUFFLE1BQU1pakIsSUFBSSxDQUFDNk0sVUFBVSxDQUFDOXZCLENBQUMsQ0FBQztVQUN2RWlqQixJQUFJLENBQUMyTSxVQUFVLEdBQUc1a0IsTUFBTTtRQUMxQjs7UUFFQTtRQUNBLElBQUkra0IsU0FBUyxHQUFHOWpCLElBQUksQ0FBQytqQixHQUFHLENBQUMsQ0FBQyxFQUFFaGxCLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFDLElBQUlpbEIsU0FBUyxHQUFHLE1BQU1oTixJQUFJLENBQUN5QixNQUFNLENBQUNyVixNQUFNLENBQUMsSUFBSXdnQixzQkFBYSxDQUFDLENBQUMsQ0FBQzdILFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQ2tJLFlBQVksQ0FBQ0gsU0FBUyxDQUFDLENBQUNJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDOztRQUUvSDtRQUNBLElBQUlDLG9CQUFvQixHQUFHLEVBQUU7UUFDN0IsS0FBSyxJQUFJQyxZQUFZLElBQUlwTixJQUFJLENBQUNpTSxhQUFhLEVBQUU7VUFDM0MsSUFBSWpNLElBQUksQ0FBQ25TLEtBQUssQ0FBQ21mLFNBQVMsRUFBRUksWUFBWSxDQUFDaGUsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLOVEsU0FBUyxFQUFFO1lBQy9ENnVCLG9CQUFvQixDQUFDNWlCLElBQUksQ0FBQzZpQixZQUFZLENBQUNoZSxPQUFPLENBQUMsQ0FBQyxDQUFDO1VBQ25EO1FBQ0Y7O1FBRUE7UUFDQTRRLElBQUksQ0FBQ2lNLGFBQWEsR0FBR2UsU0FBUzs7UUFFOUI7UUFDQSxJQUFJSyxXQUFXLEdBQUdGLG9CQUFvQixDQUFDempCLE1BQU0sS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLE1BQU1zVyxJQUFJLENBQUN5QixNQUFNLENBQUNyVixNQUFNLENBQUMsSUFBSXdnQixzQkFBYSxDQUFDLENBQUMsQ0FBQzdILFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQ2tJLFlBQVksQ0FBQ0gsU0FBUyxDQUFDLENBQUNRLFNBQVMsQ0FBQ0gsb0JBQW9CLENBQUMsQ0FBQ0QsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7O1FBRTNNO1FBQ0EsS0FBSyxJQUFJSyxRQUFRLElBQUlQLFNBQVMsRUFBRTtVQUM5QixJQUFJUSxTQUFTLEdBQUdELFFBQVEsQ0FBQ3plLGNBQWMsQ0FBQyxDQUFDLEdBQUdrUixJQUFJLENBQUNtTSwwQkFBMEIsR0FBR25NLElBQUksQ0FBQ2tNLDRCQUE0QjtVQUMvRyxJQUFJdUIsV0FBVyxHQUFHLENBQUNELFNBQVMsQ0FBQ3J3QixHQUFHLENBQUNvd0IsUUFBUSxDQUFDbmUsT0FBTyxDQUFDLENBQUMsQ0FBQztVQUNwRG9lLFNBQVMsQ0FBQzFmLEdBQUcsQ0FBQ3lmLFFBQVEsQ0FBQ25lLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDakMsSUFBSXFlLFdBQVcsRUFBRSxNQUFNek4sSUFBSSxDQUFDME4sYUFBYSxDQUFDSCxRQUFRLENBQUM7UUFDckQ7O1FBRUE7UUFDQSxLQUFLLElBQUlJLFVBQVUsSUFBSU4sV0FBVyxFQUFFO1VBQ2xDLElBQUlPLGFBQWEsR0FBR0QsVUFBVSxDQUFDN2UsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDa1IsSUFBSSxDQUFDbU0sMEJBQTBCLENBQUNodkIsR0FBRyxDQUFDd3dCLFVBQVUsQ0FBQ3ZlLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDN0c0USxJQUFJLENBQUNrTSw0QkFBNEIsQ0FBQzJCLE1BQU0sQ0FBQ0YsVUFBVSxDQUFDdmUsT0FBTyxDQUFDLENBQUMsQ0FBQztVQUM5RDRRLElBQUksQ0FBQ21NLDBCQUEwQixDQUFDMEIsTUFBTSxDQUFDRixVQUFVLENBQUN2ZSxPQUFPLENBQUMsQ0FBQyxDQUFDO1VBQzVELElBQUl3ZSxhQUFhLEVBQUUsQ0FBRTtZQUNuQixJQUFJRSxXQUFXLEdBQUdILFVBQVUsQ0FBQ25nQixJQUFJLENBQUMsQ0FBQyxDQUFDdVgsV0FBVyxDQUFDLElBQUksQ0FBQztZQUNyRCtJLFdBQVcsQ0FBQ3JELFFBQVEsQ0FBQ2tELFVBQVUsQ0FBQy9lLFFBQVEsQ0FBQyxDQUFDLENBQUNwQixJQUFJLENBQUMsQ0FBQyxDQUFDZ2EsTUFBTSxDQUFDLENBQUNzRyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLE1BQU05TixJQUFJLENBQUMwTixhQUFhLENBQUNJLFdBQVcsQ0FBQztVQUN2QztVQUNBLE1BQU05TixJQUFJLENBQUMwTixhQUFhLENBQUNDLFVBQVUsQ0FBQztRQUN0Qzs7UUFFQTtRQUNBLE1BQU0zTixJQUFJLENBQUMrTix1QkFBdUIsQ0FBQyxDQUFDO1FBQ3BDL04sSUFBSSxDQUFDc00sVUFBVSxFQUFFO01BQ25CLENBQUMsQ0FBQyxPQUFPaHJCLEdBQVEsRUFBRTtRQUNqQjBlLElBQUksQ0FBQ3NNLFVBQVUsRUFBRTtRQUNqQixJQUFJdE0sSUFBSSxDQUFDa0csU0FBUyxFQUFFblgsT0FBTyxDQUFDQyxLQUFLLENBQUMsb0NBQW9DLElBQUcsTUFBTWdSLElBQUksQ0FBQ3lCLE1BQU0sQ0FBQ25pQixPQUFPLENBQUMsQ0FBQyxJQUFHLEtBQUssR0FBR2dDLEdBQUcsQ0FBQ2EsT0FBTyxDQUFDLENBQUMsQ0FBQztNQUMvSDtJQUNGLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQWdCMHFCLFVBQVVBLENBQUM5a0IsTUFBTSxFQUFFO0lBQ2pDLE1BQU0sSUFBSSxDQUFDMFosTUFBTSxDQUFDdU0sZ0JBQWdCLENBQUNqbUIsTUFBTSxDQUFDO0VBQzVDOztFQUVBLE1BQWdCMmxCLGFBQWFBLENBQUN6ZixFQUFFLEVBQUU7O0lBRWhDO0lBQ0EsSUFBSUEsRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQyxLQUFLelYsU0FBUyxFQUFFO01BQzFDLElBQUFvRyxlQUFNLEVBQUN1SixFQUFFLENBQUNpYSxTQUFTLENBQUMsQ0FBQyxLQUFLNXBCLFNBQVMsQ0FBQztNQUNwQyxJQUFJbVEsTUFBTSxHQUFHLElBQUk0WiwyQkFBa0IsQ0FBQyxDQUFDO01BQ2hDL1QsU0FBUyxDQUFDckcsRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDbkIsU0FBUyxDQUFDLENBQUMsR0FBRzNFLEVBQUUsQ0FBQ2dnQixNQUFNLENBQUMsQ0FBQyxDQUFDO01BQzdEcm5CLGVBQWUsQ0FBQ3FILEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ2hKLGVBQWUsQ0FBQyxDQUFDLENBQUM7TUFDM0R5ZSxrQkFBa0IsQ0FBQ3ZiLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3hCLG9CQUFvQixDQUFDLENBQUMsQ0FBQzdJLE1BQU0sS0FBSyxDQUFDLEdBQUd1RSxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUN4QixvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUdqVSxTQUFTLENBQUMsQ0FBQztNQUFBLENBQ2xKc29CLEtBQUssQ0FBQzNZLEVBQUUsQ0FBQztNQUNkQSxFQUFFLENBQUNrYSxTQUFTLENBQUMsQ0FBQzFaLE1BQU0sQ0FBQyxDQUFDO01BQ3RCLE1BQU0sSUFBSSxDQUFDZ1QsTUFBTSxDQUFDeU0sbUJBQW1CLENBQUN6ZixNQUFNLENBQUM7SUFDL0M7O0lBRUE7SUFDQSxJQUFJUixFQUFFLENBQUN3USxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtuZ0IsU0FBUyxFQUFFO01BQzNDLElBQUkyUCxFQUFFLENBQUMyQixVQUFVLENBQUMsQ0FBQyxLQUFLdFIsU0FBUyxJQUFJMlAsRUFBRSxDQUFDMkIsVUFBVSxDQUFDLENBQUMsQ0FBQ2xHLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBRTtRQUNqRSxLQUFLLElBQUkrRSxNQUFNLElBQUlSLEVBQUUsQ0FBQzJCLFVBQVUsQ0FBQyxDQUFDLEVBQUU7VUFDbEMsTUFBTSxJQUFJLENBQUM2UixNQUFNLENBQUMwTSxzQkFBc0IsQ0FBQzFmLE1BQU0sQ0FBQztRQUNsRDtNQUNGLENBQUMsTUFBTSxDQUFFO1FBQ1AsSUFBSUgsT0FBTyxHQUFHLEVBQUU7UUFDaEIsS0FBSyxJQUFJVixRQUFRLElBQUlLLEVBQUUsQ0FBQ3dRLG9CQUFvQixDQUFDLENBQUMsRUFBRTtVQUM5Q25RLE9BQU8sQ0FBQy9ELElBQUksQ0FBQyxJQUFJOGQsMkJBQWtCLENBQUMsQ0FBQztVQUNoQ3poQixlQUFlLENBQUNnSCxRQUFRLENBQUM3QyxlQUFlLENBQUMsQ0FBQyxDQUFDO1VBQzNDeWUsa0JBQWtCLENBQUM1YixRQUFRLENBQUN3VixrQkFBa0IsQ0FBQyxDQUFDLENBQUM7VUFDakQ5TyxTQUFTLENBQUMxRyxRQUFRLENBQUNnRixTQUFTLENBQUMsQ0FBQyxDQUFDO1VBQy9CZ1UsS0FBSyxDQUFDM1ksRUFBRSxDQUFDLENBQUM7UUFDakI7UUFDQUEsRUFBRSxDQUFDOGMsVUFBVSxDQUFDemMsT0FBTyxDQUFDO1FBQ3RCLEtBQUssSUFBSUcsTUFBTSxJQUFJUixFQUFFLENBQUMyQixVQUFVLENBQUMsQ0FBQyxFQUFFO1VBQ2xDLE1BQU0sSUFBSSxDQUFDNlIsTUFBTSxDQUFDME0sc0JBQXNCLENBQUMxZixNQUFNLENBQUM7UUFDbEQ7TUFDRjtJQUNGO0VBQ0Y7O0VBRVVaLEtBQUtBLENBQUNKLEdBQUcsRUFBRStKLE1BQU0sRUFBRTtJQUMzQixLQUFLLElBQUl2SixFQUFFLElBQUlSLEdBQUcsRUFBRSxJQUFJK0osTUFBTSxLQUFLdkosRUFBRSxDQUFDbUIsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPbkIsRUFBRTtJQUMxRCxPQUFPM1AsU0FBUztFQUNsQjs7RUFFQSxNQUFnQnl2Qix1QkFBdUJBLENBQUEsRUFBRztJQUN4QyxJQUFJSyxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMzTSxNQUFNLENBQUNsZCxXQUFXLENBQUMsQ0FBQztJQUM5QyxJQUFJNnBCLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMxQixZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUkwQixRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDMUIsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQ2hGLElBQUksQ0FBQ0EsWUFBWSxHQUFHMEIsUUFBUTtNQUM1QixNQUFNLElBQUksQ0FBQzNNLE1BQU0sQ0FBQzRNLHVCQUF1QixDQUFDRCxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUVBLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNuRSxPQUFPLElBQUk7SUFDYjtJQUNBLE9BQU8sS0FBSztFQUNkO0FBQ0YiLCJpZ25vcmVMaXN0IjpbXX0=