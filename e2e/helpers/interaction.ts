import type {Locator, Page} from '@playwright/test'
import type {Address} from 'viem'

/**
 * Playwright's real `.click()` hangs against this app's rendered page,
 * reproduced at blank coordinates with no element present while JS stayed
 * responsive: Chromium's input-ACK pipeline against this page, not app CSS.
 * Dispatching the event directly bypasses that pipeline. A native `disabled`
 * button still suppresses the dispatched event and records no side effect.
 */
export async function dispatchClick(locator: Locator): Promise<void> {
  await locator.dispatchEvent('click')
}

export async function dispatchFill(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, nextValue) => {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    descriptor?.set?.call(element, nextValue)
    element.dispatchEvent(new Event('input', {bubbles: true}))
  }, value)
}

export function contractLabel(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function selectTokenLabel(
  token: {readonly symbol: string; readonly address: Address},
  selected = false,
): string {
  return `${selected ? 'Deselect' : 'Select'} ${token.symbol} token, contract ${contractLabel(token.address)}`
}

export async function selectToken(
  page: Page,
  token: {readonly symbol: string; readonly address: Address},
): Promise<void> {
  await dispatchClick(page.getByRole('button', {name: selectTokenLabel(token)}))
}

export async function deselectToken(
  page: Page,
  token: {readonly symbol: string; readonly address: Address},
): Promise<void> {
  await dispatchClick(page.getByRole('button', {name: selectTokenLabel(token, true)}))
}

export async function continueToConfirm(page: Page): Promise<void> {
  await dispatchClick(page.getByRole('button', {name: 'Continue'}))
}

export function burnPhrase(tokenCount: number): string {
  return tokenCount === 1 ? 'BURN' : `BURN ${tokenCount} TOKENS`
}

export async function acknowledgeAndTypeConfirmation(page: Page, tokenCount: number): Promise<void> {
  await dispatchClick(
    page.getByLabel('I acknowledge that these tokens will be permanently burned and cannot be recovered.'),
  )
  const phrase = burnPhrase(tokenCount)
  await dispatchFill(page.getByLabel(`Type ${phrase} to continue`), phrase)
}

export async function confirmBurn(page: Page): Promise<void> {
  await dispatchClick(page.getByRole('button', {name: 'Confirm Burn'}))
}

/** Clicks the header wallet button, which disconnects when already connected. */
export async function disconnectWallet(page: Page, address: Address): Promise<void> {
  await dispatchClick(page.getByRole('button', {name: contractLabel(address)}))
}
