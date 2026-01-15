// CourseDetailPage.tsx - VERSION AVEC CHATBOT BOTPRESS
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import courseService, { Course, CourseFile, Student } from '../../services/courseService';
import userService from '../../services/userService';
import agentService from '../../services/agentService';
import StudentManagement from '../../components/StudentManagement';
import CourseQuizModal from '../../components/CourseQuizModal';
import AdaptiveQuizModal from '../../components/AdaptiveQuizModal';
import QuizResultsModal from '../../components/QuizResultsModal';
import { 
  FaBook, 
  FaUserGraduate, 
  FaCalendarAlt, 
  FaFilePdf, 
  FaDownload, 
  FaTrash, 
  FaEdit, 
  FaArrowLeft, 
  FaUsers, 
  FaChalkboardTeacher, 
  FaSignInAlt,
  FaQuestionCircle,
  FaHistory,
  FaExclamationTriangle,
  FaSync,
  FaCheckCircle,
  FaRobot,
  FaBrain,
  FaChartLine,
  FaMedal,
  FaLightbulb,
  FaSearch,
  FaBookOpen,
  FaInfoCircle,
  FaComment,
  FaComments
} from 'react-icons/fa';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('details');
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // États pour la gestion des quiz standard
  const [quizEligibility, setQuizEligibility] = useState<any>(null);
  const [quizStats, setQuizStats] = useState<any>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAttempt, setQuizAttempt] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // États pour le quiz adaptatif IA
  const [adaptiveQuizData, setAdaptiveQuizData] = useState<any>(null);
  const [adaptiveQuizLoading, setAdaptiveQuizLoading] = useState(false);
  const [showAdaptiveQuizModal, setShowAdaptiveQuizModal] = useState(false);
  const [quizProgress, setQuizProgress] = useState<any>(null);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [adaptiveStrategy, setAdaptiveStrategy] = useState<string>('');

  // États pour les fonctionnalités RAG
  const [ragQuery, setRagQuery] = useState<string>('');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResponse, setRagResponse] = useState<any>(null);
  const [showRagSection, setShowRagSection] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  // États pour les statistiques des étudiants (professeurs)
  const [studentQuizStats, setStudentQuizStats] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const canEdit = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isCourseTeacher = course && user?.id?.toString() === course.teacherId;

  // Fonction pour convertir l'ID utilisateur en nombre
  const getUserIdAsNumber = useCallback(() => {
    if (!user?.id) {
      return 0;
    }
    
    const id = user.id;
    if (typeof id === 'number' && id > 0) {
      return id;
    }
    
    if (typeof id === 'string') {
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    
    return 0;
  }, [user]);

  // Fonction pour convertir l'ID cours en nombre
  const getCourseIdAsNumber = useCallback(() => {
    if (!id) return 0;
    
    const courseId = Number(id);
    
    if (isNaN(courseId) || courseId <= 0) {
      return 0;
    }
    
    return courseId;
  }, [id]);

  // Charger les statistiques des quiz pour tous les étudiants (professeurs)
  const fetchStudentQuizStats = useCallback(async (studentsList: Student[]) => {
    try {
      setStatsLoading(true);
      const courseId = getCourseIdAsNumber();
      
      if (!courseId || studentsList.length === 0) {
        setStudentQuizStats([]);
        return;
      }
      
      const statsPromises = studentsList.map(async (student) => {
        try {
          // CORRECTION : Convertir student.id (string) en number
          const studentId = Number(student.id);
          
          if (isNaN(studentId) || studentId <= 0) {
            return {
              ...student,
              quizStats: null,
              bestScore: 0,
              averageScore: 0,
              totalAttempts: 0,
              lastAttemptDate: null,
              performanceLevel: 'BEGINNER'
            };
          }
          
          // CORRECTION : Passer studentId (number) au lieu de student.id (string)
          const stats = await agentService.getCourseQuizStats(studentId, courseId);
          return {
            ...student,
            quizStats: stats,
            bestScore: stats.bestScore || 0,
            averageScore: stats.averageScore || 0,
            totalAttempts: stats.totalAttempts || 0,
            lastAttemptDate: stats.lastAttemptDate || null,
            performanceLevel: stats.performanceLevel || 'BEGINNER'
          };
        } catch (err) {
          return {
            ...student,
            quizStats: null,
            bestScore: 0,
            averageScore: 0,
            totalAttempts: 0,
            lastAttemptDate: null,
            performanceLevel: 'BEGINNER'
          };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      setStudentQuizStats(statsResults);
    } catch (err) {
      console.error('Error loading student quiz stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [getCourseIdAsNumber]);

  // Charger les données du cours
  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!id) {
        setError('ID du cours manquant');
        return;
      }
      
      // 1. Récupérer les infos basiques du cours
      const courseBasic = await courseService.getCourseBasicInfo(id);
      setCourse(courseBasic);
      
      // 2. Charger l'enseignant
      if (courseBasic.teacherId) {
        try {
          const teacherData = await userService.getUserById(courseBasic.teacherId);
          setTeacher(teacherData);
        } catch (err) {
          console.warn('Could not fetch teacher details:', err);
        }
      }
      
      // 3. Charger les étudiants
      try {
        const studentsData = await courseService.getCourseStudents(id);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        
        // Si c'est un prof, charger les stats des étudiants
        if ((user?.role === 'TEACHER' || user?.role === 'ADMIN') && studentsData.length > 0) {
          await fetchStudentQuizStats(studentsData);
        }
      } catch (studentErr: any) {
        console.warn('Could not load students list:', studentErr);
        setStudents([]);
      }
      
      // 4. Pour enseignants/admin, récupérer les détails complets
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        try {
          const courseFull = await courseService.getCourseById(id);
          setCourse(courseFull);
          
          const filesData = await courseService.getCourseFiles(id);
          setFiles(filesData);
          
          setIsEnrolled(true);
        } catch (fullErr) {
          console.warn('Could not get full course details, keeping basic info');
        }
      }
      
      // 5. Pour les étudiants, vérifier l'inscription
      else if (user?.role === 'STUDENT') {
        try {
          const courseFull = await courseService.getCourseById(id);
          setCourse(courseFull);
          setIsEnrolled(true);
          
          const filesData = await courseService.getCourseFiles(id);
          setFiles(filesData);
          
        } catch (studentErr: any) {
          if (studentErr.response?.status === 403) {
            setIsEnrolled(false);
            setFiles([]);
            setError('Vous n\'êtes pas inscrit à ce cours. Inscrivez-vous pour accéder aux fichiers.');
          } else {
            throw studentErr;
          }
        }
      }
      
    } catch (err: any) {
      console.error('Error loading course:', err);
      
      if (err.response?.status === 404) {
        setError('Cours non trouvé.');
        navigate('/courses');
      } else if (err.response?.status === 403) {
        // Déjà géré plus haut
      } else {
        setError(err.message || 'Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  }, [id, user?.role, navigate, fetchStudentQuizStats]);

  // Charger les données des quiz pour l'utilisateur courant
  const fetchQuizData = useCallback(async () => {
    try {
      const userId = getUserIdAsNumber();
      const courseId = getCourseIdAsNumber();
      
      if (!userId || !courseId) {
        return;
      }
      
      // 1. Vérifier l'éligibilité pour le quiz standard (étudiants seulement)
      if (user?.role === 'STUDENT') {
        try {
          const eligibility = await agentService.checkQuizEligibility(userId, courseId);
          
          const isActuallyEligible = eligibility.eligible === true || 
                                    eligibility.isEligible === true;
          
          const fixedEligibility = {
            ...eligibility,
            isEligible: isActuallyEligible,
            eligible: isActuallyEligible
          };
          
          setQuizEligibility(fixedEligibility);
        } catch (err: any) {
          setQuizEligibility({
            isEligible: false,
            eligible: false,
            reason: 'Erreur lors de la vérification',
            attemptsToday: 0,
            maxAttemptsPerDay: 3
          });
        }
        
        // 2. Vérifier les stats de l'étudiant
        try {
          const stats = await agentService.getCourseQuizStats(userId, courseId);
          setQuizStats(stats);
          
          if (stats && (stats.performanceLevel || stats.totalAttempts > 0)) {
            setQuizProgress(stats);
          }
        } catch (err: any) {
          setQuizStats({
            totalAttempts: 0,
            bestScore: 0,
            averageScore: 0,
            completedAttempts: 0,
            performanceLevel: 'BEGINNER'
          });
        }
      }
      
    } catch (err: any) {
      console.error('Error loading quiz data:', err);
    }
  }, [getUserIdAsNumber, getCourseIdAsNumber, user?.role]);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id, fetchCourseData]);

  useEffect(() => {
    if (id && user?.id && isEnrolled && user?.role === 'STUDENT') {
      fetchQuizData();
    }
  }, [id, user?.id, isEnrolled, fetchQuizData, user?.role]);

  // Gestion du quiz standard (UNIQUEMENT POUR ÉTUDIANTS)
  const handleStartQuiz = async () => {
    try {
      setQuizLoading(true);
      
      const userId = getUserIdAsNumber();
      const courseId = getCourseIdAsNumber();
      
      if (!userId || !courseId) {
        alert('ID utilisateur ou cours invalide');
        setQuizLoading(false);
        return;
      }
      
      // Vérifier l'éligibilité AVANT
      const isActuallyEligible = quizEligibility?.eligible === true || 
                                quizEligibility?.isEligible === true;
      
      if (quizEligibility && !isActuallyEligible) {
        alert(`Vous n'êtes pas éligible pour ce quiz:\n${quizEligibility.reason || 'Raison inconnue'}\n\nTentatives aujourd'hui: ${quizEligibility.attemptsToday}/${quizEligibility.maxAttemptsPerDay}`);
        setQuizLoading(false);
        return;
      }
      
      // Appeler le service
      const response = await agentService.initiateCourseQuiz(userId, courseId);
      
      // Vérification PLUS FLEXIBLE
      const hasValidResponse = 
        response.attemptId || 
        (response.quizResponse && response.quizResponse.questions && response.quizResponse.questions.length > 0) ||
        response.status === 'SUCCESS';
      
      if (hasValidResponse) {
        console.log('✅ Réponse valide détectée');
        
        // Préparer le quiz pour l'affichage
        setQuizAttempt(response);
        setShowQuizModal(true);
        
      } else if (response.status === 'ERROR') {
        alert(`❌ ${response.message || 'Erreur serveur'}`);
      } else {
        // Si réponse vide ou invalide
        console.error('❌ Réponse invalide du serveur:', response);
        alert('Le serveur a retourné une réponse invalide. Vérifiez la console pour plus de détails.');
      }
      
    } catch (err: any) {
      console.error('Error starting quiz:', err);
      alert('Erreur inattendue. Veuillez réessayer.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizSubmit = async (answers: any) => {
    try {
      if (!quizAttempt?.attemptId) {
        throw new Error('Aucune tentative de quiz active');
      }
      
      const results = await agentService.submitCourseQuiz(quizAttempt.attemptId, answers);
      setQuizResults(results);
      setShowQuizModal(false);
      setShowResultsModal(true);
      
      // Recharger les données du quiz
      setTimeout(() => {
        fetchQuizData();
      }, 1000);
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      alert(err.message || 'Erreur lors de la soumission du quiz');
    }
  };

  // Gestion du quiz adaptatif IA (UNIQUEMENT POUR ÉTUDIANTS)
  const handleStartAdaptiveQuiz = async (strategy?: string) => {
    try {
      setAdaptiveQuizLoading(true);
      
      const userId = getUserIdAsNumber();
      const courseId = getCourseIdAsNumber();
      
      if (!userId || !courseId) {
        alert('ID utilisateur ou cours invalide');
        setAdaptiveQuizLoading(false);
        return;
      }
      
      // Afficher un message d'attente
      const previousError = error;
      setError('⏳ Génération du quiz adaptatif en cours... Cela peut prendre quelques secondes.');
      
      // Utiliser le service adaptatif
      const response = await agentService.initiateAdaptiveQuiz(userId, courseId, strategy);
      
      // Restaurer le message d'erreur précédent ou le supprimer
      setError(previousError || '');
      
      // Gérer les différents types de réponse
      if (response.status === 'SUCCESS') {
        // Vérifier si c'est un fallback
        if (response.strategy === 'FALLBACK' || response.warnings?.some((w: string) => w.includes('dégradé'))) {
          const useFallback = window.confirm(
            '⚠️ Service IA lent détecté\n\n' +
            'Le service de génération IA met trop de temps à répondre.\n\n' +
            'Souhaitez-vous utiliser un quiz générique à la place ?\n\n' +
            '✓ Rapide (questions standards)\n' +
            '✗ Moins personnalisé\n\n' +
            'Cliquez sur "Annuler" pour essayer le quiz standard.'
          );
          
          if (!useFallback) {
            setAdaptiveQuizLoading(false);
            return;
          }
        }
        
        // Vérifier la validité du quiz
        if (!response.quiz || !response.quiz.questions || response.quiz.questions.length === 0) {
          alert('❌ Aucune question générée par l\'IA.\n\nEssayez le quiz standard ou réessayez plus tard.');
          setAdaptiveQuizLoading(false);
          return;
        }
        
        // Vérifier la validité des questions
        const validQuestions = response.quiz.questions?.filter((q: any) => 
          q.text && q.text.trim() && 
          !q.text.includes("secours") && 
          !q.text.includes("maintenance") &&
          !q.text.includes("Question de")
        ) || [];
        
        if (validQuestions.length < 2) {
          alert(
            '❌ Questions insuffisantes\n\n' +
            `Seulement ${validQuestions.length} question(s) valide(s) générée(s).\n\n` +
            'Essayez le quiz standard ou contactez votre enseignant.'
          );
          setAdaptiveQuizLoading(false);
          return;
        }
        
        setAdaptiveQuizData(response);
        setAdaptiveStrategy(strategy || response.strategy || 'STANDARD');
        setShowAdaptiveQuizModal(true);
        
      } else if (response.status === 'ERROR') {
        const retry = window.confirm(
          `❌ ${response.message || 'Erreur de génération'}\n\n` +
          'Le service IA rencontre des difficultés.\n\n' +
          'Options :\n' +
          '1. Réessayer (peut prendre du temps)\n' +
          '2. Utiliser le quiz standard (recommandé)\n' +
          '3. Contacter le support technique\n\n' +
          'Cliquez sur "OK" pour réessayer ou "Annuler" pour utiliser le quiz standard.'
        );
        
        if (retry) {
          // Réessayer avec un indicateur de retry
          setTimeout(() => handleStartAdaptiveQuiz(strategy), 1000);
          return;
        }
      } else {
        alert('⚠️ Réponse inattendue du serveur. Veuillez réessayer plus tard.');
      }
    } catch (err: any) {
      setError('');
      console.error('Error starting adaptive quiz:', err);
      
      // Messages d'erreur spécifiques
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        const choice = window.confirm(
          '⏱️ Délai d\'attente dépassé\n\n' +
          'Le service IA met trop de temps à répondre (30+ secondes).\n\n' +
          'Que souhaitez-vous faire ?\n\n' +
          'OK = Réessayer avec timeout réduit\n' +
          'Annuler = Utiliser le quiz standard\n\n' +
          'Conseil : Le quiz standard est généralement plus rapide.'
        );
        
        if (choice) {
          setTimeout(() => handleStartAdaptiveQuiz('DIAGNOSTIC'), 2000);
          return;
        }
      } else if (err.message?.includes('not found') || err.message?.includes('404')) {
        alert('❌ Service adaptatif non disponible.\n\nVeuillez contacter l\'administrateur pour activer cette fonctionnalité.');
      } else {
        alert(`❌ Erreur: ${err.message || 'Erreur inconnue'}\n\nEssayez le quiz standard.`);
      }
    } finally {
      setAdaptiveQuizLoading(false);
    }
  };

  const handleAdaptiveQuizSubmit = async (answers: any) => {
    try {
      // Note: Pour l'instant, simuler une soumission
      const mockResults = {
        score: Math.floor(Math.random() * 30) + 70,
        passed: true,
        timeSpentMinutes: 15,
        feedback: {
          strengths: ["Bonnes connaissances des concepts de base"],
          weaknesses: ["Manque de précision sur les détails"],
          suggestions: ["Revoyez les chapitres 3 et 4 pour plus de précision"]
        },
        nextQuizEligibility: {
          isEligible: true,
          reason: "Vous pouvez repasser le quiz dans 2 heures"
        }
      };
      
      setQuizResults(mockResults);
      setShowAdaptiveQuizModal(false);
      setShowResultsModal(true);
      
      // Recharger les données
      fetchQuizData();
      
    } catch (err: any) {
      console.error('Error submitting adaptive quiz:', err);
      alert(err.message || 'Erreur lors de la soumission du quiz adaptatif');
    }
  };

  // Fonctionnalités RAG (ACCESSIBLE À TOUS)
  const handleRagQuery = async () => {
    if (!ragQuery.trim()) return;
    
    try {
      setRagLoading(true);
      
      // Simuler une réponse RAG pour le moment
      setTimeout(() => {
        setRagResponse({
          answer: "Le système RAG analyse actuellement votre question...\n\n" +
                 "Question: '" + ragQuery + "'\n\n" +
                 "Le service de questions-réponses basé sur le contenu du cours sera bientôt disponible.",
          sources: [
            { title: "Cours: " + (course?.title || "") },
            { title: "Chapitre 1: Introduction" }
          ]
        });
        setRagLoading(false);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error with RAG query:', err);
      setRagResponse({
        answer: "Désolé, le service de questions-réponses n'est pas disponible pour le moment.",
        sources: []
      });
      setRagLoading(false);
    }
  };

  // Autres fonctions existantes
  const handleEnroll = async () => {
    try {
      await courseService.enrollInCourse(id!);
      setIsEnrolled(true);
      setError('');
      fetchCourseData();
      alert('✅ Inscription réussie ! Vous pouvez maintenant accéder au contenu du cours.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription au cours');
    }
  };

  const handleDeleteCourse = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.')) {
      try {
        await courseService.deleteCourse(id!);
        navigate('/courses');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleDownloadFile = async (file: CourseFile) => {
    try {
      await courseService.downloadFile(id!, file.id, file.fileName);
    } catch (err) {
      setError('Erreur lors du téléchargement');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (window.confirm('Supprimer ce fichier ?')) {
      try {
        await courseService.deleteFile(id!, fileId);
        setFiles(files.filter(f => f.id !== fileId));
      } catch (err) {
        setError('Erreur lors de la suppression du fichier');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleForceRefresh = () => {
    setError('');
    setRagResponse(null);
    fetchCourseData();
    if (isEnrolled && user?.role === 'STUDENT') {
      fetchQuizData();
    }
  };

  // Composant pour le sélecteur de stratégie (ÉTUDIANTS SEULEMENT)
  const StrategySelector = () => {
    if (!showStrategySelector || user?.role !== 'STUDENT') return null;

    const strategies = [
      { 
        id: 'auto', 
        name: 'Auto-détection IA', 
        icon: FaRobot, 
        description: 'Laissez l\'IA choisir la meilleure stratégie',
        color: 'border-info text-info'
      },
      { 
        id: 'DIAGNOSTIC', 
        name: 'Diagnostic', 
        icon: FaBrain, 
        description: 'Évaluez votre niveau actuel',
        color: 'border-primary text-primary'
      },
      { 
        id: 'REMEDIATION', 
        name: 'Remédiation', 
        icon: FaBook, 
        description: 'Renforcez vos points faibles',
        color: 'border-warning text-warning'
      },
      { 
        id: 'CHALLENGE', 
        name: 'Challenge', 
        icon: FaChartLine, 
        description: 'Testez vos limites avec des questions difficiles',
        color: 'border-danger text-danger'
      },
      { 
        id: 'REINFORCEMENT', 
        name: 'Renforcement', 
        icon: FaMedal, 
        description: 'Consolidez vos acquis récents',
        color: 'border-success text-success'
      }
    ];

    return (
      <div className="modal-backdrop" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1040,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="modal-content" style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          maxWidth: '700px',
          width: '90%'
        }}>
          <div className="modal-header border-0">
            <h5 className="modal-title">
              <FaRobot className="me-2 text-info" />
              Sélectionnez une stratégie de quiz
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowStrategySelector(false)}
            />
          </div>
          
          <div className="modal-body">
            <p className="text-muted mb-4">
              Choisissez comment l'IA va générer votre quiz adaptatif. 
              La stratégie influence la difficulté et le type de questions.
            </p>
            
            <div className="row">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="col-md-6 mb-3">
                  <div 
                    className={`card h-100 border ${strategy.color}`}
                    onClick={() => {
                      setShowStrategySelector(false);
                      if (strategy.id === 'auto') {
                        handleStartAdaptiveQuiz();
                      } else {
                        handleStartAdaptiveQuiz(strategy.id);
                      }
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      borderWidth: '2px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="card-body text-center p-4">
                      <strategy.icon className="display-6 mb-3" />
                      <h6 className="card-title fw-bold">{strategy.name}</h6>
                      <p className="card-text small text-muted">{strategy.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="modal-footer border-0">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowStrategySelector(false)}
            >
              Annuler
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowStrategySelector(false);
                handleStartQuiz();
              }}
            >
              Quiz Standard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Afficher la page d'inscription pour les étudiants non-inscrits
  if (user?.role === 'STUDENT' && !isEnrolled && !loading) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">
              <FaUserGraduate className="me-2" />
              Inscription requise
            </h5>
          </div>
          <div className="card-body text-center py-5">
            <FaBook className="display-1 text-warning mb-4" />
            <h4>Vous n'êtes pas inscrit à ce cours</h4>
            <p className="text-muted mb-4">
              Pour accéder au contenu de "{course?.title}", vous devez vous inscrire.
            </p>
            
            <div className="d-flex justify-content-center gap-3">
              <button
                onClick={handleEnroll}
                className="btn btn-primary btn-lg"
              >
                <FaSignInAlt className="me-2" />
                S'inscrire au cours
              </button>
              <Link to="/courses" className="btn btn-secondary btn-lg">
                <FaArrowLeft className="me-2" />
                Retour aux cours
              </Link>
            </div>
            
            {course && (
              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="text-primary">Informations du cours</h6>
                <p className="mb-2"><strong>Titre :</strong> {course.title}</p>
                {course.description && (
                  <p className="mb-2"><strong>Description :</strong> {course.description}</p>
                )}
                {teacher && (
                  <p className="mb-0"><strong>Enseignant :</strong> {teacher.firstName} {teacher.lastName}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error}</p>
          <Link to="/courses" className="btn btn-primary">
            <FaArrowLeft className="me-2" />
            Retour aux cours
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h5>Cours non trouvé</h5>
          <p>Le cours demandé n'existe pas ou a été supprimé.</p>
          <Link to="/courses" className="btn btn-primary">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/courses">Cours</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {course.title}
          </li>
        </ol>
      </nav>

      {/* En-tête du cours */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <FaBook className="me-2" />
                {course.title}
              </h2>
              <div className="d-flex align-items-center">
                <FaChalkboardTeacher className="me-2" />
                <span>
                  {teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username : `Enseignant ID: ${course.teacherId}`}
                </span>
              </div>
            </div>
            <div className="btn-group">
              {canEdit && (isCourseTeacher || user?.role === 'ADMIN') && (
                <>
                  <Link
                    to={`/courses/${id}/edit`}
                    className="btn btn-warning btn-sm"
                  >
                    <FaEdit className="me-1" />
                    Modifier
                  </Link>
                  <button
                    onClick={handleDeleteCourse}
                    className="btn btn-danger btn-sm"
                  >
                    <FaTrash className="me-1" />
                    Supprimer
                  </button>
                </>
              )}
              <button
                onClick={handleForceRefresh}
                className="btn btn-info btn-sm"
                title="Actualiser"
              >
                <FaSync />
              </button>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <p className="card-text">{course.description}</p>
          
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="card border-primary">
                <div className="card-body">
                  <h6 className="card-title text-primary">
                    <FaCalendarAlt className="me-2" />
                    Date de création
                  </h6>
                  <p className="card-text">{formatDate(course.createdDate)}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-success">
                <div className="card-body">
                  <h6 className="card-title text-success">
                    <FaUsers className="me-2" />
                    Étudiants inscrits
                  </h6>
                  <p className="card-text">{students.length} étudiant(s)</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-info">
                <div className="card-body">
                  <h6 className="card-title text-info">
                    <FaFilePdf className="me-2" />
                    Fichiers
                  </h6>
                  <p className="card-text">{files.length} fichier(s)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section RAG Assistant - AVEC CHATBOT BOTPRESS */}
      {isEnrolled && (
        <div className="mt-4 mb-4">
          <div className="card border-secondary">
            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaRobot className="me-2" />
                Assistant IA du Cours
              </h5>
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setShowChatbot(!showChatbot)}
                  title={showChatbot ? "Masquer le chatbot" : "Afficher le chatbot"}
                >
                  {showChatbot ? <FaComments /> : <FaComment />}
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setShowRagSection(!showRagSection)}
                >
                  {showRagSection ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>
            
            {showRagSection && (
              <div className="card-body">
                <h6 className="text-secondary">
                  <FaSearch className="me-2" />
                  Chatbot IA pour ce cours
                </h6>
                <p className="text-muted mb-3">
                  Posez vos questions sur le cours à notre assistant IA. Le chatbot analysera 
                  le contenu du cours pour vous fournir des réponses précises et personnalisées.
                </p>
                
                {/* Boutons d'accès rapide */}
                <div className="d-flex gap-2 mb-4">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowChatbot(true)}
                  >
                    <FaComment className="me-2" />
                    Ouvrir le Chatbot
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => window.open('https://cdn.botpress.cloud/webchat/v3.5/shareable.html?configUrl=https://files.bpcontent.cloud/2026/01/05/13/20260105130230-BSGAPUCW.json', '_blank')}
                  >
                    <FaComments className="me-2" />
                    Ouvrir en plein écran
                  </button>
                </div>

                {/* Intégration du chatbot Botpress */}
                {showChatbot && (
                  <div className="mb-4">
                    <div className="chatbot-container" style={{ 
                      border: '1px solid #dee2e6', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      height: '500px',
                      position: 'relative'
                    }}>
                      <iframe
                        src="https://cdn.botpress.cloud/webchat/v3.5/shareable.html?configUrl=https://files.bpcontent.cloud/2026/01/05/13/20260105130230-BSGAPUCW.json"
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                        title="Chatbot IA du cours"
                        allow="microphone"
                      />
                    </div>
                    
                    <div className="alert alert-info mt-2 small">
                      <FaInfoCircle className="me-2" />
                      <strong>Conseil :</strong> Ce chatbot est spécialisé pour répondre aux questions sur le cours 
                      "{course.title}". Vous pouvez lui demander des explications, des exemples, ou de l'aide pour réviser.
                    </div>
                  </div>
                )}
                
                <div className="row mt-4">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title">
                          <FaBookOpen className="me-2 text-primary" />
                          Exemples de questions pour le chatbot
                        </h6>
                        <ul className="small text-muted">
                          <li>"Quelles sont les notions clés du chapitre 3 ?"</li>
                          <li>"Expliquez le concept de [terme technique]"</li>
                          <li>"Donnez un exemple concret de [concept]"</li>
                          <li>"Quelle est la différence entre [concept A] et [concept B] ?"</li>
                          <li>"Résumez les points importants de la leçon 2"</li>
                          <li>"Aidez-moi à comprendre [thème difficile]"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title">
                          <FaLightbulb className="me-2 text-warning" />
                          Fonctionnalités du chatbot
                        </h6>
                        <ul className="small text-muted">
                          <li>✅ Réponses basées sur le contenu du cours</li>
                          <li>✅ Explications détaillées étape par étape</li>
                          <li>✅ Exemples pratiques et concrets</li>
                          <li>✅ Aide à la révision et préparation aux quiz</li>
                          <li>✅ Support multilingue</li>
                          <li>✅ Historique des conversations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION QUIZ ADAPTATIF IA - UNIQUEMENT POUR ÉTUDIANTS */}
      {user?.role === 'STUDENT' && isEnrolled && (
        <div className="mt-4 mb-4">
          <div className="card border-info">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaRobot className="me-2" />
                Quiz Adaptatif IA
              </h5>
              <span className="badge bg-light text-dark">
                Intelligence Artificielle
              </span>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <h6>Quiz intelligent personnalisé</h6>
                  <p className="text-muted">
                    L'IA analyse votre progression et génère un quiz adapté à votre niveau, 
                    vos points forts et vos points faibles.
                  </p>
                  
                  {/* Affichage de la progression IA */}
                  {quizProgress && quizProgress.totalAttempts > 0 ? (
                    <div className="alert alert-light border">
                      <div className="row align-items-center">
                        <div className="col-md-4">
                          <strong>Niveau IA:</strong>
                          <div className="mt-1">
                            <span className={`badge ${
                              quizProgress.performanceLevel === 'EXCELLENT' ? 'bg-success' :
                              quizProgress.performanceLevel === 'GOOD' ? 'bg-primary' :
                              quizProgress.performanceLevel === 'SATISFACTORY' ? 'bg-warning' :
                              'bg-danger'
                            }`}>
                              {quizProgress.performanceLevel || 'INTERMEDIATE'}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <strong>Tendance:</strong>
                          <div className="mt-1">
                            <span className={`badge ${
                              quizProgress.trendDirection === 'IMPROVING' ? 'bg-success' :
                              quizProgress.trendDirection === 'DECLINING' ? 'bg-danger' :
                              'bg-warning'
                            }`}>
                              {quizProgress.trendDirection || 'STABLE'}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <strong>Score moyen:</strong>
                          <div className="mt-1 h5">
                            {quizProgress.averageScore?.toFixed(1) || '0.0'}%
                          </div>
                        </div>
                      </div>
                      
                      {quizProgress.weakTopics && quizProgress.weakTopics.length > 0 && (
                        <div className="mt-3 pt-2 border-top">
                          <strong>Points à renforcer:</strong>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {quizProgress.weakTopics.slice(0, 3).map((topic: string, index: number) => (
                              <span key={index} className="badge bg-warning">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-light border">
                      <div className="d-flex align-items-center">
                        <FaInfoCircle className="me-2 text-info" />
                        <div>
                          <strong>Aucune donnée de progression disponible.</strong>
                          <p className="mb-0 small">Passez votre premier quiz pour générer des statistiques personnalisées.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Stratégies recommandées */}
                  <div className="mt-3">
                    <h6>Stratégies recommandées:</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {quizProgress?.averageScore && quizProgress.averageScore < 50 ? (
                        <button
                          onClick={() => handleStartAdaptiveQuiz('REMEDIATION')}
                          className="btn btn-warning btn-sm d-flex align-items-center"
                        >
                          <FaBook className="me-1" />
                          Mode Remédiation
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartAdaptiveQuiz('REMEDIATION')}
                          className="btn btn-outline-warning btn-sm d-flex align-items-center"
                        >
                          <FaBook className="me-1" />
                          Mode Remédiation
                        </button>
                      )}
                      
                      {quizProgress?.averageScore && quizProgress.averageScore > 85 ? (
                        <button
                          onClick={() => handleStartAdaptiveQuiz('CHALLENGE')}
                          className="btn btn-danger btn-sm d-flex align-items-center"
                        >
                          <FaChartLine className="me-1" />
                          Mode Challenge
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartAdaptiveQuiz('CHALLENGE')}
                          className="btn btn-outline-danger btn-sm d-flex align-items-center"
                        >
                          <FaChartLine className="me-1" />
                          Mode Challenge
                        </button>
                      )}
                      
                      <button
                        onClick={() => setShowStrategySelector(true)}
                        className="btn btn-outline-info btn-sm d-flex align-items-center"
                      >
                        <FaRobot className="me-1" />
                        Toutes les stratégies
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="d-grid gap-2">
                    <button
                      onClick={() => handleStartAdaptiveQuiz()}
                      disabled={adaptiveQuizLoading}
                      className="btn btn-info btn-lg d-flex align-items-center justify-content-center"
                    >
                      {adaptiveQuizLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Génération IA...
                        </>
                      ) : (
                        <>
                          <FaRobot className="me-2" />
                          Quiz Adaptatif IA
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={fetchQuizData}
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
                    >
                      <FaLightbulb className="me-2" />
                      Actualiser l'analyse
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Statistiques avancées */}
              {quizProgress && quizProgress.totalAttempts > 0 && (
                <div className="row mt-3">
                  <div className="col-md-3">
                    <div className="card text-center border-primary">
                      <div className="card-body">
                        <h5 className="card-title text-primary">
                          {quizProgress.completedCount || 0}
                        </h5>
                        <p className="card-text small">Quiz complétés</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center border-success">
                      <div className="card-body">
                        <h5 className="card-title text-success">
                          {quizProgress.averageScore?.toFixed(1) || '0.0'}%
                        </h5>
                        <p className="card-text small">Score moyen</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center border-warning">
                      <div className="card-body">
                        <h5 className="card-title text-warning">
                          {quizProgress.successRate?.toFixed(1) || '0.0'}%
                        </h5>
                        <p className="card-text small">Taux de réussite</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center border-info">
                      <div className="card-body">
                        <h5 className="card-title text-info">
                          {quizProgress.quizCount || 0}
                        </h5>
                        <p className="card-text small">Total quiz</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION QUIZ - DIFFÉRENTE POUR ÉTUDIANTS ET PROFESSEURS */}
      {isEnrolled && (
        <div className="mt-4 mb-4">
          <div className="card border-success">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <FaQuestionCircle className="me-2" />
                {user?.role === 'STUDENT' ? 'Quiz du Cours' : 'Statistiques des Quiz des Étudiants'}
              </h5>
            </div>
            <div className="card-body">
              
              {/* POUR LES ÉTUDIANTS : Passer le quiz */}
              {user?.role === 'STUDENT' ? (
                <>
                  {(() => {
                    const isQuizAvailable = quizEligibility?.eligible === true || 
                                           quizEligibility?.isEligible === true;
                    
                    if (!isQuizAvailable) {
                      return (
                        <div className="text-center py-4">
                          <FaExclamationTriangle className="text-warning display-4 mb-3" />
                          <h5>Quiz non disponible</h5>
                          <p className="text-muted mb-3">
                            {quizEligibility?.reason || 'Le quiz n\'est pas encore configuré pour ce cours.'}
                          </p>
                          {quizEligibility?.reason?.includes('Limite quotidienne') ? (
                            <div className="alert alert-info">
                              <FaInfoCircle className="me-2" />
                              Tentatives aujourd'hui: {quizEligibility.attemptsToday}/{quizEligibility.maxAttemptsPerDay}
                              {quizEligibility.nextAvailableTime && (
                                <div className="small mt-1">
                                  Prochaine tentative: {formatDate(quizEligibility.nextAvailableTime)}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        <div className="row">
                          <div className="col-md-8">
                            <h6>Testez vos connaissances</h6>
                            <p className="text-muted">
                              Passez le quiz pour évaluer votre compréhension du cours.
                            </p>
                            
                            <div className="alert alert-success">
                              <div className="d-flex align-items-center">
                                <FaCheckCircle className="me-2" />
                                <div>
                                  <strong>Statut:</strong> <span className="text-success">✅ Éligible</span>
                                  <div className="small mt-1">
                                    <strong>Tentatives aujourd'hui:</strong> {quizEligibility?.attemptsToday || 0}/{quizEligibility?.maxAttemptsPerDay || 3}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="d-grid gap-2">
                              <button
                                onClick={handleStartQuiz}
                                disabled={quizLoading}
                                className="btn btn-success btn-lg d-flex align-items-center justify-content-center"
                              >
                                {quizLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Chargement...
                                  </>
                                ) : (
                                  <>
                                    <FaQuestionCircle className="me-2" />
                                    Commencer le Quiz
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Statistiques de l'étudiant */}
                        {quizStats && (
                          <div className="row mt-3">
                            <div className="col-md-3">
                              <div className="card text-center">
                                <div className="card-body">
                                  <h5 className="card-title text-primary">{quizStats.totalAttempts || 0}</h5>
                                  <p className="card-text small">Vos tentatives</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card text-center">
                                <div className="card-body">
                                  <h5 className="card-title text-success">
                                    {quizStats.bestScore?.toFixed(1) || '0.0'}%
                                  </h5>
                                  <p className="card-text small">Votre meilleur score</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card text-center">
                                <div className="card-body">
                                  <h5 className="card-title text-info">
                                    {quizStats.averageScore?.toFixed(1) || '0.0'}%
                                  </h5>
                                  <p className="card-text small">Votre moyenne</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card text-center">
                                <div className="card-body">
                                  <h5 className="card-title text-warning">
                                    {quizEligibility?.remainingAttemptsToday || 3}
                                  </h5>
                                  <p className="card-text small">Tentatives restantes</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : 
              
              /* POUR LES PROFESSEURS/ADMIN : Voir les statistiques DES ÉTUDIANTS */
              (user?.role === 'TEACHER' || user?.role === 'ADMIN') ? (
                <div>
                  <h6>Statistiques des quiz des étudiants</h6>
                  <p className="text-muted mb-4">
                    Consultez les performances des étudiants aux quiz de ce cours.
                  </p>
                  
                  {/* Section pour voir les étudiants et leurs scores */}
                  {statsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                      <p className="mt-2">Chargement des statistiques...</p>
                    </div>
                  ) : studentQuizStats.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Étudiant</th>
                            <th>Email</th>
                            <th>Tentatives</th>
                            <th>Meilleur score</th>
                            <th>Moyenne</th>
                            <th>Niveau</th>
                            <th>Dernière tentative</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentQuizStats.map((student) => (
                            <tr key={student.id}>
                              <td>
                                <FaUserGraduate className="me-2 text-primary" />
                                {student.firstName} {student.lastName}
                              </td>
                              <td>{student.email}</td>
                              <td>
                                <span className="badge bg-info">
                                  {student.totalAttempts || 0} tentatives
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  (student.bestScore || 0) >= 80 ? 'bg-success' :
                                  (student.bestScore || 0) >= 50 ? 'bg-warning' : 'bg-danger'
                                }`}>
                                  {student.bestScore?.toFixed(1) || '0.0'}%
                                </span>
                              </td>
                              <td>
                                <strong>{student.averageScore?.toFixed(1) || '0.0'}%</strong>
                              </td>
                              <td>
                                <span className={`badge ${
                                  student.performanceLevel === 'EXCELLENT' ? 'bg-success' :
                                  student.performanceLevel === 'GOOD' ? 'bg-primary' :
                                  student.performanceLevel === 'SATISFACTORY' ? 'bg-warning' :
                                  'bg-danger'
                                }`}>
                                  {student.performanceLevel || 'BEGINNER'}
                                </span>
                              </td>
                              <td>
                                {student.lastAttemptDate ? 
                                  formatDate(student.lastAttemptDate) : 
                                  'Jamais'
                                }
                              </td>
                              <td>
                                <Link 
                                  to={`/quiz-history/${student.id}/${id}`}
                                  className="btn btn-sm btn-outline-info"
                                  title="Voir l'historique"
                                >
                                  <FaHistory />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaUsers className="display-4 text-muted mb-3" />
                      <h5>Aucune statistique disponible</h5>
                      <p className="text-muted">Les statistiques des quiz apparaîtront ici lorsque des étudiants passeront des quiz.</p>
                    </div>
                  )}
                  
                  {/* Boutons pour le prof */}
                  <div className="d-flex justify-content-between mt-4">
                    <div>
                      <Link 
                        to={`/courses/${id}/quiz-config`}
                        className="btn btn-primary"
                      >
                        <FaEdit className="me-2" />
                        Configurer les quiz
                      </Link>
                      <button
                        onClick={() => fetchStudentQuizStats(students)}
                        className="btn btn-outline-secondary ms-2"
                        disabled={statsLoading}
                      >
                        <FaSync className="me-2" />
                        Actualiser les statistiques
                      </button>
                    </div>
                    
                    <Link 
                      to={`/courses/${id}/quiz-reports`}
                      className="btn btn-info"
                    >
                      <FaChartLine className="me-2" />
                      Rapports détaillés
                    </Link>
                  </div>
                </div>
              ) : null}
              
            </div>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <FaExclamationTriangle className="me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Onglets */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Détails
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Fichiers ({files.length})
          </button>
        </li>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN' || students.length > 0) && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              Étudiants ({students.length})
            </button>
          </li>
        )}
      </ul>

      {/* Contenu des onglets */}
      <div className="tab-content">
        {/* Onglet Détails */}
        {activeTab === 'details' && (
          <div className="card">
            <div className="card-body">
              <h5>Description complète</h5>
              <div className="mt-3 p-3 bg-light rounded">
                {course.description || 'Aucune description détaillée.'}
              </div>
              
              <div className="mt-4">
                <h5>Informations complémentaires</h5>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Enseignant</h6>
                      </div>
                      <div className="card-body">
                        {teacher ? (
                          <>
                            <p className="mb-1">
                              <strong>Nom:</strong> {teacher.firstName} {teacher.lastName}
                            </p>
                            <p className="mb-1">
                              <strong>Email:</strong> {teacher.email}
                            </p>
                            <p className="mb-0">
                              <strong>Nom d'utilisateur:</strong> {teacher.username}
                            </p>
                          </>
                        ) : (
                          <p>Informations de l'enseignant non disponibles</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Statistiques</h6>
                      </div>
                      <div className="card-body">
                        <p className="mb-1">
                          <strong>Date de création:</strong> {formatDate(course.createdDate)}
                        </p>
                        <p className="mb-1">
                          <strong>Étudiants inscrits:</strong> {students.length}
                        </p>
                        <p className="mb-0">
                          <strong>Fichiers:</strong> {files.length}
                        </p>
                        {user?.role === 'STUDENT' && quizStats && (
                          <>
                            <hr />
                            <p className="mb-1">
                              <strong>Vos tentatives de quiz:</strong> {quizStats.totalAttempts || 0}
                            </p>
                            <p className="mb-0">
                              <strong>Votre meilleur score:</strong> {quizStats.bestScore?.toFixed(1) || '0.0'}%
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Fichiers */}
        {activeTab === 'files' && (
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Fichiers du cours</h5>
                {canEdit && (isCourseTeacher || user?.role === 'ADMIN') && (
                  <Link
                    to={`/courses/${id}/upload`}
                    className="btn btn-primary btn-sm"
                  >
                    <FaDownload className="me-1" />
                    Ajouter des fichiers
                  </Link>
                )}
              </div>
              
              {files.length === 0 ? (
                <div className="text-center py-5">
                  <FaFilePdf className="display-1 text-muted mb-3" />
                  <h5>Aucun fichier disponible</h5>
                  <p className="text-muted">
                    {user?.role === 'STUDENT' 
                      ? "L'enseignant n'a pas encore ajouté de fichiers à ce cours."
                      : "Ajoutez des fichiers pour les étudiants."}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Nom du fichier</th>
                        <th>Type</th>
                        <th>Taille</th>
                        <th>Date d'upload</th>
                        <th>Uploadé par</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id}>
                          <td>
                            <FaFilePdf className="me-2 text-danger" />
                            {file.fileName}
                          </td>
                          <td>
                            <span className="badge bg-info">{file.fileType}</span>
                          </td>
                          <td>{formatFileSize(file.fileSize)}</td>
                          <td>{formatDate(file.uploadedDate)}</td>
                          <td>{file.uploadedByUsername}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                onClick={() => handleDownloadFile(file)}
                                className="btn btn-outline-primary"
                                title="Télécharger"
                              >
                                <FaDownload />
                              </button>
                              {canEdit && (isCourseTeacher || user?.role === 'ADMIN') && (
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="btn btn-outline-danger"
                                  title="Supprimer"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Étudiants */}
        {activeTab === 'students' && (
          <StudentManagement
            courseId={id!}
            enrolledStudents={students}
            onStudentsUpdated={fetchCourseData}
            isTeacherOrAdmin={canEdit && (isCourseTeacher || user?.role === 'ADMIN')}
          />
        )}
      </div>

      {/* Bouton retour */}
      <div className="mt-4">
        <Link to="/courses" className="btn btn-secondary">
          <FaArrowLeft className="me-2" />
          Retour à la liste des cours
        </Link>
      </div>

      {/* Modal du Quiz Standard (ÉTUDIANTS SEULEMENT) */}
      {user?.role === 'STUDENT' && showQuizModal && quizAttempt && (
        <CourseQuizModal
          attempt={quizAttempt}
          onClose={() => {
            setShowQuizModal(false);
            setQuizAttempt(null);
          }}
          onSubmit={handleQuizSubmit}
        />
      )}

      {/* Modal du Quiz Adaptatif (ÉTUDIANTS SEULEMENT) */}
      {user?.role === 'STUDENT' && showAdaptiveQuizModal && adaptiveQuizData && (
        <AdaptiveQuizModal
          quizData={adaptiveQuizData}
          strategy={adaptiveStrategy}
          onClose={() => {
            setShowAdaptiveQuizModal(false);
            setAdaptiveQuizData(null);
          }}
          onSubmit={handleAdaptiveQuizSubmit}
        />
      )}

      {/* Modal des Résultats (ÉTUDIANTS SEULEMENT) */}
      {user?.role === 'STUDENT' && showResultsModal && quizResults && (
        <QuizResultsModal
          results={quizResults}
          onClose={() => {
            setShowResultsModal(false);
            setQuizResults(null);
          }}
          onRetry={() => {
            setShowResultsModal(false);
            setQuizResults(null);
            handleStartQuiz();
          }}
          onContinue={() => {
            setShowResultsModal(false);
            setQuizResults(null);
            navigate('/courses');
          }}
        />
      )}

      {/* Sélecteur de Stratégie (ÉTUDIANTS SEULEMENT) */}
      <StrategySelector />
    </div>
  );
};

export default CourseDetailPage;