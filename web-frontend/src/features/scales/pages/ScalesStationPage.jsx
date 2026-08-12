import ScalesConnectionBar from '../components/ScalesConnectionBar';
import ScalesPluInput from '../components/ScalesPluInput';
import ScalesProductCard from '../components/ScalesProductCard';
import ScalesWeightPanel from '../components/ScalesWeightPanel';
import { useScalesStation } from '../hooks/useScalesStation';
import '../../../styles/scales/scales-station.css';

export default function ScalesStationPage() {
  const {
    t,
    plu,
    setPlu,
    product,
    loading,
    printing,
    lastBarcode,
    autoPrint,
    setAutoPrint,
    lookup,
    doPrint,
    scale,
  } = useScalesStation();

  return (
    <div className="scales-station">
      <header className="scales-station__header">
        <div>
          <h1 className="scales-station__title">{t('scales.stationTitle')}</h1>
          <p className="scales-station__subtitle">{t('scales.stationSubtitle')}</p>
        </div>
      </header>

      <ScalesConnectionBar
        t={t}
        available={scale.available}
        connected={scale.connected}
        reading={scale.reading}
        error={scale.error}
        needsSetup={scale.needsSetup}
        onReconnect={scale.reconnect}
      />

      <div className="scales-station__grid">
        <section className="scales-station__panel">
          <ScalesPluInput
            t={t}
            value={plu}
            onChange={setPlu}
            onSubmit={lookup}
            loading={loading}
          />
          <ScalesProductCard t={t} product={product} />
        </section>

        <section className="scales-station__panel">
          <ScalesWeightPanel
            t={t}
            product={product}
            weightKg={scale.reading?.kg}
            stable={Boolean(scale.reading?.stable)}
            printing={printing}
            lastBarcode={lastBarcode}
            autoPrint={autoPrint}
            onPrint={({ force, toggleAuto } = {}) => {
              if (typeof toggleAuto === 'boolean') {
                setAutoPrint(toggleAuto);
                return;
              }
              doPrint(Boolean(force));
            }}
          />
        </section>
      </div>
    </div>
  );
}
