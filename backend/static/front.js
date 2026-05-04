// 1. CANLI API ADRESİ (Burayı güncelledik!)
const API_URL = "https://yorum-denet-service-497453700826.europe-west3.run.app/analyze";

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

// Textarea Otomatik Büyüme ve Karakter Sayacı
const tx = document.getElementById('comment-input');
if(tx) {
    tx.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
        document.querySelector('.char-count').innerText = `${this.value.length} / 500`;
    });
}

// ANALİZ FONKSİYONU
async function analizEt() {
    const input = document.getElementById('comment-input').value;
    const btnText = document.getElementById('btn-text');
    const resultCard = document.getElementById('result-container');
    const analyzeBtn = document.getElementById('analyze-btn');

    if (input.trim().length < 5) {
        alert("Lütfen denetleme için geçerli bir yorum girin.");
        return;
    }

    btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Audit Ediliyor...';
    analyzeBtn.disabled = true;

    try {
        // FETCH İŞLEMİ (Canlı URL kullanılıyor)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input })
        });

        const data = await response.json();

        if (response.ok) {
            resultCard.classList.remove('hidden');
            resultCard.style.display = 'block';
            
            const rawCodeArea = document.getElementById('raw-response-code');
            if (rawCodeArea) {
                rawCodeArea.textContent = JSON.stringify(data, null, 2);
            }

            // 1. DUYGU DURUMU HESAPLAMA
            const sentimentPercent = Math.round((data.score + 1) * 50);
            document.getElementById('sentiment-percent').innerText = sentimentPercent + '%';
            document.getElementById('sentiment-score-bar').style.width = sentimentPercent + '%';
            
            // 2. GÜVENLİK (TOKSİKLİK) HESAPLAMA
            const safetyPercent = Math.round((1 - data.toxicity) * 100);
            const tBar = document.getElementById('toxicity-score-bar');
            const tPercent = document.getElementById('toxicity-percent');
            const tLabel = document.getElementById('toxicity-label');

            tPercent.innerText = safetyPercent + '%';
            tBar.style.width = safetyPercent + '%';

            const summary = document.getElementById('result-text-summary');
            const sLabel = document.getElementById('sentiment-label');
            const sIcon = document.getElementById('sentiment-icon');

            // Duygu İkonu Kararı
            if (data.score > 0.25) { 
                sLabel.innerText = "POZİTİF (Memnun)";
                sIcon.className = "fas fa-smile status-positive";
            } else if (data.score < -0.25) { 
                sLabel.innerText = "NEGATİF (Memnun Değil)";
                sIcon.className = "fas fa-frown status-negative";
            } else {
                sLabel.innerText = "NÖTR / ELEŞTİREL"; 
                sIcon.className = "fas fa-meh status-neutral";
            }

            // Güvenlik Raporu Kararı
            if (safetyPercent < 40) {
                tLabel.innerText = "POLİTİKA İHLALİ";
                tBar.style.backgroundColor = "#c0392b";
                summary.innerHTML = `
                    <div style="background: rgba(192, 57, 43, 0.08); border-left: 4px solid #c0392b; padding: 15px; border-radius: 4px; margin-top: 10px;">
                        <strong style="color: #c0392b; display: block; margin-bottom: 5px;">🚫 REPORT: İçerik Reddedildi</strong>
                        <p style="font-size: 0.85rem; color: #444; margin: 0;">AI Kararı: Bu içerik, topluluk kurallarını ihlal eden unsurlar içerdiği için engellenmiştir.</p>
                    </div>`;
            } else {
                tLabel.innerText = "UYGUNLUK ONAYLANDI";
                tBar.style.backgroundColor = "#27ae60";
                summary.innerHTML = `
                    <div style="background: rgba(39, 174, 96, 0.08); border-left: 4px solid #27ae60; padding: 15px; border-radius: 4px; margin-top: 10px;">
                        <strong style="color: #27ae60; display: block; margin-bottom: 5px;">✅ REPORT: Denetim Başarılı</strong>
                        <p style="font-size: 0.85rem; color: #444; margin: 0;">AI Kararı: İçerik platform politikalarına uygundur.</p>
                    </div>`;
            }

            // AKILLI NOT MOTORU
            let aiAdvice = "";
            if (data.score <= -0.4) {
                aiAdvice = "🚩 <strong>KRİTİK:</strong> Kullanıcı ciddi bir memnuniyetsizlik belirtiyor. Destek ekibi uyarılmalı.";
            } else if (safetyPercent < 70) {
                aiAdvice = "⚠️ <strong>UYARI:</strong> İçerik sınırda ifadeler içeriyor. Manuel inceleme önerilir.";
            } else if (data.score >= 0.6) {
                aiAdvice = "✨ <strong>FIRSAT:</strong> Harika bir geri bildirim! Öne çıkarılması önerilir.";
            } else {
                aiAdvice = "🔍 <strong>BİLGİ:</strong> Standart ve güvenli bir etkileşim.";
            }

            summary.innerHTML += `
                <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed rgba(0,0,0,0.15); font-style: italic; font-size: 0.85rem; color: #555; display: flex; align-items: center; gap: 8px;">
                    ${aiAdvice}
                </div>`;

            resultCard.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error("Hata:", error);
        alert("Bağlantı Hatası: Sunucuya ulaşılamadı.");
    } finally {
        btnText.innerText = "Analizi Başlat";
        analyzeBtn.disabled = false;
    }
}

// JSON Görüntüleyici Fonksiyonu
function toggleJson() {
    const viewer = document.getElementById('json-viewer');
    if (viewer) {
        viewer.classList.toggle('show');
    }
}

// HTML'deki buton id'si ile fonksiyonu bağlayalım
document.getElementById('analyze-btn').addEventListener('click', analizEt);