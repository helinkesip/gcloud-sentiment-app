// Arka planda uçuşan harf efekti
function createFloatingChars() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>/";
    const container = document.body;

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
    }, 400);
}

createFloatingChars();

// Analiz Fonksiyonu
async function analizEt() {
    const input = document.getElementById('comment-input').value;
    const btnText = document.getElementById('btn-text');
    const resultCard = document.getElementById('result-container');
    
    if (input.trim().length < 5) {
        alert("Lütfen biraz daha uzun bir metin yazın.");
        return;
    }

    // Buton Yükleniyor Durumu
    btnText.innerText = "Analiz Ediliyor...";
    document.getElementById('analyze-btn').disabled = true;

    try {
        // GERÇEK API ÇAĞRISI (Backend'e istek atıyoruz)
        const response = await fetch('http://127.0.0.1:5001/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: input })
        });

        const data = await response.json();

        if (response.ok) {
            // Google Cloud'dan gelen score: -1.0 ile 1.0 arasındadır.
            // Bunu frontend'deki 0-100 arasına çeviriyoruz:
            const sentimentPercent = Math.round((data.score + 1) * 50);
            
            // Toksiklik verisi Google Cloud'un temel sentiment API'sinde ayrı gelmez, 
            // şimdilik rastgele bırakabilir veya skor düşükse yüksek gösterebilirsin:
            const toxicitySim = data.score < 0 ? Math.abs(data.score * 50) : 5;

            showResults(sentimentPercent, Math.round(toxicitySim));
            
            resultCard.classList.remove('hidden');
            resultCard.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert("Backend hatası: " + (data.error || "Bilinmeyen hata"));
        }
    } catch (error) {
        console.error("İstek hatası:", error);
        alert("Backend çalışmıyor olabilir! Lütfen terminalden python app.py komutunu kontrol et.");
    } finally {
        btnText.innerText = "Analizi Başlat";
        document.getElementById('analyze-btn').disabled = false;
    }
}

function showResults(sentiment, toxicity) {
    // Duygu Güncelleme
    const sBar = document.getElementById('sentiment-score-bar');
    const sLabel = document.getElementById('sentiment-label');
    const sIcon = document.getElementById('sentiment-icon');
    const sPercent = document.getElementById('sentiment-percent');

    sBar.style.width = sentiment + '%';
    sPercent.innerText = sentiment + '%';

    if (sentiment > 50) {
        sLabel.innerText = "Pozitif";
        sIcon.className = "fas fa-smile status-positive";
        sBar.className = "score-bar bg-positive";
    } else {
        sLabel.innerText = "Negatif";
        sIcon.className = "fas fa-frown status-negative";
        sBar.className = "score-bar bg-negative";
    }

    // Toksiklik Güncelleme
    const tBar = document.getElementById('toxicity-score-bar');
    const tPercent = document.getElementById('toxicity-percent');
    tBar.style.width = (100 - toxicity) + '%';
    tPercent.innerText = toxicity + '%';

    const summary = document.getElementById('result-text-summary');
    summary.innerText = sentiment > 50 
        ? "Bu metin genel olarak yapıcı ve olumlu bir dil içeriyor." 
        : "Bu metinde eleştirel veya olumsuz bir ton saptandı.";
}

// Karakter Sayacı
document.getElementById('comment-input').addEventListener('input', function(e) {
    const count = e.target.value.length;
    document.querySelector('.char-count').innerText = `${count} / 500`;
});