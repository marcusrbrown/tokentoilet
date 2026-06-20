> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-010: NFT Receipt System

## Summary

This RFC defines the NFT receipt system for Token Toilet, automatically minting ERC-721 "Proof of Disposal" tokens as commemorative receipts when users successfully flush their unwanted tokens. The implementation includes generative visual designs, IPFS-hosted metadata via Pinata, and a gallery view for users to browse their collection.

## Features Addressed

| Feature ID | Feature Name | Priority | Phase |
|------------|--------------|----------|-------|
| F6.1 | Automatic NFT Receipt Minting | Should Have | 4 |
| F6.2 | Receipt Metadata | Should Have | 4 |
| F6.3 | Receipt Visual Design | Should Have | 4 |
| F6.4 | Receipt Gallery | Should Have | 4 |

## Dependencies

### Requires
- RFC-007: Token Disposal Flow (minting triggered by disposal completion)
- RFC-009: Charity Integration (donation info included in receipt)
- RFC-006: Transaction Infrastructure (receipt minting uses transaction queue)

### Required By
- None (terminal feature)

## Technical Specification

### 1. Smart Contract Interface

The ProofOfDisposal ERC-721 contract:

```solidity
// contracts/ProofOfDisposal.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProofOfDisposal is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from token ID to disposal data
    mapping(uint256 => DisposalData) public disposalRecords;
    
    struct DisposalData {
        address disposer;
        uint256 tokenCount;
        uint256 totalValueUsd;
        uint256 timestamp;
        bytes32 disposalTxHash;
        bytes32 donationId;
    }
    
    event ReceiptMinted(
        uint256 indexed tokenId,
        address indexed disposer,
        uint256 tokenCount,
        uint256 totalValueUsd,
        bytes32 disposalTxHash
    );
    
    constructor() ERC721("Proof of Disposal", "FLUSH") Ownable(msg.sender) {}
    
    function mintReceipt(
        address to,
        string memory uri,
        uint256 tokenCount,
        uint256 totalValueUsd,
        bytes32 disposalTxHash,
        bytes32 donationId
    ) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        disposalRecords[tokenId] = DisposalData({
            disposer: to,
            tokenCount: tokenCount,
            totalValueUsd: totalValueUsd,
            timestamp: block.timestamp,
            disposalTxHash: disposalTxHash,
            donationId: donationId
        });
        
        emit ReceiptMinted(tokenId, to, tokenCount, totalValueUsd, disposalTxHash);
        
        return tokenId;
    }
    
    function getDisposalData(uint256 tokenId) external view returns (DisposalData memory) {
        require(_exists(tokenId), "Token does not exist");
        return disposalRecords[tokenId];
    }
    
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
```

### 2. TypeScript Contract Interface

```typescript
// lib/web3/proof-of-disposal.ts
import { type Address, type Hash, encodeFunctionData, parseAbi } from 'viem'
import { getPublicClient, getWalletClient } from './config'

const PROOF_OF_DISPOSAL_ABI = parseAbi([
  'function mintReceipt(address to, string uri, uint256 tokenCount, uint256 totalValueUsd, bytes32 disposalTxHash, bytes32 donationId) returns (uint256)',
  'function getDisposalData(uint256 tokenId) view returns ((address disposer, uint256 tokenCount, uint256 totalValueUsd, uint256 timestamp, bytes32 disposalTxHash, bytes32 donationId))',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'event ReceiptMinted(uint256 indexed tokenId, address indexed disposer, uint256 tokenCount, uint256 totalValueUsd, bytes32 disposalTxHash)',
])

export interface DisposalData {
  disposer: Address
  tokenCount: bigint
  totalValueUsd: bigint
  timestamp: bigint
  disposalTxHash: `0x${string}`
  donationId: `0x${string}`
}

export interface MintReceiptParams {
  to: Address
  metadataUri: string
  tokenCount: number
  totalValueUsd: number // In cents (e.g., 1050 = $10.50)
  disposalTxHash: Hash
  donationId?: string
}

const getContractAddress = (): Address => {
  const address = process.env.NEXT_PUBLIC_PROOF_OF_DISPOSAL_ADDRESS
  if (!address) {
    throw new Error('NEXT_PUBLIC_PROOF_OF_DISPOSAL_ADDRESS not configured')
  }
  return address as Address
}

export async function mintReceipt(params: MintReceiptParams): Promise<{
  hash: Hash
  tokenId: bigint
}> {
  const walletClient = await getWalletClient()
  const publicClient = getPublicClient()
  const contractAddress = getContractAddress()
  
  // Convert donation ID to bytes32 or use zero bytes
  const donationIdBytes = params.donationId
    ? (`0x${Buffer.from(params.donationId).toString('hex').padEnd(64, '0')}` as `0x${string}`)
    : ('0x' + '0'.repeat(64)) as `0x${string}`
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: PROOF_OF_DISPOSAL_ABI,
    functionName: 'mintReceipt',
    args: [
      params.to,
      params.metadataUri,
      BigInt(params.tokenCount),
      BigInt(params.totalValueUsd),
      params.disposalTxHash,
      donationIdBytes,
    ],
  })
  
  // Wait for transaction and get token ID from event
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  // Parse ReceiptMinted event to get token ID
  const mintEvent = receipt.logs.find(log => {
    try {
      // Check if this is our event
      return log.address.toLowerCase() === contractAddress.toLowerCase()
    } catch {
      return false
    }
  })
  
  // Extract token ID from event (first indexed param after event signature)
  const tokenId = mintEvent?.topics[1] 
    ? BigInt(mintEvent.topics[1]) 
    : BigInt(0)
  
  return { hash, tokenId }
}

export async function getDisposalData(tokenId: bigint): Promise<DisposalData> {
  const publicClient = getPublicClient()
  const contractAddress = getContractAddress()
  
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: PROOF_OF_DISPOSAL_ABI,
    functionName: 'getDisposalData',
    args: [tokenId],
  })
  
  return result as DisposalData
}

export async function getTokenURI(tokenId: bigint): Promise<string> {
  const publicClient = getPublicClient()
  const contractAddress = getContractAddress()
  
  return publicClient.readContract({
    address: contractAddress,
    abi: PROOF_OF_DISPOSAL_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  }) as Promise<string>
}

export async function getUserReceipts(owner: Address): Promise<bigint[]> {
  const publicClient = getPublicClient()
  const contractAddress = getContractAddress()
  
  const balance = await publicClient.readContract({
    address: contractAddress,
    abi: PROOF_OF_DISPOSAL_ABI,
    functionName: 'balanceOf',
    args: [owner],
  }) as bigint
  
  const tokenIds: bigint[] = []
  
  for (let i = 0n; i < balance; i++) {
    const tokenId = await publicClient.readContract({
      address: contractAddress,
      abi: PROOF_OF_DISPOSAL_ABI,
      functionName: 'tokenOfOwnerByIndex',
      args: [owner, i],
    }) as bigint
    tokenIds.push(tokenId)
  }
  
  return tokenIds
}

export async function estimateMintGas(params: MintReceiptParams): Promise<bigint> {
  const publicClient = getPublicClient()
  const contractAddress = getContractAddress()
  
  const donationIdBytes = params.donationId
    ? (`0x${Buffer.from(params.donationId).toString('hex').padEnd(64, '0')}` as `0x${string}`)
    : ('0x' + '0'.repeat(64)) as `0x${string}`
  
  return publicClient.estimateContractGas({
    address: contractAddress,
    abi: PROOF_OF_DISPOSAL_ABI,
    functionName: 'mintReceipt',
    args: [
      params.to,
      params.metadataUri,
      BigInt(params.tokenCount),
      BigInt(params.totalValueUsd),
      params.disposalTxHash,
      donationIdBytes,
    ],
    account: params.to,
  })
}
```

### 3. IPFS Metadata with Pinata

```typescript
// lib/nft/pinata-client.ts
import { z } from '@/lib/z'

const PinataConfigSchema = z.object({
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  gateway: z.string().url().default('https://gateway.pinata.cloud'),
})

type PinataConfig = z.infer<typeof PinataConfigSchema>

export interface NFTMetadata {
  name: string
  description: string
  image: string // IPFS URI
  external_url?: string
  attributes: Array<{
    trait_type: string
    value: string | number
    display_type?: 'number' | 'date' | 'boost_percentage'
  }>
  properties: {
    disposalTxHash: string
    tokenCount: number
    totalValueUsd: number
    disposedTokens: Array<{
      symbol: string
      address: string
      amount: string
    }>
    charityName?: string
    donationId?: string
  }
}

export class PinataClient {
  private config: PinataConfig
  
  constructor() {
    this.config = PinataConfigSchema.parse({
      apiKey: process.env.PINATA_API_KEY,
      apiSecret: process.env.PINATA_API_SECRET,
      gateway: process.env.PINATA_GATEWAY,
    })
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`https://api.pinata.cloud${endpoint}`, {
      ...options,
      headers: {
        pinata_api_key: this.config.apiKey,
        pinata_secret_api_key: this.config.apiSecret,
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new PinataError(
        error.message || `Pinata request failed: ${response.status}`,
        response.status
      )
    }
    
    return response.json()
  }
  
  async pinJSON(data: NFTMetadata, name: string): Promise<string> {
    const result = await this.request<{ IpfsHash: string }>('/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name,
          keyvalues: {
            type: 'proof-of-disposal',
            version: '1',
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    })
    
    return `ipfs://${result.IpfsHash}`
  }
  
  async pinFile(file: Blob, name: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', file, name)
    formData.append('pinataMetadata', JSON.stringify({
      name,
      keyvalues: {
        type: 'proof-of-disposal-image',
        version: '1',
      },
    }))
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1,
    }))
    
    const result = await this.request<{ IpfsHash: string }>('/pinning/pinFileToIPFS', {
      method: 'POST',
      body: formData,
    })
    
    return `ipfs://${result.IpfsHash}`
  }
  
  getGatewayUrl(ipfsUri: string): string {
    const hash = ipfsUri.replace('ipfs://', '')
    return `${this.config.gateway}/ipfs/${hash}`
  }
}

export class PinataError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'PinataError'
  }
}

// Singleton
let client: PinataClient | null = null

export function getPinataClient(): PinataClient {
  if (!client) {
    client = new PinataClient()
  }
  return client
}
```

### 4. Generative Receipt Image

Server-side image generation using Canvas:

```typescript
// lib/nft/receipt-image-generator.ts
import { createCanvas, loadImage, registerFont } from 'canvas'

export interface ReceiptImageParams {
  tokenCount: number
  totalValueUsd: number
  disposedTokens: Array<{
    symbol: string
    logoUrl?: string
  }>
  charityName?: string
  timestamp: Date
  receiptNumber: number
}

export async function generateReceiptImage(
  params: ReceiptImageParams
): Promise<Buffer> {
  const width = 800
  const height = 1000
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  
  // Background gradient (violet theme)
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#1a1625')
  gradient.addColorStop(0.5, '#2d1f4e')
  gradient.addColorStop(1, '#1a1625')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  // Decorative border
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, width - 40, height - 40)
  
  // Inner glow effect
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, width - 60, height - 60)
  
  // Header
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('PROOF OF DISPOSAL', width / 2, 100)
  
  // Toilet emoji
  ctx.font = '80px serif'
  ctx.fillText('🚽', width / 2, 200)
  
  // Receipt number
  ctx.fillStyle = 'rgba(139, 92, 246, 0.8)'
  ctx.font = '18px Inter, monospace'
  ctx.fillText(`Receipt #${params.receiptNumber.toString().padStart(6, '0')}`, width / 2, 250)
  
  // Divider
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(100, 280)
  ctx.lineTo(width - 100, 280)
  ctx.stroke()
  
  // Stats section
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px Inter'
  ctx.textAlign = 'left'
  
  const statsY = 340
  
  // Tokens flushed
  ctx.fillText('Tokens Flushed', 100, statsY)
  ctx.font = 'bold 48px Inter'
  ctx.fillStyle = '#8b5cf6'
  ctx.fillText(params.tokenCount.toString(), 100, statsY + 50)
  
  // Total value
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px Inter'
  ctx.textAlign = 'right'
  ctx.fillText('Total Value', width - 100, statsY)
  ctx.font = 'bold 48px Inter'
  ctx.fillStyle = '#10b981'
  const valueStr = `$${(params.totalValueUsd / 100).toFixed(2)}`
  ctx.fillText(valueStr, width - 100, statsY + 50)
  
  // Disposed tokens grid
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '18px Inter'
  ctx.fillText('Tokens Disposed', width / 2, 470)
  
  // Token symbols in a grid
  const tokensToShow = params.disposedTokens.slice(0, 12)
  const cols = 4
  const tokenSize = 60
  const startX = (width - (cols * tokenSize + (cols - 1) * 20)) / 2
  const startY = 500
  
  tokensToShow.forEach((token, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = startX + col * (tokenSize + 20)
    const y = startY + row * (tokenSize + 30)
    
    // Token circle
    ctx.beginPath()
    ctx.arc(x + tokenSize / 2, y + tokenSize / 2, tokenSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Token symbol
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Inter'
    ctx.textAlign = 'center'
    ctx.fillText(
      token.symbol.slice(0, 4),
      x + tokenSize / 2,
      y + tokenSize / 2 + 5
    )
  })
  
  if (params.disposedTokens.length > 12) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '16px Inter'
    ctx.fillText(
      `+${params.disposedTokens.length - 12} more`,
      width / 2,
      startY + 3 * (tokenSize + 30) + 20
    )
  }
  
  // Charity section (if applicable)
  if (params.charityName) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'
    ctx.fillRect(60, 760, width - 120, 80)
    
    ctx.fillStyle = '#10b981'
    ctx.font = '16px Inter'
    ctx.textAlign = 'center'
    ctx.fillText('Donated to', width / 2, 790)
    ctx.font = 'bold 24px Inter'
    ctx.fillText(params.charityName, width / 2, 820)
  }
  
  // Footer with timestamp
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '14px Inter'
  ctx.textAlign = 'center'
  ctx.fillText(
    params.timestamp.toISOString().split('T')[0],
    width / 2,
    height - 60
  )
  ctx.fillText('tokentoilet.xyz', width / 2, height - 40)
  
  return canvas.toBuffer('image/png')
}
```

### 5. NFT Minting Service

Orchestrates the minting process:

```typescript
// lib/nft/receipt-minting-service.ts
import type { Address, Hash } from 'viem'
import { getPinataClient, type NFTMetadata } from './pinata-client'
import { generateReceiptImage, type ReceiptImageParams } from './receipt-image-generator'
import { mintReceipt, estimateMintGas, type MintReceiptParams } from '@/lib/web3/proof-of-disposal'
import type { TokenInfo } from '@/lib/web3/token-metadata'

export interface MintReceiptInput {
  disposer: Address
  disposalTxHash: Hash
  disposedTokens: TokenInfo[]
  totalValueUsd: number // In cents
  charityName?: string
  donationId?: string
}

export interface MintReceiptResult {
  tokenId: bigint
  transactionHash: Hash
  metadataUri: string
  imageUri: string
}

export class ReceiptMintingService {
  private pinata = getPinataClient()
  
  async mint(input: MintReceiptInput): Promise<MintReceiptResult> {
    // 1. Generate receipt image
    const imageParams: ReceiptImageParams = {
      tokenCount: input.disposedTokens.length,
      totalValueUsd: input.totalValueUsd,
      disposedTokens: input.disposedTokens.map(t => ({
        symbol: t.symbol,
        logoUrl: t.logo,
      })),
      charityName: input.charityName,
      timestamp: new Date(),
      receiptNumber: Date.now() % 1000000, // Temp receipt number
    }
    
    const imageBuffer = await generateReceiptImage(imageParams)
    
    // 2. Upload image to IPFS
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
    const imageUri = await this.pinata.pinFile(
      imageBlob,
      `receipt-${input.disposalTxHash.slice(0, 10)}.png`
    )
    
    // 3. Create metadata
    const metadata: NFTMetadata = {
      name: `Proof of Disposal #${imageParams.receiptNumber}`,
      description: `This NFT commemorates the disposal of ${input.disposedTokens.length} unwanted tokens via Token Toilet. ${input.charityName ? `Proceeds donated to ${input.charityName}.` : ''}`,
      image: imageUri,
      external_url: `https://tokentoilet.xyz/receipt/${input.disposalTxHash}`,
      attributes: [
        {
          trait_type: 'Tokens Flushed',
          value: input.disposedTokens.length,
          display_type: 'number',
        },
        {
          trait_type: 'Total Value (USD)',
          value: input.totalValueUsd / 100,
          display_type: 'number',
        },
        {
          trait_type: 'Disposal Date',
          value: Math.floor(Date.now() / 1000),
          display_type: 'date',
        },
        ...(input.charityName ? [{
          trait_type: 'Charity',
          value: input.charityName,
        }] : []),
      ],
      properties: {
        disposalTxHash: input.disposalTxHash,
        tokenCount: input.disposedTokens.length,
        totalValueUsd: input.totalValueUsd,
        disposedTokens: input.disposedTokens.map(t => ({
          symbol: t.symbol,
          address: t.address,
          amount: t.balance?.toString() ?? '0',
        })),
        charityName: input.charityName,
        donationId: input.donationId,
      },
    }
    
    // 4. Upload metadata to IPFS
    const metadataUri = await this.pinata.pinJSON(
      metadata,
      `metadata-${input.disposalTxHash.slice(0, 10)}.json`
    )
    
    // 5. Mint NFT on-chain
    const mintParams: MintReceiptParams = {
      to: input.disposer,
      metadataUri,
      tokenCount: input.disposedTokens.length,
      totalValueUsd: input.totalValueUsd,
      disposalTxHash: input.disposalTxHash,
      donationId: input.donationId,
    }
    
    const { hash, tokenId } = await mintReceipt(mintParams)
    
    return {
      tokenId,
      transactionHash: hash,
      metadataUri,
      imageUri,
    }
  }
  
  async estimateGas(input: MintReceiptInput): Promise<{
    gasEstimate: bigint
    gasCostUsd: number
  }> {
    // Create a placeholder metadata URI for estimation
    const placeholderUri = 'ipfs://placeholder'
    
    const gasEstimate = await estimateMintGas({
      to: input.disposer,
      metadataUri: placeholderUri,
      tokenCount: input.disposedTokens.length,
      totalValueUsd: input.totalValueUsd,
      disposalTxHash: input.disposalTxHash,
      donationId: input.donationId,
    })
    
    // Estimate cost at 30 gwei (target: <$5)
    const gasPriceGwei = 30n
    const gasCostWei = gasEstimate * gasPriceGwei * 1_000_000_000n
    const ethPrice = 2000 // Approximate ETH price
    const gasCostUsd = Number(gasCostWei) / 1e18 * ethPrice
    
    return { gasEstimate, gasCostUsd }
  }
}

// Singleton
let service: ReceiptMintingService | null = null

export function getReceiptMintingService(): ReceiptMintingService {
  if (!service) {
    service = new ReceiptMintingService()
  }
  return service
}
```

### 6. React Hooks

```typescript
// hooks/use-receipt-minting.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address, Hash } from 'viem'
import type { TokenInfo } from '@/lib/web3/token-metadata'

interface MintReceiptInput {
  disposer: Address
  disposalTxHash: Hash
  disposedTokens: TokenInfo[]
  totalValueUsd: number
  charityName?: string
  donationId?: string
}

interface MintReceiptResult {
  tokenId: string
  transactionHash: string
  metadataUri: string
  imageUri: string
}

async function mintReceiptApi(input: MintReceiptInput): Promise<MintReceiptResult> {
  const response = await fetch('/api/receipts/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to mint receipt')
  }
  
  return response.json()
}

export function useReceiptMinting() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mintReceiptApi,
    onSuccess: (data, variables) => {
      // Invalidate user's receipts query
      queryClient.invalidateQueries({
        queryKey: ['receipts', variables.disposer],
      })
    },
  })
}
```

```typescript
// hooks/use-receipts.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { getUserReceipts, getDisposalData, getTokenURI } from '@/lib/web3/proof-of-disposal'
import { getPinataClient } from '@/lib/nft/pinata-client'
import type { NFTMetadata } from '@/lib/nft/pinata-client'

export interface Receipt {
  tokenId: string
  metadata: NFTMetadata
  imageUrl: string
  disposalData: {
    tokenCount: number
    totalValueUsd: number
    timestamp: Date
    disposalTxHash: string
  }
}

async function fetchReceipts(owner: Address): Promise<Receipt[]> {
  const pinata = getPinataClient()
  const tokenIds = await getUserReceipts(owner)
  
  const receipts = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const [uri, disposalData] = await Promise.all([
        getTokenURI(tokenId),
        getDisposalData(tokenId),
      ])
      
      // Fetch metadata from IPFS
      const metadataUrl = pinata.getGatewayUrl(uri)
      const metadataResponse = await fetch(metadataUrl)
      const metadata = await metadataResponse.json() as NFTMetadata
      
      return {
        tokenId: tokenId.toString(),
        metadata,
        imageUrl: pinata.getGatewayUrl(metadata.image),
        disposalData: {
          tokenCount: Number(disposalData.tokenCount),
          totalValueUsd: Number(disposalData.totalValueUsd),
          timestamp: new Date(Number(disposalData.timestamp) * 1000),
          disposalTxHash: disposalData.disposalTxHash,
        },
      }
    })
  )
  
  // Sort by timestamp descending
  return receipts.sort(
    (a, b) => b.disposalData.timestamp.getTime() - a.disposalData.timestamp.getTime()
  )
}

export function useReceipts(owner: Address | null) {
  return useQuery({
    queryKey: ['receipts', owner],
    queryFn: () => fetchReceipts(owner!),
    enabled: !!owner,
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useReceipt(tokenId: string | null) {
  return useQuery({
    queryKey: ['receipt', tokenId],
    queryFn: async () => {
      if (!tokenId) return null
      
      const pinata = getPinataClient()
      const id = BigInt(tokenId)
      
      const [uri, disposalData] = await Promise.all([
        getTokenURI(id),
        getDisposalData(id),
      ])
      
      const metadataUrl = pinata.getGatewayUrl(uri)
      const metadataResponse = await fetch(metadataUrl)
      const metadata = await metadataResponse.json() as NFTMetadata
      
      return {
        tokenId,
        metadata,
        imageUrl: pinata.getGatewayUrl(metadata.image),
        disposalData: {
          tokenCount: Number(disposalData.tokenCount),
          totalValueUsd: Number(disposalData.totalValueUsd),
          timestamp: new Date(Number(disposalData.timestamp) * 1000),
          disposalTxHash: disposalData.disposalTxHash,
        },
      } as Receipt
    },
    enabled: !!tokenId,
  })
}
```

### 7. UI Components

```typescript
// components/receipts/receipt-gallery.tsx
'use client'

import { useReceipts, type Receipt } from '@/hooks/use-receipts'
import { useWallet } from '@/hooks/use-wallet'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReceiptCard } from './receipt-card'
import { ReceiptGallerySkeleton } from '@/components/ui/skeletons/receipt-gallery-skeleton'

interface ReceiptGalleryProps {
  className?: string
  onReceiptClick?: (receipt: Receipt) => void
}

export function ReceiptGallery({ className, onReceiptClick }: ReceiptGalleryProps) {
  const { address } = useWallet()
  const { data: receipts, isLoading, error } = useReceipts(address ?? null)
  
  if (!address) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <p className="text-muted-foreground">
          Connect your wallet to view your receipts
        </p>
      </Card>
    )
  }
  
  if (isLoading) {
    return <ReceiptGallerySkeleton className={className} />
  }
  
  if (error) {
    return (
      <Card className={`p-8 text-center text-destructive ${className}`}>
        Failed to load receipts. Please try again.
      </Card>
    )
  }
  
  if (!receipts?.length) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-6xl mb-4">🚽</div>
        <p className="text-muted-foreground">
          No receipts yet. Flush some tokens to get your first Proof of Disposal!
        </p>
      </Card>
    )
  }
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Your Receipts</h2>
        <Badge variant="secondary">{receipts.length} total</Badge>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {receipts.map((receipt) => (
          <ReceiptCard
            key={receipt.tokenId}
            receipt={receipt}
            onClick={() => onReceiptClick?.(receipt)}
          />
        ))}
      </div>
    </div>
  )
}
```

```typescript
// components/receipts/receipt-card.tsx
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Receipt } from '@/hooks/use-receipts'

interface ReceiptCardProps {
  receipt: Receipt
  onClick?: () => void
}

export function ReceiptCard({ receipt, onClick }: ReceiptCardProps) {
  const { metadata, imageUrl, disposalData } = receipt
  
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 hover:shadow-lg"
      onClick={onClick}
    >
      {/* Receipt image */}
      <div className="aspect-[4/5] relative bg-muted">
        <img
          src={imageUrl}
          alt={metadata.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      {/* Receipt info */}
      <div className="p-4">
        <h3 className="font-semibold truncate">{metadata.name}</h3>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">
            {disposalData.tokenCount} tokens
          </Badge>
          <Badge variant="outline" className="text-emerald-600">
            ${(disposalData.totalValueUsd / 100).toFixed(2)}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {disposalData.timestamp.toLocaleDateString()}
        </p>
      </div>
    </Card>
  )
}
```

```typescript
// components/receipts/receipt-detail.tsx
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Receipt } from '@/hooks/use-receipts'

interface ReceiptDetailProps {
  receipt: Receipt
  onClose?: () => void
}

export function ReceiptDetail({ receipt, onClose }: ReceiptDetailProps) {
  const { metadata, imageUrl, disposalData, tokenId } = receipt
  
  const openSeaUrl = `https://opensea.io/assets/ethereum/${process.env.NEXT_PUBLIC_PROOF_OF_DISPOSAL_ADDRESS}/${tokenId}`
  const etherscanUrl = `https://etherscan.io/tx/${disposalData.disposalTxHash}`
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{metadata.name}</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
      
      {/* Image */}
      <Card className="overflow-hidden">
        <img
          src={imageUrl}
          alt={metadata.name}
          className="w-full"
        />
      </Card>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Tokens Flushed</p>
          <p className="text-2xl font-bold">{disposalData.tokenCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold text-emerald-600">
            ${(disposalData.totalValueUsd / 100).toFixed(2)}
          </p>
        </Card>
      </div>
      
      {/* Attributes */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">Attributes</h3>
        <div className="flex flex-wrap gap-2">
          {metadata.attributes.map((attr, i) => (
            <Badge key={i} variant="outline">
              {attr.trait_type}: {attr.value}
            </Badge>
          ))}
        </div>
      </Card>
      
      {/* Disposed Tokens */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">Disposed Tokens</h3>
        <div className="flex flex-wrap gap-2">
          {metadata.properties.disposedTokens.slice(0, 20).map((token, i) => (
            <Badge key={i} variant="secondary">
              {token.symbol}
            </Badge>
          ))}
          {metadata.properties.disposedTokens.length > 20 && (
            <Badge variant="outline">
              +{metadata.properties.disposedTokens.length - 20} more
            </Badge>
          )}
        </div>
      </Card>
      
      {/* Charity info */}
      {metadata.properties.charityName && (
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <p className="text-sm text-muted-foreground">Donated to</p>
          <p className="font-medium text-emerald-600">
            {metadata.properties.charityName}
          </p>
        </Card>
      )}
      
      {/* Links */}
      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <a href={openSeaUrl} target="_blank" rel="noopener noreferrer">
            View on OpenSea
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href={etherscanUrl} target="_blank" rel="noopener noreferrer">
            View Transaction
          </a>
        </Button>
      </div>
      
      {/* Metadata info */}
      <div className="text-xs text-muted-foreground">
        <p>Token ID: {tokenId}</p>
        <p>Disposal TX: {disposalData.disposalTxHash.slice(0, 10)}...</p>
        <p>Date: {disposalData.timestamp.toLocaleString()}</p>
      </div>
    </div>
  )
}
```

### 8. API Route for Minting

```typescript
// app/api/receipts/mint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from '@/lib/z'
import { getReceiptMintingService } from '@/lib/nft/receipt-minting-service'

const MintRequestSchema = z.object({
  disposer: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  disposalTxHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  disposedTokens: z.array(z.object({
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    balance: z.string().optional(),
    logo: z.string().optional(),
  })),
  totalValueUsd: z.number().int().min(0),
  charityName: z.string().optional(),
  donationId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = MintRequestSchema.parse(body)
    
    const service = getReceiptMintingService()
    const result = await service.mint({
      disposer: input.disposer as `0x${string}`,
      disposalTxHash: input.disposalTxHash as `0x${string}`,
      disposedTokens: input.disposedTokens as any,
      totalValueUsd: input.totalValueUsd,
      charityName: input.charityName,
      donationId: input.donationId,
    })
    
    return NextResponse.json({
      tokenId: result.tokenId.toString(),
      transactionHash: result.transactionHash,
      metadataUri: result.metadataUri,
      imageUri: result.imageUri,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Receipt minting failed:', error)
    return NextResponse.json(
      { error: 'Failed to mint receipt' },
      { status: 500 }
    )
  }
}
```

## File Structure

```
app/
├── api/
│   └── receipts/
│       └── mint/
│           └── route.ts          # POST /api/receipts/mint

components/
├── receipts/
│   ├── receipt-gallery.tsx       # Gallery view
│   ├── receipt-card.tsx          # Individual receipt card
│   ├── receipt-detail.tsx        # Full receipt view
│   ├── minting-status.tsx        # Minting progress indicator
│   └── index.ts
├── ui/
│   └── skeletons/
│       └── receipt-gallery-skeleton.tsx

hooks/
├── use-receipt-minting.ts        # Minting mutation
└── use-receipts.ts               # Receipt queries

lib/
├── nft/
│   ├── pinata-client.ts          # IPFS/Pinata integration
│   ├── receipt-image-generator.ts # Generative image creation
│   ├── receipt-minting-service.ts # Orchestration service
│   └── index.ts
└── web3/
    └── proof-of-disposal.ts      # Contract interface

contracts/
└── ProofOfDisposal.sol           # ERC-721 contract
```

## Environment Variables

```env
# Pinata IPFS (server-side)
PINATA_API_KEY=your_api_key
PINATA_API_SECRET=your_api_secret
PINATA_GATEWAY=https://your-gateway.mypinata.cloud

# Contract (client-side)
NEXT_PUBLIC_PROOF_OF_DISPOSAL_ADDRESS=0x...
```

## Acceptance Criteria

### F6.1 Automatic NFT Receipt Minting
- [ ] Receipt minted automatically after successful disposal
- [ ] Minting gas cost <$5 at 30 gwei
- [ ] Minting completes within 2 blocks
- [ ] Failed mints retry with exponential backoff
- [ ] User can skip minting if desired

### F6.2 Receipt Metadata
- [ ] Metadata follows ERC-721 metadata standard
- [ ] Includes disposal transaction hash
- [ ] Includes token count and value
- [ ] Includes list of disposed tokens
- [ ] Includes charity info if applicable
- [ ] Metadata pinned to IPFS via Pinata

### F6.3 Receipt Visual Design
- [ ] Generative image unique per receipt
- [ ] Displays token count prominently
- [ ] Displays total value
- [ ] Shows disposed token symbols
- [ ] Includes charity branding if donated
- [ ] Image resolution suitable for social sharing

### F6.4 Receipt Gallery
- [ ] Users can view all their receipts
- [ ] Receipts sorted by date (newest first)
- [ ] Click to view full details
- [ ] Links to OpenSea and Etherscan
- [ ] Responsive grid layout
- [ ] Loading states and error handling

## Testing Strategy

### Unit Tests
```typescript
// lib/nft/__tests__/receipt-minting-service.test.ts
describe('ReceiptMintingService', () => {
  it('generates valid metadata', async () => {
    const service = getReceiptMintingService()
    // Mock Pinata and contract
    
    const result = await service.mint({
      disposer: '0x...',
      disposalTxHash: '0x...',
      disposedTokens: mockTokens,
      totalValueUsd: 1050, // $10.50
    })
    
    expect(result.metadataUri).toMatch(/^ipfs:\/\//)
    expect(result.tokenId).toBeGreaterThan(0n)
  })
  
  it('estimates gas under $5 at 30 gwei', async () => {
    const service = getReceiptMintingService()
    
    const { gasCostUsd } = await service.estimateGas({
      disposer: '0x...',
      disposalTxHash: '0x...',
      disposedTokens: mockTokens,
      totalValueUsd: 1000,
    })
    
    expect(gasCostUsd).toBeLessThan(5)
  })
})

// lib/nft/__tests__/receipt-image-generator.test.ts
describe('generateReceiptImage', () => {
  it('generates valid PNG buffer', async () => {
    const buffer = await generateReceiptImage({
      tokenCount: 5,
      totalValueUsd: 1050,
      disposedTokens: [{ symbol: 'SHIB' }, { symbol: 'DOGE' }],
      timestamp: new Date(),
      receiptNumber: 12345,
    })
    
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    // Check PNG signature
    expect(buffer.slice(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  })
  
  it('includes charity name when provided', async () => {
    // Visual regression test with Storybook/Chromatic
  })
})
```

### Integration Tests
```typescript
// app/api/receipts/mint/__tests__/route.test.ts
describe('POST /api/receipts/mint', () => {
  it('mints receipt successfully', async () => {
    const request = new NextRequest('http://localhost/api/receipts/mint', {
      method: 'POST',
      body: JSON.stringify({
        disposer: '0x1234...',
        disposalTxHash: '0xabcd...',
        disposedTokens: mockTokens,
        totalValueUsd: 1000,
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.tokenId).toBeDefined()
    expect(data.metadataUri).toMatch(/^ipfs:\/\//)
  })
  
  it('validates request body', async () => {
    const request = new NextRequest('http://localhost/api/receipts/mint', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### Visual Tests
```typescript
// Storybook stories for visual regression
export default {
  title: 'Receipts/ReceiptCard',
  component: ReceiptCard,
}

export const Default: Story = {
  args: {
    receipt: mockReceipt,
  },
}

export const WithCharity: Story = {
  args: {
    receipt: {
      ...mockReceipt,
      metadata: {
        ...mockReceipt.metadata,
        properties: {
          ...mockReceipt.metadata.properties,
          charityName: 'Save the Children',
        },
      },
    },
  },
}

export const ManyTokens: Story = {
  args: {
    receipt: {
      ...mockReceipt,
      disposalData: {
        ...mockReceipt.disposalData,
        tokenCount: 50,
      },
    },
  },
}
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Minting gas cost | <$5 at 30 gwei | On-chain measurement |
| Minting success rate | ≥99% | Completed / Initiated |
| IPFS pin success | 100% | Pinata API responses |
| Image generation time | <2s | Server timing |
| Gallery load time | <1s | Client measurement |
| User mint rate | ≥80% | Users who mint / total disposals |

## Gas Optimization Notes

1. **Minimal on-chain storage**: Only essential data stored on-chain (hashes, counts, value)
2. **Single mint function**: No separate image/metadata uploads on-chain
3. **Efficient struct packing**: DisposalData struct optimized for storage slots
4. **Batch support**: Future enhancement for batch minting multiple receipts

## Security Considerations

1. **Pinata credentials**: Server-side only, never exposed to client
2. **Contract ownership**: Only authorized minters can call mintReceipt
3. **Input validation**: All inputs validated with Zod before processing
4. **Rate limiting**: Limit minting requests per address
5. **IPFS immutability**: Once pinned, metadata cannot be changed
