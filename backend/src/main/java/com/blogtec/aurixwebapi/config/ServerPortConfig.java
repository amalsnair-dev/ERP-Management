package com.blogtec.aurixwebapi.config;

import com.blogtec.aurixwebapi.dto.ProjectSchemeConfigDTO;
import com.blogtec.aurixwebapi.dto.ProjectSchemeDTO;
import com.blogtec.aurixwebapi.dto.SyncApiConfigDTO;
import com.blogtec.aurixwebapi.dto.SyncApiDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class ServerPortConfig {

    private static ProjectSchemeDTO config;
    private static SyncApiDTO config1;

    static {
        try {

            ObjectMapper mapper = new ObjectMapper();

            ClassPathResource resource =
                    new ClassPathResource("config/projectscheme.json");

            ProjectSchemeConfigDTO root = mapper.readValue(
                    resource.getInputStream(),
                    ProjectSchemeConfigDTO.class
            );

            config = root.getProjectscheme();

        } catch (Exception e) {
            throw new RuntimeException("Failed to load projectscheme.json", e);
        }
    }
    
    static {
    	try {
    		
    		ObjectMapper mapper = new ObjectMapper();
    		
    		ClassPathResource resource =
    				new ClassPathResource("config/sync.json");
    		
    		SyncApiConfigDTO root = mapper.readValue(
    				resource.getInputStream(),
    				SyncApiConfigDTO.class
    				);
    		
    		config1 = root.getProjectsyncapi();
    		
    	} catch (Exception e) {
    		throw new RuntimeException("Failed to load projectscheme.json", e);
    	}
    }

    public static int getServerPort() {
        return config.getServer_port();
    }

    public static String getProjectSchemeIp() {
        return config.getLocation();
    }

    public static String getProjectSchemeContext() {
        return config.getContext();
    }

    public static String getUsername() {
        return config.getUsername();
    }

    public static String getPassword() {
        return config.getPassword();
    }

	public static int getTimeoutSeconds() {
		return  config.getTimeoutSeconds();
	}

	// ==========================================
	// 🔗 SyncApi (projectsyncapi) getters
	// ==========================================
	public static String getSyncApiIp() {
		return config1 != null ? config1.getLocation() : null;
	}

	public static String getSyncApiContext() {
		return config1 != null ? config1.getContext() : null;
	}

	public static int getSyncApiPort() {
		return config1 != null ? config1.getServer_port() : 8080;
	}

	public static String getSyncApiUsername() {
		return config1 != null ? config1.getUsername() : null;
	}

	public static String getSyncApiPassword() {
		return config1 != null ? config1.getPassword() : null;
	}

	public static int getSyncApiTimeoutSeconds() {
		return config1 != null ? config1.getTimeoutSeconds() : 30;
	}
}