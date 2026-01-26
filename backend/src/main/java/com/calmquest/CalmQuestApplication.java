package com.calmquest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CalmQuestApplication {

	public static void main(String[] args) {
		SpringApplication.run(CalmQuestApplication.class, args);
	}

}
