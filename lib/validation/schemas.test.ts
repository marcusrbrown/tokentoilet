import {describe, expect, it} from 'vitest'

import {
  chainIdSchema,
  disposalInputSchema,
  ethereumAddressSchema,
  tokenAmountSchema,
  tokenApprovalSchema,
  tokenDisposalItemSchema,
  tokenTypeSchema,
  transactionHashSchema,
  walletConnectionSchema,
} from './schemas'

describe('Validation Schemas', () => {
  describe('ethereumAddressSchema', () => {
    it('should accept valid Ethereum addresses', () => {
      const validAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0xabcdefABCDEF1234567890123456789012345678',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      ]

      for (const address of validAddresses) {
        expect(() => ethereumAddressSchema.parse(address)).not.toThrow()
      }
    })

    it('should reject invalid Ethereum addresses', () => {
      const invalidAddresses = [
        '0x123',
        '1234567890123456789012345678901234567890',
        '0x12345678901234567890123456789012345678901',
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
        '',
        '0x',
      ]

      for (const address of invalidAddresses) {
        expect(() => ethereumAddressSchema.parse(address)).toThrow()
      }
    })
  })

  describe('tokenAmountSchema', () => {
    it('should accept valid token amounts', () => {
      const validAmounts = ['0', '1', '100', '1.5', '0.001', '1000000000000000000', '123.456789']

      for (const amount of validAmounts) {
        expect(() => tokenAmountSchema.parse(amount)).not.toThrow()
      }
    })

    it('should reject invalid token amounts', () => {
      const invalidAmounts = ['-1', 'abc', '1.2.3', '', '1e18']

      for (const amount of invalidAmounts) {
        expect(() => tokenAmountSchema.parse(amount)).toThrow()
      }
    })
  })

  describe('chainIdSchema', () => {
    it('should accept supported chain IDs', () => {
      const supportedChains = [1, 137, 42161]

      for (const chainId of supportedChains) {
        expect(() => chainIdSchema.parse(chainId)).not.toThrow()
      }
    })

    it('should reject unsupported chain IDs', () => {
      const unsupportedChains = [0, 5, 100, 56, 43114]

      for (const chainId of unsupportedChains) {
        expect(() => chainIdSchema.parse(chainId)).toThrow()
      }
    })
  })

  describe('transactionHashSchema', () => {
    it('should accept valid transaction hashes', () => {
      const validHashes = [
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        '0xabcdefABCDEF12345678901234567890123456789012345678901234567890ab',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ]

      for (const hash of validHashes) {
        expect(() => transactionHashSchema.parse(hash)).not.toThrow()
      }
    })

    it('should reject invalid transaction hashes', () => {
      const invalidHashes = [
        '0x1234',
        '1234567890123456789012345678901234567890123456789012345678901234',
        '0x123456789012345678901234567890123456789012345678901234567890123',
        '0x12345678901234567890123456789012345678901234567890123456789012345',
        '',
      ]

      for (const hash of invalidHashes) {
        expect(() => transactionHashSchema.parse(hash)).toThrow()
      }
    })
  })

  describe('tokenTypeSchema', () => {
    it('should accept valid token types', () => {
      expect(() => tokenTypeSchema.parse('ERC20')).not.toThrow()
      expect(() => tokenTypeSchema.parse('ERC721')).not.toThrow()
    })

    it('should reject invalid token types', () => {
      expect(() => tokenTypeSchema.parse('ERC1155')).toThrow()
      expect(() => tokenTypeSchema.parse('erc20')).toThrow()
      expect(() => tokenTypeSchema.parse('')).toThrow()
    })
  })

  describe('tokenDisposalItemSchema', () => {
    it('should accept valid disposal items', () => {
      const validItem = {
        address: '0x1234567890123456789012345678901234567890',
        amount: '100',
        type: 'ERC20' as const,
      }

      expect(() => tokenDisposalItemSchema.parse(validItem)).not.toThrow()
    })

    it('should accept ERC721 with tokenId', () => {
      const nftItem = {
        address: '0x1234567890123456789012345678901234567890',
        amount: '1',
        type: 'ERC721' as const,
        tokenId: '12345',
      }

      expect(() => tokenDisposalItemSchema.parse(nftItem)).not.toThrow()
    })

    it('should reject invalid disposal items', () => {
      const invalidItems = [
        {address: 'invalid', amount: '100', type: 'ERC20'},
        {address: '0x1234567890123456789012345678901234567890', amount: '-1', type: 'ERC20'},
        {address: '0x1234567890123456789012345678901234567890', amount: '100', type: 'INVALID'},
      ]

      for (const item of invalidItems) {
        expect(() => tokenDisposalItemSchema.parse(item)).toThrow()
      }
    })
  })

  describe('disposalInputSchema', () => {
    it('should accept valid disposal input', () => {
      const validInput = {
        tokens: [
          {
            address: '0x1234567890123456789012345678901234567890',
            amount: '100',
            type: 'ERC20' as const,
          },
        ],
        charityId: 'charity-123',
      }

      expect(() => disposalInputSchema.parse(validInput)).not.toThrow()
    })

    it('should accept multiple tokens up to 10', () => {
      const tokens = Array.from({length: 10}, (_, i) => ({
        address: `0x${String(i).padStart(40, '0')}`,
        amount: '100',
        type: 'ERC20' as const,
      }))

      const validInput = {
        tokens,
        charityId: 'charity-123',
      }

      expect(() => disposalInputSchema.parse(validInput)).not.toThrow()
    })

    it('should reject empty tokens array', () => {
      const invalidInput = {
        tokens: [],
        charityId: 'charity-123',
      }

      expect(() => disposalInputSchema.parse(invalidInput)).toThrow()
    })

    it('should reject more than 10 tokens', () => {
      const tokens = Array.from({length: 11}, (_, i) => ({
        address: `0x${String(i).padStart(40, '0')}`,
        amount: '100',
        type: 'ERC20' as const,
      }))

      const invalidInput = {
        tokens,
        charityId: 'charity-123',
      }

      expect(() => disposalInputSchema.parse(invalidInput)).toThrow()
    })

    it('should reject empty charityId', () => {
      const invalidInput = {
        tokens: [
          {
            address: '0x1234567890123456789012345678901234567890',
            amount: '100',
            type: 'ERC20' as const,
          },
        ],
        charityId: '',
      }

      expect(() => disposalInputSchema.parse(invalidInput)).toThrow()
    })
  })

  describe('walletConnectionSchema', () => {
    it('should accept valid wallet connection options', () => {
      expect(() => walletConnectionSchema.parse({})).not.toThrow()
      expect(() => walletConnectionSchema.parse({chainId: 1})).not.toThrow()
      expect(() => walletConnectionSchema.parse({autoConnect: true})).not.toThrow()
      expect(() => walletConnectionSchema.parse({chainId: 137, autoConnect: false})).not.toThrow()
    })

    it('should reject unsupported chain in wallet connection', () => {
      expect(() => walletConnectionSchema.parse({chainId: 56})).toThrow()
    })
  })

  describe('tokenApprovalSchema', () => {
    it('should accept valid token approval input', () => {
      const validApproval = {
        tokenAddress: '0x1234567890123456789012345678901234567890',
        spenderAddress: '0xabcdefABCDEF12345678901234567890abcdefAB',
        amount: '1000000000000000000',
      }

      expect(() => tokenApprovalSchema.parse(validApproval)).not.toThrow()
    })

    it('should reject invalid addresses in approval', () => {
      const invalidApprovals = [
        {
          tokenAddress: 'invalid',
          spenderAddress: '0xabcdefABCDEF12345678901234567890abcdefAB',
          amount: '100',
        },
        {
          tokenAddress: '0x1234567890123456789012345678901234567890',
          spenderAddress: 'invalid',
          amount: '100',
        },
      ]

      for (const approval of invalidApprovals) {
        expect(() => tokenApprovalSchema.parse(approval)).toThrow()
      }
    })
  })
})
