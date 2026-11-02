# 📋 Backend Texnik Topshiriq: Kassa, Kirish Huquqlari va Kassa Bildirishnomalari (Aurent POS)

Ushbu hujjat GitHub Issues (#33, #34, #35, #36) va kassa xavfsizligi tahlili asosida tayyorlandi. Backend dasturchisiga qaysi qismlar tayyor bo'lgani va aynan qaysi API'lar kutilayotganini tushuntiruvchi to'liq texnik topshiriq.

---

## ✅ 1. KECHA BAJARILGAN QISMLAR (Status: Implemented on Main)
*Ushbu qismlar kecha tunda backend tomonidan `main`ga kiritilgan:*
- [x] **Kirish huquqlari statistikasi** (`GET /api/v1/platform/module-access/stats`) — faoliyat turlari va rollar bo'yicha agregat sonlar (#36).
- [x] **Rol shablonlari bazasi** (`GET / PUT /platform/module-access/role-templates/{businessType}/{role}`) — shablonlarni saqlash va o'qish (#35 ning 1-qismi).
- [x] **Xodimlarni rol bo'yicha server-side filtrlash** (`GET /platform/module-access/users?role=...`) (#35).

---

## 🔴 2. HOZIR KUTILAYOTGAN VAZIFALAR (Checklist)

---

### A. KASSA BILDIRISHNOMALARI: TANLAB YUBORISH VA REJALASHTIRISH (GitHub #34)
*(Skrinshotda «Tez kunda» deb turgan ikkita imkoniyatni to'liq ishga tushirish uchun)*

#### 1. "Tanlab yuborish" — Kompaniya va Filiallar bo'yicha targeting
* **Muammo**:
  SuperAdmin xabarni har doim ham barcha 132 ta kassaga yubormaydi. Masalan, faqat bitta kompaniyaning (masalan, "Rayhon") yoki faqat ma'lum filiallarning (masalan, "Chilonzor filiali" va "Yunusobod filiali") kassirlariga yo'naltirilgan ogohlantirish yuborish kerak.
* **Tegishli API'lar**:
  - `POST /api/v1/platform/desktop-notifications/broadcast`
    - Payload maydonlari:
      - `targetType`: `"ALL"` | `"COMPANIES"` | `"STORES"`
      - `companyIds`: `[1, 2]` (agar targetType === 'COMPANIES')
      - `storeIds`: `[10, 15]` (agar targetType === 'STORES')
  - `GET /api/v1/desktop-notifications/unread` (Kassir kassa dasturini ochganda unread xabarlarni so'raydi):
    - Parametrlar: `?userId=...&companyId=...&storeIds=...`
* **Backend logikasi**:
  - Kassir xabarlarni so'raganda, backend quyidagilarni tekshirib qaytarishi shart:
    1. Agar xabar `targetType === 'ALL'` bo'lsa — barcha kassalar oladi.
    2. Agar `targetType === 'COMPANIES'` bo'lsa — faqat o'sha `companyId` ga tegishli kassirlar oladi.
    3. Agar `targetType === 'STORES'` bo'lsa — faqat o'sha `storeIds` dagi filial kassirlari oladi.
    4. Boshqa kassalarga bu xabar bormasligi (ko'rinmasligi) shart.

#### 2. "Rejalashtirish" — Kelajakdagi vaqtga vaqtli xabar (Scheduled Broadcasts)
* **Muammo**:
  Admin tungi profilaktika yoki yangilanish haqidagi xabarni kunduzi yozib, soat 23:00 da kassalarga avtomatik chiqadigan qilib rejalashtirib qo'ymoqchi. Hozirda backendda xabarlar faqat darhol yuboriladi.
* **Tegishli API**:
  - `POST /api/v1/platform/desktop-notifications/broadcast`
    - `scheduleType`: `"NOW"` | `"SCHEDULED"`
    - `scheduledAt`: `"2026-11-05T18:00:00Z"` (ISO 8601 UTC)
* **Backend logikasi**:
  - Agar `scheduleType === 'SCHEDULED'` va `scheduledAt > now()` bo'lsa:
    - Xabarning statusi `"SCHEDULED"` bo'lib saqlansin va kassalarga darhol tarqatilmasin (kassirning unread ro'yxatida ko'rinmasin).
    - Backendda fonda ishlovchi rejalashtiruvchi cron job (masalan, har 1 daqiqada ishlovchi Spring `@Scheduled`):
      `scheduledAt <= now()` bo'lgan barcha `SCHEDULED` xabarlarning statusini `"ACTIVE"` ga o'tkazsin va kassalarga tarqatsin.

> **Eslatma (Frontend bo'yicha)**: Backend ushbu targeting va scheduler mantiqini to'liq tekshirib tasdiqlashi bilan, frontenddagi "Tez kunda" cheklovi olib tashlanadi va ikkala tugma to'liq faollashtiriladi.

---

### B. KASSA MODULI (Moliya va xavfsizlik — P0 Kritik)

#### 3. Takroriy yozilishdan himoya: `X-Idempotency-Key` (P0)
* **Muammo**:
  Kassa kirim/chiqimida yoki savdo saqlashda internet sekinlashsa, kassir "Kiritish" yoki "Saqlash"ni qayta-qayta bosadi. Hozirda backend har bir bosishni yangi tranzaksiya deb biladi. Oqibatda kassaga ikki marta pul kiritilishi, ikki marta pul yechilishi yoki ikkita bir xil chek urilib, qoldiq ikki barobar kamayishi xavfi bor.
* **Yechim**:
  Frontend kassa so'rovlariga UUID shaklida `X-Idempotency-Key` sarlavhasini yubormoqda. Backend uni Redis/DB da kamida 24 soat keshlab, bir xil kalit bilan takroriy so'rov kelsa, operatsiyani qaytadan bajarmasdan avvalgi saqlangan javobni (200/201) qaytarishi kerak.
* **Tegishli API'lar**:
  - `POST /api/v1/sales`
  - `POST /api/v1/cashier/shifts/{id}/cash-in`
  - `POST /api/v1/cashier/shifts/{id}/cash-out`
* **Logika**:
  - Bir xil kalit kelganda operatsiya takrorlanmasin, avvalgi `200/201` javobi qaytarilsin.
  - Birinchi so'rov hali tranzaksiyada bo'lsa — `409 Conflict` qaytarilsin.
  - Boshqa summa bilan bir xil kalit kelsa — `422 Unprocessable Entity` qaytarilsin.

#### 4. Kassa chiqimida (Cash-out) kassa naqd balansi nazorati (P0)
* **Muammo**:
  Kassadan pul yechishda (inkassatsiya/xarajat) kassa g'aladonida yetarli naqd pul bor-yo'qligi tekshirilmaydi. Natijada kassa balansi manfiyga tushib ketishi mumkin.
* **Tegishli API**: `POST /api/v1/cashier/shifts/{id}/cash-out`
* **Logika**: `amount <= currentCashAmount` sharti qat'iy tekshirilsin. Agar yetarli bo'lmasa — `400 Bad Request` ("Kassada yetarli naqd pul mavjud emas").

#### 5. Oflayn savdolar to‘plami (Offline Batch Sync) (P1)
* **Muammo**:
  Do'konda internet uzilganda kassir to'xtab qolmasligi uchun sotuvlar lokal saqlanadi. Internet qayta ulanganda cheklar bitta-bitta yuborilsa, serverga katta yuklama tushadi va chek urilgan haqiqiy vaqt yo'qoladi.
* **Tegishli API**: `POST /api/v1/sync/sales/batch` — Oflayn urilgan cheklar massivini qabul qilish.
* **Logika**: Har bir chekning `clientCreatedAt` (kassir chek urgan haqiqiy vaqt) vaqtini saqlash.

---

### C. KIRISH HUQUQLARI (RBAC V2 — GitHub #35 ning qolgan qismi)

#### 6. Huquqlardan nusxa olish (Copy Permissions) (P1)
* **Muammo**:
  Bitta tajribali kassir yoki menejerning sozlangan huquqlarini shu roldagi yangi 5–10 ta xodimga bir zumda ko'chirish imkoni bo'lishi kerak.
* **Tegishli API**: `POST /api/v1/platform/module-access/copy`
* **Parametrlar**:
  - `sourceUserId`: qaysi xodimdan olinadi.
  - `targetUserIds`: qaysi xodimlarga ko'chiriladi (massiv).
  - `strategy`: `"MERGE"` (mavjud huquqlarga qo'shish) yoki `"REPLACE"` (mavjud huquqlarni to'liq almashtirish).

#### 7. Ommaviy shablonga qaytarish (Bulk Reset) (P1)
* **Muammo**:
  Shablondan adashib ketgan yoki individual huquq berilgan bir nechta xodimlarni bitta tugma bilan yana o'z rolining standart shabloniga qaytarish zarur.
* **Tegishli API**: `POST /api/v1/platform/module-access/bulk-reset`
* **Parametr**: `userIds: [12, 15, 28]`

#### 8. Huquqlar o'zgarishi tarixi va Revers (Audit Log & Revert) (P1)
* **Muammo**:
  Kim qachon qaysi xodim yoki rolning huquqini o'zgartirgani ko'rinmaydi. Agar adashib noto'g'ri huquq berilsa, uni bitta bosish bilan avvalgi holatiga qaytarish (revert) imkoni yo'q.
* **Tegishli API'lar**:
  - `GET /api/v1/platform/module-access/history` — Huquqlar o'zgarishi jurnali (vaqti, operator, target, o'zgargan modullar).
  - `POST /api/v1/platform/module-access/history/{historyId}/revert` — Amalni 1 ta bosish bilan bekor qilib, oldingi holatni tiklash.

#### 9. Sessiyani darhol yangilash / Token Invalidation (P0 Xavfsizlik)
* **Muammo**:
  Xodimdan "Chekni bekor qilish" huquqi olib tashlansa, uning eski JWT tokeni yashash vaqti tugaguncha o'chirilgan amalni bajaraveradi.
* **Logika**:
  Xodim huquqi o'zgarganda uning keshdagi sessiyasi darhol yangilansin yoki kritik kassa amallarida huquqlar DB/Redis orqali jonli tekshirilsin.

---

### D. FILIALLAR VA VILOYAT FILTRI (GitHub #33)

#### 10. `/stores/by-company` ga `companyId` parametri qo'shilishi (P1)
* **Muammo**:
  SuperAdmin `/stores` sahifasida filtrdan bitta kompaniya tanlansa ham, backend `GET /api/v1/stores/by-company` da barcha kompaniyalarni qaytarib yubormoqda, chunki endpoint `companyId` parametrini qabul qilmaydi.
* **Tegishli API**: `GET /api/v1/stores/by-company?companyId=12` — Faqat tanlangan kompaniya filiallarini qaytarishi kerak.

#### 11. Qidiruvda filial mos kelsa kompaniyani chiqarish (P1)
* **Muammo**:
  Qidiruvda filial nomi (masalan "Yunusobod filiali") yozilsa, KPI da filial bor deb ko'rinadi, lekin ro'yxatda chiqmaydi. Chunki backend qidiruvni faqat kompaniya nomi bo'yicha qilmoqda.
* **Backend talabi**: `CompanySpecifications.java` da qidiruv so'ziga kompaniyaning biror filiali nomi, kodi yoki manzili to'g'ri kelsa ham, kompaniyani natijaga chiqaruvchi subquery qo'shish kerak.

#### 12. Filial viloyati bo'sh bo'lganda kompaniya viloyatiga ulanish (P1)
* **Muammo**:
  Bazada 106 ta filialdan 65 tasida `regionCode` bo'sh (NULL). Viloyat bo'yicha filtrlanganda (masalan Toshkent), KPI 44 ta filial, ammo ro'yxatda 59 ta kompaniya chiqmoqda.
* **Backend talabi**: `StoreSpecifications.java` da agar filialning `regionCode` qiymati NULL bo'lsa, uning asosiy kompaniyasining `regionCode` qiymatini tekshiradigan shart qo'shilishi kerak.

---

## 📌 AMALGA OSHIRISH PRIORITETLARI

| Prioritet | Yo'nalish | Tavsif |
|---|---|---|
| **P0 (Kritik)** | Kassa | `X-Idempotency-Key` filtri (kassa kirim/chiqim va sotuv takrorlanishidan himoya) |
| **P0 (Kritik)** | Kassa | Kassa chiqimida manfiy qoldiqqa tushmaslik tekshiruvi (`amount <= currentCashAmount`) |
| **P0 (Kritik)** | Bildirishnomalar | **Tanlab yuborish (Targeting)**: `companyIds` va `storeIds` bo'yicha filtrlash (#34) |
| **P0 (Kritik)** | Bildirishnomalar | **Rejalashtirish (Scheduling)**: Cron job orqali vaqti kelganda faollashtirish (#34) |
| **P1 (Yuqori)** | Kirish huquqlari | Xodimlar istisnolari (`copy`, `bulk-reset`, `history/revert`) (#35) |
| **P1 (Yuqori)** | Filiallar | `GET /stores/by-company?companyId=...` va filiallar qidiruvi (#33) |
| **P1 (Yuqori)** | Kassa | Oflayn savdolar to'plamini qabul qilish (`POST /sync/sales/batch`) |
