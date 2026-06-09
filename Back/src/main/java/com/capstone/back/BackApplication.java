package com.capstone.back;

import com.capstone.back.domain.Role;
import com.capstone.back.domain.User;
import com.capstone.back.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@SpringBootApplication
public class BackApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Admin 계정 생성 또는 업데이트
            createOrUpdateUser(userRepository, passwordEncoder, "admin-001", "admin@didim.com", "password", "관리자", Role.admin);

            // Student 계정 생성 또는 업데이트
            createOrUpdateUser(userRepository, passwordEncoder, "student-001", "student@didim.com", "password", "김철수", Role.student);

            System.out.println(">>> Test accounts initialized: admin@didim.com / student@didim.com (password: password)");
        };
    }

    private void createOrUpdateUser(UserRepository repo, PasswordEncoder encoder, String id, String email, String password, String name, Role role) {
        repo.findByEmail(email).ifPresentOrElse(
            user -> {
                // 이미 존재하면 비밀번호만 최신화 (테스트 편의성)
                User updatedUser = User.builder()
                        .userId(user.getUserId())
                        .email(user.getEmail())
                        .password(encoder.encode(password))
                        .name(name)
                        .role(role)
                        .createdAt(user.getCreatedAt())
                        .build();
                repo.save(updatedUser);
            },
            () -> {
                // 없으면 새로 생성
                User newUser = User.builder()
                        .userId(id)
                        .email(email)
                        .password(encoder.encode(password))
                        .name(name)
                        .role(role)
                        .createdAt(LocalDateTime.now())
                        .build();
                repo.save(newUser);
            }
        );
    }
}
