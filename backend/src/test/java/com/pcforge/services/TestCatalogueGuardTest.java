package com.pcforge.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.mongodb.client.MongoDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import java.util.Set;

class TestCatalogueGuardTest {
    @Test void enablesForExplicitProfileFlagAndIsolatedTestDatabaseWithoutRequiringPaymentKeys() {
        Environment environment = mock(Environment.class);
        MongoDatabaseFactory factory = mock(MongoDatabaseFactory.class);
        MongoDatabase database = mock(MongoDatabase.class);
        RazorpayGateway gateway = mock(RazorpayGateway.class);
        var activeProfiles = new java.util.HashSet<>(Set.of("test-catalog"));
        when(environment.acceptsProfiles(any(Profiles.class))).thenAnswer(call -> ((Profiles) call.getArgument(0)).matches(activeProfiles::contains));
        when(factory.getMongoDatabase()).thenReturn(database);
        when(database.getName()).thenReturn("pcforge_test");
        when(gateway.testModeConfigured()).thenReturn(false);

        assertTrue(new TestCatalogueGuard(environment, factory, gateway, true).isEnabled());
        assertFalse(new TestCatalogueGuard(environment, factory, gateway, false).isEnabled());
        when(database.getName()).thenReturn("pcforge");
        assertFalse(new TestCatalogueGuard(environment, factory, gateway, true).isEnabled());
        when(database.getName()).thenReturn("pcforge_test");
        activeProfiles.add("prod");
        assertFalse(new TestCatalogueGuard(environment, factory, gateway, true).isEnabled());
    }
}
