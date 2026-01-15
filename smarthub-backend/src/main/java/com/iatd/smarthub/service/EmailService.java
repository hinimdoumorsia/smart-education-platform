package com.iatd.smarthub.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    // Méthode simple pour envoyer du texte brut
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            log.info("✅ Email envoyé à: {}", to);
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage());
        }
    }

    // Méthode spécifique pour la réinitialisation de mot de passe
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
            
            String subject = "Réinitialisation de votre mot de passe - IATD SmartHub";
            String text = String.format(
                "Bonjour,\n\n" +
                "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
                "Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant :\n" +
                "%s\n\n" +
                "Ce lien expirera dans 2 heures.\n\n" +
                "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n" +
                "Cordialement,\n" +
                "L'équipe IATD SmartHub",
                resetLink
            );
            
            sendSimpleEmail(toEmail, subject, text);
            
            // Log pour le développement
            log.info("📧 Email de réinitialisation envoyé à: {}", toEmail);
            log.debug("🔗 Lien de réinitialisation: {}", resetLink);
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email de réinitialisation à {}: {}", toEmail, e.getMessage());
        }
    }
    
    // Méthode pour envoyer un email de bienvenue
    public void sendWelcomeEmail(String toEmail, String username) {
        String subject = "Bienvenue sur IATD SmartHub !";
        String text = String.format(
            "Bonjour %s,\n\n" +
            "Bienvenue sur la plateforme IATD SmartHub !\n\n" +
            "Votre compte a été créé avec succès.\n\n" +
            "Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités.\n\n" +
            "Cordialement,\n" +
            "L'équipe IATD SmartHub",
            username
        );
        
        sendSimpleEmail(toEmail, subject, text);
        log.info("📧 Email de bienvenue envoyé à: {}", toEmail);
    }
}