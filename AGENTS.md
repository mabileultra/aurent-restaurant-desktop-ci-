# Maxsus Agentlar (Specialist Agents) — Aurent POS

Ushbu loyiha uchun 2 ta ixtisoslashtirilgan sun'iy intellekt agenti sozlangan:

---

## 1. Senior Frontend Engineer (`senior-frontend-engineer`)
* **Rol**: Aurent POS tizimining yetakchi Senior Frontend muhandisi.
* **Mas'uliyat doirasi**:
  - `web-frontend`, `restaurant-frontend`, `desktop-electron`, `restaurant-desktop` ilovalarida arxitektura, komponentlar va mantiqni ishlab chiqish;
  - React 18, Vite 7, Tailwind CSS 3, TanStack Query 5, Zustand 4;
  - Yagona paket boshqaruvi: **pnpm**;
  - Yagona mas'uliyat tamoyili (SRP), DRY, Clean Code (sehrli raqamlardan xoli);
  - Resurslarni to'g'ri boshqarish (`useEffect` cleanup, zero memory leaks);
  - Offline-first va tarmoq uzilishlariga chidamlilik;
  - Vitest orqali qat'iy unit va integratsion testlash.
* **Agent konfiguratsiya fayli**: `~/.gemini/config/plugins/aurent-agents/agents/senior-frontend-engineer.md`

---

## 2. Senior UI/UX Designer (`senior-ux-ui-designer`)
* **Rol**: Yetakchi UI/UX Dizayneri va Dizayn Tizimi Arxitektori.
* **Mas'uliyat doirasi**:
  - Sensorli POS ekranlari, ofitsiant planshetlari, oshxona KDS ekranlari va Super Admin boshqaruv panellari ergonomikasi;
  - **Qat'iy semantik ranglar tizimi**: "Rang shovqini" (color noise) va "kamalak effekti"dan saqlanish;
    - 🟢 Yashil (Emerald) — Asosiy brend, faol holat va muvaffaqiyat;
    - ⚪/⚫ Kulrang (Slate) — Neytral ma'lumotlar va biznes turlari;
    - 🟡 Sariq (Amber) — Faqat va faqat xavf / ogohlantirish (Warning);
    - 🔴 Qizil (Rose) — Xatolar va xavfli amallar;
  - **Touch-first**: Kamida `44x44px` / `48x48px` tap targetlar, minimal bosishlar va yuqori kassir tezligi;
  - **WCAG AA kontrasti** va qorong'i/yorug' rejimlar (Dark/Light mode);
  - Oshxona KDS: 2–3 metr masofadan o'qiluvchanlik va dinamik vaqt indikatorlari.
* **Agent konfiguratsiya fayli**: `~/.gemini/config/plugins/aurent-agents/agents/senior-ux-ui-designer.md`

---

## Foydalanish
Agentlar CLI muhitida mustaqil ravishda yoki subagent sifatida chaqirilishi mumkin. Har ikkala agent loyiha talablariga muvofiq **har doim O'zbek tilida** professional, senior darajadagi tahlil va yechimlarni taqdim etadi.
