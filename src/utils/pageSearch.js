const HIGHLIGHT_NAME = 'alzpoint-page-search';

export function clearPageSearchHighlight() {
  if (globalThis.CSS?.highlights) {
    globalThis.CSS.highlights.delete(HIGHLIGHT_NAME);
  }
}

export function highlightPageText(root, searchTerm) {
  clearPageSearchHighlight();
  const query = searchTerm.trim().toLocaleLowerCase('id-ID');
  const HighlightConstructor = globalThis.Highlight;

  if (!query || !root) return { count: 0, supported: true };
  if (!globalThis.CSS?.highlights || !HighlightConstructor) return { count: 0, supported: false };

  const ranges = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest('script, style, noscript, textarea, [contenteditable="true"], [aria-hidden="true"]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    const text = node.textContent;
    const normalizedText = text.toLocaleLowerCase('id-ID');
    let offset = 0;
    let matchIndex = normalizedText.indexOf(query, offset);

    while (matchIndex !== -1) {
      const range = document.createRange();
      range.setStart(node, matchIndex);
      range.setEnd(node, matchIndex + query.length);
      ranges.push(range);
      offset = matchIndex + query.length;
      matchIndex = normalizedText.indexOf(query, offset);
    }

    node = walker.nextNode();
  }

  if (ranges.length) {
    globalThis.CSS.highlights.set(HIGHLIGHT_NAME, new HighlightConstructor(...ranges));
  }

  return { count: ranges.length, supported: true };
}