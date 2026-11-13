package com.blogtec.aurixwebapi.config.db;

import com.blogtec.aurixwebapi.config.DynamicDBConnection;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDate;

@Component
public class DatabaseRoutingFilter extends OncePerRequestFilter {

    @SuppressWarnings("null")
	@Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String yearStr = request.getParameter("year");
        if (yearStr == null || yearStr.trim().isEmpty()) {
            yearStr = request.getHeader("X-Year");
        }
        if (yearStr == null || yearStr.trim().isEmpty()) {
            yearStr = request.getHeader("year");
        }

        String defaultDb = DynamicDBConnection.getDefaultDatabaseName();

        if (yearStr != null && !yearStr.trim().isEmpty()) {
            try {
                int year = Integer.parseInt(yearStr.trim());
                int currentYear = LocalDate.now().getYear();

                if (year == currentYear) {
                    DynamicDBConnection.setCurrentDatabase(defaultDb);
                } else {
                    DynamicDBConnection.setCurrentDatabase(defaultDb + year);
                }
            } catch (NumberFormatException e) {
                // In case of invalid year format, fallback to default database
                DynamicDBConnection.setCurrentDatabase(defaultDb);
            }
        } else {
            // Default to configured database when no year is specified
            DynamicDBConnection.setCurrentDatabase(defaultDb);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Crucial context cleanup to prevent ThreadLocal pollution in pool threads
            DynamicDBConnection.clear();
        }
    }
}
