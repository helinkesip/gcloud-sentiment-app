

const tx = document.getElementById('comment-input');
if(tx) {
    tx.addEventListener("input", function() {
        // Her harf girildiğinde yüksekliği sıfırlayıp içeriğe göre yeniden hesaplıyoruz
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
        
        // Karakter sayacını güncelleme (zaten sende vardı ama burada kalsın)
        document.querySelector('.char-count').innerText = `${this.value.length} / 500`;
    });
}


// Arka plan animasyonu ve karakter sayacı kısımlarına dokunmuyoruz, onlar zaten harika çalışıyor.
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

const textarea = document.getElementById('comment-input');
if(textarea) {
    textarea.addEventListener('input', (e) => {
        document.querySelector('.char-count').innerText = `${e.target.value.length} / 500`;
    });
}

// YENİLENMİŞ ANALİZ FONKSİYONU
async function analizEt() {
    const input = document.getElementById('comment-input').value;
    const btnText = document.getElementById('btn-text');
    const resultCard = document.getElementById('result-container');
    const analyzeBtn = document.getElementById('analyze-btn');

    if (input.trim().length < 5) {
        alert("Lütfen denetleme için geçerli bir yorum girin.");
        return;
    }

    // Panel Yükleniyor Durumu
    btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Audit Ediliyor...';
    analyzeBtn.disabled = true;

    try {
        const response = await fetch('http://127.0.0.1:5001/analyze', {
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
            // Backend'den gelen toxicity 1 ise (çok riskli), biz 'Güvenlik' olarak tersini (1 - toxicity) gösteriyoruz.
            const safetyPercent = Math.round((1 - data.toxicity) * 100);
            const tBar = document.getElementById('toxicity-score-bar');
            const tPercent = document.getElementById('toxicity-percent');
            const tLabel = document.getElementById('toxicity-label');
            const tIcon = document.getElementById('toxicity-icon');

            tPercent.innerText = safetyPercent + '%';
            tBar.style.width = safetyPercent + '%';

            // --- PROFESYONEL KARAR VE DENETİM PANELİ ---
            const summary = document.getElementById('result-text-summary');
            const sLabel = document.getElementById('sentiment-label');
            const sIcon = document.getElementById('sentiment-icon');

            // front.js içindeki mantığı şu şekilde güncelle:

            if (data.score > 0.25) { 
                sLabel.innerText = "POZİTİF (Memnun)";
                sIcon.className = "fas fa-smile status-positive";
            } else if (data.score < -0.25) { 
                sLabel.innerText = "NEGATİF (Memnun Değil)";
                sIcon.className = "fas fa-frown status-negative";
            } else {
                // "Beğenmedim" gibi kısa ve net olmayan duygular buraya düşer
                sLabel.innerText = "NÖTR / ELEŞTİREL"; 
                sIcon.className = "fas fa-meh status-neutral";
            }

            // 2. SaaS Tipi Karar Kutusu
            const auditID = Math.random().toString(36).substr(2, 9).toUpperCase();

            // 2. Kurumsal Moderasyon Karar Kutusu
            // --- GÜNCELLENMİŞ GÜVENLİK (MODERASYON) MANTIĞI ---

            if (safetyPercent < 40) { // Sadece GERÇEKTEN riskli içeriklerde (küfür, hakaret) durdur
                tLabel.innerText = "POLİTİKA İHLALİ";
                tBar.style.backgroundColor = "#c0392b";
                
                summary.innerHTML = `
                    <div style="background: rgba(192, 57, 43, 0.08); border-left: 4px solid #c0392b; padding: 15px; border-radius: 4px; margin-top: 10px;">
                        <strong style="color: #c0392b; display: block; margin-bottom: 5px;">🚫 REPORT: İçerik Reddedildi</strong>
                        <p style="font-size: 0.85rem; color: #444; margin: 0;">
                            <strong>AI Kararı:</strong> Bu içerik, topluluk kurallarını ihlal eden (saldırganlık veya nefret söylemi) unsurlar içerdiği için otomatik olarak engellenmiştir.
                        </p>
                    </div>
                `;
            } else { // %40 ve üzeri "Güvenli" kabul edilsin (Eleştiriler buraya düşer)
                tLabel.innerText = "UYGUNLUK ONAYLANDI";
                tBar.style.backgroundColor = "#27ae60";
                
                summary.innerHTML = `
                    <div style="background: rgba(39, 174, 96, 0.08); border-left: 4px solid #27ae60; padding: 15px; border-radius: 4px; margin-top: 10px;">
                        <strong style="color: #27ae60; display: block; margin-bottom: 5px;">✅ REPORT: Denetim Başarılı</strong>
                        <p style="font-size: 0.85rem; color: #444; margin: 0;">
                            <strong>AI Kararı:</strong> İçerik, platform politikalarına uygundur. Negatif geri bildirimler dahil olmak üzere yayın onayı verildi.
                        </div>
                    `;
            }
            // --- YENİLENMİŞ YORUMDENET AI AKILLI NOT MOTORU ---
            let aiAdvice = "";
            
            // Senaryo 1: Kritik Olumsuzluk (Skor düşükse ama güvenlik yüksekse bile uyar)
            if (data.score <= -0.4) {
                aiAdvice = "🚩 <strong>KRİTİK:</strong> Kullanıcı ciddi bir memnuniyetsizlik belirtiyor. Acil çözüm için müşteri destek ekibine yönlendirilmesi önerilir.";
            } 
            // Senaryo 2: Politika İhlali / Riskli İçerik
            else if (safetyPercent < 70) {
                aiAdvice = "⚠️ <strong>UYARI:</strong> İçerik, platformun nezaket kurallarını ihlal edebilecek ifadeler barındırıyor. Manuel inceleme önerilir.";
            }
            // Senaryo 3: Çok Olumlu / Fırsat
            else if (data.score >= 0.6) {
                aiAdvice = "✨ <strong>FIRSAT:</strong> Bu harika bir geri bildirim! Marka imajı için bu yorumu öne çıkarabilir veya sosyal medyada paylaşabilirsiniz.";
            }
            // Senaryo 4: Nötr veya Hafif Olumlu
            else {
                aiAdvice = "🔍 <strong>BİLGİ:</strong> Standart ve güvenli bir etkileşim. Rutin denetim dışında ek bir aksiyon gerektirmiyor.";
            }

            // Notu rapora ekle
            summary.innerHTML += `
                <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed rgba(0,0,0,0.15); font-style: italic; font-size: 0.85rem; color: #555; display: flex; align-items: center; gap: 8px;">
                    ${aiAdvice}
                </div>
            `;

            // Kartı animasyonla göster
            resultCard.classList.add('fade-in'); 
            resultCard.style.display = 'block';
            resultCard.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (error) {
        console.error("Hata:", error);
        alert("Denetleme paneline ulaşılamadı!");
    } finally {
        btnText.innerText = "Analizi Başlat";
        analyzeBtn.disabled = false;
    }
}

// Analiz başarılı olduğunda fetch içindeki data'yı buraya bas:
document.getElementById('raw-response-code').textContent = JSON.stringify(data, null, 2);

function toggleJson() {
    const viewer = document.getElementById('json-viewer');
    if (viewer) {
        // 'hidden' class'ı yerine 'show' class'ı ile kontrol etmek daha sağlamdır
        viewer.classList.toggle('show');
    }
}