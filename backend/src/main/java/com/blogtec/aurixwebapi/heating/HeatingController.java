package com.blogtec.aurixwebapi.heating;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import com.blogtec.aurixwebapi.dto.HeatingDto;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;


@RestController
@RequestMapping("/heating")
public class HeatingController {

    private final HeatingServ heatingService;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    @Autowired
    public HeatingController(
            HeatingServ heatingService,
            ApiUserService apiUserService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher) {

        this.heatingService = heatingService;
        this.apiUserService = apiUserService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    private boolean isLocalShop(String shopcode) {
        return shopcode != null &&
               shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    // ─── GET ────────────────────────────────────────────────────────────────────

    @GetMapping("/get")
    public ResponseEntity<?> getByEstno(
            @RequestParam("estno") int estno,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            List<HeatingDto> result = heatingService.getByEstno(estno);
            return ResponseEntity.ok(result);
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "heating/get?estno=" + estno,
                HttpMethod.GET,
                null,
                username,
                password);
    }

    // ─── ADD ────────────────────────────────────────────────────────────────────

    @PostMapping("/add")
    public ResponseEntity<?> create(@RequestBody HeatingDto dto,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            // Null-safe defaults
            dto.setEstno(AspCommonFunctions.checkNull(dto.getEstno()));
            dto.setRowId(AspCommonFunctions.checkNull(dto.getRowId()));
            dto.setEntryDate(AspCommonFunctions.checkNull(dto.getEntryDate()));
            dto.setSmCode(AspCommonFunctions.checkNull(dto.getSmCode()));
            dto.setGldSlv(AspCommonFunctions.checkNull(dto.getGldSlv()));
            dto.setItemCode(AspCommonFunctions.checkNull(dto.getItemCode()));
            dto.setGrwt(AspCommonFunctions.checkNull(dto.getGrwt()));
            dto.setNtwt(AspCommonFunctions.checkNull(dto.getNtwt()));
            dto.setShopCode(shopcode);

            return ResponseEntity.ok(heatingService.addHeat(dto));
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "heating/add",
                HttpMethod.POST,
                dto,
                username,
                password);
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────────

    @PutMapping("/update")
    public ResponseEntity<?> update(@RequestParam("estno") int estno,
            @RequestParam("row_id") int rowId,
            @RequestBody HeatingDto dto,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return ResponseEntity.ok(heatingService.updateHeat(estno, rowId, dto));
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "heating/update?estno=" + estno + "&row_id=" + rowId,
                HttpMethod.PUT,
                dto,
                username,
                password);
    }

    // ─── UPDATE FLAG ─────────────────────────────────────────────────────────────

    @PutMapping("/updateflag")
    public ResponseEntity<?> updateflag(@RequestParam("estno") int estno,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return ResponseEntity.ok(heatingService.updateFlag(estno));
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "heating/updateflag?estno=" + estno,
                HttpMethod.PUT,
                null,
                username,
                password);
    }

    // ─── CONFIRM ─────────────────────────────────────────────────────────────────

    @PutMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestParam("estno") int estno,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return ResponseEntity.ok(heatingService.updateRecFlag(estno));
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "heating/confirm?estno=" + estno,
                HttpMethod.PUT,
                null,
                username,
                password);
    }

    // ─── DELETE ─────────────────────────────────────────────────────────────────

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteById(
            @RequestParam("estno") int estno,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return heatingService.deleteHeat(estno);
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "heating/delete?estno=" + estno,
                HttpMethod.DELETE,
                null,
                username,
                password);
    }
}
