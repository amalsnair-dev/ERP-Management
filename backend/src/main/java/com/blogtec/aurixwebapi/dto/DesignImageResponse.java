package com.blogtec.aurixwebapi.dto;

import java.util.List;

public class DesignImageResponse {

    private int count;
    private List<String> images;

    public DesignImageResponse(int count, List<String> images) {
        this.count = count;
        this.images = images;
    }

    public int getCount() {
        return count;
    }

    public List<String> getImages() {
        return images;
    }
}