package com.blogtec.aurixwebapi.imagesstorage.image;

import org.springframework.stereotype.Service;

@Service
public class ImagePathService {

    private final ImagePathRepository repository;

    public ImagePathService(ImagePathRepository repository) {
        this.repository = repository;
    }

    public String getUploadDirectory() {

        String serverPath = repository.getServerPath();
        String folderName = repository.getImageFolder();

        return serverPath.toLowerCase() + "/" + folderName.toLowerCase();
    }
}