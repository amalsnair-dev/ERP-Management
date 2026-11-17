package com.blogtec.aurixwebapi.configuration;

import org.springframework.http.HttpStatus;

public class RemoteBranchException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private final HttpStatus status;
    private final String shopcode;
    private final String path;
    private final String url;

    public RemoteBranchException(String message, HttpStatus status, String shopcode, String path, String url) {
        super(message);
        this.status = status;
        this.shopcode = shopcode;
        this.path = path;
        this.url = url;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getShopcode() {
        return shopcode;
    }

    public String getPath() {
        return path;
    }

    public String getUrl() {
        return url;
    }
}
