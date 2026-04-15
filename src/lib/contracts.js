/**
 * contracts.js
 *
 * On-chain contract addresses and ABIs for the Four.meme token launch
 * system on BSC Mainnet.
 *
 * TokenManager2 — handles bonding curve token creation and launch fees
 * Helper3       — read-only helper for token info and buy estimation
 * NFT 8004      — EIP-8004 agent NFT registration
 */

// BSC Mainnet contract addresses
export const TOKEN_MANAGER2_ADDRESS = '0x5c952063c7fc8610FFDB798152D69F0B9550762b'
export const HELPER3_ADDRESS        = '0xF251F83e40a78868FcfA3FA4599Dad6494E46034'
export const NFT_8004_ADDRESS       = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'

// TokenManager2 ABI — used for creating tokens and reading launch fee
export const TOKEN_MANAGER2_ABI = [
  {
    name: 'createToken',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'args', type: 'bytes' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: '_launchFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: '_tradingFeeRate',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
]

// Helper3 ABI — read-only queries for token info and buy simulation
export const HELPER3_ABI = [
  {
    name: 'getTokenInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'version',       type: 'uint256' },
      { name: 'tokenManager',  type: 'address' },
      { name: 'quote',         type: 'address' },
      { name: 'lastPrice',     type: 'uint256' },
      { name: 'tradingFeeRate',type: 'uint256' },
      { name: 'minTradingFee', type: 'uint256' },
      { name: 'launchTime',    type: 'uint256' },
      { name: 'offers',        type: 'uint256' },
      { name: 'maxOffers',     type: 'uint256' },
      { name: 'funds',         type: 'uint256' },
      { name: 'maxFunds',      type: 'uint256' },
      { name: 'liquidityAdded',type: 'bool' },
    ],
  },
  {
    name: 'tryBuy',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token',  type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'funds',  type: 'uint256' },
    ],
    outputs: [
      { name: 'tokenManager',    type: 'address' },
      { name: 'quote',           type: 'address' },
      { name: 'estimatedAmount', type: 'uint256' },
      { name: 'estimatedCost',   type: 'uint256' },
      { name: 'estimatedFee',    type: 'uint256' },
      { name: 'amountMsgValue',  type: 'uint256' },
      { name: 'amountApproval',  type: 'uint256' },
      { name: 'amountFunds',     type: 'uint256' },
    ],
  },
]

// EIP-8004 NFT ABI — register AI agents as on-chain NFTs
export const NFT_8004_ABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
]

/**
 * Builds a `data:` URI for EIP-8004 agent registration.
 * Encodes the agent metadata as a base64 JSON payload conforming
 * to the EIP-8004 registration schema.
 */
export function buildAgentURI(name, imageUrl = '', description = '') {
  const payload = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name,
    description: description || 'MemeAgent Studio — AI-powered meme token launcher',
    image: imageUrl,
    active: true,
    supportedTrust: [''],
  }
  return `data:application/json;base64,${btoa(JSON.stringify(payload))}`
}
