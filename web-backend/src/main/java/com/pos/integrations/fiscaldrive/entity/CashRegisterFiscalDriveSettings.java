package com.pos.integrations.fiscaldrive.entity;

import com.pos.sales.entity.CashRegister;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Подключение кассы к локальному FiscalDriveService (ФМ 0400). */
@Entity
@Table(name = "cash_register_fiscal_drive_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashRegisterFiscalDriveSettings {

    @Id
    @Column(name = "cash_register_id")
    private Long cashRegisterId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "cash_register_id")
    private CashRegister cashRegister;

    @Column(name = "base_url", nullable = false, length = 512)
    private String baseUrl;

    /** Заводской номер ФМ (36 символов), передаётся в каждый вызов REST-API. */
    @Column(name = "factory_id", length = 64)
    private String factoryId;

    /** Серийный номер ФМ (TerminalID, например ZZ000000000000). */
    @Column(name = "terminal_id", length = 32)
    private String terminalId;

    /** ИНН (9) или ПИНФЛ (14) владельца — для проверки маркировки. */
    @Column(name = "owner_tin", length = 14)
    private String ownerTin;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
