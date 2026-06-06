// ==========================================
// PianoForSol - Core Application Logic
// ==========================================

// --- State Management ---
const state = {
    currentTab: 'home',
    stars: 0,
    streak: 0,
    lastPlayedDate: null,
    completedLessons: [], // list of lesson IDs completed
    activeSession: null,  // { type: 'lesson'|'practice'|'song', id: string, stepIndex: number, currentNote: string }
    practiceHighScore: 0,
    
    // Audio / Microphone State
    micActive: false,
    audioContext: null,
    analyser: null,
    microphoneStream: null,
    pitchInterval: null
};

// --- Hebrew Notes Database ---
// Base note is E4 (First Line of Treble Clef) at offset 0.
// A step of 0.5 offset equals a line/space distance (10px in SVG).
const NOTES_DB = [
    { name: 'A3', freq: 220.00, hebrew: 'לה', english: 'A3', offset: -2.0, ledger: true },
    { name: 'B3', freq: 246.94, hebrew: 'סי', english: 'B3', offset: -1.5 },
    { name: 'C4', freq: 261.63, hebrew: 'דו', english: 'C4', offset: -1.0, ledger: true }, // Middle C
    { name: 'C#4', freq: 277.18, hebrew: 'דו#', english: 'C#4', offset: -1.0, accidental: 'sharp' },
    { name: 'D4', freq: 293.66, hebrew: 'רה', english: 'D4', offset: -0.5 },
    { name: 'D#4', freq: 311.13, hebrew: 'רה#', english: 'D#4', offset: -0.5, accidental: 'sharp' },
    { name: 'E4', freq: 329.63, hebrew: 'מי', english: 'E4', offset: 0.0 }, // 1st Line
    { name: 'F4', freq: 349.23, hebrew: 'פה', english: 'F4', offset: 0.5 }, // 1st Space
    { name: 'F#4', freq: 369.99, hebrew: 'פה#', english: 'F#4', offset: 0.5, accidental: 'sharp' },
    { name: 'G4', freq: 392.00, hebrew: 'סול', english: 'G4', offset: 1.0 }, // 2nd Line
    { name: 'G#4', freq: 415.30, hebrew: 'סול#', english: 'G#4', offset: 1.0, accidental: 'sharp' },
    { name: 'A4', freq: 440.00, hebrew: 'לה', english: 'A4', offset: 1.5 }, // 2nd Space
    { name: 'A#4', freq: 466.16, hebrew: 'לה#', english: 'A#4', offset: 1.5, accidental: 'sharp' },
    { name: 'B4', freq: 493.88, hebrew: 'סי', english: 'B4', offset: 2.0 }, // 3rd Line
    { name: 'C5', freq: 523.25, hebrew: 'דו', english: 'C5', offset: 2.5 }, // 3rd Space
    { name: 'C#5', freq: 554.37, hebrew: 'דו#', english: 'C#5', offset: 2.5, accidental: 'sharp' },
    { name: 'D5', freq: 587.33, hebrew: 'רה', english: 'D5', offset: 3.0 }, // 4th Line
    { name: 'D#5', freq: 622.25, hebrew: 'רה#', english: 'D#5', offset: 3.0, accidental: 'sharp' },
    { name: 'E5', freq: 659.25, hebrew: 'מי', english: 'E5', offset: 3.5 }, // 4th Space
    { name: 'F5', freq: 698.46, hebrew: 'פה', english: 'F5', offset: 4.0 }, // 5th Line
    { name: 'F#5', freq: 739.99, hebrew: 'פה#', english: 'F#5', offset: 4.0, accidental: 'sharp' },
    { name: 'G5', freq: 783.99, hebrew: 'סול', english: 'G5', offset: 4.5 }, // Space above staff
    { name: 'G#5', freq: 830.61, hebrew: 'סול#', english: 'G#5', offset: 4.5, accidental: 'sharp' },
    { name: 'A5', freq: 880.00, hebrew: 'לה', english: 'A5', offset: 5.0, ledger: true }, // 1st Ledger line above
    { name: 'A#5', freq: 932.33, hebrew: 'לה#', english: 'A#5', offset: 5.0, accidental: 'sharp' },
    { name: 'B5', freq: 987.77, hebrew: 'סי', english: 'B5', offset: 5.5, ledger: true },
    { name: 'C6', freq: 1046.50, hebrew: 'דו', english: 'C6', offset: 6.0, ledger: true } // 2nd Ledger line above
];

// --- Interactive Curriculum (שיעורים) ---
const LESSONS_DB = [
    {
        id: 'lesson-1',
        title: 'שיעור 1: התו דו אמצעי (C4)',
        description: 'התו הבסיסי והחשוב ביותר בפסנתר',
        steps: [
            {
                text: 'ברוכים הבאים! נתחיל מהתו <strong>דו אמצעי</strong>. הוא נמצא מתחת לחמישה, ויושב על קו עזר קטן משלו. נגנו אותו בפסנתר שלכם!',
                targetNote: 'C4',
                highlightKeys: ['C4']
            },
            {
                text: 'מעולה! בואו ננגן את התו <strong>דו אמצעי</strong> פעם נוספת כדי לזכור אותו.',
                targetNote: 'C4',
                highlightKeys: ['C4']
            },
            {
                text: 'נפלא! השלמתם את ההיכרות עם התו דו.',
                targetNote: null,
                isCompletedStep: true
            }
        ]
    },
    {
        id: 'lesson-2',
        title: 'שיעור 2: תווים ראשונים - דו, רה, מי',
        description: 'נלמד את שלושת התווים הראשונים בסולם',
        steps: [
            {
                text: 'התו השני הוא <strong>רה</strong> (D4). הוא יושב ממש מתחת לקו הראשון של החמישה. נגנו אותו!',
                targetNote: 'D4',
                highlightKeys: ['D4']
            },
            {
                text: 'התו השלישי הוא <strong>מי</strong> (E4). הוא יושב בדיוק על הקו הראשון (התחתון) של החמישה. נגנו אותו!',
                targetNote: 'E4',
                highlightKeys: ['E4']
            },
            {
                text: 'עכשיו בואו ננגן רצף עולה. נגנו את התו <strong>דו</strong>.',
                targetNote: 'C4',
                highlightKeys: ['C4']
            },
            {
                text: 'עכשיו נגנו את התו <strong>רה</strong>.',
                targetNote: 'D4',
                highlightKeys: ['D4']
            },
            {
                text: 'ולסיום, נגנו את התו <strong>מי</strong>.',
                targetNote: 'E4',
                highlightKeys: ['E4']
            },
            {
                text: 'כל הכבוד! אתם כבר יודעים לנגן שלושה תווים!',
                targetNote: null,
                isCompletedStep: true
            }
        ]
    },
    {
        id: 'lesson-3',
        title: 'שיעור 3: התווים שעל הקווים (מי, סול, סי)',
        description: 'נכיר את התווים המונחים על קווי החמישה',
        steps: [
            {
                text: 'כבר למדנו שהקו הראשון הוא התו <strong>מי</strong>. נגנו אותו לחימום!',
                targetNote: 'E4',
                highlightKeys: ['E4']
            },
            {
                text: 'הקו השני הוא התו <strong>סול</strong> (G4). זהו הקו שממנו מתחיל לצייר מפתח סול! נגנו אותו.',
                targetNote: 'G4',
                highlightKeys: ['G4']
            },
            {
                text: 'הקו השלישי (האמצעי בחמישה) הוא התו <strong>סי</strong> (B4). נגנו אותו.',
                targetNote: 'B4',
                highlightKeys: ['B4']
            },
            {
                text: 'בואו ננגן אותם ברצף: נגנו <strong>מי</strong> (קו ראשון).',
                targetNote: 'E4',
                highlightKeys: ['E4']
            },
            {
                text: 'נגנו <strong>סול</strong> (קו שני).',
                targetNote: 'G4',
                highlightKeys: ['G4']
            },
            {
                text: 'נגנו <strong>סי</strong> (קו שלישי).',
                targetNote: 'B4',
                highlightKeys: ['B4']
            },
            {
                text: 'מדהים! שיננתם את שלושת הקווים הראשונים!',
                targetNote: null,
                isCompletedStep: true
            }
        ]
    },
    {
        id: 'lesson-4',
        title: 'שיעור 4: התווים שבמרווחים (פה, לה, דו)',
        description: 'נלמד לקרוא את התווים שיושבים בין הקווים',
        steps: [
            {
                text: 'התווים שבמרווחים קלים מאוד לזיהוי. המרווח הראשון הוא התו <strong>פה</strong> (F4). נגנו אותו!',
                targetNote: 'F4',
                highlightKeys: ['F4']
            },
            {
                text: 'המרווח השני הוא התו <strong>לה</strong> (A4). נגנו אותו!',
                targetNote: 'A4',
                highlightKeys: ['A4']
            },
            {
                text: 'המרווח השלישי הוא התו <strong>דו גבוה</strong> (C5). נגנו אותו!',
                targetNote: 'C5',
                highlightKeys: ['C5']
            },
            {
                text: 'בואו נתרגל את המרווחים: נגנו <strong>פה</strong>.',
                targetNote: 'F4',
                highlightKeys: ['F4']
            },
            {
                text: 'נגנו <strong>לה</strong>.',
                targetNote: 'A4',
                highlightKeys: ['A4']
            },
            {
                text: 'נגנו <strong>דו גבוה</strong>.',
                targetNote: 'C5',
                highlightKeys: ['C5']
            },
            {
                text: 'מעולה! עכשיו אתם מכירים גם את המרווחים!',
                targetNote: null,
                isCompletedStep: true
            }
        ]
    },
    {
        id: 'lesson-5',
        title: 'שיעור 5: עלייה בסולם (דו עד סול)',
        description: 'תרגול רצף עולה מלא וקריאה משולבת',
        steps: [
            {
                text: 'בשיעור המסכם נתרגל שילוב של קווים ומרווחים. נתחיל בנגינת התו <strong>דו</strong>.',
                targetNote: 'C4',
                highlightKeys: ['C4']
            },
            {
                text: 'נגנו את התו הבא - <strong>רה</strong>.',
                targetNote: 'D4',
                highlightKeys: ['D4']
            },
            {
                text: 'נגנו את התו הבא - <strong>מי</strong> (קו ראשון).',
                targetNote: 'E4',
                highlightKeys: ['E4']
            },
            {
                text: 'נגנו את התו הבא - <strong>פה</strong> (מרווח ראשון).',
                targetNote: 'F4',
                highlightKeys: ['F4']
            },
            {
                text: 'ולסיום, נגנו את התו <strong>סול</strong> (קו שני).',
                targetNote: 'G4',
                highlightKeys: ['G4']
            },
            {
                text: 'אלופים! השלמתם את קורס התווים הבסיסי שלכם! כעת אתם מוכנים לנגן שירים.',
                targetNote: null,
                isCompletedStep: true
            }
        ]
    }
];

// --- Songs Database ---
const SONGS_DB = [
    {
        id: 'song-1',
        title: 'יונתן הקטן 🐣',
        difficulty: 'קל',
        diffClass: 'easy',
        notes: ['G4', 'E4', 'E4', 'F4', 'D4', 'D4', 'C4', 'D4', 'E4', 'F4', 'G4', 'G4', 'G4'],
        lyrics: ['יו', 'נתן', 'הקטן', 'רץ', 'בבוקר', 'אל', 'הגן', 'הוא', 'טיפס', 'על', 'העץ', 'הח', 'מוד']
    },
    {
        id: 'song-2',
        title: 'אודה לשמחה (המנון האיחוד) 🇪🇺',
        difficulty: 'קל',
        diffClass: 'easy',
        notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'],
        lyrics: ['שיר', 'שמחה', 'אל', 'הש', 'מיים', 'נשי', 'רה', 'בי', 'חד', 'שיר', 'הלל', 'לאל', 'שמ', 'חה', 'ורו']
    },
    {
        id: 'song-3',
        title: 'לדוד משה הייתה חווה 🚜',
        difficulty: 'קל',
        diffClass: 'easy',
        notes: ['C4', 'C4', 'C4', 'G4', 'A4', 'A4', 'G4', 'E4', 'E4', 'D4', 'D4', 'C4'],
        lyrics: ['לדוד', 'משה', 'הייתה', 'חווה', 'איה', 'איה', 'או', 'ובחווה', 'הייתה', 'פרה', 'מו', 'מו']
    },
    {
        id: 'song-4',
        title: 'יונתן הקטן גבוה 🚀',
        difficulty: 'בינוני',
        diffClass: 'medium',
        notes: ['G5', 'E5', 'E5', 'F5', 'D5', 'D5', 'C5', 'D5', 'E5', 'F5', 'G5', 'G5', 'G5'],
        lyrics: ['יו', 'נתן', 'הקטן', 'רץ', 'בבוקר', 'אל', 'הגן', 'הוא', 'טיפס', 'על', 'העץ', 'הח', 'מוד']
    }
];

// --- Sound Synthesizer Engine (Web Audio API) ---
function playNoteSound(freq) {
    try {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const ctx = state.audioContext;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Custom rich piano timbre: triangle + a bit of sine harmonics
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // ADSR Envelope
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.35); // Decay
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2); // Sustain / Release

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.3);
    } catch (e) {
        console.error("Error playing synth sound: ", e);
    }
}

// Success Chime (Arpeggio: Do -> Mi -> Sol)
function playSuccessChime() {
    const root = 261.63; // C4
    const times = [0, 0.1, 0.2];
    const freqs = [root, root * 1.25, root * 1.5]; // C4, E4, G4
    freqs.forEach((freq, idx) => {
        setTimeout(() => playNoteSound(freq * 2), times[idx] * 1000); // 1 Octave higher for chime feel
    });
}

// Fail Buzzer Sound
function playFailBuzzer() {
    try {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = state.audioContext;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime); // Low buzz

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
        console.error(e);
    }
}

// --- App Navigation & Tab Switching ---
function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Hide main navigation header during active play sessions to maximize vertical screen space
    const mainHeader = document.querySelector('.app-header');
    if (mainHeader) {
        mainHeader.style.display = tabId === 'play-area' ? 'none' : 'flex';
    }
    
    // Update active class on nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Hide all panels
    document.querySelectorAll('.content-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Show selected panel
    const activePanel = document.getElementById(`panel-${tabId}`);
    if (activePanel) activePanel.classList.add('active');

    // Hide keyboard footer unless in the active play area
    document.getElementById('app-keyboard-footer').style.display = 'none';

    // Toggle Reset Button Visibility (hide during play sessions to avoid distraction)
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.style.display = tabId === 'play-area' ? 'none' : 'block';
    }

    // Stop active pitch detection intervals if leaving play area
    if (tabId !== 'play-area') {
        stopPitchDetection();
    }

    // Render screen contents
    if (tabId === 'home') {
        renderHomeScreen();
    } else if (tabId === 'lessons') {
        renderLessonsScreen();
    } else if (tabId === 'songs') {
        renderSongsScreen();
    }
}

// --- LocalStorage Logic ---
function saveToLocalStorage() {
    const dataToSave = {
        stars: state.stars,
        streak: state.streak,
        lastPlayedDate: state.lastPlayedDate,
        completedLessons: state.completedLessons,
        practiceHighScore: state.practiceHighScore
    };
    localStorage.setItem('piano_for_sol_data', JSON.stringify(dataToSave));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('piano_for_sol_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.stars = data.stars || 0;
            state.streak = data.streak || 0;
            state.lastPlayedDate = data.lastPlayedDate;
            state.completedLessons = data.completedLessons || [];
            state.practiceHighScore = data.practiceHighScore || 0;
            
            // Check streak logic
            checkStreakValidity();
        } catch (e) {
            console.error("Error loading localStorage data", e);
        }
    }
}

function checkStreakValidity() {
    if (!state.lastPlayedDate) return;
    
    const today = new Date().toDateString();
    const lastPlayed = new Date(state.lastPlayedDate).toDateString();
    
    if (today === lastPlayed) {
        return; // Streak is active for today
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastPlayed !== yesterdayStr) {
        // More than a day has passed, reset streak
        state.streak = 0;
        saveToLocalStorage();
    }
}

function updateStreakAndStars(starsGained) {
    // Stars
    state.stars += starsGained;
    
    // Streak
    const todayStr = new Date().toDateString();
    if (state.lastPlayedDate !== todayStr) {
        state.streak += 1;
        state.lastPlayedDate = todayStr;
    }
    
    saveToLocalStorage();
    updateHeaderStats();
}

function updateHeaderStats() {
    document.getElementById('header-stars').textContent = state.stars;
    document.getElementById('header-streak').textContent = state.streak;
}

// --- Home Screen Render ---
function renderHomeScreen() {
    document.getElementById('home-stars-total').textContent = state.stars;
    document.getElementById('home-lessons-completed').textContent = `${state.completedLessons.length}/${LESSONS_DB.length}`;
    document.getElementById('home-streak-days').textContent = state.streak;
}

function startNextLesson() {
    // Find first incomplete lesson
    let nextLessonId = 'lesson-1';
    for (const lesson of LESSONS_DB) {
        if (!state.completedLessons.includes(lesson.id)) {
            nextLessonId = lesson.id;
            break;
        }
    }
    loadLesson(nextLessonId);
}

// --- Lessons Map Render ---
function renderLessonsScreen() {
    const container = document.getElementById('lessons-path-container');
    container.innerHTML = '';

    LESSONS_DB.forEach((lesson, index) => {
        const isCompleted = state.completedLessons.includes(lesson.id);
        
        // A lesson is unlocked if it is the first lesson, or if the previous lesson is completed
        const isUnlocked = index === 0 || state.completedLessons.includes(LESSONS_DB[index - 1].id);
        
        const nodeWrapper = document.createElement('div');
        nodeWrapper.className = 'lesson-node-wrapper';

        const node = document.createElement('div');
        node.className = `lesson-node ${isCompleted ? 'completed' : ''} ${isUnlocked && !isCompleted ? 'unlocked' : ''} ${!isUnlocked ? 'locked' : ''}`;
        
        let nodeIcon = '🔒';
        if (isCompleted) nodeIcon = '⭐';
        else if (isUnlocked) nodeIcon = '📖';

        node.innerHTML = `<span>${nodeIcon}</span>`;
        
        if (isUnlocked) {
            node.onclick = () => loadLesson(lesson.id);
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'lesson-tooltip';
        tooltip.innerHTML = `
            <h4>${lesson.title}</h4>
            <p>${isCompleted ? '✅ הושלם בהצלחה!' : (isUnlocked ? '✨ זמין להתחלה' : '🔒 נעול')}</p>
        `;

        nodeWrapper.appendChild(node);
        nodeWrapper.appendChild(tooltip);
        container.appendChild(nodeWrapper);
    });
}

// --- Songs Screen Render ---
function renderSongsScreen() {
    const container = document.getElementById('songs-list-container');
    container.innerHTML = '';

    SONGS_DB.forEach(song => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.onclick = () => loadSong(song.id);

        // Get saved score stars for this song
        const savedScoreKey = `song_score_${song.id}`;
        const savedStars = parseInt(localStorage.getItem(savedScoreKey)) || 0;
        
        let starsHTML = '';
        for (let i = 0; i < 3; i++) {
            starsHTML += i < savedStars ? '⭐' : '☆';
        }

        card.innerHTML = `
            <div class="song-details">
                <h3>${song.title}</h3>
                <span class="song-difficulty ${song.diffClass}">${song.difficulty}</span>
            </div>
            <div class="song-score-stars">
                ${starsHTML}
            </div>
            <button class="song-play-btn">נגנו שיר זה 🎹</button>
        `;

        container.appendChild(card);
    });
}

// --- Play Area Actions ---
function exitPlayArea() {
    switchTab(state.activeSession && state.activeSession.type === 'song' ? 'songs' : 'lessons');
    state.activeSession = null;
}

// --- SVG Staff Drawing Engine ---
function drawStaff(highlightNoteName = null) {
    const svg = document.getElementById('svg-staff');
    svg.innerHTML = ''; // Clear previous drawings

    const width = 800;
    const height = 240;
    const bottomLineY = 160;
    const lineSpacing = 20;

    // Draw 5 staff lines
    for (let i = 0; i < 5; i++) {
        const y = bottomLineY - (i * lineSpacing);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '20');
        line.setAttribute('y1', y);
        line.setAttribute('x2', '780');
        line.setAttribute('y2', y);
        line.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
    }

    // Draw Treble Clef Symbol (Using a gorgeous SVG Path representation)
    const clef = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Simplified Treble Clef Path that looks standard and scales beautifully
    clef.setAttribute('d', 'M 60,175 C 55,170 50,160 52,152 C 55,140 70,135 72,150 C 73,158 65,168 57,166 C 53,165 48,155 52,143 C 58,125 78,110 78,85 C 78,60 67,40 60,15 L 57,15 C 55,45 61,70 52,95 C 44,115 30,130 30,150 C 30,178 52,195 72,192 C 85,190 92,175 92,160 C 92,130 68,115 62,90 L 67,45 C 70,40 73,42 71,50 C 62,100 85,120 85,150 C 85,170 75,180 60,175 Z');
    clef.setAttribute('fill', 'var(--neon-cyan)');
    clef.setAttribute('filter', 'drop-shadow(0 0 6px rgba(0, 242, 254, 0.5))');
    svg.appendChild(clef);

    // If there's a target note to display, draw it
    if (highlightNoteName) {
        const noteObj = NOTES_DB.find(n => n.name === highlightNoteName);
        if (noteObj) {
            const noteY = bottomLineY - (noteObj.offset * lineSpacing);
            const noteX = 400; // Center note horizontally

            // Draw ledger lines if the note lies outside the 5 staff lines
            if (noteObj.offset <= -1.0) {
                // Draw C4 ledger line (offset = -1.0, Y = 180)
                for (let y = bottomLineY + lineSpacing; y <= noteY; y += lineSpacing) {
                    const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    ledger.setAttribute('x1', (noteX - 25).toString());
                    ledger.setAttribute('y1', y.toString());
                    ledger.setAttribute('x2', (noteX + 25).toString());
                    ledger.setAttribute('y2', y.toString());
                    ledger.setAttribute('stroke', '#fff');
                    ledger.setAttribute('stroke-width', '2');
                    svg.appendChild(ledger);
                }
            } else if (noteObj.offset >= 5.0) {
                // Draw ledger lines above E5 (offset = 5.0 (A5), 6.0 (C6))
                for (let y = bottomLineY - (5 * lineSpacing); y >= noteY; y -= lineSpacing) {
                    const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    ledger.setAttribute('x1', (noteX - 25).toString());
                    ledger.setAttribute('y1', y.toString());
                    ledger.setAttribute('x2', (noteX + 25).toString());
                    ledger.setAttribute('y2', y.toString());
                    ledger.setAttribute('stroke', '#fff');
                    ledger.setAttribute('stroke-width', '2');
                    svg.appendChild(ledger);
                }
            }

            // Draw Note Oval (Ellipse)
            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            ellipse.setAttribute('cx', noteX.toString());
            ellipse.setAttribute('cy', noteY.toString());
            ellipse.setAttribute('rx', '15');
            ellipse.setAttribute('ry', '11');
            ellipse.setAttribute('fill', 'var(--neon-cyan)');
            ellipse.setAttribute('filter', 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.8))');
            svg.appendChild(ellipse);

            // Draw Note Stem (Direction goes down for higher notes, up for lower notes)
            const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            if (noteObj.offset >= 2.0) {
                // Stem goes down on the left
                stem.setAttribute('x1', (noteX - 14).toString());
                stem.setAttribute('y1', noteY.toString());
                stem.setAttribute('x2', (noteX - 14).toString());
                stem.setAttribute('y2', (noteY + 55).toString());
            } else {
                // Stem goes up on the right
                stem.setAttribute('x1', (noteX + 14).toString());
                stem.setAttribute('y1', noteY.toString());
                stem.setAttribute('x2', (noteX + 14).toString());
                stem.setAttribute('y2', (noteY - 55).toString());
            }
            stem.setAttribute('stroke', '#fff');
            stem.setAttribute('stroke-width', '3');
            svg.appendChild(stem);

            // Draw accidental (sharp) indicator if required
            if (noteObj.accidental === 'sharp') {
                const accidental = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                accidental.setAttribute('x', (noteX - 35).toString());
                accidental.setAttribute('y', (noteY + 8).toString());
                accidental.setAttribute('font-size', '30');
                accidental.setAttribute('fill', 'var(--neon-pink)');
                accidental.textContent = '♯';
                svg.appendChild(accidental);
            }
        }
    }
}

// --- Loading & Driving Lessons (מצב שיעורים) ---
function loadLesson(lessonId) {
    const lesson = LESSONS_DB.find(l => l.id === lessonId);
    if (!lesson) return;

    state.activeSession = {
        type: 'lesson',
        id: lessonId,
        stepIndex: 0,
        currentNote: null,
        lessonData: lesson
    };

    switchTab('play-area');
    document.getElementById('play-area-title').textContent = lesson.title;
    document.getElementById('app-keyboard-footer').style.display = 'block';

    runLessonStep();
}

function runLessonStep() {
    const session = state.activeSession;
    const step = session.lessonData.steps[session.stepIndex];

    // Reset feedback UI
    const feedbackBox = document.getElementById('feedback-text');
    feedbackBox.textContent = '';
    feedbackBox.className = 'feedback-text';

    // Highlight active virtual keys helper
    highlightPianoKeysHelper(step.highlightKeys || []);

    if (step.isCompletedStep) {
        // Completed the lesson!
        document.getElementById('instruction-text').innerHTML = step.text;
        session.currentNote = null;
        drawStaff(null);
        
        // Add star reward
        const isFirstCompletion = !state.completedLessons.includes(session.id);
        if (isFirstCompletion) {
            state.completedLessons.push(session.id);
            updateStreakAndStars(5); // 5 stars for a new lesson
        }

        playSuccessChime();
        feedbackBox.textContent = 'כל הכבוד! 🎉';
        feedbackBox.className = 'feedback-text success';
        
        document.getElementById('play-progress-label').textContent = 'התקדמות: 100%';
        document.getElementById('play-progress-bar').style.width = '100%';

        // Add a giant button to finish
        setTimeout(() => {
            const finishBtn = document.createElement('button');
            finishBtn.className = 'action-btn-large pulse';
            finishBtn.style.marginTop = '1.5rem';
            finishBtn.textContent = 'סיים שיעור 🏆';
            finishBtn.onclick = () => {
                exitPlayArea();
            };
            document.getElementById('instruction-box').appendChild(finishBtn);
        }, 1000);
        return;
    }

    // Set active instruction
    document.getElementById('instruction-text').innerHTML = step.text;
    session.currentNote = step.targetNote;

    // Draw staff
    drawStaff(step.targetNote);

    // Progress bar calculation
    const progress = Math.round((session.stepIndex / (session.lessonData.steps.length - 1)) * 100);
    document.getElementById('play-progress-label').textContent = `התקדמות: ${progress}%`;
    document.getElementById('play-progress-bar').style.width = `${progress}%`;

    // Try starting microphone if permissions exist
    autoStartMicrophone();
}

// Helper to highlight correct key on virtual keyboard to guide the child
function highlightPianoKeysHelper(keysToHighlight) {
    document.querySelectorAll('.piano-key').forEach(key => {
        key.classList.remove('active');
        const note = key.getAttribute('data-note');
        if (keysToHighlight.includes(note)) {
            key.classList.add('active');
        }
    });
}

// --- Loading & Driving Song Studio (מצב שירים) ---
function loadSong(songId) {
    const song = SONGS_DB.find(s => s.id === songId);
    if (!song) return;

    state.activeSession = {
        type: 'song',
        id: songId,
        stepIndex: 0,
        currentNote: song.notes[0],
        songData: song,
        errors: 0
    };

    switchTab('play-area');
    document.getElementById('play-area-title').textContent = song.title;
    document.getElementById('app-keyboard-footer').style.display = 'block';

    runSongStep();
}

function runSongStep() {
    const session = state.activeSession;
    const song = session.songData;
    const idx = session.stepIndex;

    // Clear feedback
    const feedbackBox = document.getElementById('feedback-text');
    feedbackBox.textContent = '';
    feedbackBox.className = 'feedback-text';

    if (idx >= song.notes.length) {
        // Song Completed!
        session.currentNote = null;
        drawStaff(null);
        highlightPianoKeysHelper([]);

        // Calculate score stars (0-1 errors = 3 stars, 2-3 errors = 2 stars, 4+ = 1 star)
        let starsEarned = 1;
        if (session.errors <= 1) starsEarned = 3;
        else if (session.errors <= 3) starsEarned = 2;

        const savedScoreKey = `song_score_${session.id}`;
        const previousBest = parseInt(localStorage.getItem(savedScoreKey)) || 0;
        
        if (starsEarned > previousBest) {
            localStorage.setItem(savedScoreKey, starsEarned.toString());
            // Grant 3 stars for overall profile
            updateStreakAndStars(starsEarned - previousBest);
        }

        playSuccessChime();
        feedbackBox.textContent = 'ניגנתם את השיר בצורה מושלמת! 🌟';
        feedbackBox.className = 'feedback-text success';

        const starDisplay = '⭐'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);
        document.getElementById('instruction-text').innerHTML = `סיימתם את השיר עם ${session.errors} שגיאות!<br><span style="font-size: 2.2rem; display: block; margin-top: 1rem;">${starDisplay}</span>`;

        document.getElementById('play-progress-label').textContent = 'התקדמות: 100%';
        document.getElementById('play-progress-bar').style.width = '100%';

        setTimeout(() => {
            const finishBtn = document.createElement('button');
            finishBtn.className = 'action-btn-large pulse';
            finishBtn.style.marginTop = '1.5rem';
            finishBtn.textContent = 'חזרה לסטודיו השירים 🏆';
            finishBtn.onclick = () => {
                exitPlayArea();
            };
            document.getElementById('instruction-box').appendChild(finishBtn);
        }, 1000);
        return;
    }

    const currentNote = song.notes[idx];
    const currentWord = song.lyrics[idx] || '';

    session.currentNote = currentNote;

    // Instruction shows active syllable
    document.getElementById('instruction-text').innerHTML = `מילים: <span style="color: var(--neon-pink); font-size: 1.8rem; font-weight: 800;">"${currentWord}"</span><br>נגנו את התו הבא שעל המסך!`;

    // Draw staff note
    drawStaff(currentNote);

    // Help visual highlight (keys light up in active song studio)
    highlightPianoKeysHelper([currentNote]);

    // Progress bar calculation
    const progress = Math.round((idx / song.notes.length) * 100);
    document.getElementById('play-progress-label').textContent = `התקדמות: ${progress}%`;
    document.getElementById('play-progress-bar').style.width = `${progress}%`;

    autoStartMicrophone();
}

// --- Loading & Driving Note Quest (מצב תרגול מהיר) ---
function startPracticeMode() {
    state.activeSession = {
        type: 'practice',
        stepIndex: 0, // Counts questions answered
        currentNote: null,
        score: 0,
        streak: 0,
        notesPool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'] // Pool of base notes
    };

    switchTab('play-area');
    document.getElementById('play-area-title').textContent = 'תרגול מהיר - אקדמיית התווים ⚡';
    document.getElementById('app-keyboard-footer').style.display = 'block';

    runPracticeStep();
}

function runPracticeStep() {
    const session = state.activeSession;
    
    // Clear feedback
    const feedbackBox = document.getElementById('feedback-text');
    feedbackBox.textContent = '';
    feedbackBox.className = 'feedback-text';

    if (session.stepIndex >= 10) {
        // Done 10 questions!
        session.currentNote = null;
        drawStaff(null);
        highlightPianoKeysHelper([]);

        // Save High Score
        if (session.score > state.practiceHighScore) {
            state.practiceHighScore = session.score;
            saveToLocalStorage();
        }

        // Grant stars (e.g. 2 stars for completing, +1 star for high score)
        updateStreakAndStars(2);

        playSuccessChime();
        feedbackBox.textContent = 'האימון הסתיים בהצלחה! 🏆';
        feedbackBox.className = 'feedback-text success';

        document.getElementById('instruction-text').innerHTML = `השגתם <strong style="color: var(--neon-cyan); font-size: 1.8rem;">${session.score} מתוך 10</strong> נקודות!<br>השיא האישי שלכם: ${state.practiceHighScore}`;

        document.getElementById('play-progress-label').textContent = 'התקדמות: 100%';
        document.getElementById('play-progress-bar').style.width = '100%';

        setTimeout(() => {
            const finishBtn = document.createElement('button');
            finishBtn.className = 'action-btn-large pulse';
            finishBtn.style.marginTop = '1.5rem';
            finishBtn.textContent = 'חזרה לתפריט 🏁';
            finishBtn.onclick = () => {
                switchTab('practice');
            };
            document.getElementById('instruction-box').appendChild(finishBtn);
        }, 1000);
        return;
    }

    // Pick a random note from the pool (ensure not same note twice in a row)
    let randomNote;
    do {
        randomNote = session.notesPool[Math.floor(Math.random() * session.notesPool.length)];
    } while (randomNote === session.currentNote);

    session.currentNote = randomNote;

    document.getElementById('instruction-text').innerHTML = `שאלה ${session.stepIndex + 1} מתוך 10:<br>מהו התו המצויר על החמישה? נגנו אותו!`;
    drawStaff(randomNote);

    // No highlights in practice/test mode!
    highlightPianoKeysHelper([]);

    document.getElementById('play-progress-label').textContent = `התקדמות: ${session.stepIndex}0%`;
    document.getElementById('play-progress-bar').style.width = `${session.stepIndex}0%`;

    autoStartMicrophone();
}

// --- Verification & Playing Input Cues ---
function handlePlayInput(notePlayed) {
    const session = state.activeSession;
    if (!session || !session.currentNote) return;

    // Trigger visual note press feedback on Virtual Keyboard
    const key = document.querySelector(`.piano-key[data-note="${notePlayed}"]`);
    
    if (notePlayed === session.currentNote) {
        // CORRECT PLAY!
        playNoteSound(NOTES_DB.find(n => n.name === notePlayed).freq);
        
        if (key) {
            key.classList.add('success-active');
            setTimeout(() => key.classList.remove('success-active'), 500);
        }

        const feedbackBox = document.getElementById('feedback-text');
        feedbackBox.textContent = getRandomEncouragement();
        feedbackBox.className = 'feedback-text success';

        // Brief delay before moving forward to allow success audio/visual to play
        setTimeout(() => {
            if (session.type === 'lesson') {
                session.stepIndex++;
                runLessonStep();
            } else if (session.type === 'song') {
                session.stepIndex++;
                runSongStep();
            } else if (session.type === 'practice') {
                session.score++;
                session.stepIndex++;
                runPracticeStep();
            }
        }, 900);
        
    } else {
        // INCORRECT PLAY!
        playNoteSound(NOTES_DB.find(n => n.name === notePlayed).freq);
        
        if (key) {
            key.classList.add('error-active');
            setTimeout(() => key.classList.remove('error-active'), 500);
        }

        const feedbackBox = document.getElementById('feedback-text');
        feedbackBox.textContent = 'נסו שוב!';
        feedbackBox.className = 'feedback-text error';

        if (session.type === 'song') {
            session.errors++;
        } else if (session.type === 'practice') {
            // In practice, failure immediately advances to next note to keep flow
            playFailBuzzer();
            setTimeout(() => {
                session.stepIndex++;
                runPracticeStep();
            }, 900);
        }
    }
}

// Click callback on virtual keys
function handleVirtualKeyPress(note) {
    handlePlayInput(note);
}

// Hebrew encouragements list
function getRandomEncouragement() {
    const list = ['מעולה! 🌟', 'כל הכבוד! 🏆', 'נכון מאוד! 🎯', 'יופי של נגינה! ✨', 'בול! ⚡', 'מצוין! 💡'];
    return list[Math.floor(Math.random() * list.length)];
}

// --- Computer Keyboard Input Fallback ---
// Maps computer keys row A-S-D-F-G-H-J-K-L... to white piano keys
const COMPUTER_KEY_MAP = {
    'KeyA': 'C4', // Do
    'KeyS': 'D4', // Re
    'KeyD': 'E4', // Mi
    'KeyF': 'F4', // Fa
    'KeyG': 'G4', // Sol
    'KeyH': 'A4', // La
    'KeyJ': 'B4', // Si
    
    'KeyK': 'C5', // Do
    'KeyL': 'D5', // Re
    'Semicolon': 'E5', // Mi
    'Quote': 'F5', // Fa
    
    // Black keys row W-E-T-Y-U...
    'KeyW': 'C#4',
    'KeyE': 'D#4',
    'KeyT': 'F#4',
    'KeyY': 'G#4',
    'KeyU': 'A#4',
    'KeyO': 'C#5',
    'KeyP': 'D#5'
};

window.addEventListener('keydown', e => {
    // Disable if typing in inputs (if any) or if play screen is not active
    if (state.currentTab !== 'play-area') return;
    
    const mappedNote = COMPUTER_KEY_MAP[e.code];
    if (mappedNote) {
        handlePlayInput(mappedNote);
    }
});

// --- Microphone Listening & Pitch Detection Module ---

function autoStartMicrophone() {
    // If browser supports getUserMedia and we haven't requested yet
    if (!state.micActive && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Let banner display click instruction. If already approved once, we can try to init
        if (localStorage.getItem('mic_approved') === 'true') {
            initMicrophone();
        }
    }
}

function initMicrophone() {
    if (state.micActive) return;

    const bannerText = document.getElementById('mic-banner-text');
    const banner = document.getElementById('mic-banner');
    const bannerIcon = document.getElementById('mic-banner-icon');

    bannerText.textContent = "מבקש גישה למיקרופון...";
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            state.micActive = true;
            state.microphoneStream = stream;
            localStorage.setItem('mic_approved', 'true');

            // Visual indicator active
            banner.classList.add('active');
            bannerIcon.textContent = "🟢";
            bannerText.textContent = "מיקרופון פעיל! נגנו בפסנתר האמיתי שלכם והאפליקציה תאזין.";

            // Start Audio Context & Pitch Analyzer
            if (!state.audioContext) {
                state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const source = state.audioContext.createMediaStreamSource(stream);
            
            state.analyser = state.audioContext.createAnalyser();
            state.analyser.fftSize = 2048; // Size of sample buffer
            source.connect(state.analyser);

            // Periodically analyze audio pitch
            startPitchDetection();
        })
        .catch(err => {
            console.error("Microphone permission denied:", err);
            bannerIcon.textContent = "❌";
            bannerText.textContent = "גישת המיקרופון נדחתה. לא נוכל להאזין לפסנתר. נגנו באמצעות המקלדת שעל המסך.";
        });
}

function startPitchDetection() {
    if (state.pitchInterval) clearInterval(state.pitchInterval);
    
    const bufferLength = state.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    
    let lastNote = null;
    let stableCount = 0;
    const REQUIRED_STABILITY = 3; // Must be identical for 3 consecutive frames (approx 150ms) to trigger note

    state.pitchInterval = setInterval(() => {
        state.analyser.getFloatTimeDomainData(dataArray);
        
        // Compute frequency using AMDF-autocorrelation
        const frequency = autoCorrelateFrequency(dataArray, state.audioContext.sampleRate);
        
        if (frequency !== -1) {
            // Find closest note
            const matchedNote = findClosestNote(frequency);
            if (matchedNote) {
                if (matchedNote.name === lastNote) {
                    stableCount++;
                    if (stableCount === REQUIRED_STABILITY) {
                        handlePlayInput(matchedNote.name);
                        stableCount = 0; // Reset after trigger to avoid double hits
                    }
                } else {
                    lastNote = matchedNote.name;
                    stableCount = 1;
                }
            } else {
                lastNote = null;
                stableCount = 0;
            }
        } else {
            lastNote = null;
            stableCount = 0;
        }
    }, 50); // Analyze every 50ms
}

function stopPitchDetection() {
    if (state.pitchInterval) {
        clearInterval(state.pitchInterval);
        state.pitchInterval = null;
    }
}

// --- AMDF Difference Autocorrelation Pitch Detection Algorithm ---
function autoCorrelateFrequency(buf, sampleRate) {
    const SIZE = buf.length;
    let rms = 0;

    // Calculate Root Mean Square (RMS) volume
    for (let i = 0; i < SIZE; i++) {
        const val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Only process signals above threshold (filters quiet room noise)
    if (rms < 0.02) {
        return -1; 
    }

    // Average Magnitude Difference Function (AMDF)
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;
    const correlations = new Array(MAX_SAMPLES);

    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;

        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs(buf[i] - buf[i + offset]);
        }
        correlation = 1 - (correlation / MAX_SAMPLES);
        correlations[offset] = correlation;

        // Peak selection threshold
        if (correlation > 0.88 && correlation > lastCorrelation) {
            foundGoodCorrelation = true;
            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestOffset = offset;
            }
        } else if (foundGoodCorrelation) {
            // Parabolic interpolation for sub-sample accuracy
            const shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];  
            return sampleRate / (bestOffset + (8 * shift));
        }
        lastCorrelation = correlation;
    }

    if (bestCorrelation > 0.05 && bestOffset !== -1) {
        return sampleRate / bestOffset;
    }
    return -1;
}

// Map frequency (Hz) to note database
function findClosestNote(freq) {
    let closestNote = null;
    let minDiff = Infinity;

    for (const note of NOTES_DB) {
        const diff = Math.abs(note.freq - freq);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    }

    // Check tolerance (roughly half a semitone = ~3.5%)
    const tolerance = closestNote.freq * 0.035;
    if (minDiff < tolerance) {
        return closestNote;
    }
    return null;
}

// --- App Initialization on Page Load ---
window.addEventListener('DOMContentLoaded', () => {
    // Load local storage progress
    loadFromLocalStorage();
    
    // Render the active stats and screen
    updateHeaderStats();
    renderHomeScreen();
    renderLessonsScreen();
    renderSongsScreen();
    
    // Register clicks inside panels if needed
    document.getElementById('practice-high-score-val').textContent = state.practiceHighScore;
});

// --- Reset Progress Function ---
function confirmResetProgress() {
    const confirmation = confirm("סול, האם את בטוחה שברצונך למחוק את כל ההתקדמות שלך ולהתחיל מהתחלה? כל הכוכבים והשיאים יימחקו!");
    if (confirmation) {
        // Clear state
        state.stars = 0;
        state.streak = 0;
        state.lastPlayedDate = null;
        state.completedLessons = [];
        state.practiceHighScore = 0;
        
        // Save empty state to localStorage
        saveToLocalStorage();
        
        // Clear song scores specifically
        SONGS_DB.forEach(song => {
            localStorage.removeItem(`song_score_${song.id}`);
        });
        
        // Refresh display
        updateHeaderStats();
        renderHomeScreen();
        renderLessonsScreen();
        renderSongsScreen();
        
        // Reset element text
        const highScoreVal = document.getElementById('practice-high-score-val');
        if (highScoreVal) highScoreVal.textContent = '0';
        
        alert("ההתקדמות אופסה בהצלחה! בהצלחה מהתחלה! 🚀");
    }
}
