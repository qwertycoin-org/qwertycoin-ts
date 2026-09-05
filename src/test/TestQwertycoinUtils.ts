import assert from "assert";
import {
  createWalletKeys,
  MoneroNetworkType,
  MoneroUtils,
  shutdown
} from "../../index";

describe("TEST QWERTYCOIN UTILITIES", function() {
  const mainnetAddress = "QWC1SRZgZ98goF8YzyWADcJLvVNrs2ZUSTxTJLk7BtNZjBLrBtGVJUp7txYycZU9kY4FDsPqGuQmB5Sr1SSaynmj8WAyKxMoeY";

  after(async function() {
    await shutdown();
  });

  it("validates a QWC v2 mainnet standard address", async function() {
    assert(await MoneroUtils.isValidAddress(mainnetAddress, MoneroNetworkType.MAINNET));
    await MoneroUtils.validateAddress(mainnetAddress, MoneroNetworkType.MAINNET);
  });

  it("rejects the QWC v2 mainnet address on non-mainnet networks", async function() {
    assert.equal(await MoneroUtils.isValidAddress(mainnetAddress, MoneroNetworkType.TESTNET), false);
    assert.equal(await MoneroUtils.isValidAddress(mainnetAddress, MoneroNetworkType.STAGENET), false);
  });

  it("creates mainnet wallet keys with a QWC standard address", async function() {
    const wallet = await createWalletKeys({
      networkType: MoneroNetworkType.MAINNET,
      language: "English"
    });

    try {
      const generatedAddress = await wallet.getPrimaryAddress();
      assert(generatedAddress.startsWith("QWC"));
      assert(await MoneroUtils.isValidAddress(generatedAddress, MoneroNetworkType.MAINNET));
    } finally {
      await wallet.close();
    }
  });
});
