> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-009: Charity Integration

## Summary

This RFC defines the charity integration system for Token Toilet, enabling users to donate disposed token proceeds to verified charitable organizations via The Giving Block API. The implementation handles secure API key management, donation tracking, webhook processing, and on-chain donation records for transparency.

## Features Addressed

| Feature ID | Feature Name | Priority | Phase |
|------------|--------------|----------|-------|
| F4.1 | Charity Display | Must Have | 4 |
| F4.2 | The Giving Block API Integration | Must Have | 4 |
| F4.3 | Donation Tracking | Must Have | 4 |
| F4.4 | Donation Reporting | Should Have | 4 |

## Dependencies

### Requires
- RFC-007: Token Disposal Flow (disposal triggers donation flow)
- RFC-006: Transaction Infrastructure (transaction completion triggers donation)

### Required By
- RFC-010: NFT Receipt System (donation info included in receipt metadata)

## Technical Specification

### 1. The Giving Block Integration

Server-side API integration for secure key management:

```typescript
// lib/charity/giving-block-client.ts
import { z } from '@/lib/z'

const GivingBlockConfigSchema = z.object({
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  baseUrl: z.string().url().default('https://api.thegivingblock.com/v1'),
  webhookSecret: z.string().min(1),
})

type GivingBlockConfig = z.infer<typeof GivingBlockConfigSchema>

const CharitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  logoUrl: z.string().url().optional(),
  category: z.string(),
  ein: z.string(), // Tax ID
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  acceptedTokens: z.array(z.string()),
  verified: z.boolean(),
  featured: z.boolean().optional(),
})

export type Charity = z.infer<typeof CharitySchema>

const DonationRequestSchema = z.object({
  charityId: z.string(),
  donorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(), // Wei amount as string
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  chainId: z.number(),
})

export type DonationRequest = z.infer<typeof DonationRequestSchema>

const DonationResponseSchema = z.object({
  donationId: z.string(),
  status: z.enum(['pending', 'confirmed', 'completed', 'failed']),
  receiptUrl: z.string().url().optional(),
  estimatedValue: z.object({
    amount: z.string(),
    currency: z.literal('USD'),
  }),
})

export type DonationResponse = z.infer<typeof DonationResponseSchema>

export class GivingBlockClient {
  private config: GivingBlockConfig
  private cache: Map<string, { data: Charity[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.config = GivingBlockConfigSchema.parse({
      apiKey: process.env.GIVING_BLOCK_API_KEY,
      apiSecret: process.env.GIVING_BLOCK_API_SECRET,
      baseUrl: process.env.GIVING_BLOCK_API_URL,
      webhookSecret: process.env.GIVING_BLOCK_WEBHOOK_SECRET,
    })
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const timestamp = Date.now().toString()
    const signature = await this.generateSignature(timestamp, endpoint)

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new GivingBlockError(
        error.message || `API request failed: ${response.status}`,
        response.status,
        error.code
      )
    }

    return response.json()
  }

  private async generateSignature(
    timestamp: string,
    endpoint: string
  ): Promise<string> {
    const message = `${timestamp}${endpoint}`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.config.apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    )
    return Buffer.from(signature).toString('hex')
  }

  async getCharities(options?: {
    category?: string
    featured?: boolean
    search?: string
  }): Promise<Charity[]> {
    const cacheKey = JSON.stringify(options || {})
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const params = new URLSearchParams()
    if (options?.category) params.set('category', options.category)
    if (options?.featured) params.set('featured', 'true')
    if (options?.search) params.set('search', options.search)

    const response = await this.request<{ charities: unknown[] }>(
      `/charities?${params.toString()}`
    )

    const charities = z.array(CharitySchema).parse(response.charities)
    this.cache.set(cacheKey, { data: charities, timestamp: Date.now() })
    
    return charities
  }

  async getCharity(charityId: string): Promise<Charity> {
    const response = await this.request<{ charity: unknown }>(
      `/charities/${charityId}`
    )
    return CharitySchema.parse(response.charity)
  }

  async createDonation(request: DonationRequest): Promise<DonationResponse> {
    const validated = DonationRequestSchema.parse(request)
    
    const response = await this.request<{ donation: unknown }>('/donations', {
      method: 'POST',
      body: JSON.stringify(validated),
    })

    return DonationResponseSchema.parse(response.donation)
  }

  async getDonation(donationId: string): Promise<DonationResponse> {
    const response = await this.request<{ donation: unknown }>(
      `/donations/${donationId}`
    )
    return DonationResponseSchema.parse(response.donation)
  }

  async getDonationHistory(
    donorAddress: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ donations: DonationResponse[]; total: number }> {
    const params = new URLSearchParams({ donor: donorAddress })
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())

    const response = await this.request<{
      donations: unknown[]
      total: number
    }>(`/donations?${params.toString()}`)

    return {
      donations: z.array(DonationResponseSchema).parse(response.donations),
      total: response.total,
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}

export class GivingBlockError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'GivingBlockError'
  }
}

// Singleton instance
let client: GivingBlockClient | null = null

export function getGivingBlockClient(): GivingBlockClient {
  if (!client) {
    client = new GivingBlockClient()
  }
  return client
}
```

### 2. Server-Side API Routes

Next.js API routes for secure charity operations:

```typescript
// app/api/charities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getGivingBlockClient, GivingBlockError } from '@/lib/charity/giving-block-client'
import { z } from '@/lib/z'

const QuerySchema = z.object({
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const query = QuerySchema.parse(searchParams)
    
    const client = getGivingBlockClient()
    const charities = await client.getCharities(query)
    
    return NextResponse.json({ charities })
  } catch (error) {
    if (error instanceof GivingBlockError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    console.error('Failed to fetch charities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch charities' },
      { status: 500 }
    )
  }
}
```

```typescript
// app/api/charities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getGivingBlockClient, GivingBlockError } from '@/lib/charity/giving-block-client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getGivingBlockClient()
    const charity = await client.getCharity(params.id)
    
    return NextResponse.json({ charity })
  } catch (error) {
    if (error instanceof GivingBlockError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    console.error('Failed to fetch charity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch charity' },
      { status: 500 }
    )
  }
}
```

```typescript
// app/api/donations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getGivingBlockClient, GivingBlockError } from '@/lib/charity/giving-block-client'
import { z } from '@/lib/z'

const CreateDonationSchema = z.object({
  charityId: z.string(),
  donorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  chainId: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const donation = CreateDonationSchema.parse(body)
    
    const client = getGivingBlockClient()
    const result = await client.createDonation(donation)
    
    return NextResponse.json({ donation: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof GivingBlockError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    console.error('Failed to create donation:', error)
    return NextResponse.json(
      { error: 'Failed to create donation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const donorAddress = request.nextUrl.searchParams.get('donor')
    
    if (!donorAddress) {
      return NextResponse.json(
        { error: 'donor address required' },
        { status: 400 }
      )
    }
    
    const client = getGivingBlockClient()
    const result = await client.getDonationHistory(donorAddress, {
      limit: Number(request.nextUrl.searchParams.get('limit')) || 20,
      offset: Number(request.nextUrl.searchParams.get('offset')) || 0,
    })
    
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof GivingBlockError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    console.error('Failed to fetch donations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}
```

```typescript
// app/api/webhooks/giving-block/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getGivingBlockClient } from '@/lib/charity/giving-block-client'
import { z } from '@/lib/z'

const WebhookEventSchema = z.object({
  event: z.enum(['donation.confirmed', 'donation.completed', 'donation.failed']),
  data: z.object({
    donationId: z.string(),
    charityId: z.string(),
    donorAddress: z.string(),
    amount: z.string(),
    status: z.string(),
    confirmedAt: z.string().optional(),
    receiptUrl: z.string().url().optional(),
  }),
  timestamp: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Webhook-Signature')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      )
    }
    
    const payload = await request.text()
    const client = getGivingBlockClient()
    
    if (!client.verifyWebhookSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }
    
    const event = WebhookEventSchema.parse(JSON.parse(payload))
    
    // Process webhook event
    switch (event.event) {
      case 'donation.confirmed':
        await handleDonationConfirmed(event.data)
        break
      case 'donation.completed':
        await handleDonationCompleted(event.data)
        break
      case 'donation.failed':
        await handleDonationFailed(event.data)
        break
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleDonationConfirmed(data: z.infer<typeof WebhookEventSchema>['data']) {
  // Update local donation record status
  // Emit event for real-time UI updates
  console.log('Donation confirmed:', data.donationId)
}

async function handleDonationCompleted(data: z.infer<typeof WebhookEventSchema>['data']) {
  // Update local donation record status
  // Trigger NFT receipt minting (RFC-010)
  // Send notification to donor
  console.log('Donation completed:', data.donationId)
}

async function handleDonationFailed(data: z.infer<typeof WebhookEventSchema>['data']) {
  // Update local donation record status
  // Send failure notification to donor
  console.error('Donation failed:', data.donationId)
}
```

### 3. Client-Side Hooks

React hooks for charity data fetching:

```typescript
// hooks/use-charities.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import type { Charity } from '@/lib/charity/giving-block-client'

interface UseCharitiesOptions {
  category?: string
  featured?: boolean
  search?: string
  enabled?: boolean
}

async function fetchCharities(options: UseCharitiesOptions): Promise<Charity[]> {
  const params = new URLSearchParams()
  if (options.category) params.set('category', options.category)
  if (options.featured) params.set('featured', 'true')
  if (options.search) params.set('search', options.search)

  const response = await fetch(`/api/charities?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch charities')
  }
  
  const data = await response.json()
  return data.charities
}

export function useCharities(options: UseCharitiesOptions = {}) {
  return useQuery({
    queryKey: ['charities', options],
    queryFn: () => fetchCharities(options),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCharity(charityId: string | null) {
  return useQuery({
    queryKey: ['charity', charityId],
    queryFn: async () => {
      if (!charityId) return null
      
      const response = await fetch(`/api/charities/${charityId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch charity')
      }
      
      const data = await response.json()
      return data.charity as Charity
    },
    enabled: !!charityId,
  })
}
```

```typescript
// hooks/use-donation.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DonationRequest, DonationResponse } from '@/lib/charity/giving-block-client'

async function createDonation(request: DonationRequest): Promise<DonationResponse> {
  const response = await fetch('/api/donations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create donation')
  }
  
  const data = await response.json()
  return data.donation
}

export function useCreateDonation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createDonation,
    onSuccess: (data, variables) => {
      // Invalidate donation history cache
      queryClient.invalidateQueries({
        queryKey: ['donations', variables.donorAddress],
      })
    },
  })
}

export function useDonationHistory(donorAddress: string | null) {
  return useQuery({
    queryKey: ['donations', donorAddress],
    queryFn: async () => {
      if (!donorAddress) return { donations: [], total: 0 }
      
      const response = await fetch(`/api/donations?donor=${donorAddress}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch donation history')
      }
      
      return response.json() as Promise<{
        donations: DonationResponse[]
        total: number
      }>
    },
    enabled: !!donorAddress,
  })
}
```

### 4. UI Components

Charity selector and donation components:

```typescript
// components/charity/charity-selector.tsx
'use client'

import { useState, useMemo } from 'react'
import { useCharities } from '@/hooks/use-charities'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CharitySkeleton } from '@/components/ui/skeletons/charity-skeleton'
import type { Charity } from '@/lib/charity/giving-block-client'

interface CharitySelectorProps {
  selectedCharity: Charity | null
  onSelect: (charity: Charity) => void
  className?: string
}

const CHARITY_CATEGORIES = [
  'All',
  'Environment',
  'Education',
  'Health',
  'Animals',
  'Humanitarian',
  'Arts & Culture',
] as const

export function CharitySelector({
  selectedCharity,
  onSelect,
  className,
}: CharitySelectorProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('All')
  
  const { data: charities, isLoading, error } = useCharities({
    category: category === 'All' ? undefined : category,
    search: search || undefined,
  })
  
  const featuredCharities = useMemo(() => 
    charities?.filter(c => c.featured) ?? [],
    [charities]
  )
  
  const filteredCharities = useMemo(() => 
    charities?.filter(c => !c.featured) ?? [],
    [charities]
  )
  
  if (error) {
    return (
      <Card className={className}>
        <div className="p-6 text-center text-destructive">
          Failed to load charities. Please try again.
        </div>
      </Card>
    )
  }
  
  return (
    <div className={className}>
      {/* Search and filter */}
      <div className="flex flex-col gap-4 mb-6">
        <Input
          placeholder="Search charities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <div className="flex flex-wrap gap-2">
          {CHARITY_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CharitySkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Featured charities */}
          {featuredCharities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Featured
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {featuredCharities.map((charity) => (
                  <CharityCard
                    key={charity.id}
                    charity={charity}
                    isSelected={selectedCharity?.id === charity.id}
                    onSelect={onSelect}
                    featured
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* All charities */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCharities.map((charity) => (
              <CharityCard
                key={charity.id}
                charity={charity}
                isSelected={selectedCharity?.id === charity.id}
                onSelect={onSelect}
              />
            ))}
          </div>
          
          {charities?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No charities found matching your criteria.
            </p>
          )}
        </>
      )}
    </div>
  )
}

interface CharityCardProps {
  charity: Charity
  isSelected: boolean
  onSelect: (charity: Charity) => void
  featured?: boolean
}

function CharityCard({ charity, isSelected, onSelect, featured }: CharityCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:bg-muted/50'
      } ${featured ? 'border-primary/50' : ''}`}
      onClick={() => onSelect(charity)}
    >
      <div className="flex items-start gap-3">
        {charity.logoUrl && (
          <img
            src={charity.logoUrl}
            alt={`${charity.name} logo`}
            className="w-12 h-12 rounded-lg object-contain bg-muted"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{charity.name}</h4>
            {charity.verified && (
              <Badge variant="secondary" className="shrink-0">
                Verified
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {charity.description}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {charity.category}
            </Badge>
            {featured && (
              <Badge className="text-xs bg-primary/10 text-primary">
                Featured
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
```

```typescript
// components/charity/donation-summary.tsx
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Charity } from '@/lib/charity/giving-block-client'
import type { TokenInfo } from '@/lib/web3/token-metadata'

interface DonationSummaryProps {
  charity: Charity
  tokens: TokenInfo[]
  estimatedValue: {
    amount: string
    currency: string
  }
  className?: string
}

export function DonationSummary({
  charity,
  tokens,
  estimatedValue,
  className,
}: DonationSummaryProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Donation Summary</h3>
      
      {/* Charity info */}
      <div className="flex items-center gap-3 pb-4 border-b">
        {charity.logoUrl && (
          <img
            src={charity.logoUrl}
            alt={charity.name}
            className="w-10 h-10 rounded-lg"
          />
        )}
        <div>
          <p className="font-medium">{charity.name}</p>
          <p className="text-sm text-muted-foreground">{charity.category}</p>
        </div>
      </div>
      
      {/* Tokens being donated */}
      <div className="py-4 border-b">
        <p className="text-sm text-muted-foreground mb-2">
          Tokens to dispose ({tokens.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {tokens.slice(0, 5).map((token) => (
            <Badge key={token.address} variant="secondary">
              {token.symbol}
            </Badge>
          ))}
          {tokens.length > 5 && (
            <Badge variant="outline">+{tokens.length - 5} more</Badge>
          )}
        </div>
      </div>
      
      {/* Estimated value */}
      <div className="pt-4">
        <p className="text-sm text-muted-foreground">Estimated donation value</p>
        <p className="text-2xl font-bold">
          ${Number(estimatedValue.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tax-deductible donation receipt will be provided
        </p>
      </div>
    </Card>
  )
}
```

```typescript
// components/charity/donation-history.tsx
'use client'

import { useDonationHistory } from '@/hooks/use-donation'
import { useWallet } from '@/hooks/use-wallet'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DonationHistorySkeleton } from '@/components/ui/skeletons/donation-history-skeleton'

export function DonationHistory() {
  const { address } = useWallet()
  const { data, isLoading, error } = useDonationHistory(address ?? null)
  
  if (!address) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Connect your wallet to view donation history
      </Card>
    )
  }
  
  if (isLoading) {
    return <DonationHistorySkeleton />
  }
  
  if (error) {
    return (
      <Card className="p-6 text-center text-destructive">
        Failed to load donation history
      </Card>
    )
  }
  
  if (!data?.donations.length) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No donations yet. Flush some tokens to make your first donation!
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Donation History</h3>
        <Badge variant="outline">{data.total} total</Badge>
      </div>
      
      <div className="space-y-3">
        {data.donations.map((donation) => (
          <Card key={donation.donationId} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  ${Number(donation.estimatedValue.amount).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {donation.donationId.slice(0, 8)}...
                </p>
              </div>
              
              <div className="text-right">
                <DonationStatusBadge status={donation.status} />
                {donation.receiptUrl && (
                  <a
                    href={donation.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block mt-1"
                  >
                    View Receipt
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DonationStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    confirmed: 'secondary',
    completed: 'default',
    failed: 'destructive',
  }
  
  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
```

### 5. On-Chain Donation Records

Smart contract interface for transparent donation tracking:

```solidity
// contracts/interfaces/IDonationRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDonationRegistry {
    struct DonationRecord {
        address donor;
        address charity;
        address token;
        uint256 amount;
        uint256 timestamp;
        bytes32 externalId; // The Giving Block donation ID
    }
    
    event DonationRecorded(
        bytes32 indexed donationId,
        address indexed donor,
        address indexed charity,
        address token,
        uint256 amount,
        bytes32 externalId
    );
    
    function recordDonation(
        address donor,
        address charity,
        address token,
        uint256 amount,
        bytes32 externalId
    ) external returns (bytes32 donationId);
    
    function getDonation(bytes32 donationId) external view returns (DonationRecord memory);
    
    function getDonorHistory(address donor) external view returns (bytes32[] memory donationIds);
    
    function getCharityDonations(address charity) external view returns (bytes32[] memory donationIds);
    
    function getTotalDonated(address donor) external view returns (uint256 totalUsd);
}
```

```typescript
// lib/web3/donation-registry.ts
import { type Address, type Hash, encodeFunctionData, decodeFunctionResult } from 'viem'
import { getPublicClient, getWalletClient } from './config'

const DONATION_REGISTRY_ABI = [
  {
    name: 'recordDonation',
    type: 'function',
    inputs: [
      { name: 'donor', type: 'address' },
      { name: 'charity', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'externalId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'getDonorHistory',
    type: 'function',
    inputs: [{ name: 'donor', type: 'address' }],
    outputs: [{ type: 'bytes32[]' }],
    stateMutability: 'view',
  },
] as const

export async function recordDonationOnChain(
  donorAddress: Address,
  charityAddress: Address,
  tokenAddress: Address,
  amount: bigint,
  externalDonationId: string
): Promise<Hash> {
  const walletClient = await getWalletClient()
  const registryAddress = process.env.NEXT_PUBLIC_DONATION_REGISTRY_ADDRESS as Address
  
  // Convert external ID to bytes32
  const externalIdBytes = `0x${Buffer.from(externalDonationId).toString('hex').padEnd(64, '0')}` as `0x${string}`
  
  const hash = await walletClient.writeContract({
    address: registryAddress,
    abi: DONATION_REGISTRY_ABI,
    functionName: 'recordDonation',
    args: [donorAddress, charityAddress, tokenAddress, amount, externalIdBytes],
  })
  
  return hash
}

export async function getDonorHistoryOnChain(
  donorAddress: Address
): Promise<`0x${string}`[]> {
  const publicClient = getPublicClient()
  const registryAddress = process.env.NEXT_PUBLIC_DONATION_REGISTRY_ADDRESS as Address
  
  const result = await publicClient.readContract({
    address: registryAddress,
    abi: DONATION_REGISTRY_ABI,
    functionName: 'getDonorHistory',
    args: [donorAddress],
  })
  
  return result as `0x${string}`[]
}
```

## File Structure

```
app/
├── api/
│   ├── charities/
│   │   ├── route.ts              # GET /api/charities
│   │   └── [id]/
│   │       └── route.ts          # GET /api/charities/:id
│   ├── donations/
│   │   └── route.ts              # POST/GET /api/donations
│   └── webhooks/
│       └── giving-block/
│           └── route.ts          # Webhook handler

components/
├── charity/
│   ├── charity-selector.tsx      # Charity selection UI
│   ├── charity-card.tsx          # Individual charity card
│   ├── donation-summary.tsx      # Pre-donation summary
│   ├── donation-history.tsx      # User's donation history
│   └── index.ts
├── ui/
│   └── skeletons/
│       ├── charity-skeleton.tsx
│       └── donation-history-skeleton.tsx

hooks/
├── use-charities.ts              # Charity data fetching
└── use-donation.ts               # Donation mutations & queries

lib/
├── charity/
│   ├── giving-block-client.ts    # API client
│   └── index.ts
└── web3/
    └── donation-registry.ts      # On-chain donation records

contracts/
└── interfaces/
    └── IDonationRegistry.sol     # Donation registry interface
```

## Environment Variables

```env
# The Giving Block API (server-side only)
GIVING_BLOCK_API_KEY=your_api_key
GIVING_BLOCK_API_SECRET=your_api_secret
GIVING_BLOCK_API_URL=https://api.thegivingblock.com/v1
GIVING_BLOCK_WEBHOOK_SECRET=your_webhook_secret

# Donation Registry Contract (client-side)
NEXT_PUBLIC_DONATION_REGISTRY_ADDRESS=0x...
```

## Acceptance Criteria

### F4.1 Charity Display
- [ ] Charities load from The Giving Block API
- [ ] Charity cards show name, logo, description, category
- [ ] Verified badge displayed for verified charities
- [ ] Featured charities highlighted
- [ ] Search and category filtering works

### F4.2 The Giving Block API Integration
- [ ] API keys stored securely (server-side only)
- [ ] Requests authenticated with HMAC signature
- [ ] Error responses handled gracefully
- [ ] Rate limiting respected
- [ ] Response caching implemented (5 min TTL)

### F4.3 Donation Tracking
- [ ] Donations created via API after disposal
- [ ] Donation status tracked (pending → confirmed → completed)
- [ ] Webhook events processed correctly
- [ ] On-chain donation records created
- [ ] Donation history viewable by user

### F4.4 Donation Reporting
- [ ] Total donation amounts displayed
- [ ] Tax receipt links provided
- [ ] Donation history exportable
- [ ] Year-to-date totals calculated

## Testing Strategy

### Unit Tests
```typescript
// lib/charity/__tests__/giving-block-client.test.ts
describe('GivingBlockClient', () => {
  it('generates valid HMAC signature', async () => {
    const client = new GivingBlockClient()
    // Test signature generation
  })
  
  it('caches charity responses', async () => {
    const client = new GivingBlockClient()
    await client.getCharities()
    await client.getCharities()
    // Verify only one API call made
  })
  
  it('validates donation requests', async () => {
    const client = new GivingBlockClient()
    await expect(client.createDonation({
      charityId: '',
      // Invalid data
    })).rejects.toThrow()
  })
})

// hooks/__tests__/use-charities.test.tsx
describe('useCharities', () => {
  it('fetches charities on mount', async () => {
    const { result } = renderHook(() => useCharities())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(expect.any(Number))
  })
  
  it('filters by category', async () => {
    const { result } = renderHook(() => 
      useCharities({ category: 'Environment' })
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.every(c => c.category === 'Environment')).toBe(true)
  })
})
```

### Integration Tests
```typescript
// app/api/charities/__tests__/route.test.ts
describe('GET /api/charities', () => {
  it('returns list of charities', async () => {
    const request = new NextRequest('http://localhost/api/charities')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.charities).toBeInstanceOf(Array)
  })
  
  it('filters by category', async () => {
    const request = new NextRequest(
      'http://localhost/api/charities?category=Environment'
    )
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.charities.every((c: Charity) => 
      c.category === 'Environment'
    )).toBe(true)
  })
})

// app/api/webhooks/giving-block/__tests__/route.test.ts
describe('POST /api/webhooks/giving-block', () => {
  it('rejects invalid signature', async () => {
    const request = new NextRequest('http://localhost/api/webhooks/giving-block', {
      method: 'POST',
      headers: { 'X-Webhook-Signature': 'invalid' },
      body: JSON.stringify({ event: 'donation.confirmed', data: {} }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })
  
  it('processes valid webhook', async () => {
    const payload = JSON.stringify({
      event: 'donation.completed',
      data: { donationId: 'test-123' },
      timestamp: new Date().toISOString(),
    })
    const signature = generateValidSignature(payload)
    
    const request = new NextRequest('http://localhost/api/webhooks/giving-block', {
      method: 'POST',
      headers: { 'X-Webhook-Signature': signature },
      body: payload,
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Charity load time | <500ms | API response time |
| Donation success rate | ≥99% | Completed / Initiated |
| Webhook processing | <1s | Event to DB update |
| API uptime | 99.9% | Monitoring |
| User satisfaction | ≥4.5/5 | Donation flow survey |

## Security Considerations

1. **API Key Protection**: Never expose Giving Block credentials to client
2. **Webhook Validation**: Always verify webhook signatures
3. **Input Validation**: Validate all user inputs with Zod
4. **Rate Limiting**: Implement rate limiting on API routes
5. **CORS**: Restrict API access to application origin only
