# 🔐 Password Strength Tester

A fully self-contained, single-file web application that analyses passwords in real time against eight OWASP-aligned security rules — with no frameworks, no libraries, and no internet connection required.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat)
![Single File](https://img.shields.io/badge/size-single%20file-blue?style=flat)

---

## ✨ Features

### Security Analysis
- **8 OWASP-based rules** evaluated in real time as you type
- **Keyboard walk detection** — catches `qwerty`, `1234`, `asdf`, and their reverses
- **Dictionary word detection** — strips digits/symbols and checks for embedded common words like `sunshine` or `dragon`
- **85-entry common password blacklist** covering classic bads, keyboard patterns, and name variants
- **Passphrase bonus** — rewards 4+ word inputs like `swift canyon mango falcon`

### Visual Feedback
- **5-segment strength meter** — each lit segment conveys strength independent of colour (colorblind-safe)
- **Strength levels** with distinct icons: 🔓 Very Weak · ⚠️ Weak · 🔒 Fair · 🛡️ Strong · 🏆 Very Strong
- **Live checklist** with ✅ / ❌ icons and a flip animation on every state change
- **Time-to-crack estimate** — calculated in log-space to handle any password length without overflow
- **Entropy display** in bits alongside each history entry

### Generators
- **💬 Generate Passphrase** — 4 unique random words from a 180-word list, capitalised + number + symbol. Always scores Very Strong.
- **⚡ Generate Strong Password** — 18 characters, all character classes guaranteed, Fisher-Yates shuffled using `crypto.getRandomValues`

### UX & Extras
- **Copy password** 📋 to clipboard in one click
- **Copy Strength Report** — exports a plain-text summary with masked password, level, entropy, time-to-crack, and full rule results
- **Strength history** — last 3 distinct attempts shown (masked, in-memory only — nothing persisted)
- **Show/hide toggle** with localStorage preference memory across sessions
- **Verdict box** with personalised improvement tips for every failing rule

### Accessibility
- `aria-live="polite"` on the strength badge — screen readers announce changes automatically
- `aria-pressed` state on the show/hide toggle
- `aria-atomic` ensures the icon + label are read as one unit
- Colorblind-safe design (strength readable by segment count alone)
- Fully keyboard-navigable

---

## 🚀 Getting Started

No installation. No build step. No server.

```bash
# Clone the repo
git clone https://github.com/your-username/password-strength-tester.git

# Open the file in your browser
open password-strength-tester.html
```

Or just [download the file](./password-strength-tester.html) and double-click it.

---

## 📋 Rules Reference

| # | Rule | Type | Points |
|---|------|------|--------|
| 1 | Minimum 8 characters | OWASP | 1 |
| 2 | Uppercase letter (A–Z) | OWASP | 1 |
| 3 | Lowercase letter (a–z) | OWASP | 1 |
| 4 | At least one digit (0–9) | OWASP | 1 |
| 5 | Special character (!@#$…) | OWASP | 1 |
| 6 | Not in common password list | OWASP | 1 |
| 7 | No weak patterns (aaaa, qwerty, 1234…) | Pattern | 1 |
| 8 | No bare dictionary words | Pattern | 1 |
| ⭐ | Passphrase bonus (4+ words) | Bonus | +1 |

### Strength Levels

| Score | Level | Colour |
|-------|-------|--------|
| 0 – 1 | 🔓 Very Weak | Red |
| 2 – 3 | ⚠️ Weak | Orange |
| 4 – 5 | 🔒 Fair | Yellow |
| 6 – 7 | 🛡️ Strong | Green |
| 8 – 9 | 🏆 Very Strong | Dark Green |

---

## 🧪 Testing

### Quick manual checks

| Password | Expected Level | Rule Targeted |
|----------|---------------|---------------|
| `abc` | 🔓 Very Weak | Minimum length |
| `password123` | ⚠️ Weak | Common password blacklist |
| `qwerty123!A` | 🔒 Fair | Keyboard walk (qwerty) |
| `Sunshine99!` | 🔒 Fair | Dictionary word (sunshine) |
| `aaaa1234!A` | 🔒 Fair | Repeated characters |
| `Tr0ub4dor&3X` | 🛡️ Strong | Passes 7/8 core rules |
| `Swift canyon mango falcon47!` | 🏆 Very Strong | All rules + passphrase bonus |

### Automated console tests

Open the app in your browser, press **F12** to open DevTools, go to the **Console** tab, and paste:

```js
const tests = [
  ["abc",            "minLength",      false],
  ["abcdefgh",       "minLength",      true ],
  ["password123",    "notCommon",      false],
  ["X7$uniquePass",  "notCommon",      true ],
  ["qwerty123!A",    "noWeakPatterns", false],
  ["aaaa1234!Ax",    "noWeakPatterns", false],
  ["Tr0ub4dor&3X",   "noWeakPatterns", true ],
  ["Sunshine99!",    "noDictionary",   false],
  ["Xk9#mPqR7!vZw",  "noDictionary",   true ],
  ["swift canyon mango falcon", "passphrase", true ],
  ["oneword",         "passphrase",    false],
];
let ok = 0;
tests.forEach(([p, r, e]) => {
  const got = evaluateRules(p)[r];
  const pass = got === e;
  console.log(pass ? "✅" : "❌", `"${p}" → ${r}: expected ${e}, got ${got}`);
  if (pass) ok++;
});
console.log(`\n${ok}/${tests.length} tests passed`);
```

`evaluateRules` is in the global scope so it's callable directly — no setup needed.

---

## 🏗️ Architecture

Everything lives in **one file** (`password-strength-tester.html`):

```
password-strength-tester.html
├── <style>      — all CSS (dark glassmorphism design, responsive)
├── <body>       — semantic HTML5 with ARIA attributes
└── <script>     — vanilla JS, split into 10 commented sections:
    ├── 1. Constants      — blacklists, word lists, level metadata
    ├── 2. DOM refs       — cached element handles
    ├── 3. State          — runtime variables + history array
    ├── 4. Event listeners — input (debounced 150ms), toggle, copy, generate
    ├── 5. Analysis       — evaluateRules(), countScore(), scoreToLevel()
    ├── 6. Rules          — one function per rule
    ├── 7. UI updaters    — meter, checklist, crack, verdict, history
    ├── 8. Generators     — passphrase + strong password
    ├── 9. Utilities      — debounce, entropy, timeToCrack, clipboard
    └── 10. Init          — restore localStorage preferences
```

### Key algorithms

**Time-to-crack** uses log₁₀ arithmetic throughout to avoid JS number overflow for long passwords:
```
log₁₀(seconds) = length × log₁₀(charsetSize) − log₁₀(10,000,000,000)
```

**Keyboard walk detection** checks for 4+ character substrings from 8 reference strings (QWERTY rows, number row, alphabet — forward and reverse).

**Dictionary detection** strips all non-alpha characters first, then matches against 35 common words — catching leet-speak variants like `p@ssw0rd` or `sunsh1ne99`.

---

## 🔭 Potential Improvements

- [ ] HaveIBeenPwned API integration (k-anonymity model — privacy-safe)
- [ ] Inline zxcvbn engine for professional-grade pattern scoring
- [ ] Expanded dictionary (10,000+ words)
- [ ] Multiple attack-speed tiers in the time-to-crack display
- [ ] High-contrast / symbols-only accessibility mode
- [ ] Shareable URL that encodes the strength report in the hash

---

## 🛠️ Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Markup | HTML5 | Semantic elements + ARIA support |
| Styling | CSS3 | Custom properties, grid, keyframe animations |
| Logic | Vanilla JS (ES2020) | Zero dependencies, works offline |
| Randomness | `crypto.getRandomValues` | Cryptographic quality for generators |
| Storage | `localStorage` | Lightweight preference persistence |

---

## 📄 License

MIT — do whatever you want with it.

---

> Built as a learning project to demonstrate OWASP password guidelines, accessible UI design, and zero-dependency web development.
