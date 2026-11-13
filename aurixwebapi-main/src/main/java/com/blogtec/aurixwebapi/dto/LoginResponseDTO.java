package com.blogtec.aurixwebapi.dto;

import java.util.List;

import com.blogtec.aurixwebapi.frame.Frameentity;

public class LoginResponseDTO {
    private String username;
    private List<String> roles;
    private List<Frameentity> frames;
    private List<String> shops;

    public LoginResponseDTO(String username, List<String> roles, List<Frameentity> frames, List<String> shops) {
        this.username = username;
        this.roles = roles;
        this.frames = frames;
        this.shops = shops;
    }

    public String getUsername() {
        return username;
    }

    public List<String> getRoles() {
        return roles;
    }

    public List<Frameentity> getFrames() {
        return frames;
    }

    public List<String> getShops() {
        return shops;
    }
}
