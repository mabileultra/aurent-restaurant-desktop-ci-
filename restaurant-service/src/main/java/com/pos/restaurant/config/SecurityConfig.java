package com.pos.restaurant.config;

import com.pos.restaurant.security.JwtAuthenticationFilter;
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

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Edge local auth (only beans exist when app.restaurant.edge.enabled=true)
                .requestMatchers(
                    "/auth/**",
                    "/edge/auth/**",
                    "/edge/bootstrap/**",
                    "/edge/sync/**",
                    "/edge/live-export",
                    "/edge/live-import",
                    "/billing/**",
                    "/company-business-types"
                ).permitAll()
                .requestMatchers(
                    "/rst/**",
                    "/products/**",
                    "/stores/**",
                    "/warehouse/**",
                    "/suppliers/**",
                    "/categories",
                    "/categories/**",
                    "/cash-registers",
                    "/cash-registers/**",
                    "/reports/**",
                    "/users",
                    "/users/**",
                    "/cashier/**",
                    "/admin/**",
                    "/edge/print-relay/**"
                ).authenticated()
                .anyRequest().denyAll()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
