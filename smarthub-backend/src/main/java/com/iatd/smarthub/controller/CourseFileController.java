package com.iatd.smarthub.controller;

import com.iatd.smarthub.model.course.CourseFile;
import com.iatd.smarthub.service.CourseFileService;
import com.iatd.smarthub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/course-files")
@RequiredArgsConstructor
public class CourseFileController {

    private final CourseFileService courseFileService;
    private final UserService userService;

    @PostMapping("/upload")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // ✅ CORRECTION : Utiliser getUserEntityByUsername
        Long teacherId = userService.getUserEntityByUsername(userDetails.getUsername()).getId();
        
        try {
            CourseFile uploadedFile = courseFileService.uploadFile(courseId, teacherId, file);
            
            // ✅ CORRECTION : Retourner un Map au lieu de l'entité pour éviter LazyInitializationException
            Map<String, Object> response = new HashMap<>();
            response.put("id", uploadedFile.getId());
            response.put("fileName", uploadedFile.getFileName());
            response.put("fileType", uploadedFile.getFileType());
            response.put("fileSize", uploadedFile.getFileSize());
            response.put("uploadedDate", uploadedFile.getUploadedDate());
            response.put("uploadedBy", uploadedFile.getUploadedBy().getUsername()); // ✅ Chargé avec JOIN FETCH
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getCourseFiles(@PathVariable Long courseId) {
        List<CourseFile> files = courseFileService.getFilesByCourseId(courseId);
        
        // ✅ CORRECTION : Convertir en Map pour éviter LazyInitializationException
        List<Map<String, Object>> response = files.stream().map(file -> {
            Map<String, Object> fileMap = new HashMap<>();
            fileMap.put("id", file.getId());
            fileMap.put("fileName", file.getFileName());
            fileMap.put("fileType", file.getFileType());
            fileMap.put("fileSize", file.getFileSize());
            fileMap.put("uploadedDate", file.getUploadedDate());
            fileMap.put("uploadedBy", file.getUploadedBy().getUsername()); // ✅ Chargé avec JOIN FETCH
            return fileMap;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{fileId}/download")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long courseId, @PathVariable Long fileId) {
        try {
            CourseFile courseFile = courseFileService.getFile(fileId);
            
            Path filePath = Paths.get(courseFile.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, 
                                "attachment; filename=\"" + courseFile.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long courseId,
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // ✅ CORRECTION : Utiliser getUserEntityByUsername
        Long teacherId = userService.getUserEntityByUsername(userDetails.getUsername()).getId();
        
        courseFileService.deleteFile(fileId, teacherId);
        return ResponseEntity.noContent().build();
    }

    // ✅ AJOUT : Endpoint de debug pour tester sans LazyInitializationException
    @PostMapping("/debug-upload")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<String> debugUpload(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // ✅ CORRECTION : Utiliser getUserEntityByUsername
            Long teacherId = userService.getUserEntityByUsername(userDetails.getUsername()).getId();
            
            CourseFile uploadedFile = courseFileService.uploadFile(courseId, teacherId, file);
            
            return ResponseEntity.ok("Upload réussi! Fichier ID: " + uploadedFile.getId() + 
                                   ", Nom: " + uploadedFile.getFileName() + 
                                   ", Taille: " + uploadedFile.getFileSize() + " bytes");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }
}