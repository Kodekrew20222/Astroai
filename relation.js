// const API_KEY = "";
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

let totalSessionTokens = 0;

function isCasualMessage(text) {
  const casualWords = [
    "hi",
    "hello",
    "hey",
    "hii",
    "hlw",
    "good morning",
    "good evening",
    "good afternoon",
    "how are you",
    "what's up",
    "sup",
    "yo",
  ];

  const cleaned = text.toLowerCase().trim();

  return casualWords.some((word) => cleaned === word || cleaned.includes(word));
}

let chatHistory = [];
let isAutoSpeak = true;
let userProfile = {};
let isSpeaking = false;
let isPaused = false;
let currentUtterance = null;

const now = new Date();
const chatContainer = document.getElementById("chat-container");
const questionInput = document.getElementById("userQuestion");
const avatarVideo = document.getElementById("avatar-video");
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwcIJ5YwlHSZdhpUMFvbN6Wq84Kc_NkUZ6mNug9yg0zj4JYtJ6ewXQdtgFpp6f8BtXa5Q/exec";
let questionCount = 0;
const MAX_QUESTIONS = 5;

// 1. Navigation from Setup to Chat
document.getElementById("start-chat").onclick = () => {
  // Partner 1 fields
  const name1El = document.getElementById("user1Name");
  const loc1El = document.getElementById("user1Loc");
  const dob1El = document.getElementById("user1Dob");
  const tob1El = document.getElementById("user1Tob");

  // Partner 2 fields
  const name2El = document.getElementById("user2Name");
  const loc2El = document.getElementById("user2Loc");
  const dob2El = document.getElementById("user2Dob");
  const tob2El = document.getElementById("user2Tob");

  const allFields = [
    name1El,
    loc1El,
    dob1El,
    tob1El,
    name2El,
    loc2El,
    dob2El,
    tob2El,
  ];

  // 🔁 Reset previous errors
  allFields.forEach((el) => el.classList.remove("is-invalid"));

  let isValid = true;

  // ✅ Field validations
  allFields.forEach((el) => {
    if (!el.value || !el.value.toString().trim()) {
      el.classList.add("is-invalid");
      isValid = false;
    }
  });

  // ✅ DOB future check (for both partners)
  const today = new Date().toISOString().split("T")[0];
  if (dob1El.value && dob1El.value > today) {
    dob1El.classList.add("is-invalid");
    isValid = false;
  }
  if (dob2El.value && dob2El.value > today) {
    dob2El.classList.add("is-invalid");
    isValid = false;
  }

  // ❌ Stop if invalid
  if (!isValid) return;

  // ✅ Continue flow
  userProfile = {
    partner1: {
      name: name1El.value || "Partner 1",
      loc: loc1El.value,
      dob: dob1El.value,
      tob: tob1El.value,
    },
    partner2: {
      name: name2El.value || "Partner 2",
      loc: loc2El.value,
      dob: dob2El.value,
      tob: tob2El.value,
    },
  };

  document.getElementById("setup-step").classList.add("hidden");
  document.getElementById("chat-step").classList.remove("hidden");

  chatHistory.push({
    role: "user",
    parts: [
      {
        text: `Context: I want a relationship / compatibility astrology reading for two people.
Partner 1: ${userProfile.partner1.name}, born ${userProfile.partner1.dob} at ${userProfile.partner1.tob} in ${userProfile.partner1.loc}.
Partner 2: ${userProfile.partner2.name}, born ${userProfile.partner2.dob} at ${userProfile.partner2.tob} in ${userProfile.partner2.loc}.
Act as my personal mystic relationship astrologer, analyzing the compatibility, dynamics and shared destiny between these two people.`,
      },
    ],
  });

  console.log("DOB VALUES:", dob1El.value, dob2El.value);

  const body = new URLSearchParams();
  body.append("partner1_name", userProfile.partner1.name);
  body.append("partner1_location", userProfile.partner1.loc);
  body.append("partner1_dob", userProfile.partner1.dob);
  body.append("partner1_tob", userProfile.partner1.tob);
  body.append("partner2_name", userProfile.partner2.name);
  body.append("partner2_location", userProfile.partner2.loc);
  body.append("partner2_dob", userProfile.partner2.dob);
  body.append("partner2_tob", userProfile.partner2.tob);

  fetch(WEB_APP_URL, {
    method: "POST",
    body: body,
  })
    .then((res) => res.json())
    .then((data) => console.log("Saved:", data))
    .catch((err) => console.error("Sheet Error:", err));
};

// 2. The Chat Execution
const sendMessage = async () => {
  if (questionCount >= MAX_QUESTIONS) {
    appendMessage(
      "⚠️ You have reached your free question limit. Please try again later.",
      "ai-msg",
    );
    return;
  }

  let text = questionInput.value.trim();

  // If regenerate, use last message
  if (!text && lastUserMessage) {
    text = lastUserMessage;
  }

  if (!text) return;

  questionCount++;
  lastUserMessage = text;

  // 🔇 Stop any ongoing speech before new request
  window.speechSynthesis.cancel();
  isSpeaking = false;
  isPaused = false;

  const now = new Date();
  const formattedDateTime = now.toLocaleString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // 🧠 Detect casual message
  const isCasualMessage = (msg) => {
    const casualWords = [
      "hi",
      "hello",
      "hey",
      "hii",
      "hlw",
      "good morning",
      "good evening",
      "good afternoon",
      "how are you",
      "what's up",
      "sup",
      "yo",
    ];
    const cleaned = msg.toLowerCase().trim();
    return casualWords.some(
      (word) => cleaned === word || cleaned.includes(word),
    );
  };

  let enrichedPrompt;

  const p1 = userProfile.partner1 || {};
  const p2 = userProfile.partner2 || {};

  if (isCasualMessage(text)) {
    // 💬 Casual mode
    enrichedPrompt = `
        Current Date & Time: ${formattedDateTime}

        Partner 1: ${p1.name}, born ${p1.dob} at ${p1.tob} in ${p1.loc}
        Partner 2: ${p2.name}, born ${p2.dob} at ${p2.tob} in ${p2.loc}

        User Message: ${text}

        Instruction:
        You are a friendly relationship astrologer assistant.
        Respond casually, briefly and human-like.
        DO NOT give a compatibility reading unless user asks.
        Keep response short (1-2 lines max).
        Tone:
        Warm, mystical, calm and conversational.

        IMPORTANT:
        Always end with a small friendly follow-up question to continue the conversation.

        Examples:
        - "How may I guide you and your partner today?"
        - "What would you like to know about your connection?"
        - "Is there something specific on your mind about this relationship?"
        `;
  } else {
    // 🔮 Relationship Astrology mode
    enrichedPrompt = `
        Current Date & Time: ${formattedDateTime}

        Partner 1: ${p1.name}, born ${p1.dob} at ${p1.tob} in ${p1.loc}
        Partner 2: ${p2.name}, born ${p2.dob} at ${p2.tob} in ${p2.loc}

        User Question: ${text}

        Instruction:

        You are an expert Vedic astrologer specializing in relationship and synastry (compatibility) readings.

        Using both partners' birth details above, provide a detailed, descriptive, emotionally engaging compatibility reading based on their cosmic connection.

        Your response should:
        - Be rich, deep, mystical and highly personalized to BOTH partners by name
        - Analyze the compatibility, chemistry and dynamic between ${p1.name} and ${p2.name}
        - Include detailed explanations and guidance grounded in Vedic astrology (e.g. Guna Milan, Moon sign compatibility, Venus/Mars dynamics) described in accessible language
        - Focus mainly on present and future relationship predictions
        - Cover emotional connection, communication style, romantic chemistry, long-term potential, challenges, and remedies/guidance for strengthening the bond
        - Use warm, human-like language
        - Sound like a real relationship astrology consultation
        - Avoid generic one-line answers
        - Expand meaningfully on love, trust, conflict areas, shared destiny and growth opportunities whenever relevant

        IMPORTANT:
        - Casual greetings like hi/hello should NOT receive a compatibility reading
        - Actual relationship/compatibility questions should receive long, immersive responses
        - ALWAYS end with a thoughtful follow-up question for further engagement

        Example follow-ups:
        - "Would you also like insight into your long-term compatibility?"
        - "Should I look deeper into how you two communicate?"
        - "Would you like remedies to strengthen this bond?"
        - "Do you want a month-wise prediction for your relationship as well?"
        `;
  }

  // Show User Message
  appendMessage(text, "user-msg");
  questionInput.value = "";

  chatHistory.push({
    role: "user",
    parts: [{ text: enrichedPrompt }],
  });

  // Loader
  const loadingId = "loader-" + Date.now();
  const loadingDiv = document.createElement("div");
  loadingDiv.id = loadingId;
  loadingDiv.className = "msg ai-msg italic text-mute";
  loadingDiv.innerHTML = `<span class="spinner-grow spinner-grow-sm text-info"></span> Consulting the heavens...`;
  chatContainer.appendChild(loadingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const response = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory,
        generationConfig: { temperature: 0.8 },
      }),
    });

    const data = await response.json();

    // Remove loader
    document.getElementById(loadingId).remove();

    // Handle API errors
    if (data.error) {
      console.log("API ERROR:", data.error);
      appendMessage("⚠️ " + data.error.message, "ai-msg");
      return;
    }

    //token counting
    if (data.usageMetadata) {
      const promptTokens = data.usageMetadata.promptTokenCount || 0;
      const candidatesTokens = data.usageMetadata.candidatesTokenCount || 0;
      const currentTotal =
        data.usageMetadata.totalTokenCount || promptTokens + candidatesTokens;

      // Accumulate tokens for the entire session
      totalSessionTokens += currentTotal;

      console.log(`✨ --- TOKEN BREAKDOWN ---`);
      console.log(`📥 Prompt Tokens (Input): ${promptTokens}`);
      console.log(`📤 Candidate Tokens (Output): ${candidatesTokens}`);
      console.log(`⚡ This Request Total: ${currentTotal}`);
      console.log(`🌌 SESSION CUMULATIVE TOTAL: ${totalSessionTokens}`);
    }

    if (data.candidates && data.candidates.length > 0) {
      const aiText = data.candidates[0].content.parts[0].text.replace(
        /[*#]/g,
        "",
      );

      appendMessage(aiText, "ai-msg");
      chatHistory.push({ role: "model", parts: [{ text: aiText }] });

      // 🔊 Speak if enabled
      if (isAutoSpeak) speak(aiText);
    } else {
      console.log("UNKNOWN RESPONSE:", data);
      appendMessage("⚠️ No response generated. Try again.", "ai-msg");
    }
  } catch (err) {
    console.error("FETCH ERROR:", err);

    const loader = document.getElementById(loadingId);
    if (loader) {
      loader.innerHTML = "⚠️ Connection lost. Try again.";
    }
  }
};

let lastUserMessage = "";

// Regenerate
const regenerateResponse = async () => {
  if (!lastUserMessage) return;

  // Remove last AI response from chatHistory
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    if (chatHistory[i].role === "model") {
      chatHistory.splice(i, 1);
      break;
    }
  }

  // Remove last AI message from UI
  const messages = document.querySelectorAll(".ai-msg");
  if (messages.length > 0) {
    messages[messages.length - 1].remove();
  }

  // Trigger again WITHOUT needing input
  questionInput.value = ""; // keep UI clean
  await sendMessage();
};

// UI Helpers
function appendMessage(text, className) {
  const div = document.createElement("div");
  div.className = `msg ${className}`;

  const messageText = document.createElement("div");
  messageText.innerText = text;
  div.appendChild(messageText);

  // ✅ Add actions ONLY for AI messages
  if (className === "ai-msg") {
    const actions = document.createElement("div");
    actions.className = "msg-actions mt-2 d-none";

    actions.innerHTML = `
            <button class="btn btn-sm btn-outline-light like-btn">👍</button>
            <button class="btn btn-sm btn-outline-light dislike-btn">👎</button>
            <button class="btn btn-sm btn-outline-light reload-btn">🔄</button>
        `;

    // 👍 Like
    actions.querySelector(".like-btn").onclick = () => {
      console.log("Liked:", text);
    };

    // 👎 Dislike
    actions.querySelector(".dislike-btn").onclick = () => {
      console.log("Disliked:", text);
    };

    // 🔄 Reload (Regenerate)
    actions.querySelector(".reload-btn").onclick = () => {
      regenerateResponse();
    };

    div.appendChild(actions);
  }

  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function speak(text) {
  // ✅ Stop old speech completely before new one
  window.speechSynthesis.cancel();

  // Reset states
  isSpeaking = false;
  isPaused = false;
  speakToggleBtn.innerText = isAutoSpeak
    ? "🔊 Auto-Speak: ON"
    : "🔇 Auto-Speak: OFF";

  currentUtterance = new SpeechSynthesisUtterance(text);

  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1;
  currentUtterance.volume = 1;

  // ▶ Start avatar animation
  if (avatarVideo) {
    avatarVideo.currentTime = 0;
    avatarVideo.play();
  }

  currentUtterance.onstart = () => {
    isSpeaking = true;
    isPaused = false;

    speakToggleBtn.innerText = "⏸ Pause";
  };

  currentUtterance.onend = () => {
    isSpeaking = false;
    isPaused = false;

    speakToggleBtn.innerText = "🔊 Auto-Speak: ON";

    if (avatarVideo) {
      avatarVideo.pause();
      avatarVideo.currentTime = 0;
    }
  };

  currentUtterance.onerror = () => {
    isSpeaking = false;
    isPaused = false;

    speakToggleBtn.innerText = "🔊 Auto-Speak: ON";

    if (avatarVideo) {
      avatarVideo.pause();
      avatarVideo.currentTime = 0;
    }
  };

  window.speechSynthesis.speak(currentUtterance);
}

const speakToggleBtn = document.getElementById("speak-toggle");

speakToggleBtn.onclick = () => {
  // 🔇 If currently speaking → Pause
  if (isSpeaking && !isPaused) {
    window.speechSynthesis.pause();

    isPaused = true;

    speakToggleBtn.innerText = "▶ Resume";

    if (avatarVideo) avatarVideo.pause();

    return;
  }

  // ▶ Resume paused speech
  if (isPaused) {
    window.speechSynthesis.resume();

    isPaused = false;

    speakToggleBtn.innerText = "⏸ Pause";

    if (avatarVideo) avatarVideo.play();

    return;
  }

  // 🔊 Toggle auto speak ON/OFF
  isAutoSpeak = !isAutoSpeak;

  speakToggleBtn.innerText = isAutoSpeak
    ? "🔊 Auto-Speak: ON"
    : "🔇 Auto-Speak: OFF";
};

// Event Listeners
document.getElementById("send-btn").onclick = sendMessage;
questionInput.onkeypress = (e) => {
  if (e.key === "Enter") sendMessage();
};

// Voice logic (Same as before)
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  document.getElementById("start-record").onclick = () => recognition.start();
  recognition.onresult = (e) => {
    questionInput.value = e.results[0][0].transcript;
    sendMessage();
  };
}
