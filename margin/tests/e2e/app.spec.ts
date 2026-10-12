import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const editor = (page: Page) => page.locator('.cm-content');

async function replaceText(page: Page, text: string) {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await page.keyboard.insertText(text);
}

async function waitForSave(page: Page) {
  await expect(page.locator('.save-status')).toHaveText('Saved');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(editor(page)).toContainText('Welcome to Margin');
});

test('starts with a welcome document', async ({ page }) => {
  await expect(page.locator('.toolbar-title')).toHaveText('Welcome to Margin');
  await expect(page.locator('.statusbar')).toContainText(/\d+ words/);
});

test('saves as you type and survives a reload', async ({ page }) => {
  await replaceText(page, '# My essay\n\nIt begins here.');
  await waitForSave(page);
  await expect(page.locator('.toolbar-title')).toHaveText('My essay');

  await page.reload();
  await expect(editor(page)).toContainText('It begins here.');
  await expect(page.locator('.statusbar')).toContainText('5 words');
});

test('creates, switches between and deletes documents', async ({ page }) => {
  await page.getByRole('button', { name: 'New document' }).first().click();
  await page.keyboard.insertText('Second doc');
  await waitForSave(page);

  await page.getByRole('button', { name: 'Library', exact: true }).first().click();
  const items = page.locator('.doc-item');
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText('Second doc');

  await items.filter({ hasText: 'Welcome to Margin' }).click();
  await expect(editor(page)).toContainText('Margin is a quiet place to write');

  await page.getByRole('button', { name: 'Delete “Second doc”' }).click();
  await expect(items).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(items).toHaveCount(2);
  await expect(editor(page)).toHaveText('Second doc');
});

test('focus mode dims everything but the current sentence', async ({ page }) => {
  await replaceText(page, 'First sentence here. Second sentence here.');
  await page.keyboard.press('ControlOrMeta+d');
  await expect(page.locator('.cm-dimmed')).toHaveText('First sentence here.');

  await page.keyboard.press('ControlOrMeta+d');
  await expect(page.locator('.cm-dimmed')).toHaveCount(0);
});

test('style check underlines filler words and clichés', async ({ page }) => {
  await replaceText(page, 'It was very good at the end of the day.');
  await page.keyboard.press('ControlOrMeta+Alt+c');
  await expect(page.locator('.cm-style-filler')).toHaveText('very');
  await expect(page.locator('.cm-style-cliche')).toHaveText('at the end of the day');
  await expect(page.locator('.cm-style-cliche')).toHaveAttribute('title', /Cliché/);
});

test('syntax highlighting colours parts of speech', async ({ page }) => {
  await replaceText(page, 'The quick fox ran quietly.');
  await page.keyboard.press('ControlOrMeta+Alt+y');
  await expect(page.locator('.cm-pos-adjective').first()).toHaveText('quick');
  await expect(page.locator('.cm-pos-adverb')).toHaveText('quietly');
});

test('preview renders Markdown beside the editor and on its own', async ({ page }) => {
  await replaceText(page, '# Title\n\n- [x] done\n- [ ] todo\n\n**Bold** text');
  await page.keyboard.press('ControlOrMeta+Alt+p');
  const preview = page.locator('.preview-pane');
  await expect(preview.locator('h1')).toHaveText('Title');
  await expect(preview.locator('input[type=checkbox]:checked')).toHaveCount(1);
  await expect(preview.locator('strong')).toHaveText('Bold');
  await expect(page.locator('.editor-pane')).toBeVisible();

  await page.keyboard.press('ControlOrMeta+Alt+r');
  await expect(preview.locator('h1')).toBeVisible();
  await expect(page.locator('.editor-pane')).toBeHidden();
});

test('outline lists headings and jumps to them', async ({ page }) => {
  await replaceText(page, '# One\n\nText\n\n## Two\n\nMore\n\n## Three\n\nEnd');
  await page.keyboard.press('ControlOrMeta+Alt+o');
  const outline = page.getByRole('navigation', { name: 'Outline' });
  await expect(outline.getByRole('button')).toHaveText(['One', 'Two', 'Three']);

  await outline.getByRole('button', { name: 'Two' }).click();
  await expect(outline.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-current', 'location');
});

test('saves versions and restores an earlier one', async ({ page }) => {
  await replaceText(page, 'Draft one.');
  await waitForSave(page);
  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.locator('.toast')).toHaveText('Version saved');

  await replaceText(page, 'Draft two, completely rewritten.');
  await waitForSave(page);
  await page.keyboard.press('ControlOrMeta+Alt+h');

  const dialog = page.getByRole('dialog', { name: 'Version history' });
  await dialog.locator('.version-item').filter({ hasText: 'Saved' }).click();
  await expect(dialog.locator('.diff del')).toContainText('one');
  await expect(dialog.locator('.diff ins')).toContainText('two');
  await dialog.getByRole('button', { name: 'Restore this version' }).click();

  await expect(dialog).toBeHidden();
  await expect(editor(page)).toHaveText('Draft one.');
  await waitForSave(page);
  await page.reload();
  await expect(editor(page)).toHaveText('Draft one.');
});

test('exports the document as Markdown', async ({ page }) => {
  await replaceText(page, '# Export me\n\nBody text.');
  await page.getByRole('button', { name: 'Export' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Markdown (.md)' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Export me.md');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  expect(Buffer.concat(chunks).toString()).toBe('# Export me\n\nBody text.');
});

test('imports Markdown files as new documents', async ({ page }) => {
  await page.getByRole('button', { name: 'Export' }).click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Import files…' }).first().click(),
  ]);
  await chooser.setFiles({ name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('# Imported notes\n\nHello.') });
  await expect(page.locator('.toast')).toHaveText('Imported 1 document.');
  await expect(editor(page)).toContainText('Hello.');
  await expect(page.locator('.toolbar-title')).toHaveText('Imported notes');
});

test('backs up everything as a zip that can be restored', async ({ page }) => {
  await replaceText(page, 'Keep me safe.');
  await waitForSave(page);
  await page.getByRole('button', { name: 'Export' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Back up everything (.zip)' }).first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^Margin backup \d{4}-\d{2}-\d{2}\.zip$/);
  const backup = { name: 'backup.zip', mimeType: 'application/zip', buffer: readFileSync((await download.path())!) };

  await page.getByRole('button', { name: 'Library', exact: true }).first().click();
  await page.getByRole('button', { name: 'Delete “Keep me safe.”' }).click();
  await expect(page.locator('.doc-item')).toHaveCount(1);

  const importBackup = async () => {
    await page.getByRole('button', { name: 'Export' }).click();
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import files…' }).first().click(),
    ]);
    await chooser.setFiles(backup);
  };

  await importBackup();
  await expect(page.locator('.toast')).toHaveText('Restored 1 document from backup.');
  await expect(page.locator('.doc-item').filter({ hasText: 'Keep me safe.' })).toHaveCount(1);

  await importBackup();
  await expect(page.locator('.toast')).toHaveText('Your library already has everything in that backup.');
  await expect(page.locator('.doc-item')).toHaveCount(2);
});

test('keyboard shortcuts dialog lists shortcuts', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+/');
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(dialog).toContainText('Focus mode');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('settings change the theme and font', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await dialog.getByRole('radio', { name: 'Dark' }).check();
  await dialog.getByRole('radio', { name: 'Quattro' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-font', 'quattro');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark');
});
