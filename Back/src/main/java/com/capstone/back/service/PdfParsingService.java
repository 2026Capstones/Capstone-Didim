package com.capstone.back.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
public class PdfParsingService {

    /**
     * MultipartFile로부터 PDF 텍스트를 추출합니다.
     * @param file 업로드된 PDF 파일
     * @return 추출된 텍스트 문자열
     * @throws IOException 파일 처리 중 발생한 예외
     */
    public String extractText(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        log.info("PDF 텍스트 추출 시작: {}", file.getOriginalFilename());

        try (InputStream is = file.getInputStream();
             PDDocument document = PDDocument.load(is)) {
            
            PDFTextStripper stripper = new PDFTextStripper();
            // 페이지 순서대로 텍스트 추출 설정 (필요시 true)
            stripper.setSortByPosition(true);
            
            String text = stripper.getText(document);
            log.info("PDF 텍스트 추출 완료 (길이: {}자)", text.length());
            
            return text;
        } catch (IOException e) {
            log.error("PDF 파싱 중 오류 발생: {}", e.getMessage());
            throw new IOException("PDF 파일에서 텍스트를 추출하는 데 실패했습니다.", e);
        }
    }

    /**
     * 특정 바이트 배열로부터 PDF 텍스트를 추출합니다. (기존 저장된 파일 처리용)
     */
    public String extractTextFromBytes(byte[] bytes) throws IOException {
        try (PDDocument document = PDDocument.load(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
}
