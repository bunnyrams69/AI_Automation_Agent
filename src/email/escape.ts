/**
 * Escapes user-supplied strings before interpolating into HTML emails to prevent HTML/XSS injection.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const matchHtmlRegExp = /["'&<>]/;
  const match = matchHtmlRegExp.exec(input);

  if (!match) {
    return input;
  }

  let escape: string;
  let html = '';
  let index = 0;
  let lastIndex = 0;

  for (index = match.index; index < input.length; index++) {
    switch (input.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += input.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + input.substring(lastIndex, index) : html;
}
