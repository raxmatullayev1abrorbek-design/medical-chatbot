import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Static fayllarni xizmat qilish (HTML, CSS, JS)
app.use(express.static(__dirname));

// API kalit – .env dan yoki berilgan defaultdan o'qing
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDcvJ6dr4Ao2ruxifqZ-BWs-qnxamRscuk";

if (!API_KEY || !API_KEY.startsWith("AIza")) {
  console.warn("⚠️  GEMINI_API_KEY topilmadi yoki noto'g'ri. Chat ishlamaydi.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_INSTRUCTION = `Sen professional tibbiy maslahatchi botssan. O'zbek tilida javob berasan.

QOIDALAR:
1. FAQAT tibbiyot va salomatlik haqida javob berasan
2. Tibbiyotga oid bo'lmagan savollarga: "Kechirasiz, men faqat tibbiy savollar bo'yicha yordam beraman" deb javob ber
3. Salom so'zlariga do'stona javob ber va o'zingni tanishtir
4. Kasalliklar haqida to'liq va aniq ma'lumot ber:
   - Bosh og'rig'i (migren, taranglik, sinusit)
   - Shamollash (gripp, ARVI, COVID-19)
   - Isitma va sabablari
   - Qorin og'rig'i va hazm tizimi
   - Yurak-tomir kasalliklari
   - Qandli diabet
   - Qon bosimi muammolari
   - Nafas olish yo'llari kasalliklari
   - Teri kasalliklari
   - Allergiya
   - Bo'g'im kasalliklari
   - Tish og'rig'i
   - Ko'z va quloq kasalliklari
   - Va boshqa umumiy kasalliklar

5. Har bir kasallik uchun tushuntir:
   - Belgilari va alomatlari nima
   - Sabablari
   - Davolash usullari (umumiy ma'lumot)
   - Oldini olish choralari
   - Qachon shifokorga murojaat qilish kerak
   - Uyda qanday yordam berish mumkin

6. Dorilar haqida umumiy ma'lumot ber, lekin aniq dozani aytma
7. Har bir javob oxirida: "⚠️ Jiddiy holatlar uchun albatta shifokorga murojaat qiling!" deb yoz

ESLATMA: Sen tashxis qo'yolmaysan va retsept yozolmaysan. Faqat ma'lumot va maslahat berasen!`;

// Asosiy sahifa - index.html ni ko'rsatish
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Chat API endpoint - barcha xabarlar shu yerga keladi
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Xabar bo'sh bo'lishi mumkin emas"
      });
    }

    if (!API_KEY || !API_KEY.startsWith("AIza") || !genAI) {
      return res.status(500).json({
        success: false,
        error: "API kalit topilmadi. Iltimos, GEMINI_API_KEY ni sozlang."
      });
    }

    console.log("\n📩 Foydalanuvchi xabari:", message);

    // Gemini 2.5 Flash modelini ishlatish
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Gemini API ga so'rov yuborish
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini javobi:", text.substring(0, 50) + "...");

    // Javobni qaytarish
    res.json({
      success: true,
      reply: text
    });

  } catch (error) {
    console.error("❌ Xatolik:", error.message);

    res.status(500).json({
      success: false,
      error: "Javob olishda xatolik",
      details: error.message
    });
  }
});

// API test endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "✅ Server ishlayapti",
    model: "Gemini 1.5 Flash",
    endpoints: {
      home: "GET /",
      chat: "POST /chat",
      status: "GET /api/status"
    }
  });
});

// Server ishga tushirish
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 SERVER MUVAFFAQIYATLI ISHGA TUSHDI!");
  console.log("=".repeat(50));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`💬 Chat sahifasi: http://localhost:${PORT}/`);
  console.log(`🔍 API status: http://localhost:${PORT}/api/status`);
  console.log(`🤖 Model: Gemini 1.5 Flash`);
  console.log("=".repeat(50) + "\n");

  // Brauzerda avtomatik ochish
  try {
    console.log("🌐 Brauzer ochilmoqda...\n");
    await open(`http://localhost:${PORT}`);
  } catch (error) {
    console.log("⚠️ Brauzer avtomatik ochilmadi. Qo'lda oching: http://localhost:${PORT}\n");
  }
});