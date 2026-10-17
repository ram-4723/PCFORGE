package com.pcforge.controllers;

import com.pcforge.config.CorsConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HealthController.class)
@Import(CorsConfiguration.class)
@org.springframework.test.context.TestPropertySource(properties = "pcforge.mongodb-auditing.enabled=false")
class HealthControllerTest {
    @Autowired MockMvc mvc;
    @MockBean MongoTemplate mongo;
    @Test void healthReportsDatabaseConnectedOnlyAfterPing() throws Exception {
        when(mongo.executeCommand(any(org.bson.Document.class))).thenReturn(new org.bson.Document("ok", 1));
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true)).andExpect(jsonPath("$.data.database").value("connected"));
    }
    @Test void healthReportsUnavailableOnPingFailure() throws Exception {
        when(mongo.executeCommand(any(org.bson.Document.class))).thenThrow(new RuntimeException("private connection detail"));
        mvc.perform(get("/api/health")).andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.data.database").value("disconnected")).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("private"))));
    }
}
