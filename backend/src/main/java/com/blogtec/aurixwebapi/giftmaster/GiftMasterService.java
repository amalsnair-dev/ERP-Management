package com.blogtec.aurixwebapi.giftmaster;

import com.blogtec.aurixwebapi.dto.GiftMasterDto;
import com.blogtec.aurixwebapi.dto.GiftLookupDto;
import java.util.List;
import java.util.Optional;

public interface GiftMasterService {
    void createTable();
    boolean saveGift(GiftMasterDto giftDto);
    boolean updateGift(GiftMasterDto giftDto);
    boolean deleteGift(Long giftId);
    List<GiftMasterDto> getAllGifts();
    Optional<GiftMasterDto> getGiftById(Long giftId);
    Optional<GiftMasterDto> getGiftByCode(String giftCode);
    boolean existsByGiftCode(String giftCode);
    List<GiftLookupDto> getGiftLookup();
}
