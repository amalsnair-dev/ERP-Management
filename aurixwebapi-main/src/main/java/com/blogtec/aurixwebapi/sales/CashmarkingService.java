package com.blogtec.aurixwebapi.sales;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.blogtec.aurixwebapi.dto.UpdateGiftDetailsDto;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.Barcode.BarcodeDetailsRepository;
import com.blogtec.aurixwebapi.dto.AfterAmount;
import com.blogtec.aurixwebapi.dto.CoalesceUpdateVadetails;
import com.blogtec.aurixwebapi.dto.ModifyVaAmt;
import com.blogtec.aurixwebapi.dto.SaleestDto;
import com.blogtec.aurixwebapi.dto.SetEstMstrDto;
import com.blogtec.aurixwebapi.dto.TransactionSummaryDTO;
import com.blogtec.aurixwebapi.dto.UpdateVaDetails;
import com.blogtec.aurixwebapi.dto.UpdateVaamtusingperceninAmount;
import com.blogtec.aurixwebapi.dto.estmstrDto;
import com.blogtec.aurixwebapi.dto.updateVaperusingDirectPercentageDTO;
import com.blogtec.aurixwebapi.dto.updateestmstrdmdrateDto;
import com.blogtec.aurixwebapi.dto.updateestmstrdmdrateDtoWithFlag;
import com.blogtec.aurixwebapi.dto.updatevavaamtanddmdratepercentageDto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("static-access")
@Service
public class CashmarkingService {

	private static final Logger logger = LoggerFactory.getLogger(CashmarkingService.class);


	@Autowired
	saleestRepository repos;

	@Autowired
	BarcodeDetailsRepository barcodeDetailsRepository;

	public List<estmstrDto> getAlldata() {
		List<Object[]> getalldata = repos.findall();
		List<estmstrDto> alldata = new ArrayList<>();

		for (Object[] result : getalldata) {
			estmstrDto est = new estmstrDto();

			est.setEst_no((Integer) result[0]);
			est.setEst_dte(result[1] != null ? ((java.sql.Date) result[1]).toLocalDate() : null);
			est.setEst_grate((BigDecimal) result[2]);
			est.setUsername((String) result[3]);
			est.setCustid((String) result[4]);
			est.setEst_cunm((String) result[5]);
			est.setEst_add1((String) result[6]);
			est.setEst_add2((String) result[7]);
			est.setEst_add3((String) result[8]);
			est.setEst_pin((String) result[9]);
			est.setEst_phone((String) result[10]);
			est.setEst_sman1((String) result[11]);
			est.setEst_sman2((String) result[12]);
			est.setEst_optr((String) result[13]);
			est.setGold_slv(result[14] != null ? result[14].toString() : null);
			est.setBarflag((Boolean) result[15]);
			est.setEst_gstper((BigDecimal) result[16]);
			est.setEst_igstper((BigDecimal) result[17]);
			est.setEst_othtaxper((BigDecimal) result[18]);
			est.setEst_tamt((BigDecimal) result[19]);
			est.setEst_discount((BigDecimal) result[20]);
			est.setPrev_amt((BigDecimal) result[21]);
			est.setPanno((String) result[22]);
			est.setGstno((String) result[23]);
			est.setEstsbillno((Integer) result[24]);
			est.setEstsdate(result[25] != null ? ((java.sql.Date) result[25]).toLocalDate() : null);
			est.setEstyear((Integer) result[26]);
			est.setEst_disrate((BigDecimal) result[27]);

			alldata.add(est);
		}
		return alldata;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	public estmstrDto findbyId(int estno) {
		List<Object[]> results = repos.findbyId(estno);
		estmstrDto est = new estmstrDto();

		if (results != null && !results.isEmpty()) {
			Object[] result = results.get(0); // Assuming one record per estno

			est.setEst_no(result[0] != null ? (Integer) result[0] : null);
			est.setEst_dte(result[1] != null ? ((java.sql.Date) result[1]).toLocalDate() : null);
			est.setEst_grate(result[2] != null ? (BigDecimal) result[2] : null);
			est.setUsername(result[3] != null ? (String) result[3] : null);
			est.setCustid(result[4] != null ? (String) result[4] : null);
			est.setEst_cunm(result[5] != null ? (String) result[5] : null);
			est.setEst_add1(result[6] != null ? (String) result[6] : null);
			est.setEst_add2(result[7] != null ? (String) result[7] : null);
			est.setEst_add3(result[8] != null ? (String) result[8] : null);
			est.setEst_pin(result[9] != null ? (String) result[9] : null);
			est.setEst_phone(result[10] != null ? (String) result[10] : null);
			est.setEst_sman1(result[11] != null ? (String) result[11] : null);
			est.setEst_sman2(result[12] != null ? (String) result[12] : null);
			est.setEst_optr(result[13] != null ? (String) result[13] : null);
			est.setGold_slv(result[14] != null ? result[14].toString() : null);
			est.setBarflag(result[15] != null ? (Boolean) result[15] : false);
			est.setEst_gstper(result[16] != null ? (BigDecimal) result[16] : null);
			est.setEst_igstper(result[17] != null ? (BigDecimal) result[17] : null);
			est.setEst_othtaxper(result[18] != null ? (BigDecimal) result[18] : null);
			est.setEst_tamt(result[19] != null ? (BigDecimal) result[19] : null);
			est.setEst_discount(result[20] != null ? (BigDecimal) result[20] : null);
			est.setPrev_amt(result[21] != null ? (BigDecimal) result[21] : null);
			est.setPanno(result[22] != null ? (String) result[22] : null);
			est.setGstno(result[23] != null ? (String) result[23] : null);
			est.setEstsbillno(result[24] != null ? (Integer) result[24] : null);
			est.setEstsdate(result[25] != null ? ((java.sql.Date) result[25]).toLocalDate() : null);
			est.setEstyear(result[26] != null ? (Integer) result[26] : null);
			est.setEst_disrate(result[27] != null ? (BigDecimal) result[27] : null);
		}

		return est;
	}

	///////////////////////////////////////////////////////////////////////////////
	public List<TransactionSummaryDTO> getTransactionSummary(int estno) {
		List<Object[]> results = repos.getTransactionSummary(estno);
		List<TransactionSummaryDTO> summary = new ArrayList<>();
		double otheramount = 0;
		for (Object[] result : results) {
			String name = (String) result[0];
			BigDecimal amount = (BigDecimal) result[1];
			BigDecimal gdwt = (BigDecimal) result[2];
			String type = (String) result[3];
			if (amount.doubleValue() < 0) {
				otheramount += amount.doubleValue();
			}

			summary.add(new TransactionSummaryDTO(name, amount, gdwt, type,
					new BigDecimal(otheramount).setScale(2, RoundingMode.HALF_UP)));
		}
		return summary;
	}
	/////////////////////////////////////////////////////////////////////////////////////

	public List<?> getTransactionUpdateVaamt(long estno, boolean vawise) {
		List<?> summary = new ArrayList<>();
		if (vawise) {
			summary = getTransactiondetailscoalesceUpdateVaamt(estno);
		} else {
			summary = getTransactiondetailsUpdateVaamt(estno);
		}
		return summary;
	}

	public List<CoalesceUpdateVadetails> getTransactiondetailscoalesceUpdateVaamt(long estno) {
		List<Object[]> results = new ArrayList<Object[]>();
		results = repos.getTransactionUpdateVaitem(estno);
		List<CoalesceUpdateVadetails> summary = new ArrayList<>();
		for (Object[] result : results) {
			String esticode = (String) result[0];
			BigDecimal estvaper = (BigDecimal) result[1];
			BigDecimal aftervaper = (BigDecimal) result[2];
			String estitemdesce = (String) result[3];
			long itemqtye = (long) result[4];
			BigDecimal estwt = (BigDecimal) result[5];
			BigDecimal esttotalamt = (BigDecimal) result[6];
			int itslno = (int) result[7];
			BigDecimal est_gamt = (BigDecimal) result[8];
			BigDecimal est_stnch = (BigDecimal) result[9];
			BigDecimal est_stnwt = (BigDecimal) result[10];
			BigDecimal est_ntwt = (BigDecimal) result[11];
			BigDecimal est_rate = (BigDecimal) result[12];
			String description = (String) result[13];
			String remarks = (String) result[14];
			String barcode = (String) result[15];
			String prevbarcode = (String) result[16];
			summary.add(new CoalesceUpdateVadetails(esticode, estvaper, aftervaper, estitemdesce, itemqtye, estwt,
					esttotalamt, itslno, est_gamt, est_stnch, est_stnwt, est_ntwt, est_rate, description, remarks,
					barcode, prevbarcode, null, null));
		}
		return summary;
	}

	public List<UpdateVaDetails> getTransactiondetailsUpdateVaamt(long estno) {
		List<Object[]> results = new ArrayList<Object[]>();
		byte[] imagevalue = null;
		String value = "";
		String imagename = "";
		String remarks = "";

		String prevbarcode = "";
		String description = "";
		// results = repos.getTransactionUpdateVa(estno);
		results = repos.getsaleestDetail(estno);
		List<UpdateVaDetails> summary = new ArrayList<>();
		for (Object[] result : results) {
			String esticode = (String) result[0];
			BigDecimal estvaper = (BigDecimal) result[1];
			BigDecimal aftervaper = (BigDecimal) result[2];
			String estitemdesce = (String) result[3];
			Integer itemqtye = (Integer) result[4];
			BigDecimal estwt = (BigDecimal) result[5];
			BigDecimal esttotalamt = (BigDecimal) result[6];
			Integer itslno = (Integer) result[7];
			BigDecimal est_gamt = (BigDecimal) result[8];
			BigDecimal est_stnch = (BigDecimal) result[9];
			BigDecimal est_stnwt = (BigDecimal) result[10];
			BigDecimal est_ntwt = (BigDecimal) result[11];
			BigDecimal est_rate = (BigDecimal) result[12];
			String checkbarcodedummy = (String) result[13];

			List<Object[]> result2 = new ArrayList<Object[]>();
			result2 = repos.getmainstockdetailstotable(checkbarcodedummy);

			for (Object[] resultmainstock : result2) {

				remarks = (String) resultmainstock[0];

				prevbarcode = (String) resultmainstock[2];
			}
			List<Object[]> result3 = new ArrayList<Object[]>();

			result3 = repos.getImagefrommaistock(checkbarcodedummy);
			imagename = "";
			imagevalue = null;
			value = null;
			for (Object[] resultimagedata : result3) {

				description = (String) resultimagedata[0];
				if (resultimagedata[1] != null) {
					imagevalue = (byte[]) resultimagedata[1];

					value = Base64.getEncoder().encodeToString(imagevalue);
					imagename = (String) resultimagedata[2];
				}
			}

			String[] parts = imagename.split("\\.");
			String extension = parts[parts.length - 1]; // "jpg"

			summary.add(new UpdateVaDetails(esticode, estvaper, aftervaper, estitemdesce, itemqtye, estwt, esttotalamt,
					itslno, est_gamt, est_stnch, est_stnwt, est_ntwt, est_rate, description, remarks, checkbarcodedummy,
					prevbarcode, value, extension));
		}
		return summary;
	}
	///////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////

	public List<ModifyVaAmt> modify(List<ModifyVaAmt> modifyVaList, boolean vastatus) {
		if (vastatus) {
			modifyVaList.stream().forEach(modifyVa -> {
				repos.updateSaleestcaolescemethod(modifyVa.getEstno(), modifyVa.getAfterva(),
						modifyVa.getEst_gamt().multiply(modifyVa.getAfterva()).divide(new BigDecimal(100)),
						modifyVa.getIcode(), modifyVa.getActualVa());
			});
		} else {
			modifyVaList.stream().forEach(modifyVa -> {

				repos.updateSaleest(modifyVa.getEstno(), modifyVa.getAfterva(),
						modifyVa.getEst_gamt().multiply(modifyVa.getAfterva()).divide(new BigDecimal(100)),
						modifyVa.getItslno());
			});
		}

		return modifyVaList;
	}

	//////////////////////////////////////////////////////////////////
	public List<SaleestDto> findbysalesstestno(int estno) {
		List<Object[]> results = repos.findByEstnos(estno);
		List<SaleestDto> summary = new ArrayList<>();
		for (Object[] result : results) {
			SaleestDto sales = new SaleestDto((BigDecimal) result[0], (BigDecimal) result[1], (BigDecimal) result[2],
					(BigDecimal) result[3], (BigDecimal) result[4], (BigDecimal) result[5]);

			summary.add(sales);
		}
		////////////////////////////////////////////// ///////////////////////////////

		// getalldata=repos.findByEstnos(estno);
		// for(saleest EST:getalldata)
		// {
		// logger.info("Fetched data: {}", EST);
		// }
		//
		// if (getalldata.isEmpty()) {
		// throw new EntityNotFoundException("No entities found with estno: " + estno);
		// }
		// List<SaleestDto> getalldatadtodata=
		// getalldata.stream().map(saleest->mapper.map(saleest,
		// SaleestDto.class)).collect(Collectors.toList());
		//
		// return getalldatadtodata;

		return summary;
	}

	//
	// public List<modifyVaAmt> modify(List<modifyVaAmt> modifyVaList)
	// {
	// for (modifyVaAmt values:modifyVaList)
	// {
	// repos.updateSaleest(
	// values.getEstno(),
	// values.getAfterva(),
	// (values.getAfterva()*values.getEst_gamt())/100,
	// values.getEst_vaper()
	// );
	// ( values.getEstno()+" "+values.getEst_vaper());
	// }
	// List<modifyVaAmt>values=null;
	// return values;
	// }
	///////////////////////////////////////////////////////////////////////
	public AfterAmount amount(int estno) {
		List<Object[]> results = repos.getafterTransactionSummary(estno);
		AfterAmount est = new AfterAmount();
		for (Object[] result : results) {
			est.setAmount((BigDecimal) result[0]);
		}
		return est;
	}

	/////////////////////////////////////////////////////
	public AfterAmount getdmddiscount() {
		List<Object[]> results = repos.getdmddiscount();
		AfterAmount est = new AfterAmount();
		for (Object[] result : results) {
			est.setAmount((BigDecimal) result[0]);
		}
		return est;
	}

	//////////////////////////////////////////////////////////
	public updateestmstrdmdrateDto updateDmdamt(updateestmstrdmdrateDto dto) {
		repos.updatedmdrate(dto.getEstno(), dto.getDmdrate());
		return dto;
	}
	//////////////////////////////////////////////////////////

	/////////////////////// update va amount and percent using percentage

	//////// update using dmdvalueonly option///////////////////

	/////////////////////////////////////////////// update va and dmd rate by
	/////////////////////////////////////////////// clicking sumbitt button
	public BigDecimal updatevavaamtanddmdratepercentage(updatevavaamtanddmdratepercentageDto dto) {
		BigDecimal avarageStoneRate = BigDecimal.ZERO;
		if (dto.getPercentage().compareTo(BigDecimal.ZERO) > 0) {
			Optional<String> result = repos.checkTheVACalculationConcept();
			Optional<String> resultdmd = repos.checkTheVACalculationdiamondConcept();
			List<Object[]> check = repos.getdmditemss(dto.getEstno());
			//////////// checking size f dmd item carrying array
			if (check.size() > 0) {
				if (resultdmd.isPresent()) {
					BigDecimal percentage = dto.getPercentage();

					/////////////////////// taking half of percentage

					double percentagevalue = percentage.doubleValue();
					String getValue = resultdmd.get(); // Get the value if present
					if (getValue.equals("DMD Value Only")) {
						//// dscount is fully on dmd value
						updatebydmdvalueonly(dto, getValue, percentagevalue, "dmd only");
					} else if (getValue.equals("VA % & DMD Stone")) {

						// ///////////////////////////half percentage of bill amount and DMD Value Only
						// List<UpdateVaamtusingperceninAmount> getVaAmtsss=
						// getVaAmt(dto.getEstno(),halfPercentage,dto.getItslnos());
						// for(UpdateVaamtusingperceninAmount getvadata:getVaAmtsss)
						// {
						// repos.updateaftervausingpercwithamount(dto.getEstno(),getvadata.getEstvaper(),getvadata.getItslno());
						// repos.updateaftervaamtusingpercpercwithamount(dto.getEstno(),getvadata.getEtvaamount(),getvadata.getItslno());
						// }
						// ///////////////////////////////////half of dmd
						// value////////////////////////////////////////
						// updatebydmdvalueonly(dto,getValue,percentagevalue/2);

						/////////////// updating for chungath//////////HALF OF VA PERC AND DIAMOND AMT
						for (int getvadata : dto.getItslnos()) {

							/////////////// updating vaper
							double va = repos.getvaforupdateftreva(Integer.parseInt(dto.getEstno() + ""), getvadata);

							double vapercentage = repos.getAfterVafromPercentage(va);
							repos.updatehalfofvaperc(dto.getEstno(), getvadata, vapercentage);

							repos.updatehalfofvaamt(dto.getEstno(), getvadata);
						}
						updatebydmdvalueonly(dto, getValue, percentagevalue, "dmd and va");

					} else if (getValue.equals("VA %  Only")) {
						repos.updateaftervausingperc(dto.getEstno(), dto.getPercentage());
						repos.updateaftervaamtusingperc(dto.getEstno());
					} else if (getValue.equals("VA %  Discount")) {
						List<updateVaperusingDirectPercentageDTO> getpercentagevalue = getVADiscountpercentage(
								dto.getEstno(), dto.getPercentage(), dto.getItslnos());
						for (updateVaperusingDirectPercentageDTO value : getpercentagevalue) {
							repos.updateaftervausingdirectperc(dto.getEstno(), value.getVaper(), value.getItslnos());
							repos.updateaftervaamtusingdirectperc(dto.getEstno(), value.getItslnos());
						}
					}
				}
			} else {
				if (result.isPresent()) {
					String getValue = result.get(); // Get the value if present
					///////////// option Va only////////////////
					if (getValue.equals("VA % Only")) {
						////////////// Directly updating using query//////////
						repos.updateaftervausingperc(dto.getEstno(), dto.getPercentage());
						repos.updateaftervaamtusingperc(dto.getEstno());
					}
					///////////// option Va&amount based only////////////////
					else if (getValue.equals("VA % Discount")) {

						List<updateVaperusingDirectPercentageDTO> getpercentagevalue = getVADiscountpercentage(
								dto.getEstno(), dto.getPercentage(), dto.getItslnos());
						for (updateVaperusingDirectPercentageDTO value : getpercentagevalue) {
							repos.updateaftervausingdirectperc(dto.getEstno(), value.getVaper(), value.getItslnos());
							repos.updateaftervaamtusingdirectperc(dto.getEstno(), value.getItslnos());
						}
					} else {
						List<UpdateVaamtusingperceninAmount> getVaAmtsss = getVaAmt(dto.getEstno(), dto.getPercentage(),
								dto.getItslnos());
						for (UpdateVaamtusingperceninAmount getvadata : getVaAmtsss) {
							repos.updateaftervausingpercwithamount(dto.getEstno(), getvadata.getEstvaper(),
									getvadata.getItslno());
							repos.updateaftervaamtusingpercpercwithamount(dto.getEstno(), getvadata.getEtvaamount(),
									getvadata.getItslno());
						}

					}
				}

			}
		} else {
		}

		return avarageStoneRate;
	}

	@SuppressWarnings("unused")
	public void getdmdAmt(int estno, BigDecimal percentag, int itslno, String type) {
		BigDecimal valuess = BigDecimal.ZERO;
		BigDecimal taxper = BigDecimal.ZERO;
		double saleamt = 0;
		double taxperce = 0, percentage = percentag.doubleValue();

		BigDecimal totstonechrge = BigDecimal.ZERO;
		double totstonechg = 0;
		BigDecimal stonechrge = BigDecimal.ZERO;

		double stonechg = 0;
		double estamt = 0;

		//////////////// getting required data from database

		if (type.equals("dmd and va")) {
			List<Object[]> results = repos.getsalestandestmstrdataforva(estno);
			for (Object[] result : results) {
				valuess = (BigDecimal) result[4];
				taxper = (BigDecimal) result[5];

			}
			saleamt = valuess.doubleValue();
			taxperce = taxper.doubleValue();
			if (saleamt > 0) {
				double vaamt = 0, vamt1 = 0;
				List<Object[]> resultofva = repos.getsaleestdatafromvamtcalculation(estno);
				for (Object[] result : resultofva) {
					BigDecimal VAPER = (BigDecimal) result[0];
					BigDecimal goldmt = (BigDecimal) result[1];
					if (VAPER == null) {
						VAPER = BigDecimal.ZERO;
					} else {
						Double vapercentage = repos.getAfterVafromPercentage(VAPER.doubleValue());
						if (vapercentage == null) {

							vapercentage = 0.0;
						} else {
							vaamt += (goldmt.doubleValue() * vapercentage) / 100;
							vamt1 += (goldmt.doubleValue() * VAPER.doubleValue()) / 100;
						}
					}
				}
				BigDecimal va = BigDecimal.ZERO;
				va = va.add(repos.getAfterVa(estno));

				saleamt = saleamt - ((saleamt * (100 - percentage)) / 100);
				saleamt = (saleamt * 100) / (100 + taxperce) - (vamt1 - vaamt);
				totstonechrge = repos.getsumstonerate(estno);
				totstonechg = totstonechrge.doubleValue();

				double peramt = 0;
				if (itslno > 0) {

					stonechrge = repos.getsumstoneratewithbyusingit_slno(estno, itslno);
					stonechg = stonechrge.doubleValue();
					peramt = (stonechg / totstonechg) * 100;
					estamt = saleamt * peramt / 100;
					estamt = (estamt / stonechg * 100);
					updatedmdratepercentage(estno, 0, estamt, itslno);

				}
			}
		} else {

			//////////////// getting required data from database

			List<Object[]> results = repos.getsalestandestmstrdataforva(estno);
			for (Object[] result : results) {
				valuess = (BigDecimal) result[4];
				taxper = (BigDecimal) result[5];

			}
			saleamt = valuess.doubleValue();
			taxperce = taxper.doubleValue();

			if (saleamt > 0) {

				saleamt = saleamt - ((saleamt * (100 - percentage)) / 100);
				saleamt = (saleamt * 100) / (100 + taxperce);
				totstonechrge = repos.getsumstonerate(estno);
				totstonechg = totstonechrge.doubleValue();

				double peramt = 0;
				if (itslno > 0) {

					stonechrge = repos.getsumstoneratewithbyusingit_slno(estno, itslno);
					stonechg = stonechrge.doubleValue();
					peramt = (stonechg / totstonechg) * 100;
					estamt = saleamt * peramt / 100;
					estamt = (estamt / stonechg * 100);
					updatedmdratepercentage(estno, 0, estamt, itslno);

				}
			}

		}

	}

	public void updatebydmdvalueonly(updatevavaamtanddmdratepercentageDto dto, String getValues, double percntage,
			String type) {
		BigDecimal percentage = BigDecimal.ZERO;
		percentage = percentage.valueOf(percntage);
		for (int i = 0; i < dto.getItslnos().size(); i++) {

			List<Object[]> getvalue = repos.getdmditem(dto.getEstno(), dto.getItslnos().get(i));
			if (getvalue.size() > 0) {

				getdmdAmt(dto.getEstno(), percentage, dto.getItslnos().get(i), type);

			}

		}
	}

	public void updatedmdratepercentage(int estno, double dmdstndisrate, double disper, int itslno) {
		double stnrate = 0;
		BigDecimal stnrates = BigDecimal.ZERO;
		try {

			if (disper > 0) {
				List<Object[]> results = repos.getdatafordmdratecalculation(estno, itslno);

				for (Object[] result : results) {

					int dslno = (Integer) result[0];
					List<Object[]> results2 = repos.getdatafordmdratecalculation2(estno, dslno);
					for (Object[] result2 : results2) {

						BigDecimal stn_rate = (BigDecimal) result2[0];
						int itslnosaaa = (Integer) result2[1];
						int slno = (Integer) result2[2];
						stnrate = stn_rate.doubleValue();
						stnrate = stnrate - (stnrate * disper) / 100;

						stnrates = stnrates.valueOf(stnrate);

						repos.updatepercentagewisedmdamountupdate(estno, stnrates, itslnosaaa, slno);
					}
				}
			}
			if (dmdstndisrate > 0) {

				List<Object[]> results = repos.getdatafordmdratecalculation(estno, itslno);
				for (Object[] result : results) {
					int dslno = (Integer) result[0];
					List<Object[]> results2 = repos.getdatafordmdratecalculation2(estno, dslno);
					for (Object[] result2 : results2) {
						BigDecimal stn_rate = (BigDecimal) result2[0];
						int itslnosaaa = (Integer) result2[1];
						int slno = (Integer) result2[2];
						stnrate = stn_rate.doubleValue();
						stnrate = stnrate - (dmdstndisrate * 100);
						stnrates = stnrates.valueOf(stnrate);

						repos.updatepercentagewisedmdamountupdate(estno, stnrates, itslnosaaa, slno);
					}
				}
			}

		} catch (Exception ce) {
			logger.error("Error updating percentage wise dmd amount: {}", ce.getMessage(), ce);
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////// updting stnchg and updatestnch to saleestby dmdrate
	/////////////////////////// and afterva equally dividing
	public void updatesaleeststnchg(updateestmstrdmdrateDtoWithFlag dto) {
		BigDecimal stnchg = BigDecimal.ZERO;
		BigDecimal totalstnch = BigDecimal.ZERO;

		BigDecimal afterstnchg = BigDecimal.ZERO;
		BigDecimal aftertotalstnch = BigDecimal.ZERO;

		List<Object[]> results = repos.getsaleeststnchg(dto.getEstno());
		for (Object[] result : results) {
			int itslno = (Integer) result[0];

			List<Object[]> results1 = repos.getest_stnchfromstoneest(dto.getEstno(), itslno);
			for (Object[] result1 : results1) {
				stnchg = (BigDecimal) result1[2];
				totalstnch = totalstnch.add(stnchg);

				afterstnchg = (BigDecimal) result1[1];
				aftertotalstnch = aftertotalstnch.add(afterstnchg);
			}

			// if(doubletotalstnch==doublesaleeststonechg)
			// {
			// repos.updateafterstnchsaleest(dto.getEstno(),aftertotalstnch,itslno);
			// }
			repos.updateafterstnchsaleest(dto.getEstno(), aftertotalstnch, itslno);
			aftertotalstnch = BigDecimal.ZERO;
		}

	}
	///////////////////////////////////// End/////////////////////////////////////////////////////////

	public boolean getVastatusCalculation() {
		return repos.getsetDiscountVaCaluclationStatus();
	}

	////////// calculating dmd rate using percentage of above field OF VA AND DMD
	////////// STONE AMOUNT////////////////////////////

	public List<UpdateVaamtusingperceninAmount> getVaAmt(int estno, BigDecimal percentag, ArrayList<Integer> itslno) {
		BigDecimal valuess = BigDecimal.ZERO;
		BigDecimal taxper = BigDecimal.ZERO;
		double saleamt = 0, saleamountwithouttaxamount = 0;
		double taxperce = 0, percentage = percentag.doubleValue();
		BigDecimal stnchestgmt = BigDecimal.ZERO;
		BigDecimal estgmat = BigDecimal.ZERO;
		BigDecimal vaamt = BigDecimal.ZERO;
		BigDecimal vaper = BigDecimal.ZERO;
		BigDecimal saleamtwihouttax = BigDecimal.ZERO;
		List<UpdateVaamtusingperceninAmount> getupdatedata = new ArrayList<UpdateVaamtusingperceninAmount>();
		//////////////// getting required data from database
		List<Object[]> results = repos.getsalestandestmstrdataforva(estno);
		for (Object[] result : results) {
			valuess = (BigDecimal) result[4];
			taxper = (BigDecimal) result[5];
			saleamtwihouttax = (BigDecimal) result[3];
		}
		saleamt = valuess.doubleValue();
		taxperce = taxper.doubleValue();
		saleamountwithouttaxamount = saleamtwihouttax.doubleValue();
		if (saleamt > 0) {
			saleamt = saleamt - ((saleamt * percentage) / 100);
			saleamt = (saleamt * 100) / (100 + taxperce);
			double stnchgplusgmat = 0;
			double estgoldamt = 0;
			double estvaamt = 0, peramt = 0, estmamt = 0, vapercentage = 0;
			if (itslno.size() > 0) {
				for (Integer itslnos : itslno) {
					/////////////////// getting current holding va percentage in database
					List<Object[]> getvaperandamt = repos.getvaperandamt(estno, itslnos);

					for (Object[] result : getvaperandamt) {
						stnchestgmt = (BigDecimal) result[0];
						estgmat = (BigDecimal) result[1];
						vaamt = (BigDecimal) result[2];
						stnchgplusgmat = stnchestgmt.doubleValue();
						estgoldamt = estgmat.doubleValue();
						estvaamt = vaamt.doubleValue();
						peramt = ((estvaamt / saleamountwithouttaxamount)) * 100;
						estmamt = saleamt * peramt / 100;
						////////////////////////// CHECK HERE
						stnchgplusgmat = (estmamt - stnchgplusgmat);
						vapercentage = (stnchgplusgmat / estgoldamt) * 100;
						vaamt = BigDecimal.valueOf(stnchgplusgmat);
						vaper = BigDecimal.valueOf(vapercentage);

						getupdatedata.add(new UpdateVaamtusingperceninAmount(vaper, vaamt, itslnos));
					}
				}

			}

		}
		return getupdatedata;

	}

	public List<updateVaperusingDirectPercentageDTO> getVADiscountpercentage(int estno, BigDecimal percentag,
			ArrayList<Integer> slno) {
		List<updateVaperusingDirectPercentageDTO> vadicountedpercentage = new ArrayList<updateVaperusingDirectPercentageDTO>();
		double percentage = 0;
		percentage = percentag.doubleValue();
		BigDecimal vaper = BigDecimal.ZERO;
		double vapercentage = 0;
		for (Integer slnos : slno) {
			List<Object[]> results = repos.getvapercentage(estno, slnos);
			for (Object[] result : results) {
				vaper = (BigDecimal) result[0];
				vapercentage = vaper.doubleValue();
				vapercentage = vapercentage - percentage;
				vaper = BigDecimal.valueOf(vapercentage);
				vadicountedpercentage.add(new updateVaperusingDirectPercentageDTO(slnos, vaper));
			}
		}
		return vadicountedpercentage;
	}

	//////////////////////////////////////////////
	public boolean checkisitdiamond(int estno) {
		boolean present = false;
		List<String> results = repos.checkitisdiamonditem(estno);
		if (results.size() > 0) {
			present = true;
		}
		return present;
	}
	//////////////////////////////////////////////////////

	public double maximumamountindmdrate() {
		double present = 0;
		Optional<BigDecimal> results = repos.maximumamountindmdratefield();

		if (results.isPresent()) {
			BigDecimal value = results.get();
			present = value.doubleValue();
		}
		return present;
	}

	///////////////////////////////////////////////////////////

	public boolean checkestnobilledornotincashmarking(int estno) {
		boolean present = false;
		Optional<Integer> results = repos.findcheckestnobilledornot(estno);

		if (results.isPresent()) {
			present = true;
		}
		return present;
	}
	////////////////////////////////////////////////////////////////////

	///////////////////////////// customer
	///////////////////////////// launge////////////////////////////////////////////////////////////////
	// public List<getCategoryWiseItemWiseForCustomerDTO>
	// getCategoryWiseItemWiseForCustomer(String categryName)
	// {
	// List<Object[]> results = repos.getCategoryWiseItemWiseDesign(categryName);
	// List<getCategoryWiseItemWiseForCustomerDTO> summary = new ArrayList<>();
	//
	// for (Object[] result : results)
	// {
	//
	//
	// String dslno= (String) result[0];
	// String name = (String) result[1];
	// String item_desc = (String) result[2];
	// String description = (String) result[3];
	// byte[] type = (byte[] ) result[4];
	//
	// summary.add(new getCategoryWiseItemWiseForCustomerDTO(dslno,name, item_desc,
	// description,type));
	// }
	// return summary;
	// }

	public void resetVadetails(String estno) {
		if (!estno.equals("")) {
			repos.resetestno(estno);
			repos.resetestmstrestno(estno);
		}

	}

	public byte[] getCompanyImage() {
		// Explicitly retrieve and cast the result
		Object imageObject = repos.getCompanyImage();
		return imageObject != null ? (byte[]) imageObject : null;
	}

	public void saveEstimate(SetEstMstrDto dto) {
		repos.insertEstMstr(dto.getEstNo(), dto.getEstDte(), dto.getEstGrate(), dto.getUserid(), dto.getCustId(),
				dto.getCustName(), dto.getAdd1(), dto.getAdd2(), dto.getAdd3(), dto.getPin(), dto.getPhone(),
				dto.getSman1(), dto.getSman2(), dto.getOptr(), dto.getGoldSlv(), dto.getBarFlag(), dto.getGstPer(),
				dto.getIgstPer(), dto.getOthTaxPer(), dto.getTamt(), dto.getDiscount(), dto.getPrevAmt(),
				dto.getPanNo(), dto.getGstNo(), dto.getEstSBillNo(), dto.getEstSDate(), dto.getEstYear(),
				dto.getShopCode());
	}

	public Map<String, Object> getGiftDetails(int estno) {
		List<Object[]> results = repos.findGiftDetailsByEstNo(estno);
		Map<String, Object> response = new HashMap<>();
		response.put("estNo", estno);
		if (results != null && !results.isEmpty()) {
			Object[] row = results.get(0);
			response.put("gift_no", row[0] != null ? row[0].toString() : "0");
			response.put("collamt", row[1] != null ? row[1] : 0);
			boolean flag = false;
			if (row[2] instanceof Boolean) {
				flag = (Boolean) row[2];
			} else if (row[2] != null) {
				flag = Boolean.parseBoolean(row[2].toString());
			}
			response.put("barcode_flag", flag);
		} else {
			response.put("gift_no", "0");
			response.put("collamt", 0);
			response.put("barcode_flag", false);
		}
		return response;
	}

	public void updateGiftDetailsByEstNo(int estno, String giftNo, BigDecimal collAmt, boolean barcodeFlag) {
		repos.updateGiftDetailsByEstNo(estno, giftNo != null ? giftNo : "0", collAmt != null ? collAmt : BigDecimal.ZERO, barcodeFlag);
	}

	public void updateGiftDetails(UpdateGiftDetailsDto dto) {
		if (dto != null && dto.getEstNo() != null) {
			updateGiftDetailsByEstNo(
				dto.getEstNo(),
				dto.getGiftNo(),
				dto.getCollAmt(),
				dto.getBarcodeFlag() != null ? dto.getBarcodeFlag() : false
			);
		}
	}

	public void resetGiftDetails(int estno) {
		repos.resetGiftDetailsByEstNo(estno);
	}

	public void updateBarcodeFlag(int estno, boolean barcodeFlag) {
		repos.updateBarcodeFlagByEstNo(estno, barcodeFlag);
	}

	public Map<String, Object> getBarcodeFlag(int estno) {
		Boolean flag = repos.findBarcodeFlagByEstNo(estno);
		Map<String, Object> response = new HashMap<>();
		response.put("estNo", estno);
		response.put("barcode_flag", flag != null ? flag : false);
		return response;
	}

}

