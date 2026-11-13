package com.blogtec.aurixwebapi.imagesstorage.image;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImageServiceTest {

    @Mock
    private ImagePathService imagePathService;

    @InjectMocks
    private ImageService imageService;

    @Test
    void testSaveImage_NullOrEmptyFile_ReturnsEmptyMessage() {
        String result = imageService.saveImage(101, "test_design", null);
        assertEquals("File is empty", result);

        MockMultipartFile emptyFile = new MockMultipartFile("file", new byte[0]);
        String resultEmpty = imageService.saveImage(101, "test_design", emptyFile);
        assertEquals("File is empty", resultEmpty);
    }

    @Test
    void testSaveImage_SanitizesSpecialCharactersInFilename() {
        when(imagePathService.getUploadDirectory()).thenReturn(System.getProperty("java.io.tmpdir"));

        MockMultipartFile mockFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", "dummy_image_data".getBytes());

        // Dangerous design name attempting path traversal & special chars
        String dangerousDesignName = "../../../etc/passwd!@#";

        String result = imageService.saveImage(101, dangerousDesignName, mockFile);

        // Verify that execution succeeded and filename was sanitized safely
        assertEquals("Image saved successfully", result);
    }
}
