# PNPM ga O'tish Bo'yicha Dasturchilar Uchun Qo'llanma (Migration Guide)

Loyiha barcha JavaScript/Node subloyihalarida paket menejeri sifatida **npm**dan **pnpm**ga to'liq o'tkazildi.  
Ushbu hujjat barcha dasturchilar o'z lokal kompyuterlarida (Windows, macOS, Linux) tizimni sozlashlari va to'g'ri ishlashlari uchun mo'ljallangan.

---

## 1. Pnpm hamma operatsion tizimlarda (OS) ishlaydimi?

**HA, 100% ISHLAYDI!**  
`pnpm` quyidagi barcha operatsion tizimlarda rasman qo'llab-quvvatlanadi:
- **Windows** (Windows 10, 11 va Windows Server — PowerShell yoki CMD orqali);
- **macOS** (Intel x64 va Apple Silicon M1 / M2 / M3 / M4);
- **Linux** (Ubuntu, Debian, Fedora, Arch, CentOS, Alpine va barcha boshqa distributivlar);
- **Docker** konteynerlari va CI/CD (GitHub Actions).

---

## 2. Nima uchun pnpm ga o'tdik?

1. **Disk maydonining tejalishi (Content-addressable storage)**:  
   Loyihamizda 6 ta mustaqil Node paketi mavjud (`web-frontend`, `restaurant-frontend`, `desktop-electron`, `restaurant-desktop`, `telegram-support-bot`, `telegram-web-support-bot`). `npm` har bir papkaga fayllarni noldan nusxalab 10-15 GB joy olar edi. `pnpm` esa paketlarni global bitta joyda saqlab, loyihalarga **hard link** qiladi — disk tejalishi 3 barobarga oshadi!
2. **Tezlik**:  
   Kesh va parallel yuklash hisobiga paketlar `npm`ga nisbatan **2–3 barobar tezroq** o'rnatiladi.
3. **Qat'iy xavfsizlik (Strict dependency tree)**:  
   `npm` barcha paketlarni bitta tekis qatlamda (`flat node_modules`) saqlagani uchun "phantom dependencies" (loyihada e'lon qilinmagan paketlarni tasodifan import qilish) xavfi bo'lardi. `pnpm` esa faqat `package.json`da ko'rsatilgan paketlarnigina ko'rishga ruxsat beradi.

---

## 3. Kompyuteringizga `pnpm`ni o'rnatish

O'zingiz ishlatayotgan operatsion tizim bo'yicha quyidagi usullardan **birini** tanlang:

### A. Universal usul (Barcha OT lar uchun — Tavsiya etiladi)
Agar kompyuteringizda Node.js (v16.13+) o'rnatilgan bo'lsa, uning ichida `corepack` mavjud:
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### B. NPM orqali global o'rnatish (Barcha OT lar uchun)
Agar Node.js va npm allaqachon bo'lsa:
```bash
npm install -g pnpm
```

### C. Windows uchun maxsus usullar
PowerShell orqali (Administrator talab qilinmaydi):
```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```
Yoki paket menejeringiz bo'lsa:
```powershell
# Winget orqali:
winget install pnpm.pnpm

# Scoop orqali:
scoop install nodejs pnpm

# Chocolatey orqali:
choco install pnpm
```

### D. macOS uchun maxsus usullar
Homebrew orqali:
```bash
brew install pnpm
```
Yoki Standalone terminal buyrug'i:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### E. Linux (Ubuntu, Debian, Fedora, Arch)
Standalone terminal buyrug'i:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### O'rnatilganini tekshirish:
Terminalda quyidagi buyruqni bering:
```bash
pnpm --version
# Chiqishi kerak: 10.x.x yoki 11.x.x
```

---

## 4. Dasturchi lokal repozitoriyda nima qilishi kerak? (Migratsiya qadamlari)

Agar siz loyihada avvaldan ishlab kelayotgan bo'lsangiz, lokal kompyuteringizda quyidagi 4 qadamni bajaring:

### 1-qadam: Eng so'nggi kodni oling
```bash
git fetch origin
git pull origin dev   # (yoki o'zingiz ishlayotgan branch)
```

### 2-qadam: Eski `package-lock.json` va eski `node_modules`ni tozalang
Eski npm kesh va fayllari pnpm bilan to'qnashmasligi uchun ularni tozalash zarur.

**Linux yoki macOS da (Terminal):**
```bash
# Loyiha ildizida (postsystem papkasida):
find . -name "package-lock.json" -delete
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
```

**Windows da (PowerShell):**
```powershell
# Loyiha ildizida (postsystem papkasida):
Get-ChildItem -Recurse -Filter "package-lock.json" | Remove-Item -Force
Get-ChildItem -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force
```

*(Yoki shunchaki har bir subpapka (`web-frontend`, `restaurant-frontend` va h.k.) ichidagi `node_modules` papkasini qo'lda o'chirib tashlang).*

### 3-qadam: Bog'liqliklarni `pnpm` orqali o'rnating
Har bir o'zingiz ishlaydigan subloyihaga kiring va `pnpm install` qiling:

```bash
# 1. Asosiy veb-ilova va retail kassa
cd web-frontend
pnpm install

# 2. Restoran zali va oshxona ilovasi
cd ../restaurant-frontend
pnpm install

# 3. Kassa Electron desktop ilovasi (agar desktop bilan ishlasangiz)
cd ../desktop-electron
pnpm install

# 4. Restoran local-first desktop ilovasi (agar desktop bilan ishlasangiz)
cd ../restaurant-desktop
pnpm install

# 5. Telegram botlar (agar botlar bilan ishlasangiz)
cd ../telegram-support-bot && pnpm install
cd ../telegram-web-support-bot && pnpm install
```

> **Eslatma (pnpm v11 native build permissions):**  
> Agar `desktop-electron` yoki `restaurant-desktop`da native C++ modullar (masalan `better-sqlite3`, `serialport`, `sharp`, `esbuild`) bo'yicha so'rov chiqsa, repozitoriyda allaqachon `pnpm-workspace.yaml` sozlangan. Shunchaki `pnpm install` buyrug'i barcha ruxsat etilgan buildlarni avtomatik bajaradi.

### 4-qadam: Loyihani ishga tushirib tekshiring
```bash
# Web frontend
cd web-frontend
pnpm dev
# Brauzerda: http://localhost:5173

# Restaurant frontend
cd restaurant-frontend
pnpm dev
# Brauzerda: http://localhost:5174
```

---

## 5. Yangi buyruqlar lug'ati (Cheat Sheet: npm vs pnpm)

Bundan buyon `npm` o'rniga quyidagi ekvivalent buyruqlardan foydalanasiz:

| Vazifa | Eski usul (npm) | Yangi usul (**pnpm**) |
|---|---|---|
| Bog'liqliklarni o'rnatish | `npm install` yoki `npm i` | `pnpm install` (yoki `pnpm i`) |
| CI toza o'rnatish | `npm ci` | `pnpm install --frozen-lockfile` |
| Yangi kutubxona qo'shish | `npm install axios` | `pnpm add axios` |
| Dev kutubxona qo'shish | `npm install -D vitest` | `pnpm add -D vitest` |
| Kutubxonani o'chirish | `npm uninstall axios` | `pnpm remove axios` |
| Dev serverni yoqish | `npm run dev` | `pnpm dev` yoki `pnpm run dev` |
| Loyihani build qilish | `npm run build` | `pnpm build` yoki `pnpm run build` |
| Testlarni yurgazish | `npm test` | `pnpm test` |
| Ixtiyoriy skriptni bajarish | `npm run <script>` | `pnpm <script>` yoki `pnpm run <script>` |

---

## 6. QAT'IY QOIDALAR (MUHIM!)

1. **HECH QACHON `npm install` yoki `yarn add` QILMANG!**  
   Bu yangidan keraksiz `package-lock.json` yoki `yarn.lock` hosil qiladi va git branchlarda ziddiyatlar (merge conflict) keltirib chiqaradi.
2. **`package-lock.json` FAYLINI GITGA PUSH QILMANG!**  
   Faqat `pnpm-lock.yaml` fayli gitda kuzatiladi.
3. Yangi paket qo'shganda yoki yangilaganda doimo `pnpm add` buyrug'idan foydalaning.

Savollar yoki muammolar bo'lsa, jamoa chatiga murojaat qiling.
