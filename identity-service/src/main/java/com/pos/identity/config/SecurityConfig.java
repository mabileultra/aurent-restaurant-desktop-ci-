package com.pos.identity.config;

import com.pos.identity.security.JwtAuthenticationFilter;
import com.pos.identity.security.PosInternalApiKeyFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final PosInternalApiKeyFilter posInternalApiKeyFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/internal/pos/**").permitAll()
                // Store POS roles need roster for waiter names / assign; CRUD stays admin/manager.
                .requestMatchers("/users/pos-roster").hasAnyRole(
                    "ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN", "MANAGER", "CASHIER", "WAITER", "COOK")
                .requestMatchers("/users/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN", "MANAGER")
                .requestMatchers("/platform/account/**").hasRole("PLATFORM_ADMIN")
                .requestMatchers("/platform/module-access/**").hasAnyRole("SUPER_ADMIN", "PLATFORM_ADMIN")
                .requestMatchers("/platform/security/super-admins/**").hasRole("SUPER_ADMIN")
                .anyRequest().denyAll()
            )
            .addFilterBefore(posInternalApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
