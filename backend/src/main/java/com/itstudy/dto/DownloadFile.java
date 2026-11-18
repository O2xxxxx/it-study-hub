package com.itstudy.dto;

import lombok.Data;

import java.nio.file.Path;

/** 下载流所需的文件信息。 */
@Data
public class DownloadFile {

    private String fileName;
    private String contentType;
    private long fileSize;
    private Path path;
}
