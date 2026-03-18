let recognition;
let transcriptText = "";
let startTime;
let isRecording = false;

const recordBtn = document.getElementById("recordBtn");

/* SPEECH SETUP */
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = function (event) {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            finalText += event.results[i][0].transcript + " ";
        }

        transcriptText = finalText.trim();
        document.getElementById("transcript").innerText = transcriptText;

        // Run full analysis
        runFullAnalysis(transcriptText);
    };
}

/* RECORD TOGGLE */
recordBtn.onclick = () => {
    if (isRecording) {
        recognition.stop();
        recordBtn.innerText = "🎤 Start";
    } else {
        recognition.start();
        startTime = new Date();
        recordBtn.innerText = "⏹ Stop";
    }
    isRecording = !isRecording;
};

/* COPY */
function copyText() {
    navigator.clipboard.writeText(transcriptText);
    alert("Copied!");
}

/* DOWNLOAD */
function downloadText() {
    const blob = new Blob([transcriptText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transcript.txt";
    link.click();
}

/* CLEAR */
function clearTranscript() {
    transcriptText = "";
    document.getElementById("transcript").innerText = "";
    document.getElementById("argumentStructure").innerHTML = "";
    document.getElementById("fallacies").innerHTML = "";
}

/* MASTER FUNCTION */
function runFullAnalysis(text) {
    document.getElementById("argumentStructure").innerHTML =
        analyzeArgumentStructure(text);

    document.getElementById("fallacies").innerHTML =
        detectFallacies(text);

    calculateWPM(text);
    confidenceAnalysis(text);
    toneAnalysis(text);
}

/* ARGUMENT STRUCTURE */
function analyzeArgumentStructure(text) {
    const lowerText = text.toLowerCase();
    let result = "";
    let found = false;

    const claimPatterns = ["should", "must", "i believe", "in my opinion"];
    claimPatterns.forEach(p => {
        if (lowerText.includes(p)) {
            const regex = new RegExp(`.*?${p}.*?(?=\\bbecause\\b|$)`, "i");
            const match = text.match(regex);
            if (match) result += `<p class="claim">✔ Claim: ${match[0].trim()}</p>`;
            found = true;
        }
    });

    const reasonPatterns = ["because", "since", "the reason is"];
    reasonPatterns.forEach(p => {
        const regex = new RegExp(`(${p}.*?)((?=\\.|$))`, "i");
        const match = text.match(regex);
        if (match) result += `<p class="reason">✔ Reason: ${match[0].trim()}</p>`;
        found = true;
    });

    const evidencePatterns = ["for example", "for instance", "according to", "data shows"];
    evidencePatterns.forEach(p => {
        const regex = new RegExp(`(${p}.*?)(?=\\.|$)`, "i");
        const match = text.match(regex);
        if (match) result += `<p class="evidence">✔ Evidence: ${match[0].trim()}</p>`;
        found = true;
    });

    const counterPatterns = ["however", "on the other hand", "some people argue", "although"];
    counterPatterns.forEach(p => {
        const regex = new RegExp(`(${p}.*?)(?=\\.|$)`, "i");
        const match = text.match(regex);
        if (match) result += `<p class="counter">✔ Counter-Argument: ${match[0].trim()}</p>`;
        found = true;
    });

    if (!found) result = "<p>No clear argument structure found</p>";
    return result;
}

/* LOGICAL FALLACIES */
function detectFallacies(text) {
    const lower = text.toLowerCase();
    let result = "";
    let found = false;

    const adHominem = ["you are stupid", "you are idiot"];
    adHominem.forEach(p => {
        if (lower.includes(p)) {
            result += `<p class="fallacy">❌ Ad Hominem detected: "${p}"</p>`;
            found = true;
        }
    });

    if (lower.match(/either .* or .*/i)) {
        result += `<p class="fallacy">❌ False Dilemma detected</p>`;
        found = true;
    }

    const slippery = ["this will lead to disaster", "everything will collapse"];
    slippery.forEach(p => {
        if (lower.includes(p)) {
            result += `<p class="fallacy">❌ Slippery Slope detected: "${p}"</p>`;
            found = true;
        }
    });

    const overgen = ["always", "never", "everyone"];
    overgen.forEach(p => {
        if (lower.includes(p)) {
            result += `<p class="fallacy">❌ Overgeneralization detected: "${p}"</p>`;
            found = true;
        }
    });

    const emotion = ["everyone will suffer", "this is heartbreaking"];
    emotion.forEach(p => {
        if (lower.includes(p)) {
            result += `<p class="fallacy">❌ Appeal to Emotion detected: "${p}"</p>`;
            found = true;
        }
    });

    if (!found) result = "<p>No logical fallacies detected</p>";
    return result;
}

/* WPM */
function calculateWPM(text) {
    const words = text.split(" ").length;
    const time = (new Date() - startTime) / 60000;
    document.getElementById("wpm").innerText = Math.round(words / time);
}

/* CONFIDENCE */
function confidenceAnalysis(text) {
    let score = 100;
    if (text.includes("um") || text.includes("uh")) score -= 10;
    if (text.length < 20) score -= 20;
    document.getElementById("confidence").innerText = score;
    aiScore(score, text);
}

/* TONE */
function toneAnalysis(text) {
    let tone = "Neutral";
    if (text.includes("!")) tone = "Aggressive";
    if (text.includes("please")) tone = "Persuasive";
    document.getElementById("tone").innerText = tone;
}

/* AI SCORE */
function aiScore(conf, text) {
    let score = conf;
    if (text.includes("because")) score += 5;
    if (text.includes("for example")) score += 5;
    score = Math.min(100, score);
    document.getElementById("aiScore").innerText = score;
    document.getElementById("strengthBar").style.width = score + "%";
}

/* SESSION STORAGE */
function saveSession() {
    let history = JSON.parse(localStorage.getItem("debateHistory")) || [];
    history.push(transcriptText);
    localStorage.setItem("debateHistory", JSON.stringify(history));
}

/* ================== AI REPLAY SYSTEM ================== */
const startReplayBtn = document.getElementById('startReplay');
const replayArea = document.getElementById('replayArea');
const annotationArea = document.getElementById('annotationArea');

const exampleAnnotations = [
    { wordIndex: 0, note: "Strong start ✅" },
    { wordIndex: 3, note: "Good argument 💡" },
    { wordIndex: 7, note: "Could speak slower ⚠️" },
];

startReplayBtn.addEventListener('click', () => {
    const text = transcriptText.trim();
    if (!text) {
        alert("Please speak or type text first!");
        return;
    }

    const words = text.split(" ");
    replayArea.innerHTML = "";
    annotationArea.innerHTML = "";

    let i = 0;
    const interval = setInterval(() => {
        if (i >= words.length) {
            clearInterval(interval);
            annotationArea.innerHTML = "Replay finished!";
            return;
        }

        replayArea.innerHTML += words[i] + " ";

        const annotation = exampleAnnotations.find(a => a.wordIndex === i);
        if (annotation) annotationArea.innerHTML = annotation.note;
        else annotationArea.innerHTML = "";

        i++;
    }, 500); // 500ms per word
});
