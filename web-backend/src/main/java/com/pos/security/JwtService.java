package com.pos.security;

import com.pos.entity.User;
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
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpiration;

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (userDetails instanceof User user && user.getCompany() != null) {
            claims.put(JwtClaimNames.COMPANY_ID, user.getCompany().getId());
        }
        return generateToken(claims, userDetails);
    }

    public Integer extractCompanyId(String token) {
        return JwtClaimsExtractor.extractCompanyId(extractAllClaims(token));
    }

    public String extractPrimaryRole(String token) {
        return JwtClaimsExtractor.extractPrimaryRole(extractAllClaims(token));
    }

    public Claims extractClaims(String token) {
        return extractAllClaims(token);
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

    public boolean isTokenValid(String token, UserDetails userDetails) {
        if (!(userDetails instanceof User user)) {
            return false;
        }
        return extractSubjectUserId(token).equals(user.getId()) && !isTokenExpired(token);
    }

    public boolean isTokenActive(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception ex) {
            return false;
        }
    }

    /** JWT subject — UUID пользователя (логин может повторяться в разных компаниях). */
    public UUID extractSubjectUserId(String token) {
        return JwtClaimsExtractor.extractUserId(extractAllClaims(token));
    }

    /** @deprecated use extractSubjectUserId */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return JwtClaimsExtractor.parseAllClaims(token, secretKey);
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
