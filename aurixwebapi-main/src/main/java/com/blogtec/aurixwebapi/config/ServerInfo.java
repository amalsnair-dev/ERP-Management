package com.blogtec.aurixwebapi.config;

import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.net.InetAddress;

@Component
public class ServerInfo {

    private static String serverIp;
    private static int serverPort;

    @EventListener
    public void onWebServerInitialized(WebServerInitializedEvent event) {
        serverPort = event.getWebServer().getPort();
        

        try {
            serverIp = InetAddress.getLocalHost().getHostAddress();
        } catch (Exception e) {
            serverIp = "127.0.0.1";
        }
    }

    public static String getServerIp() {
        return serverIp;
    }

    public static int getServerPort() {
        return serverPort;
    }
}
