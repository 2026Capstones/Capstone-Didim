package com.capstone.back.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "company")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "company_id", length = 36)
    private String companyId;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(name = "talent_type", length = 100)
    private String talentType;

    @Column(length = 200)
    private String culture;

    @Convert(converter = JsonConverter.class)
    @Column(name = "interview_types", columnDefinition = "TEXT")
    private Object interviewTypes;

    @Convert(converter = JsonConverter.class)
    @Column(name = "resume_questions", columnDefinition = "TEXT")
    private Object resumeQuestions;

    @Convert(converter = JsonConverter.class)
    @Column(name = "preferred_skills", columnDefinition = "TEXT")
    private Object preferred_skills;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
