/** Inline fallback — keep admin/POS chrome mounted while a lazy page chunk loads. */
export default function PharmacyPageFallback() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center p-6 text-slate-500" role="status">
      Загрузка…
    </div>
  );
}
