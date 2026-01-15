# com.iatd.smarthub.config.JwtUtil

Rôle
- Utilitaire pour créer, signer et valider JWT utilisés par l'application.
- Extrait username, expiration et rôles depuis le token.

Emplacement
- `src/main/java/com/iatd/smarthub/config/JwtUtil.java`

Points clés
- Utilise `io.jsonwebtoken` (JJWT) et une `SecretKey` construite à partir d'une chaîne secrète fixe (dans le code : `SECRET_STRING`).
- `EXPIRATION_TIME` = 10 heures.

Méthodes publiques importantes
- `public String extractUsername(String token)`
- `public Date extractExpiration(String token)`
- `public <T> T extractClaim(String token, Function<Claims,T> claimsResolver)`
- `public String generateToken(UserDetails userDetails)`
  - Ajoute les rôles et username dans les claims avant de créer le token
- `public List<String> extractRoles(String token)`
- `public boolean validateToken(String token, UserDetails userDetails)`
- `public Boolean validateToken(String token)` (valide juste le token sans userDetails)
- `public boolean isTokenValid(String token)` (safe check)
- `public Map<String,Object> extractAllTokenInfo(String token)` (retourne username, roles, issuedAt, expiration, isExpired)

Sécurité
- La clé secrète est codée en dur dans la classe (`SECRET_STRING`) — à déplacer vers une variable d'environnement ou secret manager pour la production.
- Les rôles sont ajoutés dans les claims pour simplifier l'autorisation côté filtre.

Exemple d'usage
```java
String token = jwtUtil.generateToken(userDetails);
boolean ok = jwtUtil.validateToken(token, userDetails);
List<String> roles = jwtUtil.extractRoles(token);
```