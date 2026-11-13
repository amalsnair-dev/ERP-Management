package com.blogtec.aurixwebapi.dynamic;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.Tuple;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@SuppressWarnings("unchecked")
public class DynamicQueryService 
{

	private static final Logger logger = LoggerFactory.getLogger(DynamicQueryService.class);

	@PersistenceContext
	private EntityManager entityManager;

	/**
	 * Restricted SQL Keywords
	 */
	private static final Pattern RESTRICTED_PATTERN = Pattern.compile(
			"(?is).*\\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|replace|merge|call|execute|do|copy|commit|rollback|set|lock|vacuum|reindex|analyze|cluster|pg_sleep|pg_terminate_backend|lo_export|lo_import)\\b.*");

	/**
	 * Validate Query
	 */
	private void validateQuery(String userQuery) {

		if (userQuery == null || userQuery.trim().isEmpty()) {

			throw new IllegalArgumentException("Query cannot be empty");
		}

		String lowerQuery = userQuery.toLowerCase().trim();

		// Allow only SELECT query
		if (!lowerQuery.startsWith("select")) {

			throw new IllegalArgumentException("Only SELECT queries are allowed");
		}

		// Restricted keyword validation
		if (RESTRICTED_PATTERN.matcher(lowerQuery).matches()) {

			throw new IllegalArgumentException("Restricted SQL keyword detected");
		}
	}

	/**
	 * Set Parameters
	 */
	private void setParameters(Query query, Map<String, Object> params) {

		if (params != null && !params.isEmpty()) {

			params.forEach(query::setParameter);
		}
	}

	/**
	 * Query Valid Check Data exists = true No data = false
	 */
	
	public boolean isQueryValid(String userQuery, Map<String, Object> params) {

		try 
		{

			validateQuery(userQuery);

			Query query = entityManager.createNativeQuery(userQuery).setHint("jakarta.persistence.query.timeout",
					10000);

			setParameters(query, params);

			query.setMaxResults(1);

			List<?> result = query.getResultList();

			return result != null && !result.isEmpty();

		}
		catch (Exception e) 
		{
			logger.warn("Query Validation Failed : {}", e.getMessage());
			return false;
		}
	}

	/**
	 * Select JSON
	 */
	public String runSelectJson(String userQuery, Map<String, Object> params) {

		try {

			validateQuery(userQuery);

			String finalQuery = "SELECT COALESCE(json_agg(t), '[]') " + "FROM (" + userQuery + ") t";

			Query query = entityManager.createNativeQuery(finalQuery).setHint("jakarta.persistence.query.timeout",
					15000);

			setParameters(query, params);

			Object result = query.getSingleResult();

			return result != null ? result.toString() : "[]";

		} catch (Exception e) {

			logger.error("JSON Query Error : {}", e.getMessage());

			return """
					{
					    "success": false,
					    "error": "%s"
					}
					""".formatted(e.getMessage().replace("\"", "\\\""));
		}
	}

	/**
	 * Single Object
	 */
	public Map<String, Object> runSelectSingle(String userQuery, Map<String, Object> params) {

		try {

			validateQuery(userQuery);

			String finalQuery = "SELECT * FROM (" + userQuery + ") t LIMIT 1";

			Query query = entityManager.createNativeQuery(finalQuery, Tuple.class)
					.setHint("jakarta.persistence.query.timeout", 15000);

			setParameters(query, params);

			List<Tuple> results = query.getResultList();

			if (results.isEmpty()) {

				return Map.of("success", false, "message", "No Data Found");
			}

			Tuple tuple = results.get(0);

			Map<String, Object> map = new HashMap<>();

			tuple.getElements().forEach(element -> {

				String alias = element.getAlias();

				map.put(alias, tuple.get(alias));
			});

			map.put("success", true);

			return map;

		} catch (Exception e) {

			logger.error("Single Object Query Error : {}", e.getMessage());

			return Map.of("success", false, "error", e.getMessage());
		}
	}

	/**
	 * Auto Report
	 */
	public Map<String, Object> getReportAuto(String sql, String providedTableName, Map<String, Object> params) {

		try {

			validateQuery(sql);

			Query query = entityManager.createNativeQuery(sql, Tuple.class).setHint("jakarta.persistence.query.timeout",
					15000);

			setParameters(query, params);

			List<Tuple> tuples = query.getResultList();

			List<Map<String, Object>> result = new ArrayList<>();

			for (Tuple t : tuples) {

				Map<String, Object> row = new HashMap<>();

				t.getElements().forEach(e ->

				row.put(e.getAlias(), t.get(e)));

				result.add(row);
			}

			String tableName;

			if (providedTableName != null && !providedTableName.trim().isEmpty()) {

				tableName = providedTableName.trim();

			} else {

				tableName = extractTableName(sql);
			}

			return Map.of("success", true, tableName, result);

		} catch (Exception e) {

			logger.error("Report Query Error : {}", e.getMessage());

			return Map.of("success", false, "error", e.getMessage());
		}
	}

	/**
	 * Extract Table Name
	 */
	private String extractTableName(String sql) {

		try {

			String lowerSql = sql.toLowerCase();

			int fromIndex = lowerSql.indexOf(" from ");

			if (fromIndex == -1) {

				return "data";
			}

			String afterFrom = sql.substring(fromIndex + 6).trim();

			String tableName = afterFrom.split("[\\s,;()]+")[0];

			if (tableName.contains(".")) {

				tableName = tableName.substring(tableName.lastIndexOf(".") + 1);
			}

			return tableName;

		} catch (Exception e) {

			logger.warn("Table Name Extract Failed : {}", e.getMessage());

			return "data";
		}
	}

	// --- YEAR-BASED METHODS ---

	private void switchDatabaseForYear(String year) {
		if (year == null || year.trim().isEmpty()) {
			return;
		}

		String currentDbYear = "";
		try {
			Query query = entityManager.createNativeQuery("select value from company c where key='year'");
			query.setMaxResults(1);
			Object result = query.getSingleResult();
			if (result != null) {
				currentDbYear = result.toString().trim();
			}
		} catch (Exception e) {
			logger.warn("Failed to get current year from db: {}", e.getMessage());
		}

		if (!year.trim().equals(currentDbYear)) 
		{
			com.blogtec.aurixwebapi.config.DynamicDBConnection.setCurrentDatabase(
					com.blogtec.aurixwebapi.config.DynamicDBConnection.getDefaultDatabaseName() + year.trim());
		}
	}

	public boolean isQueryValidYear(String userQuery, Map<String, Object> params, String year) {
		String oldDb = com.blogtec.aurixwebapi.config.DynamicDBConnection.getCurrentDatabase();
		try {
			switchDatabaseForYear(year);
			return isQueryValid(userQuery, params);
		} finally
		{
			com.blogtec.aurixwebapi.config.DynamicDBConnection.setCurrentDatabase(oldDb);
		}
	}

	public String runSelectJsonYear(String userQuery, Map<String, Object> params, String year) {
		String oldDb = com.blogtec.aurixwebapi.config.DynamicDBConnection.getCurrentDatabase();
		try {
			switchDatabaseForYear(year);
			return runSelectJson(userQuery, params);
		} finally {
			com.blogtec.aurixwebapi.config.DynamicDBConnection.setCurrentDatabase(oldDb);
		}
	}

	public Map<String, Object> runSelectSingleYear(String userQuery, Map<String, Object> params, String year) {
		String oldDb = com.blogtec.aurixwebapi.config.DynamicDBConnection.getCurrentDatabase();
		try {
			switchDatabaseForYear(year);
			return runSelectSingle(userQuery, params);
		} finally {
			com.blogtec.aurixwebapi.config.DynamicDBConnection.setCurrentDatabase(oldDb);
		}
	}

	public Map<String, Object> getReportAutoYear(String sql, String providedTableName, Map<String, Object> params, String year) {
		String oldDb = com.blogtec.aurixwebapi.config.DynamicDBConnection.getCurrentDatabase();
		try {
			switchDatabaseForYear(year);
			return getReportAuto(sql, providedTableName, params);
		} finally {
			com.blogtec.aurixwebapi.config.DynamicDBConnection.setCurrentDatabase(oldDb);
		}
	}
}