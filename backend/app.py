from flask import Flask, request, jsonify, render_template
from google.cloud import language_v1
from flask_cors import CORS
import sys
import os

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

@app.route("/")
def index():
    # Artık yazı değil, HTML dosyanı döndürecek
    return render_template("index.html")

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend-key-dosyasi.json"

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Metin yok"}), 400

    text = data["text"]

    try:
        client = language_v1.LanguageServiceClient()
        document = language_v1.Document(content=text, type_=language_v1.Document.Type.PLAIN_TEXT)

        # 1. Duygu Analizi
        sentiment_resp = client.analyze_sentiment(request={"document": document})
        score = sentiment_resp.document_sentiment.score
        # DİL BİLGİSİNİ BURADAN ALIYORUZ (Hatanın çözümü burası)
        detected_language = sentiment_resp.language 

        # 2. Moderasyon Analizi
        toxic_score = 0
        try:
            moderation_resp = client.moderate_text(request={"document": document})
            if moderation_resp.moderation_categories:
                toxic_score = max([cat.confidence for cat in moderation_resp.moderation_categories])
        except Exception as mod_error:
            print(f"Moderasyon Hatası (Geçiliyor): {mod_error}", file=sys.stderr)

        return jsonify({
            "score": score,
            "toxicity": toxic_score,
            "language": detected_language
        })

    except Exception as e:
        print(f"KRİTİK HATA: {e}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    import os
    # Cloud Run PORT environment variable'ını kullanır, yoksa 8080 yapar.
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

