package com.pos.identity.security;

import com.pos.identity.entity.User;
import com.pos.identity.service.ModuleAccessService;
import com.pos.shared.access.ModuleVisibility;
import com.pos.shared.jwt.JwtClaimNames;
import com.pos.shared.jwt.JwtClaimsExtractor;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpiration;

    private final ModuleAccessService moduleAccessService;

    public JwtService(ModuleAccessService moduleAccessService) {
        this.moduleAccessService = moduleAccessService;
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (userDetails instanceof User user) {
            if (user.getCompanyId() != null) {
                claims.put(JwtClaimNames.COMPANY_ID, user.getCompanyId());
            }
            if (user.getRole() != null) {
                claims.put(JwtClaimNames.ROLES, List.of(user.getRole().getName()));
            }
            claims.put(JwtClaimNames.CAN_REQUEST_BILL, canRequestBill(user));
            claims.put(JwtClaimNames.CAN_PRINT_PICKUP_LABEL, canPrintPickupLabel(user));
        }
        return generateToken(claims, userDetails);
    }

    private boolean canRequestBill(User user) {
        return moduleAccessService.resolveAllowedModuleIds(user)
            .contains(ModuleVisibility.RESTAURANT_REQUEST_BILL);
    }

    private boolean canPrintPickupLabel(User user) {
        return moduleAccessService.resolveAllowedModuleIds(user)
            .contains(ModuleVisibility.RESTAURANT_PICKUP_LABEL);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        String subject = userDetails instanceof User userEntity
            ? userEntity.getId().toString()
            : userDetails.getUsername();
        return Jwts.builder()
            .claims(extraClaims)
            .subject(subject)
            .issuedAt(new Date(System.currentTimeMillis()))
            .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(getSigningKey())
            .compact();
    }

    public Integer extractCompanyId(String token) {
        return JwtClaimsExtractor.extractCompanyId(extractAllClaims(token));
    }

    public UUID extractSubjectUserId(String token) {
        return JwtClaimsExtractor.extractUserId(extractAllClaims(token));
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        if (!(userDetails instanceof User user)) {
            return false;
        }
        return extractSubjectUserId(token).equals(user.getId()) && !isTokenExpired(token);
    }

    public boolean isTokenValid(String token) {
        return JwtClaimsExtractor.isTokenParsable(token, secretKey);
    }

    public String extractRole(String token) {
        return JwtClaimsExtractor.extractPrimaryRole(extractAllClaims(token));
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return JwtClaimsExtractor.parseAllClaims(token, secretKey);
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
