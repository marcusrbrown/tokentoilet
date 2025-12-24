import {z} from 'zod'

export const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')

export const tokenAmountSchema = z
  .string()
  .regex(/^\d+(?:\.\d*)?$/, 'Invalid amount format')
  .refine(val => Number.parseFloat(val) >= 0, 'Amount must be non-negative')

export const chainIdSchema = z.number().refine(id => [1, 137, 42161].includes(id), 'Unsupported chain')

export const transactionHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')

export const tokenTypeSchema = z.enum(['ERC20', 'ERC721'])

export const tokenDisposalItemSchema = z.object({
  address: ethereumAddressSchema,
  amount: tokenAmountSchema,
  type: tokenTypeSchema,
  tokenId: z.string().optional(),
})

export const disposalInputSchema = z.object({
  tokens: z.array(tokenDisposalItemSchema).min(1, 'At least one token required').max(10, 'Maximum 10 tokens per batch'),
  charityId: z.string().min(1, 'Charity selection required'),
})

export const walletConnectionSchema = z.object({
  chainId: chainIdSchema.optional(),
  autoConnect: z.boolean().optional(),
})

export const tokenApprovalSchema = z.object({
  tokenAddress: ethereumAddressSchema,
  spenderAddress: ethereumAddressSchema,
  amount: tokenAmountSchema,
})

export type EthereumAddress = z.infer<typeof ethereumAddressSchema>
export type TokenAmount = z.infer<typeof tokenAmountSchema>
export type ChainId = z.infer<typeof chainIdSchema>
export type TransactionHash = z.infer<typeof transactionHashSchema>
export type TokenType = z.infer<typeof tokenTypeSchema>
export type TokenDisposalItem = z.infer<typeof tokenDisposalItemSchema>
export type DisposalInput = z.infer<typeof disposalInputSchema>
export type WalletConnectionInput = z.infer<typeof walletConnectionSchema>
export type TokenApprovalInput = z.infer<typeof tokenApprovalSchema>
