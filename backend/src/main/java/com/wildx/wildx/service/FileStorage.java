package com.wildx.wildx.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.UUID;

@Component
public class FileStorage {
    private static final byte[] JPEG_START = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_START = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final Path root;

    public static String imageExtension(byte[] content) {
        if (startsWith(content, JPEG_START)) {
            return "jpg";
        }
        if (startsWith(content, PNG_START)) {
            return "png";
        }
        throw new IllegalArgumentException("Only JPEG and PNG images are accepted");
    }

    private static boolean startsWith(byte[] content, byte[] prefix) {
        return content.length >= prefix.length && Arrays.equals(content, 0, prefix.length, prefix, 0, prefix.length);
    }

    public FileStorage(@Value("${wildx.upload-dir:uploads}") String uploadDir) {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public String save(String folder, String extension, byte[] content) {
        Path target = inside(folder + "/" + UUID.randomUUID() + "." + extension);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content);
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not store file", ex);
        }
        return root.relativize(target).toString().replace('\\', '/');
    }

    public byte[] read(String relativePath) {
        try {
            return Files.readAllBytes(inside(relativePath));
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not read file", ex);
        }
    }

    private Path inside(String relativePath) {
        Path path = root.resolve(relativePath).normalize();
        if (!path.startsWith(root) || path.equals(root)) {
            throw new IllegalArgumentException("File path is outside the upload folder");
        }
        return path;
    }
}
