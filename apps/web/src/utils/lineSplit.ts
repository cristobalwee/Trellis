export interface LineSplitAnimationOptions {
  baseDelay: number;
  lineDelay?: number;
}

export interface LineSplitAnimationResult {
  lineCount: number;
  endDelay: number;
}

const WORD_SELECTOR = '[data-line-word]';
const WORD_REGEX = /\S+|\s+/g;
const LINE_TOP_TOLERANCE_PX = 2;

function prepareWords(element: HTMLElement): void {
  if (element.dataset.lineSplitPrepared === 'true') {
    return;
  }

  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    const textNode = currentNode as Text;

    if (textNode.textContent && textNode.textContent.trim().length > 0) {
      textNodes.push(textNode);
    }

    currentNode = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const rawText = textNode.textContent ?? '';
    const parts = rawText.match(WORD_REGEX);

    if (!parts) {
      continue;
    }

    const fragment = document.createDocumentFragment();

    for (const part of parts) {
      if (part.trim().length === 0) {
        fragment.appendChild(document.createTextNode(part));
        continue;
      }

      const word = document.createElement('span');
      word.dataset.lineWord = 'true';
      word.textContent = part;
      fragment.appendChild(word);
    }

    textNode.replaceWith(fragment);
  }

  element.dataset.lineSplitPrepared = 'true';
}

function mapWordsToLines(element: HTMLElement): number {
  const words = Array.from(element.querySelectorAll<HTMLElement>(WORD_SELECTOR));
  const lineTops: number[] = [];

  for (const word of words) {
    const top = Math.round(word.offsetTop);
    let lineIndex = lineTops.findIndex((existingTop) => Math.abs(existingTop - top) <= LINE_TOP_TOLERANCE_PX);

    if (lineIndex === -1) {
      lineTops.push(top);
      lineIndex = lineTops.length - 1;
    }

    word.style.setProperty('--line-index', String(lineIndex));
  }

  return lineTops.length;
}

export function applyLineSplitAnimation(
  element: HTMLElement | null,
  options: LineSplitAnimationOptions
): LineSplitAnimationResult {
  if (!element) {
    return {
      lineCount: 0,
      endDelay: options.baseDelay
    };
  }

  const lineDelay = options.lineDelay ?? 0.1;

  prepareWords(element);
  const lineCount = mapWordsToLines(element);

  element.dataset.animateLines = 'true';
  element.style.setProperty('--line-base-delay', `${options.baseDelay}s`);
  element.style.setProperty('--line-step-delay', `${lineDelay}s`);
  element.style.setProperty('--line-count', String(lineCount));

  const endDelay = lineCount > 0
    ? options.baseDelay + (lineCount - 1) * lineDelay
    : options.baseDelay;

  return {
    lineCount,
    endDelay
  };
}
