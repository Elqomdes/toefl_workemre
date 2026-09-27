# TOEFL Skor Pratik

Yeni TOEFL iBT formatına (Ocak 2026) uygun, her bölümde puan veren pratik sitesi.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda http://localhost:5173 adresini aç (konuşma bölümü için Chrome veya Edge).

## Puanlama

- **Reading / Listening:** cevap anahtarı ile otomatik.
- **Listen and Repeat:** konuşman metne çevrilir, hedef cümleyle kelime kelime karşılaştırılır (0-5). Gemini açıksa ses kaydından telaffuz puanı da eklenir.
- **Take an Interview, Write an Email, Academic Discussion:** yapay zeka (Gemini veya OpenAI) ETS rubriğine göre 0-5 puan ve Türkçe geri bildirim verir.
- Bölüm yüzdeleri 1-6 band'e çevrilir, genel puan dört bölümün ortalamasıdır (en yakın 0.5).

Yapay zeka puanlaması için **Ayarlar** sayfasına API anahtarı gir. Ücretsiz Gemini anahtarını https://aistudio.google.com/apikey adresinden alabilirsin.

Puanlar tahminidir, resmi ETS puanı değildir.
