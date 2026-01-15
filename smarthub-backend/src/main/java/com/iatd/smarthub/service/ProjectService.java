package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.ProjectRequestDTO;
import com.iatd.smarthub.dto.ProjectResponseDTO;
import com.iatd.smarthub.model.project.Project;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.iatd.smarthub.dto.UserBasicDTO;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserService userService;

    // ✅ NOUVEAU : Création avec l'enseignant connecté automatiquement
 // ✅ MODIFIÉ : Ajout de la vérification de sécurité
    public ProjectResponseDTO createProject(ProjectRequestDTO projectRequest, String username) {
        // ✅ VÉRIFICATION DE SÉCURITÉ : Empêcher les étudiants de créer des projets
        User currentUser = userService.getUserEntityByUsername(username);
        if (currentUser.getRole() == User.Role.STUDENT) {
            throw new RuntimeException("Les étudiants ne sont pas autorisés à créer des projets");
        }

        Project project = new Project();
        project.setTitle(projectRequest.getTitle());
        project.setDescription(projectRequest.getDescription());
        project.setStartDate(projectRequest.getStartDate());
        project.setEndDate(projectRequest.getEndDate());
        project.setStatus(projectRequest.getStatus() != null ? projectRequest.getStatus() : Project.ProjectStatus.PLANNED);

        // ✅ Assigner automatiquement l'enseignant connecté comme superviseur
        User supervisor = currentUser; // Utiliser l'utilisateur déjà récupéré
        project.setSupervisor(supervisor);

        Project savedProject = projectRepository.save(project);
        return convertToDTO(savedProject);
    }

    public List<ProjectResponseDTO> getAllProjects() {
        // ✅ Utiliser la méthode avec JOIN FETCH
        return projectRepository.findAllWithSupervisor().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<ProjectResponseDTO> getProjectById(Long id) {
        // ✅ Utiliser la méthode avec JOIN FETCH
        return projectRepository.findByIdWithSupervisor(id)
                .map(this::convertToDTO);
    }

    // Mettre à jour les autres méthodes pour utiliser les bonnes requêtes
    public List<ProjectResponseDTO> getProjectsBySupervisorUsername(String username) {
        User supervisor = userService.getUserEntityByUsername(username);
        // Vous devrez peut-être créer une méthode similaire dans le repository
        return projectRepository.findBySupervisor(supervisor).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ NOUVEAU : Récupérer les projets par username de l'étudiant
    public List<ProjectResponseDTO> getProjectsByStudentUsername(String username) {
        User student = userService.getUserEntityByUsername(username);
        return projectRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ Garder l'ancienne méthode pour compatibilité
    public List<ProjectResponseDTO> getProjectsBySupervisor(Long supervisorId) {
        User supervisor = userService.getUserEntityById(supervisorId);
        return projectRepository.findBySupervisor(supervisor).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ Garder l'ancienne méthode pour compatibilité
    public List<ProjectResponseDTO> getProjectsByStudent(Long studentId) {
        User student = userService.getUserEntityById(studentId);
        return projectRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectResponseDTO> getProjectsByStatus(Project.ProjectStatus status) {
        return projectRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectResponseDTO> getActiveProjects() {
        return projectRepository.findActiveProjects().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectResponseDTO> searchProjects(String query) {
        return projectRepository.searchByTitle(query).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO projectDetails, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        project.setTitle(projectDetails.getTitle());
        project.setDescription(projectDetails.getDescription());
        project.setStartDate(projectDetails.getStartDate());
        project.setEndDate(projectDetails.getEndDate());
        project.setStatus(projectDetails.getStatus());

        Project updatedProject = projectRepository.save(project);
        return convertToDTO(updatedProject);
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public void deleteProject(Long id, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        projectRepository.delete(project);
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public void addStudentToProject(Long projectId, Long studentId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        User student = userService.getUserEntityById(studentId);

        if (project.getStudents().contains(student)) {
            throw new RuntimeException("Student is already in the project");
        }

        project.getStudents().add(student);
        projectRepository.save(project);
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public void removeStudentFromProject(Long projectId, Long studentId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        User student = userService.getUserEntityById(studentId);

        if (!project.getStudents().contains(student)) {
            throw new RuntimeException("Student is not in the project");
        }

        project.getStudents().remove(student);
        projectRepository.save(project);
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public void addStudentsToProject(Long projectId, List<Long> studentIds, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        for (Long studentId : studentIds) {
            User student = userService.getUserEntityById(studentId);
            if (!project.getStudents().contains(student)) {
                project.getStudents().add(student);
            }
        }

        projectRepository.save(project);
    }

    private ProjectResponseDTO convertToDTO(Project project) {
        ProjectResponseDTO dto = new ProjectResponseDTO();
        dto.setId(project.getId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        
        // ✅ CORRECTION : Rôle pour le superviseur
        if (project.getSupervisor() != null) {
            UserBasicDTO supervisorDTO = new UserBasicDTO();
            supervisorDTO.setId(project.getSupervisor().getId());
            supervisorDTO.setUsername(project.getSupervisor().getUsername());
            supervisorDTO.setEmail(project.getSupervisor().getEmail());
            supervisorDTO.setFirstName(project.getSupervisor().getFirstName());
            supervisorDTO.setLastName(project.getSupervisor().getLastName());
            // ✅ AJOUT DU RÔLE
            supervisorDTO.setRole(project.getSupervisor().getRole() != null ? project.getSupervisor().getRole().name() : null);
            dto.setSupervisor(supervisorDTO);
        }
        
        // ✅ CORRECTION : Rôle pour les étudiants
        if (project.getStudents() != null && !project.getStudents().isEmpty()) {
            List<UserBasicDTO> studentDTOs = project.getStudents().stream()
                    .map(student -> {
                        UserBasicDTO studentDTO = new UserBasicDTO();
                        studentDTO.setId(student.getId());
                        studentDTO.setUsername(student.getUsername());
                        studentDTO.setEmail(student.getEmail());
                        studentDTO.setFirstName(student.getFirstName());
                        studentDTO.setLastName(student.getLastName());
                        // ✅ AJOUT DU RÔLE
                        studentDTO.setRole(student.getRole() != null ? student.getRole().name() : null);
                        return studentDTO;
                    })
                    .collect(Collectors.toList());
            dto.setStudents(studentDTOs);
        }
        
        return dto;
    }
    
}

