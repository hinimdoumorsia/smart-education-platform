// components/BotpressWebChat.tsx - VERSION FINALE CORRIGÉE
import React, { useEffect, useRef, useCallback } from 'react';

interface BotpressWebChatProps {
  botId: string;
  configUrl: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  courseContext?: {
    courseId?: string;
    courseTitle?: string;
    courseDescription?: string;
    userRole?: string;
  };
}

const BotpressWebChat: React.FC<BotpressWebChatProps> = ({
  botId,
  configUrl,
  userId = 'guest',
  userName = 'Invité',
  userEmail = 'guest@example.com',
  courseContext
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const webchatRef = useRef<any>(null);

  // Fonction pour envoyer les informations utilisateur
  const sendUserInfo = useCallback(() => {
    if (!webchatRef.current) return;

    const userInfo = {
      id: userId,
      name: userName,
      email: userEmail,
    };

    webchatRef.current.sendEvent({
      type: 'user',
      user: userInfo
    });
  }, [userId, userName, userEmail]);

  // Fonction pour envoyer le contexte du cours
  const sendCourseContext = useCallback(() => {
    if (!webchatRef.current || !courseContext) return;

    webchatRef.current.sendEvent({
      type: 'context',
      payload: {
        course: courseContext,
        timestamp: new Date().toISOString(),
        userRole: courseContext.userRole || 'unknown'
      }
    });

    // Envoyer un message de bienvenue
    setTimeout(() => {
      if (webchatRef.current) {
        webchatRef.current.sendEvent({
          type: 'trigger',
          payload: {
            type: 'welcome',
            context: {
              courseTitle: courseContext.courseTitle,
              userRole: courseContext.userRole
            }
          }
        });
      }
    }, 1500);
  }, [courseContext]);

  // Fonction pour initialiser le webchat - avec eslint-disable
  const initializeWebchat = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    
    if (!win.botpressWebChat) {
      console.error('Botpress WebChat not loaded');
      return;
    }

    const webchatConfig = {
      botId: botId,
      hostUrl: 'https://cdn.botpress.cloud/webchat/v3.5',
      messagingUrl: 'https://messaging.botpress.cloud',
      clientId: botId,
      botName: 'Assistant IA du Cours',
      avatarUrl: 'https://cdn.botpress.cloud/webchat/v3.5/assets/default-avatar.png',
      enableConversationDeletion: true,
      showConversationsButton: true,
      hideWidget: true,
      disableAnimations: false,
      stylesheet: 'https://cdn.botpress.cloud/webchat/v3.5/default.css',
      theme: {
        primaryColor: '#2d8cff',
        secondaryColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      composer: {
        placeholder: 'Posez votre question sur le cours...',
      },
      conversationId: `course-${courseContext?.courseId || 'unknown'}-user-${userId}`,
      userId: userId,
      extraStyles: `
        .bpw-header-container {
          background-color: #2d8cff;
        }
        .bpw-composer {
          border-radius: 20px;
        }
        .bpw-from-bot .bpw-chat-bubble {
          background-color: #f0f7ff;
        }
        .bpw-from-user .bpw-chat-bubble {
          background-color: #2d8cff;
          color: white;
        }
      `
    };

    try {
      // Initialiser le chatbot
      webchatRef.current = win.botpressWebChat.init(webchatConfig);

      // Configurer les événements
      webchatRef.current.onEvent(async (event: any) => {
        if (event.type === 'LIFECYCLE.LOADED') {
          setTimeout(() => {
            sendUserInfo();
            sendCourseContext();
          }, 1000);
        }
      });

      // Monter le chatbot dans le conteneur
      if (containerRef.current) {
        webchatRef.current.mount(containerRef.current);
      }
    } catch (error) {
      console.error('Error initializing Botpress WebChat:', error);
    }
  }, [botId, userId, courseContext, sendUserInfo, sendCourseContext]);

  // Effet pour charger le script Botpress
  useEffect(() => {
    // Vérifier si le script est déjà présent
    const existingScript = document.querySelector('script[src*="botpress.cloud/webchat"]');
    
    if (existingScript) {
      // Si le script existe déjà, initialiser directement
      // Attendre un peu pour s'assurer qu'il est chargé
      setTimeout(initializeWebchat, 100);
      return;
    }

    // Charger le script Botpress
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v3.5/webchat.js';
    script.async = true;
    
    script.onload = () => {
      initializeWebchat();
    };

    script.onerror = () => {
      console.error('Failed to load Botpress WebChat script');
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="alert alert-danger p-3">
            <h6>Erreur de chargement</h6>
            <p>Impossible de charger l'assistant IA. Veuillez réessayer plus tard.</p>
          </div>
        `;
      }
    };

    document.body.appendChild(script);

    // Nettoyage
    return () => {
      if (webchatRef.current && typeof webchatRef.current.destroy === 'function') {
        try {
          webchatRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying webchat instance:', e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initializeWebchat est délibérément omise pour éviter les boucles

  return (
    <div 
      ref={containerRef} 
      style={{
        width: '100%',
        height: '100%',
        minHeight: '300px',
        position: 'relative'
      }}
    >
      {/* Skeleton loading */}
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement de l'assistant IA...</span>
        </div>
        <p className="mt-2">Initialisation de l'assistant IA...</p>
      </div>
    </div>
  );
};

export default BotpressWebChat;