import * as ethers from "ethers";
import { ABIManager } from "/src/data/abi.ts";

export let Auth = function Authorization() {
  let that = this;
  let provider = new ethers.providers.Web3Provider(window.ethereum);
  let abiManager = new ABIManager();
  let unlockABI = abiManager.getUnlockABI();
  let accounts;

  this.requestAccounts = async function doRequestAccounts() {
    return new Promise((resolve) => {
      document
        .getElementById("sign_in")
        .addEventListener("click", async function handler(event) {
          accounts = await provider.send("eth_requestAccounts", []);

          console.log("signed in as " + accounts);
          return accounts;
        });
    });
  };

  this.doUnlockTransaction = async function doUnlockTransactions() {
    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      "0x8d72a5a15979ad95526abc01dec33631db6a9095",
      unlockABI,
      signer
    );

    console.log(await contract.name()); // => "Unlock Times"

    // Let's get the key price so we know how much we need to send (we could send more!)
    const amount = await contract.keyPrice();

    // Purchase params:
    // The purchase function in v11 supports making multiple purchases... here we just pass a single one.
    const purchaseParams = [
      [amount],
      [accounts[0]], // This is the recipient of the membership (us!)
      [accounts[0]], // The is the referrer who will earn UDT tokens (we'd like this to be us!)
      [ethers.constants.AddressZero], // The key manager. if 0x0, then it is the recipient by default
      [[]], // empty data object (not used here)
    ];
    console.log("purchaseParams", purchaseParams);
    const options = {
      value: amount, // This is a lock that uses Ether, so it means we need send value. If it was an ERC20 we could set this to 0 and just use the amount on purchase's first argument
    };

    // We can now send transactions to modify the state of the lock, like purchase a key!
    const transaction = await contract.purchase(...purchaseParams, options);
    console.log(transaction.hash);
    const receipt = await transaction.wait();
    console.log(receipt);
  };
};
