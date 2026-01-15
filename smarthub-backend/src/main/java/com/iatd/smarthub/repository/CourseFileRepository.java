package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.course.CourseFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CourseFileRepository extends JpaRepository<CourseFile, Long> {
    
    List<CourseFile> findByCourseId(Long courseId);
    
    Optional<CourseFile> findByIdAndCourseId(Long id, Long courseId);
    
    @Query("SELECT cf FROM CourseFile cf JOIN FETCH cf.uploadedBy WHERE cf.course.id = :courseId")
    List<CourseFile> findByCourseIdWithUploader(@Param("courseId") Long courseId);
    
    void deleteByCourseId(Long courseId);
    
    @Query("SELECT COUNT(f) FROM CourseFile f WHERE f.course.id = :courseId")
    Long countByCourseId(@Param("courseId") Long courseId);
}