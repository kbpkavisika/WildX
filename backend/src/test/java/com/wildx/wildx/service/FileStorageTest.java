package com.wildx.wildx.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.assertj.core.api.Assertions.*;

class FileStorageTest {
    @TempDir
    Path uploads;

    @Test
    void savesUnderGeneratedNameAndReadsBack() throws Exception {
        FileStorage storage = new FileStorage(uploads.toString());
        String path = storage.save("camera/CAM-001", "jpg", new byte[] {1, 2, 3});
        assertThat(path).startsWith("camera/CAM-001/").endsWith(".jpg").doesNotContain("\\");
        assertThat(Files.readAllBytes(uploads.resolve(path))).containsExactly(1, 2, 3);
        assertThat(storage.read(path)).containsExactly(1, 2, 3);
        assertThat(storage.save("camera/CAM-001", "jpg", new byte[] {1})).isNotEqualTo(path);
    }

    @Test
    void neverReadsOrWritesOutsideTheUploadFolder() {
        FileStorage storage = new FileStorage(uploads.toString());
        assertThatThrownBy(() -> storage.read("../secret.txt")).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("File path is outside the upload folder");
        assertThatThrownBy(() -> storage.read("camera/../../secret.txt")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.read(".")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.save("..", "jpg", new byte[] {1})).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void missingFilesAndUnwritableFoldersFailClearly() throws Exception {
        FileStorage storage = new FileStorage(uploads.toString());
        assertThatThrownBy(() -> storage.read("camera/missing.jpg")).isInstanceOf(UncheckedIOException.class)
                .hasMessage("Could not read file");
        Files.writeString(uploads.resolve("blocked"), "a file, not a folder");
        assertThatThrownBy(() -> storage.save("blocked", "jpg", new byte[] {1})).isInstanceOf(UncheckedIOException.class)
                .hasMessage("Could not store file");
    }
}
