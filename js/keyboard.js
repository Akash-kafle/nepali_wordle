// =============================================================
// keyboard.js — On-screen Devanagari keyboard (NFR-6)
// =============================================================

const Keyboard = (() => {
  // Key definitions — consonants, vowels, matras, specials
  const ROWS = [
    // Row 1: Vowels
    ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','अं','अः'],
    // Row 2: Consonants ka-ña
    ['क','ख','ग','घ','ङ','च','छ','ज','झ','ञ'],
    // Row 3: Consonants ṭa-na
    ['ट','ठ','ड','ढ','ण','त','थ','द','ध','न'],
    // Row 4: Consonants pa-ha + specials
    ['प','फ','ब','भ','म','य','र','ल','व','श','ष','स','ह'],
    // Row 5: Matras (vowel signs)
    ['ा','ि','ी','ु','ू','े','ै','ो','ौ','ं','ः','ँ','्'],
    // Row 6: Action keys + special chars
    ['BACKSPACE', 'क्ष','त्र','ज्ञ', 'ENTER'],
  ];

  let _onKey = null;
  let _keyStateMap = {};  // unit -> 'green'|'yellow'|'grey'

  function init(onKeyCallback) {
    _onKey = onKeyCallback;
    _render();
    _bindPhysicalKeyboard();
  }

  function _render() {
    const container = document.getElementById('on-screen-keyboard');
    if (!container) return;
    container.innerHTML = '';

    ROWS.forEach((row, rowIdx) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';

      // Label for matra row
      if (rowIdx === 4) {
        const label = document.createElement('div');
        label.className = 'keyboard-section-label';
        label.style.width = '100%';
        label.textContent = 'Matras (vowel signs)';
        container.appendChild(label);
      }

      row.forEach(key => {
        const btn = document.createElement('button');
        btn.textContent = _displayKey(key);
        btn.className   = 'key';
        btn.id          = `key-${key.replace(/[^a-z\u0900-\u097F]/gi, '_')}`;
        btn.setAttribute('aria-label', _ariaLabel(key));

        if (key === 'BACKSPACE' || key === 'ENTER') {
          btn.classList.add('key--action');
          if (key === 'ENTER') btn.classList.add('key--enter');
        }

        // Apply existing color state
        const state = _keyStateMap[key];
        if (state) btn.classList.add(`key--${state}`);

        btn.addEventListener('click', () => {
          if (key === 'BACKSPACE') _onKey?.({ type: 'backspace' });
          else if (key === 'ENTER') _onKey?.({ type: 'enter' });
          else _onKey?.({ type: 'char', value: key });
        });

        rowEl.appendChild(btn);
      });

      container.appendChild(rowEl);
    });
  }

  function _displayKey(key) {
    if (key === 'BACKSPACE') return '⌫';
    if (key === 'ENTER')     return 'Enter';
    return key;
  }

  function _ariaLabel(key) {
    if (key === 'BACKSPACE') return 'Backspace';
    if (key === 'ENTER')     return 'Submit guess';
    return key;
  }

  /**
   * Update keyboard key color states based on guess feedback.
   * Priority: green > yellow > grey
   * @param {Array<{unit: string, status: string}>} feedback
   */
  function updateColors(feedback) {
    const PRIORITY = { green: 4, blue: 3, yellow: 2, grey: 1 };

    feedback.forEach(({ unit, status }) => {
      if (!unit) return;
      // Decompose grapheme cluster (like 'पा') into individual code points ('प', 'ा')
      const chars = [...unit];
      chars.forEach(char => {
        const existing = _keyStateMap[char];
        if (!existing || PRIORITY[status] > PRIORITY[existing]) {
          _keyStateMap[char] = status;
        }
      });
    });

    _render();
  }

  function reset() {
    _keyStateMap = {};
    _render();
  }

  // Physical and virtual mobile Devanagari keyboard support
  function _bindPhysicalKeyboard() {
    // 1. Create a hidden input to capture mobile IME/system virtual keyboards
    let hiddenInput = document.getElementById('hidden-keyboard-input');
    if (!hiddenInput) {
      hiddenInput = document.createElement('input');
      hiddenInput.id = 'hidden-keyboard-input';
      hiddenInput.type = 'text';
      hiddenInput.style.position = 'absolute';
      hiddenInput.style.opacity = '0';
      hiddenInput.style.pointerEvents = 'none';
      hiddenInput.style.top = '-100px';
      hiddenInput.style.left = '-100px';
      hiddenInput.setAttribute('autocomplete', 'off');
      hiddenInput.setAttribute('autocorrect', 'off');
      hiddenInput.setAttribute('autocapitalize', 'off');
      hiddenInput.setAttribute('spellcheck', 'false');
      document.body.appendChild(hiddenInput);
    }

    // Focus hidden input on click/tap to trigger virtual keyboard
    document.addEventListener('click', () => {
      const gameView = document.getElementById('view-game');
      const isGameActive = gameView && gameView.classList.contains('view--active');
      const resultModal = document.getElementById('modal-result');
      const statsModal = document.getElementById('modal-stats');
      const isModalOpen = (resultModal && !resultModal.classList.contains('hidden')) || 
                           (statsModal && !statsModal.classList.contains('hidden'));
       
      if (isGameActive && !isModalOpen) {
        hiddenInput.focus();
      }
    });

    // Capture characters inputted from native keyboard (only accept Devanagari)
    hiddenInput.addEventListener('input', (e) => {
      const value = e.target.value;
      if (!value) return;

      for (const char of value) {
        if (/[\u0900-\u097F]/.test(char)) {
          _onKey?.({ type: 'char', value: char });
        }
      }
      e.target.value = ''; // clear for next keystroke
    });

    // Capture action keys (Enter/Backspace) which do not trigger 'input' on empty text box
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Backspace') {
        _onKey?.({ type: 'backspace' });
      } else if (e.key === 'Enter') {
        _onKey?.({ type: 'enter' });
      }
    });
  }

  return { init, updateColors, reset };
})();
