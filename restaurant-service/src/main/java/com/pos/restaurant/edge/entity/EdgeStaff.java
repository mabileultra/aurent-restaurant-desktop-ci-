package com.pos.restaurant.edge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "edge_staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeStaff {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "company_login_code", length = 16)
    private String companyLoginCode;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(length = 200)
    private String email;

    @Column(name = "full_name", length = 300)
    private String fullName;

    @Column(nullable = false, length = 64)
    private String role;

    @Column(name = "password_hash", length = 200)
    private String passwordHash;

    @Column(name = "pin_hash", length = 200)
    private String pinHash;

    @Column(name = "store_ids_json", columnDefinition = "TEXT")
    private String storeIdsJson;

    @Column(name = "allowed_modules_json", columnDefinition = "TEXT")
    private String allowedModulesJson;

    @Column(name = "can_request_bill", nullable = false)
    private boolean canRequestBill;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
