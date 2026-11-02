import { expect, test } from '@playwright/test'

import { gotoHydrated } from './helpers'

test('theme toggle switches theme and remembers it after reload', async ({
  page,
}) => {
  await gotoHydrated(page, '/')
  const html = page.locator('html')
  await expect(html).toHaveClass(/dark/)

  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(html).not.toHaveClass(/dark/)

  await page.reload()
  await expect(html).not.toHaveClass(/dark/)
  await expect(
    page.getByRole('button', { name: 'Switch to dark theme' }),
  ).toBeVisible()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('mobile menu opens, navigates and closes', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: 'Open menu' }).click()

    const menu = page.getByRole('dialog')
    await expect(menu).toBeVisible()
    await menu.getByRole('link', { name: 'Reports' }).click()

    await expect(page).toHaveURL(/\/reports$/)
    await expect(menu).toBeHidden()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Reports' }),
    ).toBeVisible()
  })

  test('mobile menu closes with Escape and returns focus', async ({ page }) => {
    await gotoHydrated(page, '/')
    const trigger = page.getByRole('button', { name: 'Open menu' })
    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})
