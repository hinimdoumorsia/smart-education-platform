package com.iatd.smarthub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "ollama")
@Getter
@Setter
public class OllamaConfig {
    
    private Api api = new Api();
    private String modelName = "llama3.2:1b";
    private int timeoutMs = 30000;
    private int maxTokens = 1000;
    private double temperature = 0.7;
    private boolean debugEnabled = true;
    
    @Getter
    @Setter
    public static class Api {
        private String url = "http://localhost:11434";
    }
    
    public String getFullApiUrl() {
        return api.getUrl() + "/api/generate";
    }
    
    public String getTagsApiUrl() {
        return api.getUrl() + "/api/tags";
    }
    
    public String getGenerateUrl() {
        return api.getUrl() + "/api/generate";
    }
    
    @Override
    public String toString() {
        return String.format(
            "OllamaConfig{model='%s', url='%s', timeout=%dms, maxTokens=%d, temperature=%.2f}",
            modelName, api.url, timeoutMs, maxTokens, temperature
        );
    }
}

