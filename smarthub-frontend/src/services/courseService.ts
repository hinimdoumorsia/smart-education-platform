import api from './api';

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  createdDate: string;
  students?: Student[];
  files?: CourseFile[];
  studentCount: number;
  fileCount: number;
}

export interface Student {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface CourseFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedDate: string;
  uploadedByUsername: string;
  downloadUrl?: string;
}

export interface CourseRequest {
  title: string;
  description: string;
  teacherId: string;
  files?: File[];
}

export interface Teacher {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
}

class CourseService {
  // Récupérer tous les cours
  async getAllCourses(): Promise<Course[]> {
    try {
      const response = await api.get('/api/courses');
      
      // Transformez les données pour inclure studentCount et fileCount
      return response.data.map((course: any) => ({
        id: course.id?.toString() || '',
        title: course.title || '',
        description: course.description || '',
        teacherId: course.teacherId ? course.teacherId.toString() : '',
        teacherName: course.teacherName || '',
        createdDate: course.createdDate || new Date().toISOString(),
        
        // IMPORTANT : Inclure les counts
        studentCount: course.studentCount || course.students?.length || 0,
        fileCount: course.fileCount || course.files?.length || 0,
        
        // Optionnel : garder les listes vides
        students: course.students || [],
        files: course.files || []
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  // Récupérer un cours par ID (complète)
  async getCourseById(id: string): Promise<Course> {
    try {
      const response = await api.get(`/api/courses/${id}`);
      return {
        ...response.data,
        id: response.data.id.toString(),
        teacherId: response.data.teacherId.toString(),
        studentCount: response.data.studentCount || response.data.students?.length || 0,
        fileCount: response.data.fileCount || response.data.files?.length || 0
      };
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      throw error;
    }
  }

  // ============ MÉTHODE AJOUTÉE : INFOS BASIQUES ============
  async getCourseBasicInfo(id: string): Promise<Course> {
    try {
      console.log(`🔍 Fetching basic info for course ${id}`);
      const response = await api.get(`/api/courses/${id}/basic-info`);
      console.log('✅ Basic info received:', response.data);
      
      // Formater la réponse pour correspondre à l'interface Course
      const basicCourse: Course = {
        id: response.data.id.toString(),
        title: response.data.title,
        description: response.data.description,
        teacherId: response.data.teacherId.toString(),
        createdDate: response.data.createdDate,
        teacherName: response.data.teacher 
          ? `${response.data.teacher.firstName || ''} ${response.data.teacher.lastName || ''}`.trim() 
            || response.data.teacher.username 
          : `Enseignant ID: ${response.data.teacherId}`,
        studentCount: response.data.studentCount || 0,
        fileCount: response.data.fileCount || 0
      };
      
      return basicCourse;
    } catch (error: any) {
      console.error(`❌ Error fetching basic info for course ${id}:`, error);
      
      if (error.response?.status === 404) {
        throw new Error('Cours non trouvé');
      } else if (error.response?.status === 403) {
        throw new Error('Accès refusé');
      }
      
      throw error;
    }
  }

  // ============ NOUVELLES MÉTHODES AJOUTÉES ============

  // Pour les étudiants - endpoint spécifique
  async getCourseForStudent(id: string): Promise<Course> {
    try {
      const response = await api.get(`/api/courses/${id}/for-student`);
      return {
        ...response.data,
        id: response.data.id.toString(),
        teacherId: response.data.teacherId.toString(),
        studentCount: response.data.studentCount || response.data.students?.length || 0,
        fileCount: response.data.fileCount || response.data.files?.length || 0
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Vous n\'êtes pas inscrit à ce cours');
      }
      throw error;
    }
  }

  // Endpoint public (sans vérification d'inscription)
  async getCoursePublic(id: string): Promise<Course> {
    try {
      const response = await api.get(`/api/courses/${id}/public`);
      return {
        ...response.data,
        id: response.data.id.toString(),
        teacherId: response.data.teacherId.toString(),
        studentCount: response.data.studentCount || response.data.students?.length || 0,
        fileCount: response.data.fileCount || response.data.files?.length || 0
      };
    } catch (error) {
      console.error(`Error fetching public course ${id}:`, error);
      throw error;
    }
  }

  // S'inscrire à un cours
  async enrollInCourse(courseId: string): Promise<any> {
    try {
      const response = await api.post(`/api/courses/${courseId}/enroll`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Vous ne pouvez pas vous inscrire à ce cours');
      }
      console.error(`Error enrolling in course ${courseId}:`, error);
      throw error;
    }
  }

  // Vérifier l'inscription
  async checkEnrollment(courseId: string): Promise<boolean> {
    try {
      const response = await api.get(`/api/courses/${courseId}/check-enrollment`);
      return response.data.isEnrolled;
    } catch (error) {
      console.error(`Error checking enrollment for course ${courseId}:`, error);
      return false;
    }
  }

  // ============ CRÉATION ET MODIFICATION ============

  // Créer un nouveau cours
  async createCourse(courseData: CourseRequest): Promise<Course> {
    console.log('=== COURSE SERVICE - createCourse ===');
    console.log('courseData:', courseData);
    console.log('teacherId:', courseData.teacherId);
    console.log('teacherId type:', typeof courseData.teacherId);
  
    try {
      const formData = new FormData();
      formData.append('title', courseData.title);
      formData.append('description', courseData.description || '');
    
      // IMPORTANT: Convertir teacherId en number pour correspondre au Long du backend
      // Mais le FormData le convertira en string - c'est normal
      const teacherIdStr = courseData.teacherId;
      console.log('teacherId (string):', teacherIdStr);
      formData.append('teacherId', teacherIdStr);
    
      // Ajouter les fichiers
      if (courseData.files && courseData.files.length > 0) {
        courseData.files.forEach(file => {
          formData.append('files', file);
        });
      }

      // Log FormData pour debug
      console.log('FormData entries:');
      const entries = Array.from(formData.entries());
      entries.forEach(([key, value]) => {
        console.log(`${key}: ${value} (${typeof value})`);
      });

      const response = await api.post('/api/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    
      console.log('Response:', response.data);
    
      // Convertir les IDs en string pour le frontend
      return {
        ...response.data,
        id: response.data.id.toString(),
        teacherId: response.data.teacherId.toString(),
        studentCount: response.data.studentCount || 0,
        fileCount: response.data.fileCount || 0
      };
    
    } catch (error: any) {
      console.error('Service error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // Mettre à jour un cours
  async updateCourse(id: string, courseData: Partial<CourseRequest>): Promise<Course> {
    try {
      const formData = new FormData();
      formData.append('title', courseData.title || '');
      formData.append('description', courseData.description || '');
      
      if (courseData.teacherId) {
        formData.append('teacherId', courseData.teacherId);
      }
      
      if (courseData.files && courseData.files.length > 0) {
        courseData.files.forEach(file => {
          formData.append('files', file);
        });
      }

      const response = await api.put(`/api/courses/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        ...response.data,
        id: response.data.id.toString(),
        teacherId: response.data.teacherId.toString(),
        studentCount: response.data.studentCount || 0,
        fileCount: response.data.fileCount || 0
      };
    } catch (error) {
      console.error(`Error updating course ${id}:`, error);
      throw error;
    }
  }

  // Supprimer un cours
  async deleteCourse(id: string): Promise<void> {
    try {
      await api.delete(`/api/courses/${id}`);
    } catch (error) {
      console.error(`Error deleting course ${id}:`, error);
      throw error;
    }
  }

  // ============ GESTION DES FICHIERS ============

  // Récupérer les fichiers d'un cours
  async getCourseFiles(courseId: string): Promise<CourseFile[]> {
    try {
      const response = await api.get(`/api/courses/${courseId}/files`);
      return response.data.map((file: any) => ({
        ...file,
        id: file.id.toString()
      }));
    } catch (error) {
      console.error(`Error fetching files for course ${courseId}:`, error);
      throw error;
    }
  }

  // Uploader un fichier pour un cours
  async uploadFile(courseId: string, file: File): Promise<CourseFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/api/course-files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { courseId }
      });
      
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Télécharger un fichier
  async downloadFile(courseId: string, fileId: string, fileName: string): Promise<void> {
    try {
      const response = await api.get(`/api/courses/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Supprimer un fichier
  async deleteFile(courseId: string, fileId: string): Promise<void> {
    try {
      await api.delete(`/api/courses/files/${fileId}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // ============ GESTION DES ÉTUDIANTS ============

  // Ajouter un étudiant à un cours
  async addStudentToCourse(courseId: string, studentId: string): Promise<void> {
    try {
      await api.post(`/api/courses/${courseId}/students/${studentId}`);
    } catch (error) {
      console.error(`Error adding student to course ${courseId}:`, error);
      throw error;
    }
  }

  // Retirer un étudiant d'un cours
  async removeStudentFromCourse(courseId: string, studentId: string): Promise<void> {
    try {
      await api.delete(`/api/courses/${courseId}/students/${studentId}`);
    } catch (error) {
      console.error(`Error removing student from course ${courseId}:`, error);
      throw error;
    }
  }

  // Récupérer les étudiants d'un cours
  async getCourseStudents(courseId: string): Promise<Student[]> {
    try {
      const response = await api.get(`/api/courses/${courseId}/students`);
      return response.data.map((student: any) => ({
        ...student,
        id: student.id.toString()
      }));
    } catch (error) {
      console.error(`Error fetching students for course ${courseId}:`, error);
      throw error;
    }
  }

  // ============ RECHERCHE ET FILTRES ============

  // Rechercher des cours par titre
  async searchCourses(query: string): Promise<Course[]> {
    try {
      const response = await api.get(`/api/courses/search`, {
        params: { query }
      });
      return response.data.map((course: any) => ({
        ...course,
        id: course.id.toString(),
        teacherId: course.teacherId.toString(),
        studentCount: course.studentCount || course.students?.length || 0,
        fileCount: course.fileCount || course.files?.length || 0
      }));
    } catch (error) {
      console.error('Error searching courses:', error);
      throw error;
    }
  }

  // Récupérer les cours par enseignant
  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    try {
      const response = await api.get(`/api/courses/teacher/${teacherId}`);
      return response.data.map((course: any) => ({
        ...course,
        id: course.id.toString(),
        teacherId: course.teacherId.toString(),
        studentCount: course.studentCount || course.students?.length || 0,
        fileCount: course.fileCount || course.files?.length || 0
      }));
    } catch (error) {
      console.error(`Error fetching courses for teacher ${teacherId}:`, error);
      throw error;
    }
  }

  // Récupérer les cours d'un étudiant
  async getStudentCourses(studentId: string): Promise<Course[]> {
    try {
      const response = await api.get(`/api/courses/student/${studentId}`);
      return response.data.map((course: any) => ({
        ...course,
        id: course.id.toString(),
        teacherId: course.teacherId.toString(),
        studentCount: course.studentCount || course.students?.length || 0,
        fileCount: course.fileCount || course.files?.length || 0
      }));
    } catch (error) {
      console.error(`Error fetching courses for student ${studentId}:`, error);
      throw error;
    }
  }

  // Récupérer les cours de l'enseignant connecté
  async getMyCourses(): Promise<Course[]> {
    console.log('=== COURSE SERVICE - getMyCourses ===');
    
    try {
      console.log('Making API call to /api/courses/my-courses');
      
      const response = await api.get('/api/courses/my-courses');
      
      console.log('API Response:', {
        status: response.status,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'N/A'
      });
      
      // Vérifiez si c'est un tableau
      if (!Array.isArray(response.data)) {
        console.error('Response.data is not an array:', response.data);
        throw new Error('Réponse invalide du serveur');
      }
      
      // Transformez les données
      const courses = response.data.map((course: any) => ({
        ...course,
        id: course.id.toString(),
        teacherId: course.teacherId ? course.teacherId.toString() : '',
        studentCount: course.studentCount || course.students?.length || 0,
        fileCount: course.fileCount || course.files?.length || 0,
        students: course.students || [],
        files: course.files || [],
        teacherName: course.teacherName || `Enseignant ID: ${course.teacherId}`,
        createdDate: course.createdDate || new Date().toISOString()
      }));
      
      console.log('Transformed courses:', courses);
      console.log('Number of courses:', courses.length);
      
      return courses;
      
    } catch (error: any) {
      console.error('Error in getMyCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      // Lancez une erreur plus descriptive
      throw new Error(
        error.response?.data?.message 
        || error.response?.data?.error 
        || `Erreur lors du chargement des cours: ${error.message}`
      );
    }
  }

  // ============ UTILITAIRES ============

  // Formater la taille du fichier
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Obtenir l'icône du type de fichier
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'bi-file-pdf text-danger';
    if (fileType.includes('word') || fileType.includes('doc')) return 'bi-file-word text-primary';
    if (fileType.includes('excel') || fileType.includes('xls')) return 'bi-file-excel text-success';
    if (fileType.includes('powerpoint') || fileType.includes('ppt')) return 'bi-file-ppt text-warning';
    if (fileType.includes('image')) return 'bi-file-image text-info';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'bi-file-zip text-secondary';
    return 'bi-file-earmark';
  }

  // Ajouter des fichiers à un cours existant
  async addFilesToCourse(courseId: string, files: File[]): Promise<void> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      await api.post(`/api/courses/${courseId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error(`Error adding files to course ${courseId}:`, error);
      throw error;
    }
  }
}

const courseService = new CourseService();
export default courseService;