package com.blogtec.aurixwebapi.dto;

public class ProjectSchemeDTO {

    private String username;
    private String password;
    private String context;
    private String location;
    private String location2;
    private int server_port;
    private int timeoutSeconds;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getLocation2() { return location2; }
    public void setLocation2(String location2) { this.location2 = location2; }

    public int getServer_port() { return server_port; }
    public void setServer_port(int server_port) { this.server_port = server_port; }
	public int getTimeoutSeconds() {  return timeoutSeconds;}
	  public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }	
		
}