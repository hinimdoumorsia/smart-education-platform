package com.iatd.smarthub.dto;

import java.time.LocalDateTime;
import com.iatd.smarthub.dto.CourseListDTO; // AJOUTEZ CET IMPORT

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseListDTO {
    private Long id;
    private String title;
    private String description;
    private Long teacherId;
    private String teacherName;
    private LocalDateTime createdDate;
    private Integer studentCount;
    private Integer fileCount;
}
