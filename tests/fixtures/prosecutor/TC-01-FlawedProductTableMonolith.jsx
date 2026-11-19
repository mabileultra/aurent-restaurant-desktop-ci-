import React, { useState, useMemo } from 'react';

/**
 * TC-01: FlawedProductTableMonolith.jsx
 * Ushbu komponent SRP (>200 qator) qoidasini buzgan monolit hisoblanadi.
 * Bitta fayl ichida jadval, filtr, qidiruv, hisob-kitob va eksport aralashtirib yuborilgan.
 */
export function FlawedProductTableMonolith({ initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Qidiruv va saralash mantiqi
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.barcode && item.barcode.includes(searchQuery));
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        let fieldA = a[sortBy];
        let fieldB = b[sortBy];
        if (typeof fieldA === 'string') {
          return sortOrder === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        }
        return sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
      });
  }, [products, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Paginatsiya
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Chegirma hisoblash
  const calculateFinalPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return price - (price * discount) / 100;
  };

  const handleApplyBulkDiscount = () => {
    setProducts((prev) =>
      prev.map((item) => ({
        ...item,
        priceWithDiscount: calculateFinalPrice(item.price, discountPercent),
      }))
    );
  };

  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      ['ID,Name,Price,Barcode']
        .concat(products.map((p) => `${p.id},"${p.name}",${p.price},${p.barcode || ''}`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'products_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Mahsulotlar Boshqaruvi (Monolit Ro'yxat)
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Qidiruv..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Eksport CSV
          </button>
        </div>
      </div>

      {/* Chegirma bloki */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6 flex items-center gap-4">
        <span className="text-sm font-medium">Ommaviy chegirma (%):</span>
        <input
          type="number"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(Number(e.target.value))}
          className="w-20 px-3 py-1 border rounded"
        />
        <button
          onClick={handleApplyBulkDiscount}
          className="px-3 py-1 bg-slate-700 text-white rounded"
        >
          Qo'llash
        </button>
      </div>

      {/* Jadval */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-100 dark:bg-slate-800">
              <th className="p-3">#</th>
              <th className="p-3 cursor-pointer" onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Nomi
              </th>
              <th className="p-3">Kategoriya</th>
              <th className="p-3 cursor-pointer" onClick={() => { setSortBy('price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Narxi
              </th>
              <th className="p-3">Chegirmali</th>
              <th className="p-3">Shtrix-kod</th>
              <th className="p-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product, idx) => (
              <tr key={product.id || idx} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="p-3">{(currentPage - 1) * pageSize + idx + 1}</td>
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3">{product.category}</td>
                <td className="p-3">{product.price?.toLocaleString()} UZS</td>
                <td className="p-3">
                  {product.priceWithDiscount ? `${product.priceWithDiscount.toLocaleString()} UZS` : '—'}
                </td>
                <td className="p-3 font-mono text-xs">{product.barcode || 'Yo\'q'}</td>
                <td className="p-3 text-right">
                  <button className="px-2 py-1 text-xs text-blue-600 hover:underline">Tahrirlash</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginatsiya qismi */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-slate-500">
          Jami: {filteredProducts.length} ta mahsulot
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Oldingi
          </button>
          <span className="text-sm px-2">Sahifa: {currentPage}</span>
          <button
            disabled={currentPage * pageSize >= filteredProducts.length}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Keyingi
          </button>
        </div>
      </div>

      {/* Monolit hajmini 200 qatordan oshiruvchi yordamchi qismlar */}
      <div className="mt-8 border-t pt-4 text-xs text-slate-400">
        <div>Ichki audit ma'lumotlari:</div>
        <div>Tizim ID: MONOLITH-TABLE-V1</div>
        <div>Xavfsizlik darajasi: Standard</div>
        <div>Paginatsiya holati: Faol</div>
        <div>Oxirgi yangilanish: 2026-11-19</div>
        <div>Modul versiyasi: 1.0.4-internal</div>
        <div>Kesh holati: Ochiq</div>
        <div>Server vaqti: Toshkent UTC+5</div>
        <div>Mijoz brauzeri tekshiruvi: Muvaffaqiyatli</div>
        <div>Eksport formati: UTF-8 CSV</div>
        <div>Kassir ruxsati: ReadWrite</div>
        <div>Hisobot generation: Client-side DOM parsing</div>
        <div>Saralash indeksi: Avtomatik</div>
        <div>Filtr holati: Sinxron</div>
        <div>Yuklangan ob'ektlar: {products.length}</div>
        <div>Maksimal ruxsat: 500</div>
        <div>Xotira nazorati: Passiv</div>
        <div>Re-render soni: 12</div>
        <div>Optimizatsiya: Yo'q</div>
        <div>SRP holati: Monolit komponent</div>
        <div>Debug ma'lumoti: {JSON.stringify({ query: searchQuery, cat: selectedCategory })}</div>
        <div>Izoh: Ushbu qatorlar fayl hajmini 200 qatordan oshirib, SRP qoidasini fosh etish uchun xizmat qiladi.</div>
        <div>Monolit qator 191</div>
        <div>Monolit qator 192</div>
        <div>Monolit qator 193</div>
        <div>Monolit qator 194</div>
        <div>Monolit qator 195</div>
        <div>Monolit qator 196</div>
        <div>Monolit qator 197</div>
        <div>Monolit qator 198</div>
        <div>Monolit qator 199</div>
        <div>Monolit qator 200</div>
        <div>Monolit qator 201</div>
        <div>Monolit qator 202</div>
        <div>Monolit qator 203</div>
        <div>Monolit qator 204</div>
        <div>Monolit qator 205</div>
        <div>Monolit qator 206</div>
        <div>Monolit qator 207</div>
        <div>Monolit qator 208</div>
        <div>Monolit qator 209</div>
        <div>Monolit qator 210</div>
        <div>Monolit qator 211</div>
        <div>Monolit qator 212</div>
        <div>Monolit qator 213</div>
        <div>Monolit qator 214</div>
        <div>Monolit qator 215</div>
      </div>
    </div>
  );
}
