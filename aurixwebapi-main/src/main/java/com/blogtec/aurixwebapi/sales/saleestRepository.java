package com.blogtec.aurixwebapi.sales;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

@Repository
public interface saleestRepository extends JpaRepository<SalesEntity, Integer> {

	@Query(value = "select distinct est_no from cashmarkings  where est_no=:estno and  counter_code in('C1','C2','C3');", nativeQuery = true)
	Optional<Integer> findcheckestnobilledornot(@Param("estno") int estno);

	@Query(value = "SELECT est_gamt,est_tamt,aftervaamt,afterstnch,est_gstper,est_igstper FROM saleest WHERE est_no = :estno ORDER BY it_slno", nativeQuery = true)
	List<Object[]> findByEstnos(@Param("estno") int estno);

	@Query(value = "SELECT est_no,est_dte,est_grate,(select username from userdetails where uid=userid) as username,custid,est_cunm,est_add1,est_add2,est_add3,est_pin,est_phone,est_sman1,est_sman2,est_optr,gold_slv,barflag,est_gstper,est_igstper,est_othtaxper,est_tamt,est_discount,prev_amt,panno,gstno,estsbillno,estsdate,estyear,est_disrate from estmstr WHERE est_no= :estno", nativeQuery = true)
	List<Object[]> findbyId(@Param("estno") int estno);

	@Query(value = "SELECT est_no,est_dte,est_grate,(select username from userdetails where uid=userid) as username,custid,est_cunm,est_add1,est_add2,est_add3,est_pin,est_phone,est_sman1,est_sman2,est_optr,gold_slv,barflag,est_gstper,est_igstper,est_othtaxper,est_tamt,est_discount,prev_amt,panno,gstno,estsbillno,estsdate,estyear,est_disrate from estmstr", nativeQuery = true)
	List<Object[]> findall();

	/////////////// FETCH IMAGE FOR TABLE
	@Query(value = "select distinct subdesign.image_data from mainstock m, bar_itemdesignsizewtmaster as bid,bar_designmaster as design,bar_subdesignmaster as subdesign where m.barcode=:barcodeno and  m.designcode=subdesign.dsgn_name  ", nativeQuery = true)
	byte[] getAllBarcodeimage(String barcodeno);

	///// getdatatova table for update va
	// @Query(value = "select distinct
	///// a.est_icode,a.est_vaper,a.afterva,a.est_itdesc,a.est_qty,a.est_wt,a.est_tamt,a.it_slno,a.est_gamt,a.est_stnch,a.est_stnwt,a.est_ntwt,a.est_rate,
	///// coalesce(b.description,'') as description,coalesce(m.remarks,'') as
	///// remarks,coalesce(m.barcode,'') as barcode,coalesce(m.prev_barcode,'') as
	///// prev_barcode ,(select bs.image_data from bar_subdesignmaster bs,mainstock
	///// m2 where bs.dsgn_name=m.designcode) as imagedata from saleest as a left
	///// join mainstock as m on m.barcode=a.est_barcode left join
	///// bar_itemdesignsizewtmaster as i on i.entryno =m.dslno left join
	///// bar_designmaster as b on b.code=i.design where a.EST_NO=:estno order by
	///// a.it_slno", nativeQuery = true)
	@Query(value = "select distinct a.est_icode,a.est_vaper,a.afterva,a.est_itdesc,a.est_qty,a.est_wt,a.est_tamt,a.it_slno,a.est_gamt,a.est_stnch,a.est_stnwt,a.est_ntwt,a.est_rate, coalesce(b.description,'') as description,coalesce(m.remarks,'') as remarks,coalesce(m.barcode,'') as barcode,coalesce(m.prev_barcode,'') as prev_barcode,coalesce(bs.image_data,'') as image_data ,coalesce(bs.img_name,'') as img_name from saleest as a left join mainstock as m on m.barcode=a.est_barcode left join bar_itemdesignsizewtmaster as i on i.entryno =m.dslno left join bar_designmaster as b on b.code=i.design left join bar_subdesignmaster bs on bs.dsgn_name=m.designcode  where  a.EST_NO=:estno order by a.it_slno", nativeQuery = true)
	List<Object[]> getTransactionUpdateVa(@Param("estno") long estno);

	;

	////////////////////////////////// itemdetails to the table including v ,stone
	////////////////////////////////// all detils from saleest
	@Query(value = "select  distinct a.est_icode,a.est_vaper,a.afterva,a.est_itdesc,a.est_qty,a.est_wt,a.est_tamt,a.it_slno,a.est_gamt,a.est_stnch,a.est_stnwt,a.est_ntwt,a.est_rate,a.est_barcode from saleest as a where a.est_no=:estno  order by a.it_slno", nativeQuery = true)
	List<Object[]> getsaleestDetail(@Param("estno") long estno);

	@Query(value = "select coalesce(m.remarks,'') as remarks,coalesce(m.barcode,'') as barcode,coalesce(m.prev_barcode,'') as prev_barcode from mainstock as m,saleest as s where s.est_barcode =m.barcode and s.est_barcode=:barcodeno", nativeQuery = true)
	List<Object[]> getmainstockdetailstotable(String barcodeno);

	@Query(value = "select  coalesce(b.description,'') as description ,coalesce(bs.image_data,'') as image_data,coalesce (bs.img_name,'') as img_name from bar_subdesignmaster as bs,mainstock as m,saleest as s ,bar_designmaster as b where m.barcode=s.est_barcode and bs.dsgn_name =m.designcode  and s.est_barcode =:barcodeno and  bs.dcode=b.code", nativeQuery = true)
	List<Object[]> getImagefrommaistock(String barcodeno);

	//////////// getdatatova table for distinct item wise for update va
////	@Query(value = "select distinct a.est_icode,a.est_vaper,a.afterva,a.est_itdesc,a.est_qty,a.est_wt,a.est_tamt,a.it_slno,a.est_gamt,a.est_stnch,a.est_stnwt,a.est_ntwt,a.est_rate, coalesce(b.description,'') as description,coalesce(m.remarks,'') as remarks,coalesce(m.barcode,'') as barcode,coalesce(m.prev_barcode,'') as prev_barcode from saleest as a left join mainstock as m on m.barcode=a.est_barcode left join bar_itemdesignsizewtmaster as i on i.entryno =m.dslno left join bar_designmaster as b on b.code=i.design  where  a.EST_NO=:estno order by a.it_slno", nativeQuery = true)
//	@Query(value = "select distinct est_icode,est_vaper,afterva,est_itdesc,sum(est_qty) as est_qty,sum(est_wt) as est_wt,sum(est_tamt) as est_tamt,0 as it_slno,sum(est_gamt) as est_gamt,sum(est_stnch) as est_stnch,sum(est_stnwt) as est_stnwt,sum(est_ntwt) as est_ntwt,avg(est_rate) as est_rate,'' as description,'' as remarks,'' as barcode,'' as prev_barcode,'' as image_data,'' as img_name from saleest where EST_NO=:estno order by it_slno group by est_icode,est_vaper,afterva,est_itdesc order by est_icode,est_vaper", nativeQuery = true)
//	List<Object[]> getTransactionUpdateVaitem(@Param("estno") long estno);
	@Query(value = "select est_icode, est_vaper, afterva, est_itdesc, sum(est_qty) as est_qty, sum(est_wt) as est_wt, sum(est_tamt) as est_tamt, 0 as it_slno, sum(est_gamt) as est_gamt, sum(est_stnch) as est_stnch, sum(est_stnwt) as est_stnwt, sum(est_ntwt) as est_ntwt, avg(est_rate) as est_rate, '' as description, '' as remarks, '' as barcode, '' as prev_barcode, '' as image_data, '' as img_name from saleest where EST_NO=:estno group by est_icode, est_vaper, afterva, est_itdesc order by est_icode, est_vaper", nativeQuery = true)
	List<Object[]> getTransactionUpdateVaitem(@Param("estno") long estno);

	/////////////////// updateing va on normal case not bulk
	@Modifying
	@Transactional
	@Query(value = " update saleest set afterva=:afterva,aftervaamt=:aftervaamt where est_no=:estno  AND it_slno = :itslno", nativeQuery = true)
	void updateSaleest(@Param("estno") int estno, @Param("afterva") BigDecimal afterva,
			@Param("aftervaamt") BigDecimal aftervaamt, int itslno);

	@Modifying
	@Transactional
	@Query(value = " update saleest set afterva=:afterva,aftervaamt=:aftervaamt where est_no=:estno and est_icode=:itemcode and est_vaper=:actualva", nativeQuery = true)
	void updateSaleestcaolescemethod(@Param("estno") int estno, @Param("afterva") BigDecimal afterva,
			@Param("aftervaamt") BigDecimal aftervaamt, String itemcode, BigDecimal actualva);

	/////////////////// updateing va on bulk case

	//////////////////// get afterva
	@Query(value = "select coalesce(sum(aftervaamt), 0) from saleest where est_no = :estno", nativeQuery = true)
	BigDecimal getAfterVa(@Param("estno") int estno);

	/////////////////// getva
	@Query(value = "select afterva  from dmdvapermaster where dmdvaper =:percentage", nativeQuery = true)
	double getAfterVafromPercentage(double percentage);

	@Query(value = """
			SELECT 
			    'SALES' AS name,
			    COALESCE(SUM(est_tamt), 0) AS amount,
			    COALESCE(SUM(est_wt), 0) AS gdwt,
			    'A' AS type
			FROM saleest
			WHERE est_no = :estno
			
			UNION ALL
			
			SELECT 
			    'PURCHASE' AS name,
			    COALESCE(-SUM(ps_tamt), 0) AS amount,
			    COALESCE(SUM(ps_gwt), 0) AS gdwt,
			    'B' AS type
			FROM pureest
			WHERE est_no = :estno
			
			UNION ALL
			
			SELECT 
			    'CREDIT NOTE' AS name,
			    COALESCE(-SUM(totalamount), 0) AS amount,
			    COALESCE(SUM(est_wt), 0) AS gdwt,
			    'C' AS type
			FROM crnest
			WHERE est_no = :estno
			
			UNION ALL
			
			SELECT 
			    adv_name AS name,
			    -adv_amt AS amount,
			    COALESCE(schm_gdwt, 0) AS gdwt,
			    'D' AS type
			FROM saleadvest
			WHERE est_no = :estno
			
			ORDER BY type
			""", nativeQuery = true)
	List<Object[]> getTransactionSummary(@Param("estno") int estno);

	@Query(value = "SELECT COALESCE( (SELECT SUM(est_gamt + aftervaamt + afterstnch) FROM saleest WHERE est_no = :estno), 0) +COALESCE((SELECT -SUM(ps_tamt)  FROM pureest WHERE est_no = :estno), 0) +COALESCE((SELECT -SUM(totalamount) FROM crnest WHERE est_no = :estno), 0) + COALESCE((SELECT SUM(-adv_amt) FROM saleadvest WHERE est_no = :estno), 0) AS amount", nativeQuery = true)
	List<Object[]> getafterTransactionSummary(@Param("estno") int estno);

	@Query(value = "select amount from setdiscount  e where details='DMD DISCOUNT RATE'", nativeQuery = true)
	List<Object[]> getdmddiscount();

	@Modifying
	@Transactional
	@Query(value = " update estmstr set est_disrate=:disrate where est_no=:estno", nativeQuery = true)
	void updatedmdrate(@Param("estno") int estno, @Param("disrate") BigDecimal disrate);

	@Query(value = "select it_slno,est_stnch from saleest where est_no=:estno and est_stnch>0 and est_cntr in (select code from countermaster  where dmd_flag=true) order by it_slno", nativeQuery = true)
	List<Object[]> getsaleeststnchg(@Param("estno") int estno);

	@Query(value = "select it_slno,(stn_rate*stn_qty) as stnchg,((stn_rate-:disamt*100) :: numeric *stn_qty) as stnchg1 from stoneest where est_no=:estno and stn_rate>(select amount from setdiscount where details='MIN DMD STONE AMOUNT') and s_type='D' and stn_typ='D' and it_slno=:slno order by it_slno", nativeQuery = true)
	List<Object[]> getStoneestchg(@Param("estno") int estno, BigDecimal disamt, int slno);

	@Query(value = "select it_slno,(stn_rate*stn_nos) as stnchg from stoneest where est_no=:estno and s_type!='D' and it_slno=:slno order by it_slno", nativeQuery = true)
	List<Object[]> getStoneestbynos(@Param("estno") int estno, int slno);

	@Query(value = "select it_slno,(stn_rate*stn_qty) as stnchg,((stn_rate-((stn_rate*:disamt/100))) :: numeric *stn_qty) as stnchg1 from stoneest where est_no=:estno and stn_rate>(select amount from setdiscount where details='MIN DMD STONE AMOUNT') and s_type='D' and stn_typ='D' and it_slno=:slno order by it_slno", nativeQuery = true)
	List<Object[]> getStoneestpercentagechg(@Param("estno") int estno, BigDecimal disamt, int slno);

	@Modifying
	@Transactional
	@Query(value = "update saleest set afterstnch= :afterstnch :: numeric where est_no=:estno and it_slno=:itslno", nativeQuery = true)
	void updateafterstnchsaleest(@Param("estno") int estno, @Param("afterstnch") BigDecimal afterstnch,
			@Param("itslno") int itslno);

	@Modifying
	@Transactional
	@Query(value = "update saleest set afterva=(EST_VAPER-(EST_VAPER*:percentage/100)) :: numeric where est_no=:estno", nativeQuery = true)
	void updateaftervausingperc(@Param("estno") int estno, BigDecimal percentage);

	@Modifying
	@Transactional
	@Query(value = "update saleest set afterva=:afterva :: numeric where est_no=:estno and it_slno=:itslno", nativeQuery = true)
	void updateaftervausingdirectperc(@Param("estno") int estno, BigDecimal afterva, int itslno);

	@Modifying
	@Transactional
	@Query(value = "update saleest set afterva=:per :: numeric where est_no=:estno and it_slno=:itslno", nativeQuery = true)
	void updateaftervausingpercwithamount(@Param("estno") int estno, BigDecimal per, int itslno);

	@Modifying
	@Transactional
	@Query(value = "update saleest set afterva=:afterva where est_no=:estno and it_slno=:itslno", nativeQuery = true)
	void updatehalfofvaperc(@Param("estno") int estno, int itslno, double afterva);

	@Modifying
	@Transactional
	@Query(value = "update saleest set aftervaamt=(est_gamt*afterva)/100 where est_no=:estno and afterva>0", nativeQuery = true)
	void updateaftervaamtusingperc(@Param("estno") int estno);

	@Modifying
	@Transactional
	@Query(value = "update saleest set aftervaamt=(est_gamt*afterva)/100 where est_no=:estno and afterva>0 and it_slno=:itslno", nativeQuery = true)
	void updateaftervaamtusingdirectperc(@Param("estno") int estno, int itslno);

	@Modifying
	@Transactional
	@Query(value = "update saleest set aftervaamt=(est_gamt*afterva)/100 where est_no=:estno and afterva>0  and it_slno=:itslno", nativeQuery = true)
	void updatehalfofvaamt(@Param("estno") int estno, int itslno);

	@Modifying
	@Transactional
	@Query(value = "update saleest set aftervaamt=:AMOUNT where est_no=:estno and afterva>0  and it_slno=:itslno", nativeQuery = true)
	void updateaftervaamtusingpercpercwithamount(@Param("estno") int estno, BigDecimal AMOUNT, int itslno);

	@Query(value = "SELECT (stn_rate) FROM stoneest where est_no=:estno and stn_typ='D' and s_type='D' and stn_rate>(select amount from setdiscount where details='MIN DMD STONE AMOUNT')", nativeQuery = true)
	BigDecimal getCheckStoneexist(@Param("estno") int estno);

	@Query(value = "SELECT avg(stn_rate) FROM stoneest where est_no=:estno and stn_typ='D' and s_type='D'", nativeQuery = true)
	BigDecimal getavaerageStonerate(@Param("estno") int estno);

	@Query(value = "select coalesce(sum(stn_amt),0) as amt from stoneest  where est_no =:estno and s_type='D'", nativeQuery = true)
	BigDecimal getsumstonerate(@Param("estno") int estno);

	@Query(value = "select flag from setdiscount  where details ='VA WISE CASH MARK'", nativeQuery = true)
	Boolean getsetDiscountVaCaluclationStatus();

	@Modifying
	@Transactional
	@Query(value = "update estmstr set est_disrate=:dmdrte :: numeric where est_no=:estno", nativeQuery = true)
	void updatedmdrteusingpercentages(int estno, BigDecimal dmdrte);

	@Query(value = "update saleest set afterva=(EST_VAPER-(EST_VAPER*:percentage/100)) :: numeric where est_no=:estno", nativeQuery = true)
	void updatetotlamtusingpercentage(@Param("estno") int estno, BigDecimal percentage);

	@Query(value = "select est_vaper from saleest s where est_no=:estno  and it_slno=:it_slno", nativeQuery = true)
	List<Object[]> getvapercentage(@Param("estno") int estno, int it_slno);

	@Query(value = "select est_vaper from saleest s where est_no=:estno  and it_slno=:it_slno", nativeQuery = true)
	double getvaforupdateftreva(@Param("estno") int estno, int it_slno);

////////////////////////////////////////////////////////////////////////////////////////////////////////
	@Query(value = "select description1 from discountpermaster where description='Other Items' and flag ='true' ", nativeQuery = true)
	Optional<String> checkTheVACalculationConcept();

	@Query(value = "select description1 from discountpermaster where description='Bill Amount Wise DMD' and flag ='true' ", nativeQuery = true)
	Optional<String> checkTheVACalculationdiamondConcept();

/////////////////vapercntagewiseamount///////////////////////////
	@Query(value = "select  sum(est_vamt) as vaamt,sum(est_stnch) as stnch,sum(est_gamt) as goldamt,sum(est_tamt) as tamt,sum(totalamount) as totalamount,(select (est_gstper+est_igstper+est_othtaxper) as taxper from estmstr where est_no = :estno) from saleest  where est_no =:estno", nativeQuery = true)
	List<Object[]> getsalestandestmstrdataforva(int estno);

	@Query(value = "select est_vaper,est_gamt as goldamt from saleest  where est_no =:estno", nativeQuery = true)
	List<Object[]> getsaleestdatafromvamtcalculation(int estno);

	@Query(value = "select (est_stnch+est_gamt),est_gamt,est_tamt from saleest s where est_no=:estno and it_slno=:itslno order by it_slno", nativeQuery = true)
	List<Object[]> getvaperandamt(int estno, int itslno);

/////////////////vapercntagewisedmd///////////////////////////
	@Query(value = "select coalesce(sum(stn_amt),0) as amt from stoneest  where est_no =:estno and it_slno=:it_slno and s_type='D'", nativeQuery = true)
	BigDecimal getsumstoneratewithbyusingit_slno(@Param("estno") int estno, int it_slno);

	@Query(value = "select stn_rate,slno from stoneest where est_no=:estno and s_type='D' and it_slno=:itslno", nativeQuery = true)
	List<Object[]> getstonechrgandslnofromstoneestinviduallyforstonerate(int estno, int itslno);

///////////////////dmdrateupdation diamond rate //////////
	@Query(value = "select it_slno,est_stnch from saleest where est_no=:estno and est_stnch>0 and est_cntr in (select code from countermaster  where dmd_flag=true) and it_slno=:est_slno order by it_slno", nativeQuery = true)
	List<Object[]> getdatafordmdratecalculation(@Param("estno") int estno, int est_slno);

	@Query(value = "select stn_rate,it_slno,slno from stoneest where est_no=:estno and s_type='D' and it_slno=:est_slno", nativeQuery = true)
	List<Object[]> getdatafordmdratecalculation2(@Param("estno") int estno, int est_slno);

	@Modifying
	@Transactional
	@Query(value = "update stoneest set aft_stnrate=:stnrate,aft_stnamt=(stn_qty*:stnrate):: numeric where  est_no=:estno and it_slno=:itslno and slno=:slno", nativeQuery = true)
	void updatepercentagewisedmdamountupdate(int estno, BigDecimal stnrate, int itslno, int slno);

	@Query(value = "select s.est_icode from saleest as s,itemmaster  as  it,countermaster as c where  it.item_code =s.est_icode and it.counter =c.code and c.dmd_flag='true' and s.it_slno =:est_slno and s.est_no =:estno", nativeQuery = true)
	List<Object[]> getdmditem(@Param("estno") int estno, int est_slno);

	@Query(value = "select s.est_icode from saleest as s,itemmaster  as  it,countermaster as c where  it.item_code =s.est_icode and it.counter =c.code and c.dmd_flag='true' and s.est_no =:estno", nativeQuery = true)
	List<Object[]> getdmditemss(@Param("estno") int estno);

	@Query(value = "select it_slno,aft_stnamt as aftstnchg,stn_amt as stn_amt from stoneest where est_no=:estno and it_slno=:est_slno order by it_slno", nativeQuery = true)
	List<Object[]> getest_stnchfromstoneest(@Param("estno") int estno, int est_slno);

	@Query(value = "select s.est_icode from saleest as s,itemmaster  as  it,countermaster as c where  it.item_code =s.est_icode and it.counter =c.code and c.dmd_flag='true' and s.est_no =:estno", nativeQuery = true)
	List<String> checkitisdiamonditem(int estno);

	@Query(value = "select amount from   setdiscount  s   where details='SALES VA UPDATION ITEM' ", nativeQuery = true)
	Optional<BigDecimal> maximumamountindmdratefield();

////////////////////rest the estimate number to old data 
	@Modifying
	@Transactional
	@Query(value = "update saleest set afterva=est_vaper, aftervaamt=est_vamt, afterstnch=est_stnch where est_no = CAST(:estno AS integer)", nativeQuery = true)
	void resetestno(@Param("estno") String estno);

	@Modifying
	@Transactional
	@Query(value = "update estmstr set est_disrate=0, est_discount=0 where est_no = CAST(:estno AS integer)", nativeQuery = true)
	void resetestmstrestno(@Param("estno") String estno);

///////////////////////////////////////////

//////////////////////////////////////easy Total/////////////////////////////////////////

	@Query(value = "select coalesce(sum(est_wt),0) as weight,  coalesce(sum(est_tamt),0) as amount from sbilltran s where est_no >0 and est_icode in(select item_code from itemmaster i where catg_type=:type)", nativeQuery = true)
	List<Object[]> getsalewtforeasytotal(String type);

	@Query(value = "select  coalesce(sum(ps_gwt),0) as weight,  coalesce(sum(ps_tamt),0) as amount from pbilltran  where est_no >0 and ps_itcde in(select item_code from itemmaster i where catg_type=:type)", nativeQuery = true)
	List<Object[]> getpurchasewtforeasytotal(String type);

	@Query(value = "select  coalesce(sum(est_wt),0) as weight,  coalesce(sum(est_tamt),0) as amount from crn_billtran  where est_no >0 and est_icode in(select item_code from itemmaster i where catg_type=:type)", nativeQuery = true)
	List<Object[]> getcreditnotewtforeasytotal(String type);

	// @Query("UPDATE saleest e SET e.aftervaamt = (:est_gamt * :afterva) / 100
	// WHERE e.estno = :estno AND e.est_vaper = :est_vaper")
//	    void updateSaleest(@Param("estno") int estno, @Param("afterva") double afterva, @Param("est_gamt") double est_gamt, @Param("est_vaper") int est_vaper);
	@Query(value = "select imagedata from companyimagemaster where description = 'COMPANY IMAGE' LIMIT 1", nativeQuery = true)
	byte[] getCompanyImage();

	@Modifying
	@Transactional
	@Query(value = """
			INSERT INTO estmstr (
			    est_no, est_dte, est_grate, userid, custid, est_cunm, est_add1, est_add2, est_add3, est_pin, est_phone,
			    est_sman1, est_sman2, est_optr, gold_slv, barflag, est_gstper, est_igstper, est_othtaxper, est_tamt,
			    est_discount, prev_amt, panno, gstno, estsbillno, estsdate, estyear, shopcode
			)
			VALUES (
			    :estNo, :estDte, :estGrate, :userid, :custid, :custName, :add1, :add2, :add3, :pin, :phone,
			    :sman1, :sman2, :optr, :goldSlv, :barFlag, :gstPer, :igstPer, :othTaxPer, :tamt,
			    :discount, :prevAmt, :panNo, :gstNo, :estSBillNo, :estSDate, :estYear, :shopCode
			)
			""", nativeQuery = true)
	void insertEstMstr(@Param("estNo") Integer estNo, @Param("estDte") Date estDte,
			@Param("estGrate") BigDecimal estGrate, @Param("userid") Integer userid, @Param("custid") String custid,
			@Param("custName") String custName, @Param("add1") String add1, @Param("add2") String add2,
			@Param("add3") String add3, @Param("pin") String pin, @Param("phone") String phone,
			@Param("sman1") String sman1, @Param("sman2") String sman2, @Param("optr") String optr,
			@Param("goldSlv") String goldSlv, @Param("barFlag") Boolean barFlag, @Param("gstPer") BigDecimal gstPer,
			@Param("igstPer") BigDecimal igstPer, @Param("othTaxPer") BigDecimal othTaxPer,
			@Param("tamt") BigDecimal tamt, @Param("discount") BigDecimal discount,
			@Param("prevAmt") BigDecimal prevAmt, @Param("panNo") String panNo, @Param("gstNo") String gstNo,
			@Param("estSBillNo") Integer estSBillNo, @Param("estSDate") Date estSDate, @Param("estYear") Integer estYear,
			@Param("shopCode") String shopCode);

	@Query(value = "SELECT gift_no, collamt, barcode_flag FROM estmstr WHERE est_no = :estno", nativeQuery = true)
	List<Object[]> findGiftDetailsByEstNo(@Param("estno") int estno);

	@Modifying
	@Transactional
	@Query(value = "UPDATE estmstr SET gift_no = :giftNo, collamt = :collAmt, barcode_flag = :barcodeFlag WHERE est_no = :estno", nativeQuery = true)
	void updateGiftDetailsByEstNo(@Param("estno") int estno, @Param("giftNo") String giftNo, @Param("collAmt") BigDecimal collAmt, @Param("barcodeFlag") boolean barcodeFlag);

	@Modifying
	@Transactional
	@Query(value = "UPDATE estmstr SET gift_no = '0', collamt = 0, barcode_flag = false WHERE est_no = :estno", nativeQuery = true)
	void resetGiftDetailsByEstNo(@Param("estno") int estno);

	@Modifying
	@Transactional
	@Query(value = "UPDATE estmstr SET barcode_flag = :barcodeFlag WHERE est_no = :estno", nativeQuery = true)
	void updateBarcodeFlagByEstNo(@Param("estno") int estno, @Param("barcodeFlag") boolean barcodeFlag);

	@Query(value = "SELECT barcode_flag FROM estmstr WHERE est_no = :estno", nativeQuery = true)
	Boolean findBarcodeFlagByEstNo(@Param("estno") int estno);
}

