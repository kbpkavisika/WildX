package com.wildx.wildx.config;

import org.springframework.context.annotation.*;
import java.time.Clock;

@Configuration
public class PatrolConfig {
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}

