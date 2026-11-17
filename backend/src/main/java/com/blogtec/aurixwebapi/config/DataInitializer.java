package com.blogtec.aurixwebapi.config;

import com.blogtec.aurixwebapi.apiuser.ApiUser;
import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.dto.FrameDTO;
import com.blogtec.aurixwebapi.dto.RoleDTO;
import com.blogtec.aurixwebapi.frame.FrameRepository;
import com.blogtec.aurixwebapi.frame.Frameentity;
import com.blogtec.aurixwebapi.role.Role;
import com.blogtec.aurixwebapi.role.RoleRepository;
import com.blogtec.aurixwebapi.user.User;
import com.blogtec.aurixwebapi.user.UserRepository;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.giftmaster.GiftMasterService;
import com.blogtec.aurixwebapi.heating.HeatingServ;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FrameRepository frameRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ApiUserService apiUserService;

    @Value("${system.user.name}")
    private String username;

    @Value("${system.user.password}")
    private String password;

    @Autowired
    private UserService userService;

    @Autowired
    private GiftMasterService giftMasterService;

    @Autowired
    private HeatingServ heatingServ;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${app.init.enabled:false}")
    private boolean initEnabled;

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void run(String... args) {
        // Table creation should always run on app startup if table doesn't exist
        try {
            log.info("🔨 Checking and initializing gift_master table...");
            giftMasterService.createTable();

            log.info("🔨 Checking and initializing gold_heat_mstr table...");
            heatingServ.createGoldHeatMstrTable();
        } catch (Exception e) {
            log.error("❌ Failed to initialize tables", e);
        }

        if (!initEnabled) {
            log.info("⏭️ Data Initialization Skipped (app.init.enabled=false)");
            return;
        }

        try {
            log.info("🚀 Data Initialization Started...");

            loadRoles();
            syncFrames();
            createAdminIfNotExists();
            createProjectSchemeUserIfNotExists();
            createNidhinUserIfNotExists();

            loadSetDiscountDefaults();
            loadSummaryMasterDefaults();

            log.info("✅ Data Initialization Completed");
        } catch (Exception e) {
            log.error("❌ Initialization Failed", e);
        }
    }

    private void loadSummaryMasterDefaults() {
        try {
            List<Boolean> oldModelFlags = jdbcTemplate.query(
                    "SELECT flag FROM setdiscount WHERE details = 'CASH SUMMARY OLD MODEL' AND flag = true",
                    (rs, rowNum) -> rs.getBoolean("flag"));
            if (!oldModelFlags.isEmpty() && Boolean.TRUE.equals(oldModelFlags.get(0))) {
                log.info(
                        "ℹ CASH SUMMARY OLD MODEL is enabled - Clearing summary_master table and skipping default insertion");
                try {
                    jdbcTemplate.update("DELETE FROM summary_master");
                } catch (Exception ex) {
                    log.debug("Could not clear summary_master: {}", ex.getMessage());
                }
                return;
            }
        } catch (Exception e) {
            log.debug("Could not check setdiscount for CASH SUMMARY OLD MODEL: {}", e.getMessage());
        }

        try {
            String checkTableSql = "SELECT COUNT(*) FROM summary_master";
            Integer count = jdbcTemplate.queryForObject(checkTableSql, Integer.class);
            if (count != null && count > 0) {
                log.info("✔ summary_master already has data ({} rows)", count);
                return;
            }
        } catch (Exception e) {
            log.warn("summary_master check failed, attempting insertion: {}", e.getMessage());
        }

        String shopCode = "";
        try {
            List<String> list = jdbcTemplate.query("SELECT value FROM company WHERE key='shopcode'",
                    (rs, rowNum) -> rs.getString("value"));
            if (!list.isEmpty() && list.get(0) != null && !list.get(0).trim().isEmpty()) {
                shopCode = list.get(0).trim();
            }
        } catch (Exception e) {
            log.debug("Could not fetch shopcode from company table for summary_master: {}", e.getMessage());
        }

        String insertSql = "INSERT INTO summary_master (shopcode, transaction_type, item_name, counter_code, metal_type, active) VALUES (?, ?, ?, ?, ?, true)";
        Object[][] defaultRows = new Object[][] {
                { shopCode, "SALES", "GOLD ", "NGO", "G" },
                { shopCode, "SALES", "SILVER ", "SIL", "S" },
                { shopCode, "SALES", "DMD ", "R", "D" },
                { shopCode, "SALES", "SWA DMD ", "SWA", "D" },
                { shopCode, "SALES", "PLATINUM ", "PLT", "P" },
                { shopCode, "SALES", "FANCY ITEMS", "FNC", "O" },
                { shopCode, "SALES", "LOOSE STONE", "LS", "O" },
                { shopCode, "SALES", "REFINED GOLD", "RFG", "G" },
                { shopCode, "PURCHASE", "OLD GOLD", "OG", "G" },
                { shopCode, "PURCHASE", "OLD SILVER", "OSIL", "S" },
                { shopCode, "PURCHASE", "OLD DMD", "R", "D" },
                { shopCode, "PURCHASE", "SWA DMD", "SWA", "D" },
                { shopCode, "PURCHASE", "OLD PLATINUM", "PLT", "P" },
                { shopCode, "CREDITNOTE", "GOLD", "NGO", "G" },
                { shopCode, "CREDITNOTE", "SILVER ", "SIL", "S" },
                { shopCode, "CREDITNOTE", "DMD ", "R", "D" },
                { shopCode, "CREDITNOTE", "SWA DMD ", "SWA", "D" },
                { shopCode, "CREDITNOTE", "PLATINUM ", "PLT", "P" }
        };

        int inserted = 0;
        for (Object[] row : defaultRows) {
            try {
                jdbcTemplate.update(insertSql, row[0], row[1], row[2], row[3], row[4]);
                inserted++;
            } catch (Exception ex) {
                log.warn("Failed to insert summary_master default {}: {}", row[2], ex.getMessage());
            }
        }
        log.info("🔥 Inserted {} default rows for shopcode '{}' into summary_master", inserted, shopCode);
    }

    // ============================
    // LOAD ROLES
    // ============================
    private void loadRoles() throws Exception {

        ClassPathResource resource = new ClassPathResource("config/userrole.json");

        List<RoleDTO> roles = mapper.readValue(
                resource.getInputStream(),
                new TypeReference<List<RoleDTO>>() {
                });

        for (RoleDTO dto : roles) {

            roleRepository.findByRole(dto.getRole())
                    .orElseGet(() -> {
                        Role role = new Role();
                        role.setRole(dto.getRole());
                        log.info("✔ Adding Role: {}", dto.getRole());
                        return roleRepository.save(role);
                    });
        }
    }

    // ============================
    // SYNC FRAMES
    // ============================
    private void syncFrames() throws Exception {

        ClassPathResource resource = new ClassPathResource("config/frames.json");

        List<FrameDTO> jsonFrames = mapper.readValue(
                resource.getInputStream(),
                new TypeReference<List<FrameDTO>>() {
                });

        Set<String> jsonNames = new HashSet<>();

        for (FrameDTO dto : jsonFrames) {

            jsonNames.add(dto.getFramename());

            if (!frameRepository.existsByFramename(dto.getFramename())) {
                Frameentity frame = new Frameentity();
                frame.setFramename(dto.getFramename());

                frameRepository.save(frame);
                log.info("✔ Added Frame: {}", dto.getFramename());
            }
        }

        // Remove old frames
        for (Frameentity frame : frameRepository.findAll()) {

            if (!jsonNames.contains(frame.getFramename())) {

                userRepository.findAll().forEach(user -> {
                    user.getFrame().remove(frame);
                    userRepository.save(user);
                });

                frameRepository.delete(frame);
                log.warn("⚠ Deleted Frame: {}", frame.getFramename());
            }
        }
    }

    // ============================
    // CREATE ADMIN
    // ============================
    private void createAdminIfNotExists() {

        Optional<Role> role = roleRepository.findByRole("ROLE_DEV");
        if (role.isEmpty()) {
            role = roleRepository.findByRole("ROLE_SUPERADMIN");
        }

        if (role.isEmpty()) {
            log.warn("⚠ ROLE_SUPERADMIN not found!");
            return;
        }

        Optional<User> existingUser = userRepository.findByUsername(username);
        User user;

        if (existingUser.isPresent()) {
            log.info("✔ Admin already exists: {}", username);
            user = existingUser.get();
        } else {
            user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role.get());
            log.info("🔥 Admin Created: {}", username);
        }

        // Ensure password and DEV / Admin role are up to date
        user.setPassword(passwordEncoder.encode(password));
        if (role.isPresent()) {
            user.setRole(role.get());
        }

        // Always ensure admin has all frames (especially newly added ones)
        List<Frameentity> allFrames = frameRepository.findAll();
        user.setFrame(new ArrayList<>(allFrames));
        userRepository.save(user);

        createApiUser(user, password);
    }

    // ============================
    // CREATE PROJECT SCHEME USER
    // ============================
    private void createProjectSchemeUserIfNotExists() {
        try {
            ClassPathResource resource = new ClassPathResource("config/projectscheme.json");
            if (!resource.exists()) {
                return;
            }
            JsonNode root = mapper.readTree(resource.getInputStream());
            JsonNode scheme = root.path("projectscheme");
            String schemeUsername = scheme.path("username").asText(null);
            String schemePassword = scheme.path("password").asText(null);

            if (schemeUsername == null || schemeUsername.isEmpty() || schemePassword == null
                    || schemePassword.isEmpty()) {
                return;
            }

            Optional<Role> role = roleRepository.findByRole("ROLE_DEV");
        if (role.isEmpty()) {
            role = roleRepository.findByRole("ROLE_SUPERADMIN");
        }
            if (role.isEmpty()) {
                return;
            }

            Optional<User> existingUser = userRepository.findByUsername(schemeUsername);
            User user;

            if (existingUser.isPresent()) {
                log.info("✔ Project Scheme User already exists: {}", schemeUsername);
                user = existingUser.get();
            } else {
                user = new User();
                user.setUsername(schemeUsername);
                user.setPassword(passwordEncoder.encode(schemePassword));
                user.setRole(role.get());
                log.info("🔥 Project Scheme User Created: {}", schemeUsername);
            }

            // Always ensure project scheme user has all frames
            List<Frameentity> allFrames = frameRepository.findAll();
            user.setFrame(new ArrayList<>(allFrames));
            userRepository.save(user);

            createApiUser(user, schemePassword);

        } catch (Exception e) {
            log.error("❌ Failed to load project scheme user", e);
        }
    }

    private void createNidhinUserIfNotExists() {
        try {
            String uName = "Nidhin@123";
            String rawPwd = "Blogtec@123";
            Optional<Role> role = roleRepository.findByRole("ROLE_DEV");
        if (role.isEmpty()) {
            role = roleRepository.findByRole("ROLE_SUPERADMIN");
        }
            if (role.isEmpty()) {
                return;
            }
            Optional<User> existingUser = userRepository.findByUsername(uName);
            User user;
            if (existingUser.isPresent()) {
                log.info("✔ User already exists: {}", uName);
                user = existingUser.get();
            } else {
                user = new User();
                user.setUsername(uName);
                user.setPassword(passwordEncoder.encode(rawPwd));
                user.setRole(role.get());
                log.info("🔥 User Created: {}", uName);
            }
            List<Frameentity> allFrames = frameRepository.findAll();
            user.setFrame(new ArrayList<>(allFrames));
            userRepository.save(user);

            createApiUser(user, rawPwd);
        } catch (Exception e) {
            log.error("❌ Failed to load user Nidhin@123", e);
        }
    }

    // ============================
    // CREATE API USER
    // ============================
    private void createApiUser(User user, String rawPassword) {

        Optional<ApiUser> apiUserOpt = apiUserService.findByUsername(user.getUsername());

        ApiUser apiUser = apiUserOpt.orElse(new ApiUser());

        apiUser.setUsername(user.getUsername());
        apiUser.setPassword(rawPassword);
        apiUser.setRole(user.getRole().getRole());
        apiUser.setShopcode(userService.getdefaultshopcode());

        if (apiUserOpt.isPresent()) {
            apiUserService.update(apiUser.getUserid(), apiUser);
            log.info("✔ API User Updated");
        } else {
            apiUserService.create(apiUser);
            log.info("✔ API User Created");
        }
    }

    private void loadSetDiscountDefaults() {

        insertIfNotExists("IDLE TIMEOUT MINUTES", 0.1, false, "WEB APP IDLE TIMEOUT");
        insertIfNotExists("IMAGE FOLDER NAME", 0.01, true, "");
        insertIfNotExists("SERVER PATH", 0.01, true, "");
        insertIfNotExists("BARCODE IMAGE FROM SERVER", 0.01, false, "ENABLE/DISABLE BARCODE IMAGE LOAD FROM SERVER");
        insertIfNotExists("BARCODE CAMERA", 0.01, false, "BARCODE SCAN TO CAMERA USING DISABLE AND ENABLE OPTION");
        insertIfNotExists("SYNC SCHEDULER INTERVAL", 0.01, false,
                "AUTOMATIC DATABASE SYNCHRONIZATION INTERVAL IN MINUTES");
        insertIfNotExists("CASH SUMMARY OLD MODEL", 0.01, false, "ENABLE OLD CASH SUMMARY MODEL FOR SYNC");
        insertIfNotExists("SYNC BACKUP RETENTION DAYS", 7.0, true, "LOCAL DAILY SYNC BACKUP RETENTION PERIOD IN DAYS");
    }

    private void insertIfNotExists(String details, double amount, boolean flag, String remark) {

        try {
            // 1. Check if exists
            String checkSql = "SELECT COUNT(*) FROM setdiscount WHERE details = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, details);

            if (count != null && count > 0) {
                log.info("✔ Already exists: {}", details);
                return;
            }

            // 2. Get max slno
            String maxSql = "SELECT COALESCE(MAX(slno), 0) FROM setdiscount";
            Integer maxSlno = jdbcTemplate.queryForObject(maxSql, Integer.class);

            int newSlno = (maxSlno != null ? maxSlno : 0) + 1;

            // 3. Insert
            String insertSql = "INSERT INTO setdiscount (slno, details, amount, flag, remark) VALUES (?, ?, ?, ?, ?)";

            jdbcTemplate.update(insertSql,
                    newSlno,
                    details,
                    amount,
                    flag,
                    remark);

            log.info("🔥 Inserted: {} with slno {}", details, newSlno);

        } catch (Exception e) {
            log.error("❌ Error inserting: " + details, e);
        }
    }
}