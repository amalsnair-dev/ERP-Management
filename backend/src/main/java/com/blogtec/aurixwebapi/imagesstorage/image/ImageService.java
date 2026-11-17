package com.blogtec.aurixwebapi.imagesstorage.image;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.blogtec.aurixwebapi.dto.DesignImageResponse;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.nio.file.attribute.UserPrincipal;
import java.nio.file.attribute.UserPrincipalLookupService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@SuppressWarnings("null")
public class ImageService {

	private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

	private final JdbcTemplate jdbcTemplate;
	private final ImagePathService imagePathService;

	public ImageService(JdbcTemplate jdbcTemplate, ImagePathService imagePathService) {
		this.jdbcTemplate = jdbcTemplate;
		this.imagePathService = imagePathService;
	}

	// ---------------------------------------------------------
	// Upload Single Image
	// ---------------------------------------------------------
	public String saveImage(int dcode, String dsgnName, MultipartFile file) {

		try {

			String uploadDir = imagePathService.getUploadDirectory();

			if (file == null || file.isEmpty()) {
				return "File is empty";
			}

			String cleanName = dsgnName.replaceAll("[^a-zA-Z0-9]", "_");

			File folder = new File(uploadDir + "/" + dcode);

			if (!folder.exists()) {
				folder.mkdirs();
			}

			String filePath = uploadDir + "/" + dcode + "/" + cleanName + ".jpg";

			File destFile = new File(filePath);
			file.transferTo(destFile);

			return "Image saved successfully";

		} catch (Exception e) {
			logger.error("Upload failed for design code {}: {}", dcode, e.getMessage(), e);
			return "Upload failed : " + e.getMessage();
		}
	}

	// ---------------------------------------------------------
	// Migrate ALL Images (BYTEA → Folder)
	// ---------------------------------------------------------

	public String updateAllImages() {

		final int batchSize = 1000;
		int offset = 0;
		int totalProcessed = 0;
		int totalSaved = 0;

		String query = "SELECT slno, dcode, dsgn_name, image_data " +
				"FROM bar_subdesignmaster " +
				"WHERE image_data IS NOT NULL " +
				"ORDER BY dcode " +
				"LIMIT ? OFFSET ?";

		try {

			String uploadDir = imagePathService.getUploadDirectory();
			File rootFolder = new File(uploadDir);

			if (rootFolder.exists()) {
				deleteFolder(rootFolder);
			}

			if (!rootFolder.mkdirs() && !rootFolder.exists()) {
				throw new IOException("Cannot create: " + uploadDir);
			}

			set777(rootFolder.toPath());
			setOwnerTomcat(rootFolder.toPath());

			while (true) {

				final int currentOffset = offset;
				int[] batchProcessedCount = new int[1];
				int[] batchSavedCount = new int[1];

				jdbcTemplate.query(
						query,
						ps -> {
							ps.setInt(1, batchSize);
							ps.setInt(2, currentOffset);
							ps.setFetchSize(batchSize);
						},
						rs -> {

							int slno = rs.getInt("slno");
							int dcode = rs.getInt("dcode");
							String originalName = rs.getString("dsgn_name");

							batchProcessedCount[0]++;

							String cleanName;
							if (originalName == null || originalName.isBlank()) {
								cleanName = "image_" + slno;
							} else {
								cleanName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
							}

							File folder = new File(rootFolder, String.valueOf(dcode));

							if (!folder.exists()) {
								folder.mkdirs();
								set777(folder.toPath());
								setOwnerTomcat(folder.toPath());
							}

							File imageFile = new File(folder, cleanName + ".jpg");
							if (imageFile.exists()) {
								imageFile = new File(folder, cleanName + "_" + slno + ".jpg");
							}

							try (
									InputStream is = rs.getBinaryStream("image_data");

									FileOutputStream fos = new FileOutputStream(imageFile)) {

								byte[] buffer = new byte[8192];

								int bytesRead;
								long totalBytesRead = 0;

								if (is != null) {
									while ((bytesRead = is.read(buffer)) != -1) {
										fos.write(buffer, 0, bytesRead);
										totalBytesRead += bytesRead;
									}
									if (totalBytesRead > 0) {
										batchSavedCount[0]++;
									}
								}

								if (totalBytesRead == 0) {
									fos.close();
									imageFile.delete();
								}

							} catch (IOException e) {
								throw new RuntimeException(e);
							}

							set777(imageFile.toPath());
							setOwnerTomcat(imageFile.toPath());
						});

				if (batchProcessedCount[0] == 0) {
					break;
				}

				totalProcessed += batchProcessedCount[0];
				totalSaved += batchSavedCount[0];
				offset += batchSize;

				logger.info("Records checked: {}, Files saved: {}, Offset: {}", totalProcessed, totalSaved, offset);
			}

			return "All images migrated successfully. Total DB records processed: " + totalProcessed
					+ ", Total files saved: " + totalSaved;

		} catch (Exception e) {

			logger.error("Image migration failed: {}", e.getMessage(), e);

			return "Migration failed: " + e.getMessage();
		}
	}

	// public String updateAllImages() {
	//
	// String query =
	// "SELECT bs.dcode, bs.dsgn_name, bs.image_data " +
	// "FROM bar_designmaster bd " +
	// "LEFT JOIN bar_subdesignmaster bs ON bs.dcode = bd.code " +
	// "WHERE bs.image_data IS NOT NULL";
	//
	// try {
	//
	// String uploadDir = imagePathService.getUploadDirectory();
	//
	// // STEP 1: Delete old images
	// File rootFolder = new File(uploadDir);
	//
	// if (rootFolder.exists()) {
	// deleteFolder(rootFolder);
	// }
	//
	// if (!rootFolder.mkdirs() && !rootFolder.exists()) {
	// throw new IOException(
	// "Unable to create directory: " + uploadDir);
	// }
	//
	// // Set root directory permission + owner
	// set777(rootFolder.toPath());
	// setOwnerTomcat(rootFolder.toPath());
	//
	// // STEP 2: Insert fresh images
	// jdbcTemplate.query(query, (ResultSet rs) -> {
	//
	// while (rs.next()) {
	//
	// try {
	//
	// int dcode = rs.getInt("dcode");
	// String originalName = rs.getString("dsgn_name");
	//
	// if (originalName == null) {
	// continue;
	// }
	//
	// String cleanName =
	// originalName.replaceAll("[^a-zA-Z0-9]", "_");
	//
	// File folder =
	// new File(uploadDir + "/" + dcode);
	//
	// if (!folder.exists()) {
	//
	// if (!folder.mkdirs()) {
	// throw new IOException(
	// "Unable to create directory: "
	// + folder.getAbsolutePath());
	// }
	//
	// // 777 + tomcat
	// set777(folder.toPath());
	// setOwnerTomcat(folder.toPath());
	// }
	//
	// String filePath =
	// uploadDir + "/"
	// + dcode + "/"
	// + cleanName + ".jpg";
	//
	// File imageFile = new File(filePath);
	//
	// try (
	// InputStream is =
	// rs.getBinaryStream("image_data");
	//
	// FileOutputStream fos =
	// new FileOutputStream(imageFile)
	// ) {
	//
	// byte[] buffer = new byte[8192];
	//
	// int bytesRead;
	//
	// while ((bytesRead = is.read(buffer)) != -1) {
	// fos.write(buffer, 0, bytesRead);
	// }
	// }
	//
	// // Set image permission + owner
	// set777(imageFile.toPath());
	// setOwnerTomcat(imageFile.toPath());
	//
	// } catch (Exception e) {
	// e.printStackTrace();
	// }
	// }
	// });
	//
	// return "All images migrated successfully";
	//
	// } catch (Exception e) {
	//
	// e.printStackTrace();
	//
	// return "Migration failed : " + e.getMessage();
	// }
	// }
	// public String updateAllImages() {
	//
	// String query = "SELECT bs.dcode, bs.dsgn_name, bs.image_data " + "FROM
	// bar_designmaster bd "
	// + "LEFT JOIN bar_subdesignmaster bs ON bs.dcode = bd.code " + "WHERE
	// bs.image_data IS NOT NULL";
	//
	// try {
	//
	// String uploadDir = imagePathService.getUploadDirectory();
	//
	// // STEP 1 : Delete old images
	// File rootFolder = new File(uploadDir);
	// if (rootFolder.exists()) {
	// deleteFolder(rootFolder);
	// }
	// rootFolder.mkdirs();
	//
	// // STEP 2 : Insert fresh images
	// jdbcTemplate.query(query, (ResultSet rs) -> {
	//
	// while (rs.next()) {
	//
	// try {
	//
	// int dcode = rs.getInt("dcode");
	// String originalName = rs.getString("dsgn_name");
	//
	// if (originalName == null)
	// continue;
	//
	// String cleanName = originalName.replaceAll("[^a-zA-Z0-9]", "_");
	//
	// File folder = new File(uploadDir + "/" + dcode);
	//
	// if (!folder.exists()) {
	// folder.mkdirs();
	// }
	//
	// set777(rootFolder.toPath());
	// setOwnerTomcat(rootFolder.toPath());
	//
	//
	// String filePath = uploadDir + "/" + dcode + "/" + cleanName + ".jpg";
	//
	// File imageFile = new File(filePath);
	//
	// try (InputStream is = rs.getBinaryStream("image_data");
	// FileOutputStream fos = new FileOutputStream(imageFile)) {
	//
	// byte[] buffer = new byte[8192];
	// int bytesRead;
	//
	// while ((bytesRead = is.read(buffer)) != -1) {
	// fos.write(buffer, 0, bytesRead);
	// }
	// }
	//
	// } catch (Exception e) {
	// e.printStackTrace();
	// }
	// }
	// });
	//
	// return "All images migrated successfully";
	//
	// } catch (Exception e) {
	// return "Migration failed : " + e.getMessage();
	// }
	// }

	private void deleteFolder(File folder) {

		File[] files = folder.listFiles();

		if (files != null) {
			for (File file : files) {
				if (file.isDirectory()) {
					deleteFolder(file);
				} else {
					file.delete();
				}
			}
		}

		folder.delete();
	}

	// ---------------------------------------------------------
	// Migrate Images by Design Code
	// ---------------------------------------------------------
	@SuppressWarnings("deprecation")
	public String updateImages(int dcode) {

		String query = "SELECT bs.dsgn_name, bs.image_data " + "FROM bar_subdesignmaster bs "
				+ "WHERE bs.image_data IS NOT NULL AND bs.dcode = ?";

		try {

			String uploadDir = imagePathService.getUploadDirectory();

			File folder = new File(uploadDir, String.valueOf(dcode));

			// Delete old images
			if (folder.exists()) {
				File[] files = folder.listFiles();
				if (files != null) {
					for (File f : files) {
						f.delete();
					}
				}
			} else {
				folder.mkdirs();
			}

			jdbcTemplate.query(query, ps -> ps.setLong(1, dcode), rs -> {

				String originalName = rs.getString("dsgn_name");
				if (originalName == null) {
					return;
				}

				InputStream is = rs.getBinaryStream("image_data");
				if (is == null) {
					return;
				}

				String cleanName = originalName.replaceAll("[^a-zA-Z0-9]", "_");

				File imageFile = new File(folder, cleanName + ".jpg");

				try (FileOutputStream fos = new FileOutputStream(imageFile)) {

					byte[] buffer = new byte[4096];
					int bytesRead;

					while ((bytesRead = is.read(buffer)) != -1) {
						fos.write(buffer, 0, bytesRead);
					}

				} catch (FileNotFoundException e) {
					logger.error("Image file not found during migration: {}", e.getMessage(), e);
				} catch (IOException e) {
					logger.error("IO error during image migration: {}", e.getMessage(), e);
				}

			});

			return "Images migrated successfully";

		} catch (Exception e) {
			logger.error("Batch image migration error: {}", e.getMessage(), e);
			return "Migration error : " + e.getMessage();
		}
	}

	// ---------------------------------------------------------
	// View Image
	// ---------------------------------------------------------

	private boolean isBarcodeImageFromServer() {
		try {
			String sql = "SELECT flag FROM setdiscount WHERE details = 'BARCODE IMAGE FROM SERVER' AND flag = true";
			List<Boolean> flags = jdbcTemplate.queryForList(sql, Boolean.class);
			return !flags.isEmpty() && Boolean.TRUE.equals(flags.get(0));
		} catch (Exception e) {
			return false;
		}
	}

	private File findImageInFolder(File folder, String targetName) {
		if (folder == null || !folder.exists() || !folder.isDirectory()) {
			return null;
		}

		if (targetName != null && !targetName.trim().isEmpty()) {
			String cleanDash = targetName.replaceAll("[^a-zA-Z0-9._-]", "_");
			String cleanStrict = targetName.replaceAll("[^a-zA-Z0-9]", "_");
			String spaceToUnderscore = targetName.replace(' ', '_');

			File[] candidates = new File[] {
					new File(folder, targetName),
					new File(folder, targetName + ".jpg"),
					new File(folder, targetName + ".png"),
					new File(folder, targetName + ".jpeg"),
					new File(folder, spaceToUnderscore),
					new File(folder, spaceToUnderscore + ".jpg"),
					new File(folder, spaceToUnderscore + ".png"),
					new File(folder, spaceToUnderscore + ".jpeg"),
					new File(folder, cleanDash),
					new File(folder, cleanDash + ".jpg"),
					new File(folder, cleanDash + ".png"),
					new File(folder, cleanDash + ".jpeg"),
					new File(folder, cleanStrict + ".jpg"),
					new File(folder, cleanStrict + ".png"),
					new File(folder, cleanStrict + ".jpeg")
			};

			for (File candidate : candidates) {
				if (candidate.exists() && candidate.isFile()) {
					return candidate;
				}
			}
		}

		File[] images = folder.listFiles((dir, name) -> name.toLowerCase().endsWith(".jpg")
				|| name.toLowerCase().endsWith(".jpeg") || name.toLowerCase().endsWith(".png"));

		if (images != null && images.length > 0) {
			java.util.Arrays.sort(images, (a, b) -> a.getName().compareToIgnoreCase(b.getName()));
			return images[0];
		}

		return null;
	}

	public ResponseEntity<Resource> viewImageByDesign(int dcode, String dsgnName) {

		try {

			if (isBarcodeImageFromServer()) {
				String dbSql = "SELECT image_data FROM bar_subdesignmaster WHERE (dcode = ? OR ? = 0) AND (dsgn_name = ? OR description = ? OR slno::text = ?) AND image_data IS NOT NULL";
				List<byte[]> list = jdbcTemplate.query(dbSql, (rs, rowNum) -> rs.getBytes("image_data"), dcode, dcode,
						dsgnName, dsgnName, dsgnName);
				if (list.isEmpty() && dsgnName != null && !dsgnName.trim().isEmpty()) {
					String fallbackSql = "SELECT image_data FROM bar_subdesignmaster WHERE (dsgn_name = ? OR description = ?) AND image_data IS NOT NULL";
					list = jdbcTemplate.query(fallbackSql, (rs, rowNum) -> rs.getBytes("image_data"), dsgnName,
							dsgnName);
				}
				if (list.isEmpty() && dcode != 0) {
					String fallbackSql = "SELECT image_data FROM bar_subdesignmaster WHERE dcode = ? AND image_data IS NOT NULL";
					list = jdbcTemplate.query(fallbackSql, (rs, rowNum) -> rs.getBytes("image_data"), dcode);
				}
				if (!list.isEmpty() && list.get(0) != null && list.get(0).length > 0) {
					Resource resource = new ByteArrayResource(list.get(0));
					return ResponseEntity.ok()
							.header("Cache-Control", "public, max-age=604800, must-revalidate")
							.contentType(MediaType.IMAGE_JPEG)
							.body(resource);
				}

				Resource resource = new ClassPathResource("image/noimage.jpg");
				return ResponseEntity.ok()
						.header("Cache-Control", "public, max-age=604800, must-revalidate")
						.contentType(MediaType.IMAGE_JPEG)
						.body(resource);
			} else {
				String uploadDir = imagePathService.getUploadDirectory();
				File folder = new File(uploadDir, String.valueOf(dcode));

				File imageFile = findImageInFolder(folder, dsgnName);

				Resource resource;
				MediaType mediaType = MediaType.IMAGE_JPEG;

				if (imageFile != null && imageFile.exists()) {
					resource = new UrlResource(imageFile.toURI());
					if (imageFile.getName().toLowerCase().endsWith(".png")) {
						mediaType = MediaType.IMAGE_PNG;
					}
				} else {
					resource = new ClassPathResource("image/noimage.jpg");
				}

				return ResponseEntity.ok()
						.header("Cache-Control", "public, max-age=604800, must-revalidate")
						.contentType(mediaType)
						.body(resource);
			}

		} catch (Exception e) {

			Resource resource = new ClassPathResource("image/noimage.jpg");

			return ResponseEntity.ok()
					.header("Cache-Control", "public, max-age=604800, must-revalidate")
					.contentType(MediaType.IMAGE_JPEG)
					.body(resource);
		}
	}

	public ResponseEntity<Resource> viewImageByDesignCODE(int dcode, String fileName) {

		try {

			if (isBarcodeImageFromServer()) {
				String dbSql = "SELECT image_data FROM bar_subdesignmaster WHERE (dcode = ? OR ? = 0) AND (dsgn_name = ? OR description = ? OR slno::text = ?) AND image_data IS NOT NULL";
				List<byte[]> list = jdbcTemplate.query(dbSql, (rs, rowNum) -> rs.getBytes("image_data"), dcode, dcode,
						fileName, fileName, fileName);

				if (list.isEmpty() && fileName != null && !fileName.trim().isEmpty()) {
					String fallbackSql = "SELECT image_data FROM bar_subdesignmaster WHERE (dsgn_name = ? OR description = ?) AND image_data IS NOT NULL";
					list = jdbcTemplate.query(fallbackSql, (rs, rowNum) -> rs.getBytes("image_data"), fileName,
							fileName);
				}

				if (list.isEmpty() && dcode != 0) {
					String fallbackSql = "SELECT image_data FROM bar_subdesignmaster WHERE dcode = ? AND image_data IS NOT NULL";
					list = jdbcTemplate.query(fallbackSql, (rs, rowNum) -> rs.getBytes("image_data"), dcode);
				}

				if (!list.isEmpty() && list.get(0) != null && list.get(0).length > 0) {
					Resource resource = new ByteArrayResource(list.get(0));
					return ResponseEntity.ok()
							.header("Cache-Control", "public, max-age=604800, must-revalidate")
							.contentType(MediaType.IMAGE_JPEG)
							.body(resource);
				}

				Resource resource = new ClassPathResource("image/noimage.jpg");
				return ResponseEntity.ok()
						.header("Cache-Control", "public, max-age=604800, must-revalidate")
						.contentType(MediaType.IMAGE_JPEG)
						.body(resource);
			} else {
				String uploadDir = imagePathService.getUploadDirectory();
				File folder = new File(uploadDir, String.valueOf(dcode));

				File imageFile = findImageInFolder(folder, fileName);

				Resource resource;
				MediaType mediaType = MediaType.IMAGE_JPEG;

				if (imageFile != null && imageFile.exists()) {
					resource = new UrlResource(imageFile.toURI());
					if (imageFile.getName().toLowerCase().endsWith(".png")) {
						mediaType = MediaType.IMAGE_PNG;
					}
				} else {
					resource = new ClassPathResource("image/noimage.jpg");
				}

				return ResponseEntity.ok()
						.header("Cache-Control", "public, max-age=604800, must-revalidate")
						.contentType(mediaType)
						.body(resource);
			}

		} catch (Exception e) {

			Resource resource = new ClassPathResource("image/noimage.jpg");

			return ResponseEntity.ok()
					.header("Cache-Control", "public, max-age=604800, must-revalidate")
					.contentType(MediaType.IMAGE_JPEG)
					.body(resource);
		}
	}

	private static final boolean IS_UNIX = !System.getProperty("os.name").toLowerCase().contains("win");

	private void set777(Path path) {
		if (!IS_UNIX)
			return;
		try {
			Set<PosixFilePermission> permissions = PosixFilePermissions.fromString("rwxrwxrwx");
			Files.setPosixFilePermissions(path, permissions);
		} catch (Exception ignored) {
		}
	}

	private void setOwnerTomcat(Path path) {
		if (!IS_UNIX)
			return;
		try {
			UserPrincipalLookupService lookupService = path.getFileSystem().getUserPrincipalLookupService();
			UserPrincipal tomcat = lookupService.lookupPrincipalByName("tomcat");
			Files.setOwner(path, tomcat);
		} catch (Exception ignored) {
		}
	}

	public ResponseEntity<DesignImageResponse> getDesignImages(int dcode) {

		List<String> images = new ArrayList<>();

		try {

			if (isBarcodeImageFromServer()) {
				String dbSql = "SELECT slno, dsgn_name FROM bar_subdesignmaster WHERE dcode = ? AND image_data IS NOT NULL";
				List<Map<String, Object>> rows = jdbcTemplate.queryForList(dbSql, dcode);
				for (Map<String, Object> row : rows) {
					Object dsgnName = row.get("dsgn_name");
					Object slno = row.get("slno");
					String name = dsgnName != null ? dsgnName.toString() : (slno != null ? slno.toString() : "");
					if (!name.isEmpty()) {
						String url = "/image/designview?dcode=" + dcode + "&file=" + name;
						images.add(url);
					}
				}
			} else {
				String uploadDir = imagePathService.getUploadDirectory();
				File folder = new File(uploadDir, String.valueOf(dcode));

				if (folder.exists() && folder.isDirectory()) {

					File[] files = folder.listFiles((dir, name) -> name.toLowerCase().endsWith(".jpg")
							|| name.toLowerCase().endsWith(".jpeg") || name.toLowerCase().endsWith(".png"));

					if (files != null) {

						for (File file : files) {

							String url = "/image/designview?dcode=" + dcode + "&file=" + file.getName();

							images.add(url);
						}
					}
				}
			}

			if (images.isEmpty()) {
				images.add("/image/noimage");
			}

		} catch (Exception e) {
			images.add("/image/noimage");
		}

		DesignImageResponse response = new DesignImageResponse(images.size(), images);

		return ResponseEntity.ok(response);
	}

	public ResponseEntity<Resource> getNoImage() {

		try {

			Resource resource = new ClassPathResource("image/noimage.jpg");

			return ResponseEntity.ok()
					.header("Cache-Control", "public, max-age=604800, must-revalidate")
					.contentType(MediaType.IMAGE_JPEG)
					.body(resource);

		} catch (Exception e) {

			return ResponseEntity.notFound().build();
		}
	}

	public ResponseEntity<Resource> viewImageByBarcode(String barcode) {

		try {

			if (isBarcodeImageFromServer()) {
				String dbImageSql = """
						SELECT DISTINCT subdesign.image_data
						FROM mainstock m
						JOIN bar_subdesignmaster subdesign ON m.designcode = subdesign.dsgn_name
						WHERE m.barcode = ? AND subdesign.image_data IS NOT NULL
						""";
				List<byte[]> list = jdbcTemplate.query(dbImageSql, (rs, rowNum) -> rs.getBytes("image_data"), barcode);
				if (!list.isEmpty() && list.get(0) != null && list.get(0).length > 0) {
					Resource resource = new ByteArrayResource(list.get(0));
					return ResponseEntity.ok()
							.header("Cache-Control", "public, max-age=604800, must-revalidate")
							.contentType(MediaType.IMAGE_JPEG)
							.body(resource);
				}
			}

			String sql = """
					SELECT DISTINCT m.designcode,
					                design.code
					FROM mainstock m
					JOIN bar_subdesignmaster subdesign
					     ON m.designcode = subdesign.dsgn_name
					JOIN bar_itemdesignsizewtmaster bid
					     ON bid.entryno = m.dslno
					JOIN bar_designmaster design
					     ON design.code = bid.design
					WHERE m.barcode = ?
					""";

			List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, barcode);

			if (result.isEmpty()) {
				Resource resource = new ClassPathResource("image/noimage.jpg");

				return ResponseEntity.ok()
						.header("Cache-Control", "public, max-age=604800, must-revalidate")
						.contentType(MediaType.IMAGE_JPEG)
						.body(resource);
			}

			Map<String, Object> row = result.get(0);

			String dsgnName = row.get("designcode") != null
					? row.get("designcode").toString()
					: "";

			Integer dcode = row.get("code") != null
					? ((Number) row.get("code")).intValue()
					: 0;

			return viewImageByDesign(dcode, dsgnName);

		} catch (Exception e) {
			logger.error("Failed to view image by tag: {}", e.getMessage(), e);

			Resource resource = new ClassPathResource("image/noimage.jpg");

			return ResponseEntity.ok()
					.header("Cache-Control", "public, max-age=604800, must-revalidate")
					.contentType(MediaType.IMAGE_JPEG)
					.body(resource);
		}
	}
}