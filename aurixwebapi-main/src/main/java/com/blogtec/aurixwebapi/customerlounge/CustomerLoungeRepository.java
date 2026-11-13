package com.blogtec.aurixwebapi.customerlounge;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.blogtec.aurixwebapi.dto.BarcodeDetailDTO;

public interface CustomerLoungeRepository extends JpaRepository<CustomerLounge, Integer> {

    /*
     * ==========================================================
     * 1️⃣ DESIGN WISE (CATEGORY FILTER)
     * ==========================================================
     */
    @Query(value = "SELECT bd.code, " +
            "MIN(n.name) AS category_name, " +
            "MIN(i.item_desc) AS item_desc, " +
            "MIN(bd.description) AS design " +
            "FROM mainstock m " +
            "JOIN itemmaster i ON m.itemcode = i.item_code " +
            "JOIN numanacathead n ON n.code = i.stk_head " +
            "JOIN bar_itemdesignsizewtmaster bi ON bi.entryno = m.dslno " +
            "JOIN bar_designmaster bd ON bd.code = bi.design " +
            "JOIN bar_subdesignmaster bs ON bs.dsgn_name = m.designcode " +
            "WHERE m.itemsold='f' " +
            "AND m.designcode <> '' " +
            "AND n.name = :category " +
            "GROUP BY bd.code " +
            "ORDER BY bd.code", nativeQuery = true)
    List<Object[]> getDesignWiseByCategory(@Param("category") String category);

    /*
     * ==========================================================
     * 2️⃣ DESIGN WISE (ALL CATEGORY)
     * ==========================================================
     */
    @Query(value = "SELECT bd.code, " +
            "MIN(n.name) AS category_name, " +
            "MIN(i.item_desc) AS item_desc, " +
            "MIN(bd.description) AS design " +
            "FROM mainstock m " +
            "JOIN itemmaster i ON m.itemcode = i.item_code " +
            "JOIN numanacathead n ON n.code = i.stk_head " +
            "JOIN bar_itemdesignsizewtmaster bi ON bi.entryno = m.dslno " +
            "JOIN bar_designmaster bd ON bd.code = bi.design " +
            "JOIN bar_subdesignmaster bs ON bs.dsgn_name = m.designcode " +
            "WHERE m.itemsold='f' " +
            "AND m.designcode <> '' " +
            "AND m.designcode IS NOT NULL " +
            "GROUP BY bd.code " +
            "ORDER BY bd.code", nativeQuery = true)
    List<Object[]> getAllDesignWise();

    /*
     * ==========================================================
     * 3️⃣ SUB DESIGN LIST (BASED ON DESIGN CODE)
     * ==========================================================
     */
    @Query(value = "SELECT m.designcode, " +
            "bs.dcode, " +
            "MIN(n.name) AS category_name, " +
            "MIN(i.item_desc) AS item_desc, " +
            "MIN(bs.description) AS design_description " +
            "FROM mainstock m " +
            "JOIN itemmaster i ON m.itemcode = i.item_code " +
            "JOIN numanacathead n ON n.code = i.stk_head " +
            "JOIN bar_itemdesignsizewtmaster bi ON bi.entryno = m.dslno " +
            "JOIN bar_designmaster bd ON bd.code = bi.design " +
            "JOIN bar_subdesignmaster bs ON bs.dsgn_name = m.designcode " +
            "AND bd.code = bs.dcode " +
            "WHERE m.itemsold='f' " +
            "AND m.designcode <> '' " +
            "AND m.designcode IS NOT NULL " +
            "AND bd.code = :designcode " +
            "GROUP BY m.designcode, bs.dcode " +
            "ORDER BY m.designcode", nativeQuery = true)
    List<Object[]> getSubDesignByDesign(@Param("designcode") Integer designcode);

    /*
     * ==========================================================
     * 4️⃣ BARCODE LIST BY SUB DESIGN
     * ==========================================================
     */
    @Query(value = "SELECT DISTINCT m.designcode, m.barcode " +
            "FROM mainstock m " +
            "JOIN bar_subdesignmaster bs ON bs.dsgn_name = m.designcode " +
            "WHERE m.itemsold='f' " +
            "AND bs.description = :subdesign " +
            "ORDER BY m.designcode", nativeQuery = true)
    List<Object[]> getBarcodeBySubDesign(@Param("subdesign") String subdesign);

    @Query(value = "SELECT DISTINCT n.name " +
            "FROM mainstock m " +
            "JOIN itemmaster i ON m.itemcode = i.item_code " +
            "JOIN numanacathead n ON n.code = i.stk_head " +
            "WHERE m.itemsold='f' " +
            "AND m.dslno > 0 " +
            "AND m.designcode IS NOT NULL " +
            "AND m.designcode <> '' " +
            "AND m.shopcode = :shopcode " +
            "ORDER BY n.name", nativeQuery = true)
    List<String> getCategoryForCustomer(@Param("shopcode") String shopcode);

    @Query(value = """
            SELECT DISTINCT
                m.barcode,
                m.slno,
                m.bar_date as bardate,
                m.itemcode,
                m.itemname,
                m.num AS qty,
                m.grossweight,
                m.stoneweight,
                m.netweight,
                m.stonecharge,
                m.valueaddition,
                m.counter_code AS itemcounter,
                t.purity,
                t.bill_type AS billtype,
                m.p_amt AS piecerate,
                t.unit,
                r.rate,
                bsd.dcode AS designcode,
                m.designcode AS subdesigncode,
                (
                    SELECT dm.description
                    FROM bar_designmaster dm
                    JOIN bar_itemdesignsizewtmaster idm
                        ON dm.code = idm.design
                    WHERE idm.entryno = m.dslno
                    LIMIT 1
                ) AS designname,

                m.shopcode,

                (
                    SELECT COALESCE(SUM(bb.stonewt),0)
                    FROM barcodeandstone bb
                    WHERE bb.barcode = m.barcode and bb.stonetype ='D'
                ) AS crwt,

                (
                    SELECT COALESCE(SUM(bb.nos),0)
                    FROM barcodeandstone bb
                    WHERE bb.barcode = m.barcode and bb.stonetype ='D'
                ) AS crqty

            FROM mainstock m
            JOIN itemmaster t
                ON t.item_code = m.itemcode
            JOIN bar_subdesignmaster bsd
                ON m.designcode = bsd.dsgn_name
            JOIN goldratemaster r
                ON r.code = t.unit
            WHERE m.itemsold = 'f'
            AND bsd.dsgn_name = :dsgnname
            AND m.shopcode = :shopcode
            ORDER BY m.barcode
            """, nativeQuery = true)

    List<BarcodeDetailDTO> getDetailedBarcodeReport(
            @Param("dsgnname") String dsgnname,
            @Param("shopcode") String shopcode);

    /*
     * ==========================================================
     * 5️⃣ COMPANY IMAGE
     * ==========================================================
     */
    @Query(value = "SELECT imagedata FROM companyimagemaster " +
            "WHERE description='COMPANY IMAGE' LIMIT 1", nativeQuery = true)
    byte[] getCompanyImage();

}