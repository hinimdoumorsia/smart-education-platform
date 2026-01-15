package com.iatd.smarthub.service;

import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.model.course.CourseFile;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.CourseFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseFileService {

    private final CourseFileRepository courseFileRepository;
    private final CourseService courseService;
    private final UserService userService;

    // Répertoire de stockage des fichiers
    private final Path fileStorageLocation = Paths.get("uploads/courses").toAbsolutePath().normalize();

    public CourseFile uploadFile(Long courseId, Long teacherId, MultipartFile file) throws IOException {
        // Vérifier que le cours existe et que l'enseignant est le propriétaire
        Course course = courseService.getCourseById(courseId);
        User teacher = userService.getUserEntityById(teacherId);
        
        // Vérifier que l'enseignant est bien le propriétaire du cours
        if (!course.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Seul l'enseignant du cours peut uploader des fichiers");
        }

        // Créer le répertoire s'il n'existe pas
        Files.createDirectories(fileStorageLocation);

        // Générer un nom de fichier unique
        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String storedFileName = UUID.randomUUID().toString() + "." + fileExtension;
        Path targetLocation = fileStorageLocation.resolve(storedFileName);

        // Copier le fichier
        Files.copy(file.getInputStream(), targetLocation);

        // Créer l'entité CourseFile
        CourseFile courseFile = new CourseFile(
            originalFileName,
            targetLocation.toString(),
            file.getContentType(),
            file.getSize(),
            course,
            teacher
        );

        return courseFileRepository.save(courseFile);
    }

    public List<CourseFile> getFilesByCourseId(Long courseId) {
        return courseFileRepository.findByCourseIdWithUploader(courseId);
    }

    public void deleteFile(Long fileId, Long teacherId) {
        CourseFile courseFile = courseFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Fichier non trouvé"));

        // Vérifier que l'enseignant est le propriétaire du fichier
        if (!courseFile.getUploadedBy().getId().equals(teacherId)) {
            throw new RuntimeException("Seul l'enseignant qui a uploadé le fichier peut le supprimer");
        }

        try {
            // Supprimer le fichier physique
            Files.deleteIfExists(Paths.get(courseFile.getFilePath()));
            // Supprimer l'entrée en base
            courseFileRepository.delete(courseFile);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la suppression du fichier: " + e.getMessage());
        }
    }

    public CourseFile getFile(Long fileId) {
        return courseFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Fichier non trouvé"));
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return "";
        int lastDotIndex = fileName.lastIndexOf(".");
        return (lastDotIndex == -1) ? "" : fileName.substring(lastDotIndex + 1);
    }
}