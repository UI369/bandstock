import * as THREE from "three";
import { Tween, Easing, update } from "@tweenjs/tween.js";
import * as Stats from "stats.js";
import { timer } from "/src/util/timer.js";
import { assign, createMachine, interpret, send, spawn } from "xstate";
import { EventEmitter } from "/src/util/event_emitter.ts";
import { BlockMaker } from "/src/data/blocks.ts";
import * as ETHERS from "ethers"

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

let container, stats, focalPoint;
let scene, renderer;
let mainCamera, backstageCamera, activeCamera;
let mainCameraHelper, mainCameraRig, backstageCameraHelper, activeHelper;

let emit = new EventEmitter();
let blockMaker = new BlockMaker();

let blockServices = [];
let blockMachines = [];
let blockService, mainCameraService, boardService;

let currentTile;
let clock = new THREE.Clock();
let clockDelta = 0;
// 30 fps
let framerate = 1 / 30;
let tiles = [];
let theta = 0;
let delta = 0.1;

let blockData = blockMaker.makeBlocks();

let requestAccounts = [];
let provider = new ETHERS.providers.Web3Provider(window.ethereum)

const abi = [{"inputs":[],"name":"CANNOT_APPROVE_SELF","type":"error"},{"inputs":[],"name":"CANT_BE_SMALLER_THAN_SUPPLY","type":"error"},{"inputs":[],"name":"CANT_EXTEND_NON_EXPIRING_KEY","type":"error"},{"inputs":[],"name":"GAS_REFUND_FAILED","type":"error"},{"inputs":[],"name":"INSUFFICIENT_ERC20_VALUE","type":"error"},{"inputs":[],"name":"INSUFFICIENT_VALUE","type":"error"},{"inputs":[],"name":"INVALID_ADDRESS","type":"error"},{"inputs":[{"internalType":"uint8","name":"hookIndex","type":"uint8"}],"name":"INVALID_HOOK","type":"error"},{"inputs":[],"name":"INVALID_LENGTH","type":"error"},{"inputs":[],"name":"INVALID_TOKEN","type":"error"},{"inputs":[],"name":"KEY_NOT_VALID","type":"error"},{"inputs":[],"name":"KEY_TRANSFERS_DISABLED","type":"error"},{"inputs":[],"name":"LOCK_HAS_CHANGED","type":"error"},{"inputs":[],"name":"LOCK_SOLD_OUT","type":"error"},{"inputs":[],"name":"MAX_KEYS_REACHED","type":"error"},{"inputs":[],"name":"MIGRATION_REQUIRED","type":"error"},{"inputs":[],"name":"NON_COMPLIANT_ERC721_RECEIVER","type":"error"},{"inputs":[],"name":"NON_RENEWABLE_LOCK","type":"error"},{"inputs":[],"name":"NOT_ENOUGH_FUNDS","type":"error"},{"inputs":[],"name":"NOT_ENOUGH_TIME","type":"error"},{"inputs":[],"name":"NOT_READY_FOR_RENEWAL","type":"error"},{"inputs":[],"name":"NO_SUCH_KEY","type":"error"},{"inputs":[],"name":"NULL_VALUE","type":"error"},{"inputs":[],"name":"ONLY_KEY_MANAGER_OR_APPROVED","type":"error"},{"inputs":[],"name":"ONLY_LOCK_MANAGER","type":"error"},{"inputs":[],"name":"ONLY_LOCK_MANAGER_OR_KEY_GRANTER","type":"error"},{"inputs":[],"name":"OUT_OF_RANGE","type":"error"},{"inputs":[],"name":"OWNER_CANT_BE_ADDRESS_ZERO","type":"error"},{"inputs":[],"name":"SCHEMA_VERSION_NOT_CORRECT","type":"error"},{"inputs":[],"name":"TRANSFER_TO_SELF","type":"error"},{"inputs":[],"name":"UNAUTHORIZED","type":"error"},{"inputs":[],"name":"UNAUTHORIZED_KEY_MANAGER_UPDATE","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"sendTo","type":"address"},{"indexed":false,"internalType":"uint256","name":"refund","type":"uint256"}],"name":"CancelKey","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newExpiration","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"bool","name":"timeAdded","type":"bool"}],"name":"ExpirationChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ExpireKey","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"refundedAmount","type":"uint256"},{"indexed":false,"internalType":"address","name":"tokenAddress","type":"address"}],"name":"GasRefunded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newTimestamp","type":"uint256"}],"name":"KeyExtended","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"KeyGranterAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"KeyGranterRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"_tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"_newManager","type":"address"}],"name":"KeyManagerChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"updatedRecordsCount","type":"uint256"}],"name":"KeysMigrated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"expirationDuration","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"maxNumberOfKeys","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"maxKeysPerAcccount","type":"uint256"}],"name":"LockConfig","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"LockManagerAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"LockManagerRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"symbol","type":"string"},{"indexed":false,"internalType":"string","name":"baseTokenURI","type":"string"}],"name":"LockMetadata","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":false,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oldKeyPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"keyPrice","type":"uint256"},{"indexed":false,"internalType":"address","name":"oldTokenAddress","type":"address"},{"indexed":false,"internalType":"address","name":"tokenAddress","type":"address"}],"name":"PricingChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"freeTrialLength","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"refundPenaltyBasisPoints","type":"uint256"}],"name":"RefundPenaltyChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"transferFeeBasisPoints","type":"uint256"}],"name":"TransferFeeChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"lockAddress","type":"address"},{"indexed":false,"internalType":"address","name":"unlockAddress","type":"address"}],"name":"UnlockCallFailed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"tokenAddress","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"KEY_GRANTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"LOCK_MANAGER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addKeyGranter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addLockManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_approved","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_keyOwner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"cancelAndRefund","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"expirationDuration","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"expireAndRefundFor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"address","name":"_referrer","type":"address"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"extend","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"freeTrialLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"gasRefundValue","outputs":[{"internalType":"uint256","name":"_refundValue","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"getCancelAndRefundValue","outputs":[{"internalType":"uint256","name":"refund","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_keyOwner","type":"address"}],"name":"getHasValidKey","outputs":[{"internalType":"bool","name":"isValid","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_time","type":"uint256"}],"name":"getTransferFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_duration","type":"uint256"}],"name":"grantKeyExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_recipients","type":"address[]"},{"internalType":"uint256[]","name":"_expirationTimestamps","type":"uint256[]"},{"internalType":"address[]","name":"_keyManagers","type":"address[]"}],"name":"grantKeys","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address payable","name":"_lockCreator","type":"address"},{"internalType":"uint256","name":"_expirationDuration","type":"uint256"},{"internalType":"address","name":"_tokenAddress","type":"address"},{"internalType":"uint256","name":"_keyPrice","type":"uint256"},{"internalType":"uint256","name":"_maxNumberOfKeys","type":"uint256"},{"internalType":"string","name":"_lockName","type":"string"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isKeyGranter","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isLockManager","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"isValidKey","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"keyExpirationTimestampFor","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"keyManagerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"keyPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"lendKey","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"maxKeysPerAddress","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxNumberOfKeys","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenIdFrom","type":"uint256"},{"internalType":"uint256","name":"_tokenIdTo","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"mergeKeys","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"","type":"bytes"}],"name":"migrate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"numberOfOwners","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"onKeyCancelHook","outputs":[{"internalType":"contract ILockKeyCancelHook","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"onKeyExtendHook","outputs":[{"internalType":"contract ILockKeyExtendHook","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"onKeyGrantHook","outputs":[{"internalType":"contract ILockKeyGrantHook","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"onKeyPurchaseHook","outputs":[{"internalType":"contract ILockKeyPurchaseHook","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"onKeyTransferHook","outputs":[{"internalType":"contract ILockKeyTransferHook","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"onTokenURIHook","outputs":[{"internalType":"contract ILockTokenURIHook","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"onValidKeyHook","outputs":[{"internalType":"contract ILockValidKeyHook","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"publicLockVersion","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"_values","type":"uint256[]"},{"internalType":"address[]","name":"_recipients","type":"address[]"},{"internalType":"address[]","name":"_referrers","type":"address[]"},{"internalType":"address[]","name":"_keyManagers","type":"address[]"},{"internalType":"bytes[]","name":"_data","type":"bytes[]"}],"name":"purchase","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"address","name":"_referrer","type":"address"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"purchasePriceFor","outputs":[{"internalType":"uint256","name":"minKeyPrice","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"referrerFees","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"refundPenaltyBasisPoints","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"address","name":"_referrer","type":"address"}],"name":"renewMembershipFor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceLockManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_granter","type":"address"}],"name":"revokeKeyGranter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"schemaVersion","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"bool","name":"_approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_onKeyPurchaseHook","type":"address"},{"internalType":"address","name":"_onKeyCancelHook","type":"address"},{"internalType":"address","name":"_onValidKeyHook","type":"address"},{"internalType":"address","name":"_onTokenURIHook","type":"address"},{"internalType":"address","name":"_onKeyTransferHook","type":"address"},{"internalType":"address","name":"_onKeyExtendHook","type":"address"},{"internalType":"address","name":"_onKeyGrantHook","type":"address"}],"name":"setEventHooks","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_refundValue","type":"uint256"}],"name":"setGasRefundValue","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"address","name":"_keyManager","type":"address"}],"name":"setKeyManagerOf","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_lockName","type":"string"},{"internalType":"string","name":"_lockSymbol","type":"string"},{"internalType":"string","name":"_baseTokenURI","type":"string"}],"name":"setLockMetadata","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"setOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_referrer","type":"address"},{"internalType":"uint256","name":"_feeBasisPoint","type":"uint256"}],"name":"setReferrerFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_tokenIdFrom","type":"uint256"},{"internalType":"uint256","name":"_timeShared","type":"uint256"}],"name":"shareKey","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_index","type":"uint256"}],"name":"tokenByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_keyOwner","type":"address"},{"internalType":"uint256","name":"_index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_keyOwner","type":"address"}],"name":"totalKeys","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_valueBasisPoint","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"transferFeeBasisPoints","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"unlendKey","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unlockProtocol","outputs":[{"internalType":"contract IUnlock","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_keyPrice","type":"uint256"},{"internalType":"address","name":"_tokenAddress","type":"address"}],"name":"updateKeyPricing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newExpirationDuration","type":"uint256"},{"internalType":"uint256","name":"_maxNumberOfKeys","type":"uint256"},{"internalType":"uint256","name":"_maxKeysPerAcccount","type":"uint256"}],"name":"updateLockConfig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_freeTrialLength","type":"uint256"},{"internalType":"uint256","name":"_refundPenaltyBasisPoints","type":"uint256"}],"name":"updateRefundPenalty","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"updateSchemaVersion","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_transferFeeBasisPoints","type":"uint256"}],"name":"updateTransferFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenAddress","type":"address"},{"internalType":"address payable","name":"_recipient","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]

let textures = {
  magenta3: "/src/assets/magenta3.png",
  teal6: "/src/assets/teal6.png",
  purple9: "/src/assets/purple9.png",
};

// allow mousepick
let raycaster, INTERSECTED;

const frustumSize = 600;

function init() {
  init3DSetup();
  initGameSystem();
  initGUI();
}

function init3DSetup() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  initCameras();

  // add light
  var light = new THREE.PointLight(0xffffff, 10000);
  light.position.set(50, 50, 50);
  scene.add(light);

  //
  createStarScape();

  //
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container.appendChild(renderer.domElement);

  renderer.autoClear = false;
  //
  stats = new Stats();
  container.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
  onWindowResize();
}

function initCameras() {
  mainCamera = new THREE.PerspectiveCamera(45, 1 * aspect, 1, 1300);

  mainCameraHelper = new THREE.CameraHelper(mainCamera);
  scene.add(mainCameraHelper);

  activeCamera = mainCamera;
  activeHelper = mainCameraHelper;

  backstageCamera = new THREE.PerspectiveCamera(1500, 1 * aspect, 0, 10000);
  backstageCameraHelper = new THREE.CameraHelper(backstageCamera);

  // counteract different front orientation of mainCameras vs rig
  mainCamera.rotation.y = -Math.PI;
  //mainCamera.rotation.x = Math.PI * 2;
  //mainCamera.rotation.z = Math.PI;
  mainCamera.updateProjectionMatrix();
  mainCameraRig = new THREE.Group();
  mainCameraRig.add(mainCamera);

  focalPoint = new THREE.Mesh(
    new THREE.BoxGeometry(10, 50, 70, 2, 5, 5),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  focalPoint.position.z = -700;
  focalPoint.visible = false;
  scene.add(focalPoint);

  
  mainCameraRig.lookAt(focalPoint.position);
  mainCameraRig.position.z += 300;
  mainCameraRig.position.y += 50;

  scene.add(mainCameraRig);
  scene.add(backstageCamera);

  console.log("mainCamera.position", mainCamera.position);
  console.log("backstageCamera.position", backstageCamera.position);
}

function initGameSystem() {
  console.log("initGameSystem");

  addMouseHandlers();
  //initBlockMachines();
  initServices();

  window.blockServices = blockServices;
  window.mainCameraService = mainCameraService;
  window.boardService = boardService;

  window.addEventListener("keydown", onKeyDown);
}

function initGUI() {
  doRequestAccounts();
  document.getElementById("next").addEventListener('click',
    () => {
      boardService.send({ type: "PRESENT_NEXT" });
    })

  document.getElementById("claim").addEventListener('click',
  async () => {
    boardService.send({ type: "CLAIM" });
    const signer = provider.getSigner()    

    const contract = new ETHERS.Contract( "0x8d72a5a15979ad95526abc01dec33631db6a9095" , abi , signer )
    
    console.log(await contract.name()); // => "Unlock Times"


  // Let's get the key price so we know how much we need to send (we could send more!)
    const amount = await contract.keyPrice();

    // Purchase params:
    // The purchase function in v11 supports making multiple purchases... here we just pass a single one.
    const purchaseParams = [
      [amount],
      [requestAccounts[0]], // This is the recipient of the membership (us!)
      [requestAccounts[0]], // The is the referrer who will earn UDT tokens (we'd like this to be us!)
      [ETHERS.constants.AddressZero], // The key manager. if 0x0, then it is the recipient by default
      [[]], // empty data object (not used here)
    ];
    console.log('purchaseParams', purchaseParams)
    const options = {
      value: amount, // This is a lock that uses Ether, so it means we need send value. If it was an ERC20 we could set this to 0 and just use the amount on purchase's first argument
    };

    // We can now send transactions to modify the state of the lock, like purchase a key!
    const transaction = await contract.purchase(...purchaseParams, options);
    console.log(transaction.hash);
    const receipt = await transaction.wait();
    console.log(receipt);

    
    //const signedMessage = await signer.signMessage("Message")
  })
}

async function doRequestAccounts() {
  return new Promise(resolve => {
    document.getElementById("sign_in").addEventListener('click',
          async function handler(event) {
              requestAccounts = await provider.send("eth_requestAccounts", []);
              console.log("signed in " + requestAccounts);
          });
  });
}



const initBlockMachines = () => {
  console.log("initBlockMachines");
  //Create (ySet.length ^ 2) blockMachines - incomprehensible algorithm determining the pattern of cubes.
  let ySet = [-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250];
  let types = ["teal6", "purple3", "magenta9"];
  let k = 0;
  for (let i = 0; i < ySet.length; i++) {
    for (let j = 0; j < ySet.length; j++) {
      const border = 3;
      let edge =
        i < border ||
        i > ySet.length - (border + 1) ||
        j < border ||
        j > ySet.length - (border + 1)
          ? 1
          : 0;
      edge = i % 2 == 0 || j % 2 == 0 ? 1 : 0;
      edge = i == 5 && j == 5 ? 2 : edge;
      blockMachines[k] = createBlockMachine(
        "tile" + k,
        types[edge],
        ySet[j],
        ySet[i],
        focalPoint.position.z
      );

      k++;
    }
  }
  console.log("end initBlock blockMachines[0]", blockMachines[0]);
};

const initServices = () => {
  console.log("initServices");
  //create blockService => Wire them in to blockMachine => Wire them into userData of 3D block

  // for (let i = 0; i < blockMachines.length; i++) {
  //   blockServices[i] = interpret(blockMachines[i], { devTools: true }).start();

  //   // blockMachines[i].config.context = {
  //   //   ...blockMachines[i].config.context,
  //   //   blockService: blockServices[i],
  //   // };

  //   emit.subscribe("tile" + i + ".hover", () => {
  //     blockServices[i].send("SWAP");
  //   });

  //   emit.subscribe("tile" + i + ".unhover", () => {
  //     blockServices[i].send("SWAP");
  //   });
  // }

  mainCameraService = interpret(createCameraMachine(), {
    devTools: true,
  }).start();

  boardService = interpret(createBoardMachine("board1", 0, 0, 0, blockData), {
    devTools: true,
  }).start();

  console.log("boardService._state", boardService._state);
};

const createBlockMachine = (idIn, typeIn, xIn, yIn, zIn) => {
  return createMachine(
    {
      id: "block_machine." + idIn,
      predictableActionArguments: true,
      context: {
        id: idIn,
        x: xIn,
        y: yIn,
        z: zIn,
        type: typeIn,
        note: "note",
        speed: 2000,
        block: undefined,
      },
      initial: "ready",
      states: {
        ready: {
          entry: ["ready_assign", "ready_init"],
          on: {
            SWAP: {
              target: "near",
            },
            PRESENT: {
              target: "presenting",
            },
          },
        },
        far: {
          entry: ["far_action"],
          on: {
            SWAP: {
              target: "near",
            },
          },
          invoke: [],
        },
        near: {
          entry: ["near_action"],
          on: {
            SWAP: {
              target: "far",
            },
          },
          invoke: [],
        },
        presenting: {
          entry: ["presenting_assign", "presenting_action"],
          on: {
            GO_AWAY: "far",
            PRESENT: {
              target: "presenting",
            },
          },
        },
      },
    },
    {
      actions: {
        ready_init: (ctx, event) => {
          //position block and add it to scene
          ctx.block.position.x = ctx.x;
          ctx.block.position.y = ctx.y;
          ctx.block.position.z = ctx.z;
          //ctx.block.userData.blockService = ctx.blockService;
          ctx.block.userData.name = ctx.name;
          tiles.push(ctx.block);
          console.log("adding block to scene: " + ctx.block);
          scene.add(ctx.block);
        },
        ready_assign: assign({
          note: () => {
            return "note!";
          },
          block: () => {
            //create the 3D block
            const textureLoader = new THREE.TextureLoader();
            const material = new THREE.MeshBasicMaterial({
              map: textureLoader.load(textures[typeIn]),
            });

            let block = new THREE.Mesh(
              new THREE.BoxGeometry(50, 50, 50, 5, 5, 5),
              material
            );
            block.userData.type = "tile";
            return block;
          },
        }),
        near_action: (ctx, event) => {
          ctx.z += 80;

          let object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        far_action: (ctx, event) => {
          ctx.z -= 80;

          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        presenting_assign: (ctx, e) => {
          console.log("block presenting_assign");
          console.log(e.event);
          ctx.x = e.event.present_to.position.x;
          ctx.y = e.event.present_to.position.y;
          ctx.z = e.event.present_to.position.z;
        },
        presenting_action: (ctx, event) => {
          console.log("block presenting_action");
          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
      },
    }
  );
};

const createBoardMachine = (
  nameIn,
  macroXIn,
  macroYIn,
  macroZIn,
  blockDataIn
) => {
  return createMachine(
    {
      id: "board_machine." + nameIn,
      predictableActionArguments: true,
      context: {
        macroX: macroXIn,
        macroY: macroYIn,
        macroZ: macroZIn,
        blockData: blockDataIn,
        blockScript: blockMaker.getBlockScript(),
        name: nameIn,
        blockSize: 50,
        next: 0,
      },
      initial: "ready",
      states: {
        ready: {
          entry: ["ready_action", "ready_assign", "ready_test"],
          on: {
            PRESENT_NEXT: {
              target: "present",
            },
          },
        },
        present: {
          entry: ["unpresent_last", "present_assign", "present_next", ],
          on: {
            PRESENT_NEXT: {
              target: "present",
            },
            CLAIM_CURRENT: {
              target: "claiming",
            }
          },
        },
        claiming: {
          entry: ["claim_current"],
          on: {
            PRESENT_NEXT: {
              target: "present",
            }
          }
        }
      },
    },
    {
      actions: {
        ready_action: (ctx, event) => {
          console.log("ready_action", ctx);
        },
        ready_assign: assign((ctx) => {
          // const blocks = Array.from({ length: 121 }).map((_, i) =>
          //   spawn(
          //     createBlockMachine(
          //       `block-${i}`,
          //       "magenta3",
          //       focalPoint.position.x,
          //       focalPoint.position.y,
          //       focalPoint.position.z
          //     ),
          //     {
          //       name: `cell-${i}`,
          //     }
          //   )
          // );

          console.log("ready_assign", ctx);
          const blocks = ctx.blockData.map((element, _) => {
            let block = createBlockMachine(
              element.name,
              element.c,
              focalPoint.position.x + element.x * ctx.blockSize,
              focalPoint.position.y + element.y * ctx.blockSize,
              focalPoint.position.z + element.z * ctx.blockSize
            );
            spawn(block, { name: element.name });
            return block;
          });
          console.log("blocks", blocks);

          const actors = blocks.reduce((all, curr, i) => {
            return { ...all, [`block-${i}`]: curr };
          }, {});

          console.log("actors", actors);
          return actors;
        }),
        unpresent_last: (() => {
          let s = send(
            (ctx, event) => ({
              type: "PRESENT",
              event: {
                present_to: {
                  position: {
                    x: ctx[ctx.blockScript.script[ctx.blockScript.index]]
                      ._context.x,
                    y: ctx[ctx.blockScript.script[ctx.blockScript.index]]
                      ._context.y,
                    z: ctx[ctx.blockScript.script[ctx.blockScript.index]]
                      ._context.z,
                  },
                },
              },
            }),
            { to: (ctx) => ctx.actor }
          );
          return s;
        })(),
        ready_test: (ctx, e) => {
          console.log("ctx", ctx.blockScript.script[ctx.blockScript.index]);
        },
        present_next: (() => {
          console.log("board present_next");
          //let nxt = ctx.next;
          let s = send(
            {
              type: "PRESENT",
              event: {
                present_to: {
                  position: {
                    x: activeCamera.position.x,
                    y: activeCamera.position.y,
                    z: activeCamera.position.z - 400,
                  },
                },
              },
            },
            { to: (ctx) => ctx.actor }
          );
          return s;
        })(),
        present_assign: assign({
          actor: (ctx, e) => {
            console.log("ctx.blockScript.script[ctx.blockScript.index]", ctx.blockScript.script[ctx.blockScript.index]);
            let nextBlock = ctx.blockScript.script[ctx.blockScript.index];
            ctx.blockScript.index += 1;
            if (ctx.blockScript.index >= ctx.blockScript.script.length) {
              ctx.blockScript.index = 0;
            }
            return nextBlock;
          },
        }),
        claim_current: (() => {
          console.log("board claim_current");
          //let nxt = ctx.next;
          let s = send(
            {
              type: "PRESENT",
              event: {
                present_to: {
                  position: {
                    x: activeCamera.position.x,
                    y: activeCamera.position.y+20,
                    z: activeCamera.position.z+10,
                  },
                },
              },
            },
            { to: (ctx) => ctx.actor }
          );
          return s;
        })(),
      },
    }
  );
};

const createCameraMachine = () => {
  return createMachine(
    {
      id: "mainCamera_machine",
      predictableActionArguments: true,
      initial: "live",
      states: {
        live: {
          initial: "perspective",
          on: {
            GO_BACKSTAGE: {
              target: "backstage",
            },
          },
          states: {
            perspective: {
              entry: "live_action",
            },
          },
        },
        backstage: {
          entry: "backstage_action",
          on: {
            GO_LIVE: {
              target: "live",
            },
          },
        },
      },
    },
    {
      actions: {
        live_action: (context, event) => {
          console.log("perspective");
          mainCamera.updateProjectionMatrix();
          mainCameraHelper.update();
          activeCamera = mainCamera;
          activeHelper = mainCameraHelper;
          activeHelper.visible = false;
        },
        backstage_action: (context, event) => {
          console.log("backstage");
          activeHelper.visible = true;
          activeCamera = backstageCamera;
          activeHelper = backstageCameraHelper;
        },
      },
    }
  );
};

/*********************/
/* UTILITY FUNCTIONS */
/*********************/
function addMouseHandlers() {
  let clickMouse = new THREE.Vector2();
  let moveMouse = new THREE.Vector2();

  document.addEventListener("pointermove", (event) => {
    moveMouse.x = (event.clientX / SCREEN_WIDTH) * 2 - 1;
    moveMouse.y = -(event.clientY / SCREEN_HEIGHT) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(moveMouse, activeCamera);
    let intersects = raycaster.intersectObjects(tiles, true);

    if (intersects.length > 0) {
      //found intersections
      if (!currentTile) {
        //no current tile? use hovered object.
        currentTile = intersects[0].object;
        emit.emit(currentTile.userData.name + ".hover");
      } else if (currentTile && intersects[0] != currentTile) {
        //current tile? replace it with hovered object if different.
        emit.emit(currentTile.userData.name + ".unhover");
        currentTile = intersects[0].object;
        emit.emit(currentTile.userData.name + ".hover");
      }
    } else {
      // nothing hovered?
      emit.emit(currentTile?.userData.name + ".unhover");
      currentTile = null;
    }
  });
}

function onWindowResize() {
  var bounding_rect = window.visualViewport;
  //Removing the -20 will fix the offset issue, but adds scrollbars. TODO: Why?
  SCREEN_WIDTH = bounding_rect.width - 20;
  SCREEN_HEIGHT = bounding_rect.height - 20;
  //SCREEN_WIDTH = window.innerWidth;
  //SCREEN_HEIGHT = window.innerHeight;
  aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  activeCamera.aspect = 1 * aspect;
  activeCamera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  update();
  clockDelta += clock.getDelta();

  if (clockDelta > framerate) {
    // The draw or time dependent code are here
    render();

    clockDelta = clockDelta % framerate;
  }

  stats.update();
}

function render() {
  //const r = Date.now() * 0.0005;

  //Wibble wobble camera thing
  /*theta += delta;
  activeCamera.position.x = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.position.y = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.position.z = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.lookAt(focalPoint.position);
  if (theta > 5) {
    delta = -delta;
  }*/

  theta += delta;
  //activeCamera.rotation.x = Math.sin(THREE.MathUtils.degToRad(theta));
  //activeCamera.rotation.z = activeCamera.rotation.z + 0.01;

  
  

  //render from current activeCamera
  renderer.clear();
  renderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.render(scene, activeCamera);
}

function createStarScape() {
  //
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < 5000; i++) {
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x888888 })
  );
  scene.add(particles);
}

function transform(object, target, duration) {
  let distance = object.position.distanceTo(target.position);

  new Tween(object.position)
    .to(
      { x: target.position.x, y: target.position.y, z: target.position.z },
      duration
    )
    .easing(Easing.Elastic.Out)
    .start();

  new Tween(object.rotation)
    .to(
      { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
      duration
    )
    .easing(Easing.Exponential.InOut)
    .start();

  new Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start();
}

function onKeyDown(event) {
  switch (event.keyCode) {
    case 80 /*P*/:
      console.log("go_perspective");
      mainCameraService.send({ type: "GO_PERSPECTIVE" });
      break;
    case 76 /*L*/:
      console.log("go_live");
      mainCameraService.send({ type: "GO_LIVE" });
      break;
    case 75 /*K*/:
      console.log("go_backstage");
      mainCameraService.send({ type: "GO_BACKSTAGE" });
      break;
    case 79 /*O*/:
      console.log("sending SWAP");
      blockService.send({ type: "SWAP" });
      break;
    case 70 /*F*/:
      console.log("sending SWAP");
      blockService.send({ type: "SWAP" });
      break;
    case 78 /*N*/:
      console.log("sending PRESENT");
      // blockServices[0].send({
      //   type: "PRESENT",
      //   event: {
      //     present_to: {
      //       position: {
      //         x: activeCamera.position.x,
      //         y: activeCamera.position.y,
      //         z: activeCamera.position.z - 200,
      //       },
      //     },
      //   },
      // });
      boardService.send({ type: "PRESENT_NEXT" });
      break;
    case 67 /*C*/:
      console.log("sending CLAIM_CURRENT");
      boardService.send({ type: "CLAIM_CURRENT" });
      break;
  }
}

function doTimer(services, doLog, label) {
  interval = 400;

  let t1 = new timer(
    () => {
      services.map((s) => {
        s.send("SWAP");
      });
    },
    interval,
    (now, expected, drift, interval) => {
      // console.log("now", now);
      // console.log("drift", drift);
      // console.log("expected", expected);
      // console.log("interval", interval);
    },
    doLog,

    (logLabel, now, expected, drift, interval, lastInterval) => {
      if (drift > 20) {
        // console.log("logLabel", logLabel);
        // console.log("now", now / 1000);
        // console.log("expected", expected);
        // console.log("drift", drift);
        // console.log("lastInterval", lastInterval);
      }
    },
    label
  );

  t1.start();
}

function updateCamera() {
  mainCamera.updateProjectionMatrix();
}

class MinMaxGUIHelper {
  constructor(obj, minProp, maxProp, minDif) {
    this.obj = obj;
    this.minProp = minProp;
    this.maxProp = maxProp;
    this.minDif = minDif;
  }
  get min() {
    return this.obj[this.minProp];
  }
  set min(v) {
    this.obj[this.minProp] = v;
    this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
  }
  get max() {
    return this.obj[this.maxProp];
  }
  set max(v) {
    this.obj[this.maxProp] = v;
    this.min = this.min; // this will call the min setter
  }
}

//Start the show
init();
animate();
