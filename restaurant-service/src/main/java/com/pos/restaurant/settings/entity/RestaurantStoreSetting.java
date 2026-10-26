package com.pos.restaurant.settings.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "restaurant_store_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantStoreSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false, unique = true)
    private Integer storeId;

    @Column(name = "kitchen_board_enabled", nullable = false)
    @Builder.Default
    private boolean kitchenBoardEnabled = true;

    /** Cashier and menu cards show a photo or the empty placeholder. */
    @Column(name = "menu_photos_enabled", nullable = false)
    @Builder.Default
    private boolean menuPhotosEnabled = true;

    /** JSON print profile (logo, fonts, per-slip field styles). Null = factory defaults. */
    @Column(name = "print_profile_json", columnDefinition = "TEXT")
    private String printProfileJson;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
