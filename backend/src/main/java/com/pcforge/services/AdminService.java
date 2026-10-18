package com.pcforge.services;

import com.pcforge.dto.Pagination;
import com.pcforge.dto.AdminUserSummary;
import com.pcforge.exception.ApiException;
import com.pcforge.models.UserAccount;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    public record Overview(long totalRegisteredUsers) { }
    public record UserPage(List<AdminUserSummary> users, Pagination pagination) { }
    private final AuthService auth;
    private final MongoTemplate mongo;

    public AdminService(AuthService auth, MongoTemplate mongo) { this.auth = auth; this.mongo = mongo; }

    public Overview overview(String authorization) {
        auth.requireAdmin(authorization);
        return new Overview(mongo.count(new Query(), UserAccount.class));
    }

    public UserPage users(String authorization, int page, int size, String search) {
        auth.requireAdmin(authorization);
        if (page < 1 || size < 1 || size > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PAGINATION", "page must be at least 1 and size must be between 1 and 100.");
        if (search != null && search.length() > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SEARCH", "Search must be 100 characters or fewer.");
        Criteria criteria = Criteria.where("role").is("USER");
        if (search != null && !search.isBlank()) {
            String safeSearch = Pattern.quote(search.trim());
            criteria = new Criteria().andOperator(criteria, new Criteria().orOperator(
                    Criteria.where("name").regex(safeSearch, "i"),
                    Criteria.where("email").regex(safeSearch, "i")));
        }
        Query query = Query.query(criteria).with(PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "registeredAt")));
        long total = mongo.count(Query.query(criteria), UserAccount.class);
        List<AdminUserSummary> results = mongo.find(query, UserAccount.class).stream().map(AdminUserSummary::from).toList();
        int pages = total == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new UserPage(results, new Pagination(page, size, total, pages));
    }
}
