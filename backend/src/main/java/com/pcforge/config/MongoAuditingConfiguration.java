package com.pcforge.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/** Enables createdAt/updatedAt auditing in the full app; MVC slices can disable it without Mongo beans. */
@Configuration
@EnableMongoAuditing
@ConditionalOnProperty(name = "pcforge.mongodb-auditing.enabled", havingValue = "true", matchIfMissing = true)
public class MongoAuditingConfiguration {
}
