package com.pcforge.services;

import com.mongodb.client.MongoDatabase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.stereotype.Component;

/** Fail-closed gate for the isolated, non-production payment test catalogue. */
@Component
public class TestCatalogueGuard {
    private final Environment environment;
    private final MongoDatabaseFactory databaseFactory;
    private final RazorpayGateway gateway;
    private final boolean explicitlyEnabled;

    public TestCatalogueGuard(Environment environment, MongoDatabaseFactory databaseFactory, RazorpayGateway gateway,
                              @Value("${pcforge.test-catalog.enabled:false}") boolean explicitlyEnabled) {
        this.environment = environment;
        this.databaseFactory = databaseFactory;
        this.gateway = gateway;
        this.explicitlyEnabled = explicitlyEnabled;
    }

    public boolean isEnabled() {
        // Catalogue access is intentionally independent of payment credentials. This lets
        // local development reach the server-priced order review before Razorpay is configured.
        // Payment creation still requires test keys in RazorpayGateway.
        if (!explicitlyEnabled || !environment.acceptsProfiles(Profiles.of("test-catalog"))
                || environment.acceptsProfiles(Profiles.of("prod", "production"))) return false;
        try {
            MongoDatabase database = databaseFactory.getMongoDatabase();
            return "pcforge_test".equals(database.getName());
        } catch (RuntimeException unavailable) {
            return false;
        }
    }

    /** Public readiness flag only; never exposes either credential. */
    public boolean paymentsEnabled() { return gateway.testModeConfigured(); }

    public void requireEnabled() {
        if (!isEnabled()) throw new IllegalStateException("Test catalogue requires the test-catalog profile, PCFORGE_TEST_CATALOG_ENABLED=true, and database pcforge_test.");
    }
}
