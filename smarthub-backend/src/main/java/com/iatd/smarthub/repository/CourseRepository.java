package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    // ✅ CHARGER TOUS LES COURS AVEC TEACHER
    @Query("SELECT c FROM Course c JOIN FETCH c.teacher")
    List<Course> findAllWithTeacher();
    
    // ✅ CHARGER UN COURS AVEC TEACHER
    @Query("SELECT c FROM Course c JOIN FETCH c.teacher WHERE c.id = :id")
    Optional<Course> findByIdWithTeacher(Long id);
    
    // AJOUTE CETTE MÉTHODE
    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.students " +
           "LEFT JOIN FETCH c.teacher " +
           "WHERE c.teacher.id = :teacherId")
    List<Course> findByTeacherIdWithStudents(@Param("teacherId") Long teacherId);
    
    // ✅ CHARGER UN COURS AVEC ÉTUDIANTS
    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.students WHERE c.id = :id")
    Optional<Course> findByIdWithStudents(Long id);
    
    // ✅ CHARGER UN COURS AVEC TEACHER ET ÉTUDIANTS
    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.teacher " +
           "LEFT JOIN FETCH c.students " +
           "WHERE c.id = :id")
    Optional<Course> findByIdWithTeacherAndStudents(Long id);

    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.files f " +
           "LEFT JOIN FETCH f.uploadedBy " +
           "WHERE c.id = :id")
    Optional<Course> findByIdWithFiles(@Param("id") Long id);
    
    List<Course> findByTeacherId(Long teacherId);
    List<Course> findByTitleContainingIgnoreCase(String title);
    
    @Query("SELECT c FROM Course c JOIN c.teacher t WHERE t.username = :username")
    List<Course> findByTeacherUsername(@Param("username") String username);
    
    @Query("SELECT s FROM Course c JOIN c.students s WHERE c.id = :courseId")
    List<User> findStudentsByCourseId(@Param("courseId") Long courseId);
    
    boolean existsByStudentsIdAndId(Long studentId, Long courseId);
    
    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.students " +
           "WHERE c.id = :courseId")
    Optional<Course> findByIdWithStudentsForUpdate(@Param("courseId") Long courseId);
    
    // ✅ CORRECTION : MÉTHODES NATIVES POUR LA TABLE DE JOINTURE
    
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO course_students (course_id, student_id) VALUES (:courseId, :studentId)", 
           nativeQuery = true)
    void addStudentToCourseNative(@Param("courseId") Long courseId, 
                                 @Param("studentId") Long studentId);
    
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM course_students WHERE course_id = :courseId AND student_id = :studentId", 
    	       nativeQuery = true)
    	Integer existsInCourseStudents(@Param("courseId") Long courseId, 
    	                               @Param("studentId") Long studentId);
    
    // Méthode alternative qui retourne un Long (pour debug)
    @Query(value = "SELECT COUNT(*) FROM course_students WHERE course_id = :courseId AND student_id = :studentId", 
           nativeQuery = true)
    Long countStudentInCourse(@Param("courseId") Long courseId, 
                             @Param("studentId") Long studentId);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM course_students WHERE course_id = :courseId AND student_id = :studentId", 
           nativeQuery = true)
    void removeStudentFromCourseNative(@Param("courseId") Long courseId, 
                                      @Param("studentId") Long studentId);
    
    // ✅ OPTIONNEL : Méthode pour éviter les doublons
    @Modifying
    @Transactional
    @Query(value = "INSERT IGNORE INTO course_students (course_id, student_id) VALUES (:courseId, :studentId)", 
           nativeQuery = true)
    void addStudentIfNotExists(@Param("courseId") Long courseId, 
                              @Param("studentId") Long studentId);
    
 // AJOUTEZ CETTE MÉTHODE
    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.students s " +
           "WHERE c.id = :courseId")
    Optional<Course> findByIdWithStudentsEager(@Param("courseId") Long courseId);
    
    @Query(value = "SELECT COUNT(*) FROM course_students WHERE course_id = :courseId", 
    	       nativeQuery = true)
    	Long countStudentsByCourseIdNative(@Param("courseId") Long courseId);
    
    @Query("""
    	    SELECT c FROM Course c
    	    JOIN c.students s
    	    WHERE s.id = :studentId
    	""")
    	List<Course> findCoursesByStudentId(@Param("studentId") Long studentId);
}