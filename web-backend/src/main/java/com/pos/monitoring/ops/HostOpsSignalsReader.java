package com.pos.monitoring.ops;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Host-level ops signals: backup freshness and disk usage on a mounted path.
 */
@Slf4j
@Component
public class HostOpsSignalsReader {

  private static final String BACKUP_GLOB = "pos_db_*.sql.gz";

  @Value("${ops.backup.dir:}")
  private String backupDir;

  @Value("${ops.disk.check-path:}")
  private String diskCheckPath;

  @Value("${ops.disk.warn-percent:85}")
  private int diskWarnPercent;

  public boolean isBackupDirConfigured() {
    return backupDir != null && !backupDir.isBlank();
  }

  public Optional<BackupSnapshot> latestBackup() {
    if (!isBackupDirConfigured()) {
      return Optional.empty();
    }
    Path dir = Path.of(backupDir.trim());
    if (!Files.isDirectory(dir)) {
      return Optional.empty();
    }
    try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, BACKUP_GLOB)) {
      List<Path> files = new ArrayList<>();
      for (Path path : stream) {
        if (Files.isRegularFile(path)) {
          files.add(path);
        }
      }
      return files.stream()
          .max(Comparator.comparing(this::lastModifiedSafe))
          .map(BackupSnapshot::of);
    } catch (IOException e) {
      log.warn("Cannot read backup dir {}: {}", dir, e.getMessage());
      return Optional.empty();
    }
  }

  public Optional<Integer> diskUsedPercent() {
    if (diskCheckPath == null || diskCheckPath.isBlank()) {
      return Optional.empty();
    }
    Path path = Path.of(diskCheckPath.trim());
    if (!Files.exists(path)) {
      return Optional.empty();
    }
    try {
      long total = path.toFile().getTotalSpace();
      long usable = path.toFile().getUsableSpace();
      if (total <= 0) {
        return Optional.empty();
      }
      long used = total - usable;
      return Optional.of((int) Math.min(100, Math.round(used * 100.0 / total)));
    } catch (Exception e) {
      log.warn("Cannot read disk usage for {}: {}", path, e.getMessage());
      return Optional.empty();
    }
  }

  public int diskWarnPercent() {
    return diskWarnPercent;
  }

  private Instant lastModifiedSafe(Path file) {
    try {
      FileTime time = Files.getLastModifiedTime(file);
      return time.toInstant();
    } catch (IOException e) {
      return Instant.EPOCH;
    }
  }

  public record BackupSnapshot(String fileName, long ageHours) {
    public static BackupSnapshot of(Path file) {
      try {
        long ageH = Duration.between(Files.getLastModifiedTime(file).toInstant(), Instant.now()).toHours();
        return new BackupSnapshot(file.getFileName().toString(), Math.max(0, ageH));
      } catch (IOException e) {
        return new BackupSnapshot(file.getFileName().toString(), -1);
      }
    }
  }
}
