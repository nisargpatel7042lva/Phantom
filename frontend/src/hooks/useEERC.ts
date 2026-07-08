"use client";

import { useCallback, useRef, useState } from "react";
import { ethers } from "ethers";
import { EERC } from "@avalabs/ac-eerc-sdk";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type EIP1193Provider,
} from "viem";
import { avalancheFuji } from "viem/chains";

import EncryptedERCArtifact from "@/contracts/abis/EncryptedERC.json";
import RegistrarArtifact from "@/contracts/abis/Registrar.json";

// ── Config ──────────────────────────────────────────────────────────────

const EERC_ADDRESS = process.env.NEXT_PUBLIC_EERC_ADDRESS as
  | `0x${string}`
  | undefined;
const REGISTRAR_ADDRESS = process.env.NEXT_PUBLIC_REGISTRAR_ADDRESS as
  | `0x${string}`
  | undefined;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as
  | `0x${string}`
  | undefined;
const RPC_URL =
  process.env.NEXT_PUBLIC_FUJI_RPC_URL ??
  "https://api.avax-test.network/ext/bc/C/rpc";

const USDC_DECIMALS = 6;
// Fallback only: the real value is always read from EncryptedERC.decimals().
const FALLBACK_EERC_DECIMALS = 2n;

const ENCRYPTED_ERC_ABI = EncryptedERCArtifact.abi;
const REGISTRAR_ABI = RegistrarArtifact.abi;

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// Proof circuits generated client-side via snarkjs. Only register/transfer/
// withdraw are wired up because PHANTOM never mints or burns directly
// (mint/burn are standalone-only operations, unused in converter mode).
const CIRCUIT_URLS = {
  register: {
    wasm: "/circuits/register/RegistrationCircuit.wasm",
    zkey: "/circuits/register/RegistrationCircuit.groth16.zkey",
  },
  transfer: {
    wasm: "/circuits/transfer/TransferCircuit.wasm",
    zkey: "/circuits/transfer/TransferCircuit.groth16.zkey",
  },
  withdraw: {
    wasm: "/circuits/withdraw/WithdrawCircuit.wasm",
    zkey: "/circuits/withdraw/WithdrawCircuit.groth16.zkey",
  },
  mint: { wasm: "", zkey: "" },
  burn: { wasm: "", zkey: "" },
};

// The SDK only calls proveFunc when snarkjsMode is disabled; PHANTOM always
// proves client-side via the circuit URLs above, so this is never invoked.
type ProveFunction = (
  data: string,
  proofType: "REGISTER" | "MINT" | "WITHDRAW" | "TRANSFER",
) => Promise<{ proof: string[]; publicInputs: string[] }>;

const unsupportedProveFunc: ProveFunction = async () => {
  throw new Error(
    "Remote proof generation is not configured; PHANTOM proves client-side via snarkjs.",
  );
};

const STORAGE_PREFIX = "phantom:eerc:decryptionKey:";

export interface UseEERCState {
  isRegistered: boolean;
  privateBalance: string;
  publicBalance: string;
  isLoading: boolean;
  error: string | null;
}

function getContractAddresses(): {
  eercAddress: `0x${string}`;
  registrarAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
} {
  if (!EERC_ADDRESS || !REGISTRAR_ADDRESS || !USDC_ADDRESS) {
    throw new Error(
      "Missing eERC contract configuration. Check NEXT_PUBLIC_EERC_ADDRESS, NEXT_PUBLIC_REGISTRAR_ADDRESS, and NEXT_PUBLIC_USDC_ADDRESS in .env.",
    );
  }
  return {
    eercAddress: EERC_ADDRESS,
    registrarAddress: REGISTRAR_ADDRESS,
    usdcAddress: USDC_ADDRESS,
  };
}

function getInjectedProvider(): EIP1193Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "No injected wallet found. Please install a wallet like MetaMask.",
    );
  }
  return window.ethereum;
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

// ── Encrypted localStorage cache for the derived eERC decryption key ──────
// The key is deterministically derivable by re-signing a fixed message with
// the wallet, so caching it here only saves the user a repeat signature
// prompt — it isn't the sole copy of the secret.

function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveStorageKey(address: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(address.toLowerCase()),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("phantom-eerc-local-storage"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function storeDecryptionKey(
  address: string,
  decryptionKey: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  const key = await deriveStorageKey(address);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(decryptionKey),
  );
  window.localStorage.setItem(
    STORAGE_PREFIX + address.toLowerCase(),
    JSON.stringify({ iv: bufToBase64(iv), data: bufToBase64(ciphertext) }),
  );
}

async function loadDecryptionKey(address: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(
    STORAGE_PREFIX + address.toLowerCase(),
  );
  if (!raw) return null;
  try {
    const { iv, data } = JSON.parse(raw) as { iv: string; data: string };
    const key = await deriveStorageKey(address);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuf(iv) as BufferSource },
      key,
      base64ToBuf(data) as BufferSource,
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    // Corrupt/unreadable cache entry — treat as absent, caller regenerates.
    return null;
  }
}

// ── viem bridge ─────────────────────────────────────────────────────────
// @avalabs/ac-eerc-sdk is built on viem/wagmi. PHANTOM is an ethers.js app,
// so we bridge from the wallet's injected EIP-1193 provider (the same one
// ethers.BrowserProvider wraps) into a viem PublicClient/WalletClient pair
// purely to satisfy the SDK's constructor.

function createViemClients(address: string) {
  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    chain: avalancheFuji,
    transport: custom(getInjectedProvider()),
    account: address as `0x${string}`,
  });
  return { publicClient, walletClient };
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useEERC() {
  const [state, setState] = useState<UseEERCState>({
    isRegistered: false,
    privateBalance: "0.00",
    publicBalance: "0.00",
    isLoading: false,
    error: null,
  });

  // One EERC instance per wallet address for the lifetime of this hook.
  const eercCache = useRef<Map<string, EERC>>(new Map());

  const setLoading = (isLoading: boolean) =>
    setState((s) => ({ ...s, isLoading }));
  const setError = (error: string | null) =>
    setState((s) => ({ ...s, error }));

  const getEncryptedERCContract = useCallback(
    (signerOrProvider: ethers.JsonRpcSigner | ethers.Provider) => {
      const { eercAddress } = getContractAddresses();
      return new ethers.Contract(
        eercAddress,
        ENCRYPTED_ERC_ABI,
        signerOrProvider,
      );
    },
    [],
  );

  const getRegistrarContract = useCallback(
    (signerOrProvider: ethers.JsonRpcSigner | ethers.Provider) => {
      const { registrarAddress } = getContractAddresses();
      return new ethers.Contract(
        registrarAddress,
        REGISTRAR_ABI,
        signerOrProvider,
      );
    },
    [],
  );

  const getUsdcContract = useCallback(
    (signerOrProvider: ethers.JsonRpcSigner | ethers.Provider) => {
      const { usdcAddress } = getContractAddresses();
      return new ethers.Contract(usdcAddress, ERC20_ABI, signerOrProvider);
    },
    [],
  );

  const getEercInstance = useCallback(
    async (signer: ethers.JsonRpcSigner): Promise<EERC> => {
      const { eercAddress, registrarAddress } = getContractAddresses();
      const address = (await signer.getAddress()).toLowerCase();

      const cached = eercCache.current.get(address);
      if (cached) return cached;

      const { publicClient, walletClient } = createViemClients(address);
      const existingKey = await loadDecryptionKey(address);

      // viem's client types here don't line up 1:1 with the wagmi-derived
      // PublicClient/WalletClient types the SDK declares (peer-dep version
      // friction), but wagmi v1's clients ARE viem clients at runtime, so
      // this is a type-only escape hatch, not a behavioral one.
      const eerc = new EERC(
        publicClient as never,
        walletClient as never,
        eercAddress,
        registrarAddress,
        true, // isConverter — PHANTOM only ever runs in converter mode
        unsupportedProveFunc,
        CIRCUIT_URLS,
        existingKey ?? undefined,
      );

      eercCache.current.set(address, eerc);
      return eerc;
    },
    [],
  );

  /**
   * 6. Queries the Registrar contract directly for registration status.
   */
  const checkIfRegistered = useCallback(
    async (address: string): Promise<boolean> => {
      try {
        getContractAddresses();
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const registrar = getRegistrarContract(provider);
        const registered: boolean = await registrar.isUserRegistered(address);
        return registered;
      } catch (err) {
        setError(describeError(err, "Failed to check registration status."));
        return false;
      }
    },
    [getRegistrarContract],
  );

  /**
   * 1. Creates the eERC key pair, registers the public key on-chain via the
   *    Registrar contract, and caches the derived decryption key (encrypted)
   *    in localStorage.
   */
  const registerUser = useCallback(
    async (signer: ethers.JsonRpcSigner): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        getContractAddresses();
        const address = await signer.getAddress();

        const alreadyRegistered = await checkIfRegistered(address);
        if (alreadyRegistered) {
          setState((s) => ({ ...s, isRegistered: true }));
          return true;
        }

        const eerc = await getEercInstance(signer);
        const { key } = await eerc.register();
        await storeDecryptionKey(address.toLowerCase(), key);

        setState((s) => ({ ...s, isRegistered: true }));
        return true;
      } catch (err) {
        setError(describeError(err, "Failed to register user."));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getEercInstance, checkIfRegistered],
  );

  /**
   * Fetches the caller's plain USDC balance (not encrypted).
   */
  const getPublicBalance = useCallback(
    async (signer: ethers.JsonRpcSigner): Promise<string> => {
      try {
        getContractAddresses();
        const address = await signer.getAddress();
        const usdc = getUsdcContract(signer.provider);
        const balance: bigint = await usdc.balanceOf(address);
        const formatted = ethers.formatUnits(balance, USDC_DECIMALS);
        setState((s) => ({ ...s, publicBalance: formatted }));
        return formatted;
      } catch (err) {
        setError(describeError(err, "Failed to fetch public USDC balance."));
        return "0.00";
      }
    },
    [getUsdcContract],
  );

  /**
   * 2. Fetches the encrypted balance from EncryptedERC and decrypts it
   *    client-side using the user's derived private key.
   */
  const getPrivateBalance = useCallback(
    async (signer: ethers.JsonRpcSigner): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const { usdcAddress } = getContractAddresses();
        const address = await signer.getAddress();
        const eerc = await getEercInstance(signer);

        if (!eerc.isDecryptionKeySet) {
          const key = await eerc.generateDecryptionKey();
          await storeDecryptionKey(address.toLowerCase(), key);
        }

        const encryptedERC = getEncryptedERCContract(signer);

        const tokenId: bigint = await encryptedERC.tokenIds(usdcAddress);
        if (tokenId === 0n) {
          // No deposit has ever been made — nothing to decrypt yet.
          setState((s) => ({ ...s, privateBalance: "0.00" }));
          return "0.00";
        }

        const [eGCT, , amountPCTs, balancePCT] = await encryptedERC.balanceOf(
          address,
          tokenId,
        );
        const eercDecimals: bigint = await encryptedERC
          .decimals()
          .catch(() => FALLBACK_EERC_DECIMALS);

        const decrypted = eerc.calculateTotalBalance(
          eGCT,
          amountPCTs,
          balancePCT,
        );
        const formatted = ethers.formatUnits(decrypted, eercDecimals);

        setState((s) => ({ ...s, privateBalance: formatted }));
        return formatted;
      } catch (err) {
        setError(describeError(err, "Failed to fetch private balance."));
        return "0.00";
      } finally {
        setLoading(false);
      }
    },
    [getEercInstance, getEncryptedERCContract],
  );

  /**
   * 3. Approves USDC spend for EncryptedERC, deposits it (locking plaintext
   *    USDC and minting an encrypted balance — no zk proof is required for
   *    deposit itself), then refreshes balances.
   */
  const deposit = useCallback(
    async (amount: string, signer: ethers.JsonRpcSigner): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const { eercAddress, usdcAddress } = getContractAddresses();
        const address = await signer.getAddress();
        const amountUnits = ethers.parseUnits(amount, USDC_DECIMALS);
        if (amountUnits <= 0n) {
          throw new Error("Deposit amount must be greater than 0.");
        }

        const usdc = getUsdcContract(signer);
        const encryptedERC = getEncryptedERCContract(signer);

        const allowance: bigint = await usdc.allowance(address, eercAddress);
        if (allowance < amountUnits) {
          const approveTx = await usdc.approve(eercAddress, amountUnits);
          await approveTx.wait();
        }

        const eerc = await getEercInstance(signer);
        const eercDecimals: bigint = await encryptedERC
          .decimals()
          .catch(() => FALLBACK_EERC_DECIMALS);

        const { transactionHash } = await eerc.deposit(
          amountUnits,
          usdcAddress,
          eercDecimals,
        );

        await signer.provider.waitForTransaction(transactionHash);
        await Promise.all([getPrivateBalance(signer), getPublicBalance(signer)]);

        return transactionHash;
      } catch (err) {
        setError(describeError(err, "Deposit failed."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getEercInstance, getEncryptedERCContract, getUsdcContract, getPrivateBalance, getPublicBalance],
  );

  /**
   * 4. Fetches the recipient's public key from the Registrar, generates a
   *    transfer proof client-side, and submits an encrypted transfer. The
   *    amount is never visible on-chain.
   */
  const privateTransfer = useCallback(
    async (
      toAddress: string,
      amount: string,
      signer: ethers.JsonRpcSigner,
    ): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const { usdcAddress } = getContractAddresses();
        if (!ethers.isAddress(toAddress)) {
          throw new Error("Invalid recipient address.");
        }

        const eerc = await getEercInstance(signer);
        if (!eerc.isDecryptionKeySet) {
          throw new Error(
            "Register (or unlock your private key) before transferring.",
          );
        }

        const recipientPublicKey = await eerc.fetchPublicKey(toAddress);
        if (recipientPublicKey[0] === 0n && recipientPublicKey[1] === 0n) {
          throw new Error("Recipient is not registered for private transfers.");
        }

        const encryptedERC = getEncryptedERCContract(signer);
        const address = await signer.getAddress();

        const tokenId: bigint = await encryptedERC.tokenIds(usdcAddress);
        if (tokenId === 0n) {
          throw new Error("Token not registered in EncryptedERC yet — deposit first.");
        }

        const [eGCT, , amountPCTs, balancePCT] = await encryptedERC.balanceOf(
          address,
          tokenId,
        );
        const decryptedBalance = eerc.calculateTotalBalance(
          eGCT,
          amountPCTs,
          balancePCT,
        );

        const eercDecimals: bigint = await encryptedERC
          .decimals()
          .catch(() => FALLBACK_EERC_DECIMALS);
        const amountUnits = ethers.parseUnits(amount, eercDecimals);

        const encryptedBalance: bigint[] = [
          eGCT.c1.x,
          eGCT.c1.y,
          eGCT.c2.x,
          eGCT.c2.y,
        ].map((v: bigint) => BigInt(v));

        const auditorKey = await encryptedERC.auditorPublicKey();
        const auditorPublicKey: bigint[] = [
          BigInt(auditorKey[0]),
          BigInt(auditorKey[1]),
        ];

        const { transactionHash } = await eerc.transfer(
          toAddress,
          amountUnits,
          encryptedBalance,
          decryptedBalance,
          auditorPublicKey,
          usdcAddress,
        );

        await signer.provider.waitForTransaction(transactionHash);
        await getPrivateBalance(signer);

        return transactionHash;
      } catch (err) {
        setError(describeError(err, "Private transfer failed."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getEercInstance, getEncryptedERCContract, getPrivateBalance],
  );

  /**
   * 5. Generates a withdrawal proof, burns the encrypted balance, and
   *    returns plain USDC to the caller's wallet.
   */
  const withdraw = useCallback(
    async (amount: string, signer: ethers.JsonRpcSigner): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const { usdcAddress } = getContractAddresses();
        const eerc = await getEercInstance(signer);
        if (!eerc.isDecryptionKeySet) {
          throw new Error(
            "Register (or unlock your private key) before withdrawing.",
          );
        }

        const encryptedERC = getEncryptedERCContract(signer);
        const address = await signer.getAddress();

        const tokenId: bigint = await encryptedERC.tokenIds(usdcAddress);
        if (tokenId === 0n) {
          throw new Error("Token not registered in EncryptedERC yet — deposit first.");
        }

        const [eGCT, , amountPCTs, balancePCT] = await encryptedERC.balanceOf(
          address,
          tokenId,
        );
        const decryptedBalance = eerc.calculateTotalBalance(
          eGCT,
          amountPCTs,
          balancePCT,
        );

        const eercDecimals: bigint = await encryptedERC
          .decimals()
          .catch(() => FALLBACK_EERC_DECIMALS);
        const amountUnits = ethers.parseUnits(amount, eercDecimals);

        const encryptedBalance: bigint[] = [
          eGCT.c1.x,
          eGCT.c1.y,
          eGCT.c2.x,
          eGCT.c2.y,
        ].map((v: bigint) => BigInt(v));

        const auditorKey = await encryptedERC.auditorPublicKey();
        const auditorPublicKey: bigint[] = [
          BigInt(auditorKey[0]),
          BigInt(auditorKey[1]),
        ];

        const { transactionHash } = await eerc.withdraw(
          amountUnits,
          encryptedBalance,
          decryptedBalance,
          auditorPublicKey,
          usdcAddress,
        );

        await signer.provider.waitForTransaction(transactionHash);
        await Promise.all([getPrivateBalance(signer), getPublicBalance(signer)]);

        return transactionHash;
      } catch (err) {
        setError(describeError(err, "Withdraw failed."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getEercInstance, getEncryptedERCContract, getPrivateBalance, getPublicBalance],
  );

  return {
    // state
    isRegistered: state.isRegistered,
    privateBalance: state.privateBalance,
    publicBalance: state.publicBalance,
    isLoading: state.isLoading,
    error: state.error,

    // functions
    registerUser,
    getPrivateBalance,
    getPublicBalance,
    deposit,
    privateTransfer,
    withdraw,
    checkIfRegistered,
  };
}
