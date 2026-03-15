// ═══════════════════════════════════════
//   SUKOON BY HM — script.js
// ═══════════════════════════════════════

// ⚠️ APNI GROQ API KEY YAHAN RAKHO
const API_KEY = "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";

// ── System Prompt ──
const SYSTEM_PROMPT = `You are "Sukoon by HM" — a warm, compassionate Islamic AI assistant designed to bring peace and comfort to people going through difficult times.

## Your Purpose:
When a user shares any problem, stress, sadness, anxiety, or any emotional difficulty — you respond with:
1. A warm, empathetic opening (never judgmental, never dismissive)
2. Relevant Quranic Ayat with proper reference
3. Brief Tafseer of the Ayat
4. Relevant Ahadith from: Sahih Bukhari, Sahih Muslim, Sunan Abu Dawood, Jami Tirmizi, Sunan Nasai, Sunan Ibn Majah — with proper book name + hadith number
5. A gentle, hopeful closing message

## Response Format (always follow this):

🌙 **Opening** — 2-3 lines of warm empathy

---

📖 **Quranic Guidance**
> [Arabic text of Ayat]
> *Translation: [Urdu + English both]*
> 📍 Surah [Name], Ayat [Number]

💡 **Tafseer (Brief):**
[2-3 lines simple explanation]

---

📿 **Hadith**
> "[Hadith text in English/Urdu]"
> 📍 [Book Name], [Hadith Number]

*(Include 2-3 Ahadith per response from different books when possible)*

---

🤍 **Closing Message**
[Warm, hopeful, encouraging — remind them Allah is always near]

---

## Tone Rules:
- Always warm, gentle, non-judgmental
- Never robotic — be genuinely caring
- Use "InshaAllah", "Alhamdulillah" naturally
- Never give fatwa or religious rulings
- Always encourage professional help for serious mental health issues
- Keep hope alive — Allah's mercy is infinite
- Mix Urdu and English naturally (Roman Urdu is fine)

## Language:
- Respond in the same language the user writes in
- If Roman Urdu — reply in Roman Urdu
- If English — reply in English
- Arabic only for Quranic text and Hadith

## Important:
- Always verify references are accurate
- Never fabricate Hadith or Ayat numbers
- Be a source of Sukoon (peace) — not more stress`;

// ── State ──
let messageHistory = [];
let isLoading = false;

// ── DOM Elements ──
const chatArea    = document.getElementById('chatArea');
const messages    = document.getElementById('messages');
const welcomeScr  = document.getElementById('welcomeScreen');
const userInput   = document.getElementById('userInput');
const sendBtn     = document.getElementById('sendBtn');
const sidebar     = document.getElementById('sidebar');
const overlay     = document.getElementById('sidebarOverlay');
const topicItems  = document.querySelectorAll('.topic-item');

// ── Auto resize textarea ──
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}

// ── Handle Enter key ──
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!isLoading && userInput.value.trim()) sendMessage();
  }
}

// ── Use topic from sidebar ──
function useTopic(topic) {
  // Mark active
  topicItems.forEach(t => t.classList.remove('active'));
  const matched = [...topicItems].find(t => t.textContent.includes(topic));
  if (matched) matched.classList.add('active');

  userInput.value = `I need guidance about: ${topic}`;
  autoResize(userInput);

  // Close sidebar on mobile
  if (window.innerWidth <= 768) toggleSidebar();

  sendMessage();
}

// ── New chat ──
function newChat() {
  messages.innerHTML = '';
  messageHistory = [];
  welcomeScr.style.display = '';
  userInput.value = '';
  userInput.style.height = 'auto';
  topicItems.forEach(t => t.classList.remove('active'));
}

// ── Toggle sidebar (mobile) ──
function toggleSidebar() {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

// ── Send message ──
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  // Hide welcome
  welcomeScr.style.display = 'none';

  // Add user message
  appendMessage('user', text);
  messageHistory.push({ role: 'user', content: text });

  // Reset input
  userInput.value = '';
  userInput.style.height = 'auto';

  // Show typing
  isLoading = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messageHistory
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('API Error Response:', errData);
      removeTyping();
      appendMessage('ai', `⚠️ Error: ${errData.error?.message || 'API key check karein'}. 🤍`);
      isLoading = false;
      sendBtn.disabled = false;
      return;
    }

    const data = await response.json();
    removeTyping();

    if (data.choices && data.choices[0]) {
      const reply = data.choices[0].message.content;
      messageHistory.push({ role: 'assistant', content: reply });
      appendMessage('ai', reply);
    } else {
      console.error('Unexpected response:', data);
      appendMessage('ai', '🌙 Maafi chahta hoon, abhi response nahi aa saka. Thodi der mein dobara try karein. InshaAllah sab theek hoga. 🤍');
    }

  } catch (err) {
    removeTyping();
    console.error('Fetch Error:', err);
    appendMessage('ai', '⚠️ Connection error aaya. F12 dabao aur Console mein error check karo. 🤍');
  }

  isLoading = false;
  sendBtn.disabled = false;
}

// ── Append message to chat ──
function appendMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg-group';

  const row = document.createElement('div');
  row.className = `msg-row ${role}`;

  const avatarHTML = role === 'ai'
    ? '<div class="msg-avatar ai">☽</div>'
    : '<div class="msg-avatar user">You</div>';

  const labelText = role === 'ai' ? 'Sukoon by HM' : 'You';

  const formattedContent = role === 'ai' ? formatAIResponse(content) : escapeHTML(content);

  const actionsHTML = role === 'ai' ? `
    <div class="msg-actions">
      <button class="msg-action-btn" onclick="copyMsg(this)">📋 Copy</button>
    </div>` : '';

  const bubbleClass = role === 'ai' ? 'bubble ai' : 'bubble user';

  row.innerHTML = `
    ${avatarHTML}
    <div class="msg-content">
      <div class="msg-label">${labelText}</div>
      <div class="${bubbleClass}">${formattedContent}</div>
      ${actionsHTML}
    </div>
  `;

  wrapper.appendChild(row);
  messages.appendChild(wrapper);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ── Format AI response (markdown-like) ──
function formatAIResponse(text) {
  return text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="section-divider">')
    // Reference lines (📍)
    .replace(/(📍 .+)/g, '<span class="reference">$1</span>')
    // Newlines
    .replace(/\n/g, '<br>');
}

// ── Escape HTML for user messages ──
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

// ── Typing indicator ──
function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'typing-wrap';
  wrap.id = 'typingIndicator';
  wrap.innerHTML = `
    <div class="msg-avatar ai">☽</div>
    <div class="typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  messages.appendChild(wrap);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typingIndicator');
  if (t) t.remove();
}

// ── Copy message ──
function copyMsg(btn) {
  const bubble = btn.closest('.msg-content').querySelector('.bubble');
  const text = bubble.innerText;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy', 2000);
  });
}

// ── Input send button enable/disable ──
userInput.addEventListener('input', () => {
  sendBtn.disabled = userInput.value.trim() === '' || isLoading;
});

// Initial state
sendBtn.disabled = true;