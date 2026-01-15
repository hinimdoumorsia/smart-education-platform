package com.iatd.smarthub.controller.debug;

import com.iatd.smarthub.service.rag.RAGQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@Slf4j
public class FileDebugController {
    
    private final RAGQuizService ragQuizService;
    
    @GetMapping("/files/{courseId}")
    public Map<String, Object> testFileAccess(@PathVariable Long courseId) {
        log.info("🧪 Test accès fichiers pour courseId: {}", courseId);
        return ragQuizService.testFileAccess(courseId);
    }
    
    @GetMapping("/system")
    public Map<String, Object> systemDiagnostic() {
        log.info("🩺 Diagnostic système");
        return ragQuizService.getSystemDiagnostic();
    }
}