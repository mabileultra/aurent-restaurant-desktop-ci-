package com.pos.config;

import com.pos.security.CrmInternalApiKeyFilter;
import com.pos.security.IdentityInternalApiKeyFilter;
import com.pos.security.JwtAuthenticationFilter;
import com.pos.security.PlatformInternalApiKeyFilter;
import com.pos.security.ReportingInternalApiKeyFilter;
import com.pos.telegram.security.TelegramBotApiKeyFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final IdentityInternalApiKeyFilter identityInternalApiKeyFilter;
    private final PlatformInternalApiKeyFilter platformInternalApiKeyFilter;
    private final ReportingInternalApiKeyFilter reportingInternalApiKeyFilter;
    private final CrmInternalApiKeyFilter crmInternalApiKeyFilter;
    private final TelegramBotApiKeyFilter telegramBotApiKeyFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${app.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*}")
    private String corsAllowedOriginPatterns;

    private static final String[] PUBLIC_PATHS = {
        "/public/**",
        "/actuator/health",
        "/swagger-ui.html",
        "/swagger-ui/**",
        "/v3/api-docs/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(CorsUtils::isPreFlightRequest).permitAll()
                .requestMatchers("/internal/identity/**").permitAll()
                .requestMatchers("/internal/platform/**").permitAll()
                .requestMatchers("/internal/reports/**").permitAll()
                .requestMatchers("/internal/crm/**").permitAll()
                .requestMatchers(PUBLIC_PATHS).permitAll()
                .requestMatchers("/returns/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers("/orders/**").hasAnyRole("ADMIN", "MANAGER")
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(identityInternalApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(platformInternalApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(reportingInternalApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(crmInternalApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(telegramBotApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> patterns = List.of(corsAllowedOriginPatterns.split(","));
        config.setAllowedOriginPatterns(patterns.stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
