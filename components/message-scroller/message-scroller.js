// -- Message Scroller -------------------------------------------

const MESSAGE_SCROLLER_SELECTOR = '.message-scroller:not([data-init])';
const DEFAULT_THRESHOLD = 24;

function getPart(root, name, fallback) {
  return root.querySelector(`[data-message-part="${name}"], .message-scroller-${name}${fallback || ''}`);
}

function getThreshold(root) {
  const value = Number(root.dataset.followThreshold);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_THRESHOLD;
}

function createMessage(root, text) {
  const item = document.createElement('li');
  const article = document.createElement('article');
  const header = document.createElement('header');
  const author = document.createElement('h3');
  const time = document.createElement('time');
  const body = document.createElement('p');

  item.className = 'message-scroller-item';
  article.className = 'message-scroller-message';
  header.className = 'message-scroller-message-header';
  author.className = 'message-scroller-message-author';
  time.className = 'message-scroller-message-time';
  body.className = 'message-scroller-message-body';
  author.textContent = root.dataset.messageAuthor || 'You';

  const now = new Date();
  time.dateTime = now.toISOString();
  time.textContent = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(now);
  body.textContent = text;

  header.append(author, time);
  article.append(header, body);
  item.append(article);
  return item;
}

function init() {
  document.querySelectorAll(MESSAGE_SCROLLER_SELECTOR).forEach((root) => {
    root.dataset.init = '';

    const viewport = getPart(root, 'viewport', '');
    const messages = getPart(root, 'messages', '');
    const composer = getPart(root, 'composer', '');
    const jump = getPart(root, 'jump', '') || root.querySelector('[data-message-jump]');
    const status = getPart(root, 'status', '');
    const textarea = composer?.querySelector('textarea');
    if (!viewport || !messages) {
      root.removeAttribute('data-init');
      return;
    }

    let follow = true;

    const bottom = () => Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const nearBottom = () => bottom() - viewport.scrollTop <= getThreshold(root);

    const updateState = (announceUnread = false, forceStatus = false) => {
      const nextFollow = nearBottom();
      const changed = nextFollow !== follow;
      follow = nextFollow;
      root.dataset.state = follow ? 'latest' : 'unread';
      if (jump) jump.hidden = follow;
      if (status && (changed || announceUnread || forceStatus)) {
        status.textContent = follow
          ? 'You are viewing the latest messages.'
          : announceUnread
            ? 'New messages are available. Jump to latest.'
            : 'You are viewing older messages.';
      }
    };

    const goToLatest = () => {
      viewport.scrollTop = viewport.scrollHeight;
      updateState(false, true);
    };

    const observer = new MutationObserver((records) => {
      const addedMessage = records.some((record) => (
        record.type === 'childList'
        && record.target === messages
        && record.addedNodes.length > 0
      ));
      if (!addedMessage) return;
      if (follow) {
        goToLatest();
      } else {
        updateState(true);
      }
    });
    observer.observe(messages, { childList: true });

    viewport.addEventListener('scroll', () => {
      updateState();
    }, { passive: true });

    jump?.addEventListener('click', goToLatest);

    composer?.addEventListener('submit', (event) => {
      if (!textarea) return;
      const text = textarea.value.trim();
      textarea.setCustomValidity(text ? '' : 'Enter a message.');
      if (!text || !composer.checkValidity()) {
        event.preventDefault();
        composer.reportValidity();
        return;
      }

      event.preventDefault();
      const wasFollowing = follow;
      messages.append(createMessage(root, text));
      textarea.value = '';
      textarea.setCustomValidity('');
      root.dispatchEvent(new CustomEvent('message-scroller:send', {
        bubbles: true,
        detail: { text, following: wasFollowing }
      }));
      if (wasFollowing) goToLatest();
    });

    textarea?.addEventListener('input', () => textarea.setCustomValidity(''));
    goToLatest();
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
