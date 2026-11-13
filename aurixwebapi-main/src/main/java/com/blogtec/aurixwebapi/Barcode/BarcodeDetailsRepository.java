package com.blogtec.aurixwebapi.Barcode;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.Tuple;

@Repository
public interface BarcodeDetailsRepository extends JpaRepository<BarcodeDetails, Integer> {

    @Query(value = "SELECT m.slno, g.today, g.gld_rte AS goldrate, g.tax, m.barcode, m.itemcode, m.itemname, m.num, m.grossweight, m.stoneweight, m.netweight, m.stonecharge, m.valueaddition, m.counter_code AS itemcounter, t.purity AS purity, t.bill_type AS billtype, m.p_amt AS piecerate, t.unit, r.rate, p.p_name AS partyname, m.designcode, dm.code AS dcode, dm.description AS designdescription FROM mainstock m JOIN itemmaster t ON t.item_code = m.itemcode JOIN goldratemaster r ON r.code = t.unit JOIN partymaster p ON p.pid = m.party_slno JOIN goldrate g ON 1=1 LEFT JOIN bar_itemdesignsizewtmaster idm ON idm.entryno = m.dslno LEFT JOIN bar_designmaster dm ON dm.code = idm.design WHERE m.barcode = :value", nativeQuery = true)
    List<Tuple> getAllBarcodeDetails(@Param("value") String barcode);

    @Query(value = "SELECT b.stonecode, s.s_desc AS stonename, b.rate AS stonerate, b.nos AS stno, b.stonewt AS grmwt, (b.stonewt * 0.5) AS crwt, b.amount AS stonevalue FROM stonemaster AS s, barcodeandstone AS b WHERE b.stonecode = s.s_code AND b.barcode = :value", nativeQuery = true)
    List<Tuple> getAllBarcodeClass(@Param("value") String barcode);

    // @Query(value = "SELECT DISTINCT subdesign.image_data FROM mainstock m,
    // bar_itemdesignsizewtmaster AS bid, bar_designmaster AS design,
    // bar_subdesignmaster AS subdesign WHERE m.barcode = :barcodeno AND
    // m.designcode = subdesign.dsgn_name", nativeQuery = true)
    @Query(value = "SELECT DISTINCT subdesign.image_data FROM mainstock m JOIN bar_subdesignmaster subdesign ON m.designcode = subdesign.dsgn_name JOIN bar_itemdesignsizewtmaster bid ON bid.entryno = m.dslno JOIN bar_designmaster design ON design.code = bid.design  WHERE m.barcode = :barcodeno", nativeQuery = true)
    byte[] getAllBarcodeimage(@Param("barcodeno") String barcodeno);

    @Query(value = "SELECT m.barcode, bsd.image_data FROM mainstock m JOIN bar_subdesignmaster bsd ON m.designcode = bsd.dsgn_name WHERE m.barcode IN (:barcodes)", nativeQuery = true)
    List<Object[]> getImagesForBarcodes(@Param("barcodes") List<String> barcodes);
}
