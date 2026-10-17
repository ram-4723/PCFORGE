package com.pcforge.repositories;

import com.pcforge.models.PCBuild;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PCBuildRepository extends MongoRepository<PCBuild, String> {
    Optional<PCBuild> findByIdAndSessionTokenHash(String id, String sessionTokenHash);
}
