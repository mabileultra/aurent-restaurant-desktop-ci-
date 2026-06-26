package com.pos.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "pin_digest", length = 64)
    private String pinDigest;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 100)
    private String patronymic;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "company_id")
    private Integer companyId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_stores", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "store_id")
    @Builder.Default
    private Set<Integer> storeIds = new HashSet<>();

    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "module_access_custom")
    @Builder.Default
    private boolean moduleAccessCustom = false;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        syncFullName();
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
        syncFullName();
    }

    public void syncFullName() {
        String built = Stream.of(lastName, firstName, patronymic)
            .filter(s -> s != null && !s.isBlank())
            .collect(Collectors.joining(" "));
        if (!built.isBlank()) {
            this.fullName = built;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.getName()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }
}
