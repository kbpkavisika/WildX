package com.wildx.wildx.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void tooLargeUploadsReturn413WithErrorBody() {
        var response = handler.handleTooLarge(new MaxUploadSizeExceededException(5L * 1024 * 1024));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(response.getBody()).containsEntry("error", "File is too large");
    }

    @Test
    void missingMultipartPartsReturn400WithErrorBody() {
        var response = handler.handleRequestError(new MissingServletRequestPartException("image"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("error", "Invalid request payload or parameter");
    }
}
