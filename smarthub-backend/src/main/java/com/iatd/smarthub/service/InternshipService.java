package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.InternshipRequestDTO;
import com.iatd.smarthub.dto.InternshipResponseDTO;
import com.iatd.smarthub.model.internship.Internship;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.InternshipRepository;
import com.iatd.smarthub.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class InternshipService {

    private static final Logger log = LoggerFactory.getLogger(InternshipService.class);

    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;
    private final UserService userService; // ✅ Ajout pour getUserEntityByUsername

    public InternshipService(InternshipRepository internshipRepository, UserRepository userRepository, UserService userService) {
        this.internshipRepository = internshipRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // ✅ MODIFIÉ : Ajout du paramètre username pour l'enseignant connecté
    public InternshipResponseDTO createInternship(InternshipRequestDTO internshipRequest, String username) {
        log.info("Creating new internship: {}", internshipRequest.getTitle());

        // Vérifier que l'étudiant existe
        User student = userRepository.findById(internshipRequest.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + internshipRequest.getStudentId()));

        // ✅ CORRECTION : Gérer supervisorId optionnel
        User supervisor;
        if (internshipRequest.getSupervisorId() != null) {
            // Si supervisorId est fourni, l'utiliser
            supervisor = userRepository.findById(internshipRequest.getSupervisorId())
                    .orElseThrow(() -> new RuntimeException("Supervisor not found with id: " + internshipRequest.getSupervisorId()));
        } else {
            // Sinon, utiliser l'enseignant connecté par défaut
            supervisor = userService.getUserEntityByUsername(username);
        }

        // Créer le stage
        Internship internship = new Internship();
        internship.setTitle(internshipRequest.getTitle());
        internship.setDescription(internshipRequest.getDescription());
        internship.setStudent(student);
        internship.setSupervisor(supervisor); // ✅ Assigné correctement
        internship.setCompany(internshipRequest.getCompany());
        internship.setStartDate(internshipRequest.getStartDate());
        internship.setEndDate(internshipRequest.getEndDate());
        internship.setStatus(internshipRequest.getStatus() != null ? internshipRequest.getStatus()
                : Internship.InternshipStatus.PLANNED);

        Internship savedInternship = internshipRepository.save(internship);
        return new InternshipResponseDTO(savedInternship);
    }

    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> getAllInternships() {
        log.debug("Fetching all internships");
        return internshipRepository.findAll()
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<InternshipResponseDTO> getInternshipById(Long id) {
        log.debug("Fetching internship by id: {}", id);
        return internshipRepository.findById(id)
                .map(InternshipResponseDTO::new);
    }

    // ✅ NOUVEAU : Récupérer les stages par username de l'étudiant
    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> getInternshipsByStudentUsername(String username) {
        User student = userService.getUserEntityByUsername(username);
        return internshipRepository.findByStudent(student)
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ NOUVEAU : Récupérer les stages par username du superviseur
    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> getInternshipsBySupervisorUsername(String username) {
        User supervisor = userService.getUserEntityByUsername(username);
        return internshipRepository.findBySupervisor(supervisor)
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ Garder l'ancienne méthode pour compatibilité
    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> getInternshipsByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        return internshipRepository.findByStudent(student)
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ Garder l'ancienne méthode pour compatibilité
    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> getInternshipsBySupervisor(Long supervisorId) {
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found with id: " + supervisorId));
        return internshipRepository.findBySupervisor(supervisor)
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> getInternshipsByCompany(String company) {
        return internshipRepository.findByCompanyContainingIgnoreCase(company)
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> getInternshipsByStatus(Internship.InternshipStatus status) {
        return internshipRepository.findByStatus(status)
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> getActiveInternships() {
        return internshipRepository.findActiveInternships()
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public InternshipResponseDTO updateInternship(Long id, InternshipRequestDTO internshipDetails, String username) {
        log.info("Updating internship with id: {}", id);

        Internship existingInternship = internshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Internship not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est le superviseur du stage
        User currentUser = userService.getUserEntityByUsername(username);
        if (!existingInternship.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce stage");
        }

        // Mettre à jour les champs
        existingInternship.setTitle(internshipDetails.getTitle());
        existingInternship.setDescription(internshipDetails.getDescription());
        existingInternship.setCompany(internshipDetails.getCompany());
        existingInternship.setStartDate(internshipDetails.getStartDate());
        existingInternship.setEndDate(internshipDetails.getEndDate());
        existingInternship.setStatus(internshipDetails.getStatus());

        // Mettre à jour l'étudiant si fourni
        if (internshipDetails.getStudentId() != null) {
            User student = userRepository.findById(internshipDetails.getStudentId())
                    .orElseThrow(() -> new RuntimeException(
                            "Student not found with id: " + internshipDetails.getStudentId()));
            existingInternship.setStudent(student);
        }

        Internship updatedInternship = internshipRepository.save(existingInternship);
        return new InternshipResponseDTO(updatedInternship);
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public void deleteInternship(Long id, String username) {
        log.info("Deleting internship with id: {}", id);

        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Internship not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est le superviseur du stage
        User currentUser = userService.getUserEntityByUsername(username);
        if (!internship.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce stage");
        }

        internshipRepository.delete(internship);
    }

    @Transactional(readOnly = true)
    public List<InternshipResponseDTO> searchInternships(String query) {
        return internshipRepository.searchInternships(query)
                .stream()
                .map(InternshipResponseDTO::new)
                .collect(Collectors.toList());
    }
}
