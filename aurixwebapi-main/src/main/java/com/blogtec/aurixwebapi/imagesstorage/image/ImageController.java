package com.blogtec.aurixwebapi.imagesstorage.image;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

@RestController
@RequestMapping("/image")
public class ImageController {

    private final ImageService imageService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    @Autowired
    public ImageController(
            ImageService imageService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher
    ) {
        this.imageService = imageService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

 

    /** ---------------- LOCAL SHOP CHECK ---------------- */

    private boolean isLocalShop(String shopcode) {
        return shopcode != null && shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    /** =========================================================
     * 1️⃣ UPDATE ALL IMAGES
     * ========================================================= */
    @GetMapping("/allimageupdate")
    public ResponseEntity<?> updateAllImages(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {


        if (isLocalShop(shopcode)) {
            String result = imageService.updateAllImages();
            return ResponseEntity.ok(result);
        }

        return remoteDataFetcher.fetchRemoteRawJson(
                shopcode,
                "/image/allimageupdate",
                HttpMethod.GET,
                null,
                username,
                password
        );
    }

    /** =========================================================
     * 2️⃣ UPDATE IMAGE BY DESIGN
     * ========================================================= */
    @GetMapping("/imageupdate")
    public ResponseEntity<?> updateImages(
            @RequestParam int dcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {


        if (isLocalShop(shopcode)) {
            String result = imageService.updateImages(dcode);
            return ResponseEntity.ok(result);
        }

        return remoteDataFetcher.fetchRemoteRawJson(
                shopcode,
                "/image/imageupdate?dcode=" + dcode,
                HttpMethod.GET,
                null,
                username,
                password
        );
    }

    /** =========================================================
     * 3️⃣ IMAGE UPLOAD
     * ========================================================= */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(
            @RequestParam("shopcode") String shopcode,
            @RequestParam int dcode,
            @RequestParam String dsgnName,
            @RequestParam MultipartFile file,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            String response = imageService.saveImage(dcode, dsgnName, file);
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest()
                .body("Remote image upload not supported yet.");
    }

    /** =========================================================
     * 4️⃣ VIEW IMAGE
     * ========================================================= */
    @GetMapping("/view")
    public ResponseEntity<?> viewImage(
            @RequestParam int dcode,
            @RequestParam(value = "subdsgnCode", required = false) String subdsgnCode,
            @RequestParam(value = "dsgnName", required = false) String dsgnName,
            @RequestParam(value = "shopcode", required = false) String shopcode) {

        String targetDesign = (subdsgnCode != null && !subdsgnCode.trim().isEmpty())
                ? subdsgnCode
                : (dsgnName != null ? dsgnName : "");

        if (shopcode == null || isLocalShop(shopcode)) {
            return imageService.viewImageByDesign(dcode, targetDesign);
        }

        return remoteDataFetcher.fetchRemoteFile(
                shopcode,
                "/image/view?dcode=" + dcode + "&subdsgnCode=" + targetDesign + "&dsgnName=" + targetDesign,
                null,
                null
        );
    }
    /** =========================================================
//     * 5 VIEW IMAGE
     * ========================================================= */
    @GetMapping("/barimage")
    public ResponseEntity<?> BarviewImage(
    		@RequestParam String barcode,
    		@RequestParam("shopcode") String shopcode)
    {
    	
    	if (isLocalShop(shopcode)) 
    	{
    		return imageService.viewImageByBarcode(barcode);
    	}
    	
    	return remoteDataFetcher.fetchRemoteFile(
    			shopcode,
    			"/image/barimage?barcode=" + barcode ,
    			null,
    			null
    			);
    }
    
    @GetMapping("/designview")
    public ResponseEntity<?> viewDesignImage(
            @RequestParam int dcode,
            @RequestParam(required = false) String file,
            @RequestParam("shopcode") String shopcode)
    {

        if (isLocalShop(shopcode)) 
        {
            return imageService.viewImageByDesignCODE(dcode, file);
        }

        String path = "/image/designview?dcode=" + dcode;

        if (file != null && !file.isEmpty()) {
            path += "&file=" + file;
        }

        return remoteDataFetcher.fetchRemoteFile(
                shopcode,
                path,
                null,
                null
        );
    }
    
    
    @GetMapping("/designimages")
    public ResponseEntity<?> getDesignImages(
            @RequestParam int dcode,
            @RequestParam("shopcode") String shopcode) {

        if (isLocalShop(shopcode)) {
            return imageService.getDesignImages(dcode);
        }

        String path = "/image/designimages?dcode=" + dcode + "&shopcode=" + shopcode;

        return remoteDataFetcher.fetchRemoteFile(shopcode,path,null,null);
    }


    @GetMapping("/noimage")
    public ResponseEntity<?> getNoImage(
            @RequestParam("shopcode") String shopcode) {

        if (isLocalShop(shopcode)) {
            return imageService.getNoImage();
        }

        String path = "/image/noimage?shopcode=" + shopcode;

        return remoteDataFetcher.fetchRemoteFile(
                shopcode,
                path,
                null,
                null
        );
    }
}