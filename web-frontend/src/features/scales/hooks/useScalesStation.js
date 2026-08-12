import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { scalesApi } from '../../../api/scales.api';
import { useScaleWeight } from '../../../scales/useScaleWeight';
import { isDesktopScaleBridge } from '../../../scales/scaleBridge';
import { encodeWeightBarcode } from '../utils/weightBarcode';
import { printWeightLabel } from '../utils/printWeightLabel';

const AUTO_PRINT_KEY = 'scales.station.autoPrint';

export function useScalesStation() {
  const { t } = useTranslation();
  const [plu, setPlu] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [lastBarcode, setLastBarcode] = useState('');
  const [autoPrint, setAutoPrint] = useState(() => {
    try {
      return localStorage.getItem(AUTO_PRINT_KEY) !== '0';
    } catch {
      return true;
    }
  });

  const scale = useScaleWeight(isDesktopScaleBridge());
  const lastPrintedKeyRef = useRef('');
  const printingRef = useRef(false);

  const lookup = useCallback(async () => {
    const code = String(plu || '').trim();
    if (!code) return;
    setLoading(true);
    try {
      const { data } = await scalesApi.getByPlu(code);
      setProduct(data);
      lastPrintedKeyRef.current = '';
    } catch (e) {
      setProduct(null);
      toast.error(e.response?.data?.message || t('scales.productNotFound'));
    } finally {
      setLoading(false);
    }
  }, [plu, t]);

  const doPrint = useCallback(
    async (force = false) => {
      if (!product?.plu) {
        toast.error(t('scales.noProduct'));
        return;
      }
      const kg = Number(scale.reading?.kg);
      if (!Number.isFinite(kg) || kg <= 0) {
        toast.error(t('scales.needWeight'));
        return;
      }
      if (!force && !scale.reading?.stable) {
        return;
      }
      if (!force && !autoPrint) {
        return;
      }

      const key = `${product.plu}:${kg.toFixed(3)}`;
      if (!force && lastPrintedKeyRef.current === key) {
        return;
      }
      if (printingRef.current) return;

      printingRef.current = true;
      setPrinting(true);
      try {
        const barcode = encodeWeightBarcode(product.plu, kg);
        await printWeightLabel({ product, weightKg: kg, t, copies: 1 });
        lastPrintedKeyRef.current = key;
        setLastBarcode(barcode);
        toast.success(t('scales.printOk'));
      } catch (e) {
        toast.error(e?.message || e.response?.data?.message || t('scales.printFailed'));
      } finally {
        printingRef.current = false;
        setPrinting(false);
      }
    },
    [autoPrint, product, scale.reading, t]
  );

  useEffect(() => {
    if (!autoPrint || !product?.plu) return undefined;
    if (!scale.reading?.stable) return undefined;
    const kg = Number(scale.reading?.kg);
    if (!Number.isFinite(kg) || kg <= 0) return undefined;
    const timer = window.setTimeout(() => {
      doPrint(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [autoPrint, doPrint, product?.plu, scale.reading?.kg, scale.reading?.stable]);

  const setAutoPrintPersist = useCallback((value) => {
    setAutoPrint(value);
    try {
      localStorage.setItem(AUTO_PRINT_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  return {
    t,
    plu,
    setPlu,
    product,
    loading,
    printing,
    lastBarcode,
    autoPrint,
    setAutoPrint: setAutoPrintPersist,
    lookup,
    doPrint,
    scale,
  };
}
