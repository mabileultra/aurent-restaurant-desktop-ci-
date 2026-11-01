# Backend uchun API Topshiriqlari (Issues)

Ushbu hujjat frontend talablari asosida backend jamoasi uchun tayyorlangan texnik topshiriqlar (issues) to'plamidir. Har bir issue'ni to'g'ridan-to'g'ri GitHub/GitLab issue yoki Jira task sifatida ochish mumkin.

---

## Issue 1: Rol shablonlari huquqlarini saqlash va o'qish (Role Templates API)
**Labels**: `backend`, `security`, `module-access`, `feature`  
**Priority**: High  

### Tavsif
Frontendning yangi "Kirish huquqlari" (V2) kartali ko'rinishida super-admin har bir faoliyat turi (Restoran, Dorixona va h.k.) va rol (Admin, Menejer, Kassir) uchun standart modullar to'plamini (shablonni) sozlay olishi lozim. Hozirda backendda faqat `roleDefault` o'qiladi, lekin shablonni o'zgartiruvchi endpoint yo'q.

### Talab qilinadigan endpointlar
1. `GET /api/platform/module-access/role-templates/{businessType}/{role}`
   - Qaytaradi: Ushbu rol uchun standart ruxsat berilgan modullar ro'yxati.
2. `PUT /api/platform/module-access/role-templates/{businessType}/{role}`
   - Body:
     ```json
     {
       "modules": {
         "products": true,
         "categories": true,
         "fin_journal": false
       },
       "applyToExisting": false
     }
     ```
   - `applyToExisting: true` bo'lsa, ushbu roldagi mavjud barcha xodimlarga (istisnolari bo'lmaganlariga) ham o'zgarish avtomatik tatbiq etilsin.

### Qabul qilish mezonlari (Acceptance Criteria)
- Super-admin huquqi talab qilinadi (`SUPER_ADMIN`).
- Yangi qo'shilgan xodim o'z roli va faoliyat turiga ko'ra yangilangan shablon huquqlarini avtomatik qabul qilishi shart.
- Muvaffaqiyatli saqlanganda `200 OK` va yangilangan shablon obyekti qaytadi.

---

## Issue 2: Xodimlar ro'yxatini rol bo'yicha server-side filtrlash
**Labels**: `backend`, `performance`, `module-access`  
**Priority**: High  

### Tavsif
Hozirda `GET /api/platform/module-access/users?businessType=RESTAURANT&role=MANAGER` so'rovi yuborilganda, backend `role` parametrini inobatga olmay barcha 195 ta foydalanuvchini qaytarmoqda.

### Talab
- `GET /api/platform/module-access/users` endpointida `role` query parametrini filtrlashga qo'shish.
- Misol: `GET /api/platform/module-access/users?businessType=RESTAURANT&role=CASHIER&page=0&size=50`
- Response strukturasi:
  ```json
  {
    "content": [
      {
        "id": "usr_123",
        "name": "Ali Valiyev",
        "role": "CASHIER",
        "companyName": "Rayhon Milliy Taomlar",
        "customAccess": false
      }
    ],
    "totalElements": 38,
    "totalPages": 1
  }
  ```

### Qabul qilish mezonlari
- `role` parametri berilganda faqat shu roldagi xodimlar qaytishi kerak.
- `role` berilmasa — eski xatti-harakat (barcha rollar) saqlanib qoladi.

---

## Issue 3: Huquqlar o'zgarishi auditi va tarixi (Audit Log & Rollback)
**Labels**: `backend`, `audit`, `security`  
**Priority**: Medium  

### Tavsif
Dizayndagi "O'zgarishlar tarixi" modal oynasi uchun kim, qachon, qaysi rol yoki xodimning huquqini o'zgartirganini qaytaruvchi va zarur hollarda o'zgarishni bekor qiluvchi (rollback) API kerak.

### Talab qilinadigan endpointlar
1. `GET /api/platform/module-access/history`
   - Query: `businessType`, `role`, `page`, `size`
   - Response:
     ```json
     {
       "content": [
         {
           "id": "hist_01",
           "changedAt": "2026-11-01T15:30:00Z",
           "authorName": "Laziz SuperAdmin",
           "targetType": "ROLE_TEMPLATE",
           "role": "MANAGER",
           "businessType": "RESTAURANT",
           "diff": "+kassa, -fin_journal",
           "affectedCount": 13
         }
       ]
     }
     ```
2. `POST /api/platform/module-access/history/{historyId}/rollback`
   - O'zgarishni oldingi holatiga qaytarish (`200 OK`).

---

## Issue 4: Bildirishnomalarni tanlab yuborish (Desktop Targeting by Companies/Stores)
**Labels**: `backend`, `desktop-notifications`, `bug`  
**Priority**: Critical  

### Tavsif
Frontendda "Tanlab yuborish" rejimida tanlangan kompaniya yoki filiallar IDlari (`targetType: "SELECTED_STORES"`, `storeIds: [...]`) yuborilmoqda, ammo backend bu maydonlarni inobatga olmay xabarni barcha kassalarga darhol tarqatmoqda.

### Talab
- `POST /api/platform/desktop-notifications` modeliga quyidagi maydonlarni qo'shish va qayta ishlash:
  - `targetType`: `"ALL" | "SELECTED_COMPANIES" | "SELECTED_STORES"`
  - `companyIds`: `string[]` (agar targetType === SELECTED_COMPANIES)
  - `storeIds`: `string[]` (agar targetType === SELECTED_STORES)
- Kassalarga SSE / WebSocket orqali xabar yuborishda faqat belgilangan filial/kompaniyalarga tegishli aktiv kassa seanslariga xabarni yuborish.

---

## Issue 5: Bildirishnomalarni rejalashtirilgan vaqtda yuborish (Scheduled Notifications)
**Labels**: `backend`, `desktop-notifications`, `scheduler`  
**Priority**: High  

### Tavsif
Frontendda xabarni kelajakdagi vaqtga rejalashtirish (`scheduledAt: "2026-11-01T21:00:00Z"`) yuborilganda, backend xabarni rejalashtirmasdan darhol yuborib yubormoqda yoki vaqtni e'tiborsiz qoldirmoqda.

### Talab
- `scheduledAt` maydonini qabul qilish (ISO 8601 UTC formatda).
- Agar `scheduledAt > now()` bo'lsa:
  - Xabarning statusi `"SCHEDULED"` bo'lib saqlansin.
  - Belgilangan vaqt yetganda fonda ishlovchi scheduler (masalan, Spring `@Scheduled` yoki Quartz) xabarni aktiv kassalarga yetkazsin va statusini `"SENT"` ga o'tkazsin.
- Agar `scheduledAt` o'tgan vaqt bo'lsa yoki formati noto'g'ri bo'lsa, `400 Bad Request` qaytarilsin.
