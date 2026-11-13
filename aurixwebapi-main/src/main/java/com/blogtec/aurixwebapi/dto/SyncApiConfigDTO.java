package com.blogtec.aurixwebapi.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SyncApiConfigDTO {

	   private SyncApiDTO projectsync;

	   private SyncApiDTO projectsyncapi;

	    public SyncApiDTO getProjectsync() {
	        return projectsync;
	    }

	    public void setProjectsync(SyncApiDTO projectsync) {
	        this.projectsync = projectsync;
	    }

	    public SyncApiDTO getProjectsyncapi() {
	        return projectsyncapi;
	    }

	    public void setProjectsyncapi(SyncApiDTO projectsyncapi) {
	        this.projectsyncapi = projectsyncapi;
	    }
}

