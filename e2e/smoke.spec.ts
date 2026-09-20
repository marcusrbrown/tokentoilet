import {expect, test} from '@playwright/test'

test('dev server serves the app shell', async ({page}) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Token Toilet/)
})
