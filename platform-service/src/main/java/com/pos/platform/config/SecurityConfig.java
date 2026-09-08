package com.pos.platform.config;

import com.pos.platform.security.JwtAuthenticationFilter;
import com.pos.platform.security.PlatformInternalApiKeyFilter;
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
    private final PlatformInternalApiKeyFilter internalApiKeyFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/internal/platform/**").permitAll()
                .requestMatchers("/public/site/**").permitAll()
                .requestMatchers("/billing/me/access").authenticated()
                .requestMatchers("/billing/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/platform/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/admin/finance-sync/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/companies/**").hasRole("SUPER_ADMIN")
                .anyRequest().denyAll()
            )
            .addFilterBefore(internalApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
