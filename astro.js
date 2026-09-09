// const API_KEY = "";
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

let totalSessionTokens = 0;

function isCasualMessage(text) {
    const casualWords = [
        "hi", "hello", "hey", "hii", "hlw",
        "good morning", "good evening", "good afternoon",
        "how are you", "what's up", "sup", "yo"
    ];

    const cleaned = text.toLowerCase().trim();

    return casualWords.some(word => cleaned === word || cleaned.includes(word));
}

let chatHistory = [];
let isAutoSpeak = true;
let userProfile = {};
let isSpeaking = false;
let isPaused = false;
let currentUtterance = null;

const now = new Date();
const chatContainer = document.getElementById('chat-container');
const questionInput = document.getElementById('userQuestion');
const avatarVideo = document.getElementById('avatar-video');
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwcIJ5YwlHSZdhpUMFvbN6Wq84Kc_NkUZ6mNug9yg0zj4JYtJ6ewXQdtgFpp6f8BtXa5Q/exec";
let questionCount = 0;
const MAX_QUESTIONS = 5;

// 1. Navigation from Setup to Chat
document.getElementById('start-chat').onclick = () => {

    const nameEl = document.getElementById('userName');
    const locEl  = document.getElementById('userLoc');
    const dobEl  = document.getElementById('userDob');
    const tobEl  = document.getElementById('userTob');

    // 🔁 Reset previous errors
    [nameEl, locEl, dobEl, tobEl].forEach(el => el.classList.remove("is-invalid"));

    let isValid = true;

    // ✅ Field validations
    if (!nameEl.value.trim()) {
        nameEl.classList.add("is-invalid");
        isValid = false;
    }

    if (!locEl.value.trim()) {
        locEl.classList.add("is-invalid");
        isValid = false;
    }

    if (!dobEl.value) {
        dobEl.classList.add("is-invalid");
        isValid = false;
    }

    if (!tobEl.value) {
        tobEl.classList.add("is-invalid");
        isValid = false;
    }

    // ✅ DOB future check
    const today = new Date().toISOString().split("T")[0];
    if (dobEl.value && dobEl.value > today) {
        dobEl.classList.add("is-invalid");
        isValid = false;
    }

    // ❌ Stop if invalid
    if (!isValid) return;

    // ✅ Continue flow
    userProfile = {
        name: nameEl.value || "Seeker",
        loc: locEl.value,
        dob: dobEl.value,
        tob: tobEl.value
    };

    document.getElementById('setup-step').classList.add('hidden');
    document.getElementById('chat-step').classList.remove('hidden');

    chatHistory.push({
        role: "user",
        parts: [{
            text: `Context: My name is ${userProfile.name}, born ${userProfile.dob} at ${userProfile.tob} in ${userProfile.loc}. Act as my personal mystic astrologer.`
        }]
    });

    console.log("DOB VALUE:", dobEl.value);

    const body = new URLSearchParams();
    body.append("name", userProfile.name);
    body.append("location", userProfile.loc);
    body.append("dob", userProfile.dob);
    body.append("tob", userProfile.tob);

    fetch(WEB_APP_URL, {
        method: "POST",
        body: body
    })
        .then(res => res.json())
        .then(data => console.log("Saved:", data))
        .catch(err => console.error("Sheet Error:", err));
};

// 2. The Chat Execution
const sendMessage = async () => {

    if (questionCount >= MAX_QUESTIONS) {
        appendMessage("⚠️ You have reached your free question limit. Please try again later.", "ai-msg");
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
        second: "2-digit"
    });

    // 🧠 Detect casual message
    const isCasualMessage = (msg) => {
        const casualWords = [
            "hi", "hello", "hey", "hii", "hlw",
            "good morning", "good evening", "good afternoon",
            "how are you", "what's up", "sup", "yo"
        ];
        const cleaned = msg.toLowerCase().trim();
        return casualWords.some(word => cleaned === word || cleaned.includes(word));
    };

    let enrichedPrompt;

    if (isCasualMessage(text)) {
        // 💬 Casual mode
        enrichedPrompt = `
        Current Date & Time: ${formattedDateTime}

        User Message: ${text}

        Instruction:
        You are a friendly astrologer assistant.
        Respond casually, briefly and human-like.
        DO NOT give astrology prediction unless user asks.
        Keep response short (1-2 lines max).
        Tone:
        Warm, mystical, calm and conversational.

        IMPORTANT:
        Always end with a small friendly follow-up question to continue the conversation.

        Examples:
        - "How may I guide you today?"
        - "What would you like to know?"
        - "Is there something specific troubling you lately?"
        `;
    } else {
        // 🔮 Astrology mode
        enrichedPrompt = `
        Current Date & Time: ${formattedDateTime}

        Seeker Profile:
        - Name: ${userProfile.name}
        - Date of Birth (DOB): ${userProfile.dob}
        - Time of Birth (TOB): ${userProfile.tob}
        - Place of Birth / Location: ${userProfile.loc}

        User Question: ${text}

        Instruction:
        You are an expert Vedic astrologer and numerologist.

        1. Numerological Analysis (Mandatory First Step):
           - Calculate Mulank (Root Number): Reduce the birth day number to a single digit (1-9). State the number and ruling planet clearly.
           - Calculate Bhagyank (Destiny Number): Sum all digits of the entire date of birth (Day + Month + Year) and reduce to a single digit (1-9). State the number and ruling planet clearly.
           - Briefly synthesize the core vibration of this Mulank-Bhagyank combination.

        2. Comprehensive Reading & Predictions:
           - Base your guidance and predictions directly on their Mulank, Bhagyank, birth time, location, and current planetary transit energies.
           - Provide a deep, mystical, emotionally resonant, and personalized reading directly answering their question.
           - Focus on current life phase, near-future forecasts, opportunities, and inner strengths/weaknesses.
           - Cover relevant dimensions (career, relationships, energy, spiritual path) with practical remedies/guidance where fitting.
           - Maintain a warm, grounded, professional astrologer tone—avoiding superficial one-line answers.

        3. Follow-up:
           - ALWAYS conclude with a thoughtful, context-specific follow-up question to invite further exploration.

        Example follow-ups:
        - "Would you like me to look into how your ruling planets align with your career in the coming months?"
        - "Should we explore remedies to balance the energies of your Mulank and Bhagyank?"
        - "Would you like insight into your relationship compatibility based on these numbers?"
        `;
    }

    // Show User Message
    appendMessage(text, 'user-msg');
    questionInput.value = "";

    chatHistory.push({
        role: "user",
        parts: [{ text: enrichedPrompt }]
    });

    // Loader
    const loadingId = "loader-" + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = "msg ai-msg italic text-mute";
    loadingDiv.innerHTML = `<span class="spinner-grow spinner-grow-sm text-info"></span> Consulting the heavens...`;
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: chatHistory,
                generationConfig: { temperature: 0.8 }
            })
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
            const currentTotal = data.usageMetadata.totalTokenCount || (promptTokens + candidatesTokens);

            // Accumulate tokens for the entire session
            totalSessionTokens += currentTotal;

            console.log(`✨ --- TOKEN BREAKDOWN ---`);
            console.log(`📥 Prompt Tokens (Input): ${promptTokens}`);
            console.log(`📤 Candidate Tokens (Output): ${candidatesTokens}`);
            console.log(`⚡ This Request Total: ${currentTotal}`);
            console.log(`🌌 SESSION CUMULATIVE TOTAL: ${totalSessionTokens}`);
        }

        if (data.candidates && data.candidates.length > 0) {
            const aiText = data.candidates[0].content.parts[0].text.replace(/[*#]/g, '');

            appendMessage(aiText, 'ai-msg');
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
    const messages = document.querySelectorAll('.ai-msg');
    if (messages.length > 0) {
        messages[messages.length - 1].remove();
    }

    // Trigger again WITHOUT needing input
    questionInput.value = ""; // keep UI clean
    await sendMessage();
};

// UI Helpers
function appendMessage(text, className) {
    const div = document.createElement('div');
    div.className = `msg ${className}`;

    const messageText = document.createElement('div');
    messageText.innerText = text;
    div.appendChild(messageText);

    // ✅ Add actions ONLY for AI messages
    if (className === 'ai-msg') {
        const actions = document.createElement('div');
        actions.className = "msg-actions mt-2 d-none";

        actions.innerHTML = `
            <button class="btn btn-sm btn-outline-light like-btn">👍</button>
            <button class="btn btn-sm btn-outline-light dislike-btn">👎</button>
            <button class="btn btn-sm btn-outline-light reload-btn">🔄</button>
        `;

        // 👍 Like
        actions.querySelector('.like-btn').onclick = () => {
            console.log("Liked:", text);
        };

        // 👎 Dislike
        actions.querySelector('.dislike-btn').onclick = () => {
            console.log("Disliked:", text);
        };

        // 🔄 Reload (Regenerate)
        actions.querySelector('.reload-btn').onclick = () => {
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

const speakToggleBtn = document.getElementById('speak-toggle');

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
document.getElementById('send-btn').onclick = sendMessage;
questionInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

// Voice logic (Same as before)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    document.getElementById('start-record').onclick = () => recognition.start();
    recognition.onresult = (e) => {
        questionInput.value = e.results[0][0].transcript;
        sendMessage();
    };
}
