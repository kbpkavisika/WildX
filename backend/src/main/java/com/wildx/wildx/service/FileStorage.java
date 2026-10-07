package com.wildx.wildx.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Component
public class FileStorage {
    private final Path root;

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
