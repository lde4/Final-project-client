// ==========================================
// חלק א': לוגיקת עמוד ההרשמה בשרשרת שלבים (Register Multi-step)
// ==========================================
// פונקציית עזר מובנית בדפדפן המבצעת הצפנת SHA-256 אסינכרונית לכל טקסט שתקבל
async function hashSHA256(text) {
    if (!text) return "";
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const registerForm = document.getElementById('registerForm');
const goToQuestionsBtn = document.getElementById('goToQuestionsBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const registerButton = document.getElementById('registerButton');

let currentStep = 1; // משתנה העוקב אחרי השאלה הנוכחית בשרשרת (1 עד 6)

// 1. מעבר משלב פרטי החשבון לשלב שרשרת שאלות האבטחה
if (goToQuestionsBtn) {
    goToQuestionsBtn.addEventListener('click', function() {
        const regPassword = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (regPassword !== confirmPassword) {
            alert('שגיאה: הסיסמאות אינן תואמות!');
            return;
        }

        if (regPassword.length < 6 || regPassword.length > 15 || !/[A-Z]/.test(regPassword) || !/[0-9]/.test(regPassword)) {
            alert('שגיאה: הסיסמה אינה עומדת בדרישות האבטחה!');
            return;
        }

        // אם הפרטים תקינים, נסתיר את שלב החשבון ונציג את שלב שאלות האבטחה
        document.getElementById('account-info-section').style.display = 'none';
        document.getElementById('security-questions-section').style.display = 'block';
    });
}

// 2. ניהול השרשרת והמעבר בין 6 השאלות (וידוא שהן שדה חובה)
if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', function() {
        const currentInput = document.getElementById(`security-answer-${currentStep}`);

        if (!currentInput.value.trim()) {
            alert(`שגיאה: שאלה מספר ${currentStep} היא שדה חובה! אנא הקלד תשובה.`);
            return;
        }

        // הסתרת השאלה הנוכחית ומעבר לבאה בתור
        document.getElementById(`step-${currentStep}`).style.display = 'none';
        currentStep++;
        document.getElementById(`step-${currentStep}`).style.display = 'block';
        nextQuestionBtn.innerText = `Next Question (${currentStep}/6)`;

        // אם הגענו לשאלה האחרונה (6), נחליף את כפתור Next בכפתור סיום ההרשמה
        if (currentStep === 6) {
            nextQuestionBtn.style.display = 'none';
            registerButton.style.display = 'block';
        }
    });
}

// 3. הגשת הטופס המלא לפלאסק לאחר סיום כל השרשרת
if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const finalInput = document.getElementById('security-answer-6');
        if (!finalInput.value.trim()) {
            alert('שגיאה: שאלה מספר 6 היא שדה חובה!');
            return;
        }

        const regUsername = document.getElementById('reg-username').value;
        const email = document.getElementById('email').value;
        const regPassword = document.getElementById('reg-password').value;

        fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: regUsername,
                email: email,
                password: regPassword,
                ans1: document.getElementById('security-answer-1').value.trim().toLowerCase(),
                ans2: document.getElementById('security-answer-2').value.trim().toLowerCase(),
                ans3: document.getElementById('security-answer-3').value.trim().toLowerCase(),
                ans4: document.getElementById('security-answer-4').value.trim().toLowerCase(),
                ans5: document.getElementById('security-answer-5').value.trim().toLowerCase(),
                ans6: document.getElementById('security-answer-6').value.trim().toLowerCase()
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('ההרשמה הצליחה! 6 שאלות האבטחה נשמרו בשרת. כעת תועבר למסך ההתחברות.');
                window.location.href = 'login.html';
            } else {
                alert('שגיאה מהשרת: ' + data.message);
            }
        });
    });
}

// ====================================================================
// 🔧 תיקון בעיה 1: בדיקת חוזק סיסמה דינמית בזמן אמת (מאדום לירוק)
// ====================================================================
const regPasswordInput = document.getElementById('reg-password');
const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqNumber = document.getElementById('req-number');

if (regPasswordInput) {
    regPasswordInput.addEventListener('input', function() {
        const val = regPasswordInput.value;

        // א. בדיקת אורך (6 עד 15 תווים)
        if (val.length >= 6 && val.length <= 15) {
            reqLength.classList.remove('invalid'); reqLength.classList.add('valid');
            reqLength.innerText = '✔ Between 6 to 15 characters';
        } else {
            reqLength.classList.remove('valid'); reqLength.classList.add('invalid');
            reqLength.innerText = '✖ Between 6 to 15 characters';
        }

        // ב. בדיקת אות גדולה באנגלית
        if (/[A-Z]/.test(val)) {
            reqUppercase.classList.remove('invalid'); reqUppercase.classList.add('valid');
            reqUppercase.innerText = '✔ At least one uppercase letter (A-Z)';
        } else {
            reqUppercase.classList.remove('valid'); reqUppercase.classList.add('invalid');
            reqUppercase.innerText = '✖ At least one uppercase letter (A-Z)';
        }

        // ג. בדיקת מספר
        if (/[0-9]/.test(val)) {
            reqNumber.classList.remove('invalid'); reqNumber.classList.add('valid');
            reqNumber.innerText = '✔ At least one number (0-9)';
        } else {
            reqNumber.classList.remove('valid'); reqNumber.classList.add('invalid');
            reqNumber.innerText = '✖ At least one number (0-9)';
        }
    });
}

// ==========================================
// חלק ב': לוגיקת עמוד ההתחברות (Login)
// ==========================================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const enteredUsername = document.getElementById('username').value;
        const enteredPassword = document.getElementById('password').value;

        fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: enteredUsername, password: enteredPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`ברוך הבא ל-Lmap, ${data.username}! התחברת בהצלחה למערכת.`);
            } else {
                alert('שגיאה: ' + data.message);
            }
        });
    });
}

// ==========================================
// חלק ג': שחזור סיסמה עם 2 שאלות אבטחה רנדומליות והצפנה
// ==========================================
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const resetUsername = document.getElementById('reset-username').value;
        const resetEmail = document.getElementById('reset-email').value;

        // 1. קריאה לשרת פייתון לקבלת 2 שאלות שהוגרלו באקראי מתוך ה-6
        fetch('http://localhost:5000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: resetUsername, email: resetEmail })
        })
        .then(response => response.json())
        .then(async data => { // הוספנו async כאן כדי לאפשר הצפנה בפנים
            if (data.success) {
                // חלונית שאלה אקראית 1 שהשרת בחר
                const ansA = prompt(`Security Verification - Question 1:\n${data.questionA_text}`);
                if (!ansA) return;

                // חלונית שאלה אקראית 2 שהשרת בחר
                const ansB = prompt(`Security Verification - Question 2:\n${data.questionB_text}`);
                if (!ansB) return;

                // 🔒 שלב ההצפנה: הפיכת התשובות שהוקלדו ל-Hash מוצפן לפני השילוח לפלאסק
                const encryptedAnsA = await hashSHA256(ansA.trim().toLowerCase());
                const encryptedAnsB = await hashSHA256(ansB.trim().toLowerCase());

                // 2. שליחת שתי התשובות המוצפנות יחד לאימות סופי בשרת ה-MySQL
                fetch('http://localhost:5000/api/verify-security-answers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: resetUsername,
                        qA_id: data.questionA_id, qA_ans: encryptedAnsA,
                        qB_id: data.questionB_id, qB_ans: encryptedAnsB
                    })
                })
                .then(res => res.json())
                .then(verifyData => {
                    if (verifyData.success) {
                        alert('אימות רנדומלי כפול הצליח! כעת תועבר לבחירת סיסמה חדשה.');
                        // מעבר בטוח לעמוד בחירת הסיסמה החדשה
                        window.location.href = `set-new-password.html?username=${resetUsername}`;
                    } else {
                        alert('שגיאה: ' + verifyData.message);
                    }
                })
                .catch(error => console.error('Error verifying answers:', error));
            } else {
                alert('שגיאה: ' + data.message);
            }
        })
        .catch(error => console.error('Error during initial forgot password fetch:', error));
    });
}
