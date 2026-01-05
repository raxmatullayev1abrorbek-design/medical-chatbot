import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Statik fayllarni xizmat qilish
app.use(express.static(__dirname));

// API kalit - Render Environment Variables orqali olinadi
const API_KEY = process.env.GEMINI_API_KEY;

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_INSTRUCTION = `Sen professional tibbiy maslahatchi botssan. O'zbek tilida javob berasan.
QOIDALAR:
1. FAQAT tibbiyot va salomatlik haqida javob berasan.
2. Tibbiyotga oid bo'lmagan savollarga: "Kechirasiz, men faqat tibbiy savollar bo'yicha yordam beraman" deb javob ber.
3. Har bir javob oxirida: "⚠️ Jiddiy holatlar uchun albatta shifokorga murojaat qiling!" deb yoz.
ESLATMA: Sen tashxis qo'yolmaysan va retsept yozolmaysan.`;

// Asosiy sahifa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Chat API endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Xabar bo'sh" });
    }

    if (!genAI) {
      return res.status(500).json({ error: "API kalit sozlanmagan" });
    }

    // Modelni sozlash - gemini-1.5-flash hozirda eng barqaror versiya
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, reply: text });

  } catch (error) {
    console.error("❌ Xatolik:", error.message);
    res.status(500).json({ success: false, error: "Xatolik yuz berdi" });
  }
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server http://localhost:${PORT} da ishga tushdi`);
});




