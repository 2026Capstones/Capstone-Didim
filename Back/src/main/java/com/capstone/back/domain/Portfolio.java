package com.capstone.back.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Portfolio {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "portfolio_id", length = 36)
    private String portfolioId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(precision = 3, scale = 2)
    private BigDecimal gpa;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "TEXT")
    private Object awards;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "TEXT")
    private Object scholarships;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "TEXT")
    private Object volunteer;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "TEXT")
    private Object certifications;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "TEXT")
    private Object projects;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Convert(converter = JsonConverter.class)
    @Column(name = "additional_pdf_urls", columnDefinition = "TEXT")
    private Object additionalPdfUrls;

    public void updateData(java.math.BigDecimal gpa, Object awards, Object scholarships, Object volunteer, Object certifications, Object projects) {
        this.gpa = gpa;
        this.awards = awards;
        this.scholarships = scholarships;
        this.volunteer = volunteer;
        this.certifications = certifications;
        this.projects = projects;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateAdditionalPdfs(Object additionalPdfUrls) {
        this.additionalPdfUrls = additionalPdfUrls;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
