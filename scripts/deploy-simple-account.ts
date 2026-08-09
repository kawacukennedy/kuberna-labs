import 'dotenv/config';
import { createPublicClient, createWalletClient, http, parseEther, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const FACTORY: Address = '0x9406Cc6185a346906296840746125a0E44976454';
const SALT = 0n;

const abi = [
  {
    name: 'createAccount',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'salt', type: 'uint256' },
    ],
    outputs: [{ name: 'ret', type: 'address' }],
  },
  {
    name: 'getAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'salt', type: 'uint256' },
    ],
    outputs: [{ name: 'ret', type: 'address' }],
  },
] as const;

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('PRIVATE_KEY not set');
  const owner = privateKeyToAccount(pk as `0x${string}`);
  const rpc = process.env.BASE_SEPOLIA_RPC_URL ?? 'https://sepolia.base.org';

  const publicClient = createPublicClient({ transport: http(rpc), chain: baseSepolia });
  const walletClient = createWalletClient({ transport: http(rpc), chain: baseSepolia });

  const predicted = (await publicClient.readContract({
    address: FACTORY,
    abi,
    functionName: 'getAddress',
    args: [owner.address, SALT],
  })) as Address;
  console.log('owner:', owner.address);
  console.log('predicted:', predicted);

  const code = await publicClient.getCode({ address: predicted });
  if (code && code.length > 2) {
    console.log('account already deployed at', predicted);
    return predicted;
  }

  const hash = await walletClient.writeContract({
    address: FACTORY,
    abi,
    functionName: 'createAccount',
    args: [owner.address, SALT],
    account: owner,
    chain: baseSepolia,
  });
  console.log('tx:', hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('status:', receipt.status);
  if (receipt.status === 'success') {
    const created = (await publicClient.readContract({
      address: FACTORY,
      abi,
      functionName: 'getAddress',
      args: [owner.address, SALT],
    })) as Address;
    console.log('created account:', created);
    return created;
  }
  throw new Error('deployment failed');
}

main()
  .then((addr) => {
    if (addr) console.log('ACCOUNT=' + addr);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.shortMessage ?? e.message);
    process.exit(1);
  });
