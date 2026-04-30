// Arka plan animasyonu
function createFloatingChars() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>/";
    const container = document.getElementById('bg-canvas') || document.body;
    setInterval(() => {
        const char = document.createElement('span');
        char.className = 'floating-char';
        char.innerText = chars[Math.floor(Math.random() * chars.length)];
        const startPos = Math.random() * window.innerWidth;
        const size = Math.random() * 20 + 10;
        const duration = Math.random() * 10 + 5;
        char.style.left = startPos + 'px';
        char.style.top = window.innerHeight + 'px';
        char.style.fontSize = size + 'px';
        char.style.animation = `floatUp ${duration}s linear forwards`;
        container.appendChild(char);
        setTimeout(() => char.remove(), duration * 1000);
    }, 450);
}
createFloatingChars();

// Karakter Sayacı
const textarea = document.getElementById('comment-input');
if(textarea) {
    textarea.addEventListener('input', (e) => {
        document.querySelector('.char-count').innerText = `${e.target.value.length} / 500`;
    });
}

// ANALİZ FONKSİYONU
async function analizEt() {
    const input = document.getElementById('comment-input').value;
    const btnText = document.getElementById('btn-text');
    const resultCard = document.getElementById('result-container');
    const analyzeBtn = document.getElementById('analyze-btn');

    if (input.trim().length < 5) {
        alert("Lütfen biraz daha uzun bir cümle yazın.");
        return;
    }

    // Yükleniyor durumu
    btnText.innerText = "Analiz Ediliyor...";
    analyzeBtn.disabled = true;

    try {
        const response = await fetch('http://127.0.0.1:5001/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input })
        });

        const data = await response.json();

        if (response.ok) {
            // GİZLİ KARTI GÖSTER
            resultCard.classList.remove('hidden');
            resultCard.style.display = 'block'; // CSS'teki hidden bazen inatçı olabilir

            // Skoru hesapla (-1 to 1  => 0 to 100)
            const sentimentPercent = Math.round((data.score + 1) * 50);
            
            // UI Güncelle
            document.getElementById('sentiment-percent').innerText = sentimentPercent + '%';
            document.getElementById('sentiment-score-bar').style.width = sentimentPercent + '%';
            
            const summary = document.getElementById('result-text-summary');
            const sLabel = document.getElementById('sentiment-label');
            const sIcon = document.getElementById('sentiment-icon');

            if (data.score > 0.1) {
                sLabel.innerText = "Pozitif";
                sIcon.className = "fas fa-smile status-positive";
                summary.innerText = "Harika! Bu metin çok olumlu bir enerji yayıyor.";
            } else if (data.score < -0.1) {
                sLabel.innerText = "Negatif";
                sIcon.className = "fas fa-frown status-negative";
                summary.innerText = "Dikkat! Bu metinde olumsuz bir ton saptandı.";
            } else {
                sLabel.innerText = "Nötr";
                sIcon.className = "fas fa-meh status-neutral";
                summary.innerText = "Bu metin oldukça dengeli ve objektif görünüyor.";
            }

            // Scroll yap
            resultCard.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error("Hata:", error);
        alert("Backend ile bağlantı kurulamadı!");
    } finally {
        btnText.innerText = "Analizi Başlat";
        analyzeBtn.disabled = false;
    }
}