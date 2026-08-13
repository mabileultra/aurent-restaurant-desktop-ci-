package com.pos.scales.dto;

import java.util.List;

/**
 * Каталог семейств адаптеров (для UI без Desktop тоже видно «много моделей»).
 */
public record ScaleAdapterFamilyDto(
    String id,
    String name,
    String description,
    String modelsHint,
    boolean readyNow,
    boolean pluPush,
    boolean weight,
    boolean builtInPrint
) {
    public static List<ScaleAdapterFamilyDto> catalog() {
        return List.of(
            new ScaleAdapterFamilyDto(
                "weight-generic",
                "Любые весы (только вес)",
                "COM/USB → кг. Код и печать в станции Aurent. Покрывает большинство моделей сразу.",
                "Любые RS-232/USB, которые отдают вес текстом",
                true,
                false,
                true,
                false
            ),
            new ScaleAdapterFamilyDto(
                "family-massa-k",
                "MASSA-K (семейство)",
                "Умные весы с PLU и печатью",
                "ВП, MK-R, TB и др.",
                false,
                true,
                true,
                true
            ),
            new ScaleAdapterFamilyDto(
                "family-cas",
                "CAS (семейство)",
                "CAS host PLU",
                "CL5000, CL3000, PR Plus, …",
                false,
                true,
                true,
                true
            ),
            new ScaleAdapterFamilyDto(
                "family-digi",
                "Digi / Teraoka (семейство)",
                "Digi SM host PLU",
                "SM-100, SM-500, …",
                false,
                true,
                true,
                true
            ),
            new ScaleAdapterFamilyDto(
                "family-yespos-tlp",
                "YesPOS TLP (семейство)",
                "Умные label-scales: PLU-клавиатура + печать на весах",
                "TLP18-LD, TLP18 и близкие линейки",
                false,
                true,
                true,
                true
            ),
            new ScaleAdapterFamilyDto(
                "family-rongta",
                "Rongta / совместимые (семейство)",
                "Китайские label-scales",
                "Rongta RLS и аналоги",
                false,
                true,
                true,
                true
            ),
            new ScaleAdapterFamilyDto(
                "family-generic-smart",
                "Другие умные весы",
                "Новая марка = тот же контракт",
                "Любая модель с выгрузкой PLU",
                false,
                true,
                true,
                true
            )
        );
    }
}
