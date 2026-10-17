/**
 * WhatsApp Message Post-Processor & Formatter
 *
 * WhatsApp formatting rules:
 * - Bold: single asterisk pair (*text*), NEVER double (**text**)
 * - Italics: single underscore (_text_)
 * - Strikethrough: single tilde (~text~)
 * - Monospace: triple backticks (```text```)
 * - Headings: Markdown '#' headings are not supported in WhatsApp and should be stripped or rendered as bold
 * - Bullets: Asterisk-prefixed bullets ('* item') clash with bold formatting on WhatsApp and should be converted to '• ' or '- '
 */

export function formatWhatsAppMessage(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let formatted = text;

  // 1. Convert Markdown headings (e.g. "### Title", "## Title", "# Title") to bold (*Title*)
  formatted = formatted.replace(/^[ \t]*#{1,6}[ \t]+([^\n\r]+)/gm, '*$1*');

  // 2. Convert markdown double-asterisks (**bold**) to WhatsApp single-asterisks (*bold*)
  // We handle nested/repeated double asterisks safely
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '*$1*');

  // Any remaining stray double asterisks
  formatted = formatted.replace(/\*\*/g, '*');

  // 3. Convert leading bullet asterisks ("* item" or "*   item") to "• item"
  // so it doesn't accidentally trigger or break WhatsApp bolding
  formatted = formatted.replace(/^[ \t]*\*[ \t]+([^\n\r]+)/gm, '• $1');

  // 4. Clean up any trailing whitespace per line while preserving newlines
  formatted = formatted
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();

  return formatted;
}
