-- MyMoons Art Gallery — full database (tables + demo data)
-- Generated 2026-10-03T13:41:32.656Z from the local development database.
-- Import into an EMPTY database (phpMyAdmin → select database → Import). Compatible with MySQL 8 and MariaDB 10.5+.
-- Image URLs point to https://mymoonsgallery.com/media/... — upload backend/uploads to the server so they resolve.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

--
-- ------------------------------------------------------

/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Artist`
--

DROP TABLE IF EXISTS `Artist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Artist` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `displayName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('INDIVIDUAL','STUDIO','GALLERY','CREATIVE_BUSINESS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INDIVIDUAL',
  `status` enum('PENDING_APPROVAL','APPROVED','REJECTED','SUSPENDED','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_APPROVAL',
  `avatarUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverImageUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `acceptsCustomArt` tinyint(1) NOT NULL DEFAULT '1',
  `customArtBasePrice` decimal(12,2) DEFAULT NULL,
  `followerCount` int NOT NULL DEFAULT '0',
  `ratingAverage` decimal(3,2) NOT NULL DEFAULT '0.00',
  `ratingCount` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Artist_userId_key` (`userId`),
  UNIQUE KEY `Artist_slug_key` (`slug`),
  KEY `Artist_status_idx` (`status`),
  CONSTRAINT `Artist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Artist`
--

/*!40000 ALTER TABLE `Artist` DISABLE KEYS */;
INSERT INTO `Artist` (`id`, `userId`, `displayName`, `slug`, `type`, `status`, `avatarUrl`, `coverImageUrl`, `isFeatured`, `acceptsCustomArt`, `customArtBasePrice`, `followerCount`, `ratingAverage`, `ratingCount`, `createdAt`, `updatedAt`) VALUES ('cmus4gwzb00347k9o7jpqfl1i','cmus4gwzb00317k9oa3ttabyd','Meera Iyer Studio','meera-iyer-studio','INDIVIDUAL','APPROVED','https://mymoonsgallery.com/media/artists/1791015640098-1035.webp','https://mymoonsgallery.com/media/artworks/1791022183675-NywmrEMKjX_v.webp',1,1,3500.00,183,4.50,2,'2026-10-03 08:20:40.823','2026-10-03 10:10:34.763'),('cmus4h1iv00557k9oobpdcfx0','cmus4h1iv00527k9ojjjarwip','Kapoor Contemporary','kapoor-contemporary','GALLERY','APPROVED','https://mymoonsgallery.com/media/artists/1791015645831-1043.webp','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0.webp',1,1,9000.00,57,4.50,2,'2026-10-03 08:20:46.711','2026-10-03 10:10:34.825'),('cmus4h652006v7k9od0w60tg6','cmus4h652006s7k9oja5jhlje','Lena Fischer','lena-fischer','INDIVIDUAL','APPROVED','https://mymoonsgallery.com/media/artists/1791015652181-1050.webp','https://mymoonsgallery.com/media/artworks/1791022164064-7SiEu8wXqmg0.webp',1,1,5000.00,201,5.00,2,'2026-10-03 08:20:52.694','2026-10-03 10:10:34.893'),('cmus4h9jq008n7k9okcz2sm88','cmus4h9jq008k7k9o8nyp4k95','Kavya Nair Art','kavya-nair-art','INDIVIDUAL','APPROVED','https://mymoonsgallery.com/media/artists/1791015656375-1057.webp','https://mymoonsgallery.com/media/artworks/1791022129216-aYbTttzaH0r6.webp',1,1,2500.00,291,5.00,1,'2026-10-03 08:20:57.111','2026-10-03 10:10:34.950'),('cmus4hdoo00ad7k9okljt2ll3','cmus4hdoo00aa7k9o06tq6x27','Das Ink Works','das-ink-works','STUDIO','APPROVED','https://mymoonsgallery.com/media/artists/1791015661693-1064.webp','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv.webp',0,1,2000.00,107,4.00,2,'2026-10-03 08:21:02.473','2026-10-03 10:10:35.004'),('cmus4hhxu00c37k9ofrmv5glr','cmus4hhxt00c07k9obd1cpsxz','Atelier Sofia','atelier-sofia','STUDIO','APPROVED','https://mymoonsgallery.com/media/artists/1791015667355-1071.webp','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU.webp',1,1,7000.00,133,5.00,2,'2026-10-03 08:21:07.986','2026-10-03 10:10:35.040'),('cmus4hr3d00dt7k9o6wgfdg7o','cmus4hr3d00dq7k9ojf1e19dk','Rathore Heritage Gallery','rathore-heritage-gallery','GALLERY','APPROVED','https://mymoonsgallery.com/media/artists/1791015679084-1078.webp','https://mymoonsgallery.com/media/artworks/1791022128053-HyEktoYMnCRr.webp',0,1,6000.00,354,5.00,1,'2026-10-03 08:21:19.849','2026-10-03 10:10:35.085'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4hvaf00fg7k9o56ax8t3n','Aiko Tanaka','aiko-tanaka','INDIVIDUAL','APPROVED','https://mymoonsgallery.com/media/artists/1791015684591-1085.webp','https://mymoonsgallery.com/media/artworks/1791022130175-VEZo_jNRP25u.webp',0,1,3000.00,96,5.00,2,'2026-10-03 08:21:25.287','2026-10-03 10:10:35.143'),('cmus4hxuj00gx7k9omkclsld2','cmus4hxuj00gu7k9o9zblhchi','Pixel & Pigment','pixel-pigment','CREATIVE_BUSINESS','APPROVED','https://mymoonsgallery.com/media/artists/1791015688013-1091.webp','https://mymoonsgallery.com/media/artworks/1791022141751-C4Hs2RBOf7mC.webp',0,1,2800.00,144,5.00,1,'2026-10-03 08:21:28.603','2026-10-03 10:10:35.203'),('cmus4i12900id7k9oc65g1ku8','cmus4i12900ia7k9ohvw78scc','Ananya Sen Fine Art','ananya-sen-fine-art','INDIVIDUAL','APPROVED','https://mymoonsgallery.com/media/artists/1791015691919-1097.webp','https://mymoonsgallery.com/media/artworks/1791022155529-hgfUZjBXC2AC.webp',0,1,8000.00,27,0.00,0,'2026-10-03 08:21:32.769','2026-10-03 10:10:35.261'),('cmus4ibhr00jr7k9oh68g6fvx','cmus4ibhq00jo7k9ow91upb79','Mehta Murals','mehta-murals','STUDIO','APPROVED','https://mymoonsgallery.com/media/artists/1791015705462-1103.webp','https://mymoonsgallery.com/media/galleries/1791015705676-1104.webp',0,0,15000.00,0,0.00,0,'2026-10-03 08:21:46.287','2026-10-03 13:17:39.395'),('cmus5zslg005s7ky0dymbgs16','cmus5zslf005p7ky0dyh0xhr5','test','test-j55prb','INDIVIDUAL','APPROVED',NULL,'https://mymoonsgallery.com/media/artworks/1791022203383-NgQgMgpeedNt.webp',0,1,NULL,1,0.00,0,'2026-10-03 09:03:21.219','2026-10-03 11:42:11.038');
/*!40000 ALTER TABLE `Artist` ENABLE KEYS */;

--
-- Table structure for table `ArtistAddress`
--

DROP TABLE IF EXISTS `ArtistAddress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtistAddress` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `line1` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `line2` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN',
  `postalCode` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtistAddress_artistId_key` (`artistId`),
  CONSTRAINT `ArtistAddress_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtistAddress`
--

/*!40000 ALTER TABLE `ArtistAddress` DISABLE KEYS */;
INSERT INTO `ArtistAddress` (`id`, `artistId`, `line1`, `line2`, `city`, `state`, `country`, `postalCode`) VALUES ('cmus4gwzb00377k9ozx769jgh','cmus4gwzb00347k9o7jpqfl1i',NULL,NULL,'Bengaluru','Karnataka','IN',NULL),('cmus4h1iv00587k9os50z9skm','cmus4h1iv00557k9oobpdcfx0',NULL,NULL,'Mumbai','Maharashtra','IN',NULL),('cmus4h652006y7k9od1k8dpwg','cmus4h652006v7k9od0w60tg6',NULL,NULL,'Berlin','Berlin','DE',NULL),('cmus4h9jr008q7k9ob77lrs00','cmus4h9jq008n7k9okcz2sm88',NULL,NULL,'Kochi','Kerala','IN',NULL),('cmus4hdop00ag7k9ovysph2w4','cmus4hdoo00ad7k9okljt2ll3',NULL,NULL,'Kolkata','West Bengal','IN',NULL),('cmus4hhxu00c67k9oc5mpc2n4','cmus4hhxu00c37k9ofrmv5glr',NULL,NULL,'Lisbon','Lisbon','PT',NULL),('cmus4hr3d00dw7k9ovfwb2fe7','cmus4hr3d00dt7k9o6wgfdg7o',NULL,NULL,'Jaipur','Rajasthan','IN',NULL),('cmus4hvaf00fm7k9o86yswg4h','cmus4hvaf00fj7k9omlgiu1hu',NULL,NULL,'Kyoto','Kyoto','JP',NULL),('cmus4hxuk00h07k9o652cpply','cmus4hxuj00gx7k9omkclsld2',NULL,NULL,'Pune','Maharashtra','IN',NULL),('cmus4i12900ig7k9othhaz3n5','cmus4i12900id7k9oc65g1ku8',NULL,NULL,'New Delhi','Delhi','IN',NULL),('cmus4ibhr00ju7k9oa06e4mci','cmus4ibhr00jr7k9oh68g6fvx',NULL,NULL,'Ahmedabad','Gujarat','IN',NULL),('cmus5zslh005u7ky0qqiw3u02','cmus5zslg005s7ky0dymbgs16',NULL,NULL,NULL,NULL,'IN',NULL);
/*!40000 ALTER TABLE `ArtistAddress` ENABLE KEYS */;

--
-- Table structure for table `ArtistApproval`
--

DROP TABLE IF EXISTS `ArtistApproval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtistApproval` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adminId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromStatus` enum('PENDING_APPROVAL','APPROVED','REJECTED','SUSPENDED','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toStatus` enum('PENDING_APPROVAL','APPROVED','REJECTED','SUSPENDED','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ArtistApproval_artistId_idx` (`artistId`),
  CONSTRAINT `ArtistApproval_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtistApproval`
--

/*!40000 ALTER TABLE `ArtistApproval` DISABLE KEYS */;
INSERT INTO `ArtistApproval` (`id`, `artistId`, `adminId`, `fromStatus`, `toStatus`, `reason`, `createdAt`) VALUES ('cmus4gwzb00387k9oery9kmhv','cmus4gwzb00347k9o7jpqfl1i',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:20:40.823'),('cmus4gwzb00397k9o1s371oj6','cmus4gwzb00347k9o7jpqfl1i','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:20:40.823'),('cmus4h1iv00597k9o58fx02of','cmus4h1iv00557k9oobpdcfx0',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:20:46.711'),('cmus4h1iv005a7k9o6x5zjfgn','cmus4h1iv00557k9oobpdcfx0','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:20:46.711'),('cmus4h652006z7k9ojpi7yuuq','cmus4h652006v7k9od0w60tg6',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:20:52.694'),('cmus4h65200707k9oyapj8234','cmus4h652006v7k9od0w60tg6','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:20:52.694'),('cmus4h9jr008r7k9o3tavjha2','cmus4h9jq008n7k9okcz2sm88',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:20:57.111'),('cmus4h9jr008s7k9oalpfyqm2','cmus4h9jq008n7k9okcz2sm88','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:20:57.111'),('cmus4hdop00ah7k9orsk2x306','cmus4hdoo00ad7k9okljt2ll3',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:21:02.473'),('cmus4hdop00ai7k9on2y6mecn','cmus4hdoo00ad7k9okljt2ll3','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:21:02.473'),('cmus4hhxu00c77k9olisnnqmb','cmus4hhxu00c37k9ofrmv5glr',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:21:07.986'),('cmus4hhxu00c87k9ozc270k61','cmus4hhxu00c37k9ofrmv5glr','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:21:07.986'),('cmus4hr3d00dx7k9o1vtnntac','cmus4hr3d00dt7k9o6wgfdg7o',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:21:19.849'),('cmus4hr3d00dy7k9o5wa32qdi','cmus4hr3d00dt7k9o6wgfdg7o','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:21:19.849'),('cmus4hvag00fn7k9oae8t2yai','cmus4hvaf00fj7k9omlgiu1hu',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:21:25.287'),('cmus4hvag00fo7k9oq3u26qvj','cmus4hvaf00fj7k9omlgiu1hu','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:21:25.287'),('cmus4hxuk00h17k9o92v1lw4e','cmus4hxuj00gx7k9omkclsld2',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:21:28.603'),('cmus4hxuk00h27k9ogoc3asc6','cmus4hxuj00gx7k9omkclsld2','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:21:28.603'),('cmus4i12900ih7k9o06t46vtb','cmus4i12900id7k9oc65g1ku8',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:21:32.769'),('cmus4i12900ii7k9oe2agand1','cmus4i12900id7k9oc65g1ku8','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Portfolio verified','2026-10-03 08:21:32.769'),('cmus4ibhr00jv7k9onff6qi7c','cmus4ibhr00jr7k9oh68g6fvx',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 08:21:46.287'),('cmus5zslh005v7ky01imlb5vw','cmus5zslg005s7ky0dymbgs16',NULL,NULL,'PENDING_APPROVAL','Registered','2026-10-03 09:03:21.219'),('cmus61qso00697ky0mnmqag4r','cmus5zslg005s7ky0dymbgs16','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED',NULL,'2026-10-03 09:04:52.201'),('cmusf2tvy002x7kzg2a56bz0f','cmus4ibhr00jr7k9oh68g6fvx','cmus4gw91002c7k9ozx8w96po','PENDING_APPROVAL','APPROVED','Activated by admin','2026-10-03 13:17:39.407');
/*!40000 ALTER TABLE `ArtistApproval` ENABLE KEYS */;

--
-- Table structure for table `ArtistDocument`
--

DROP TABLE IF EXISTS `ArtistDocument`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtistDocument` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storageKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ArtistDocument_artistId_idx` (`artistId`),
  CONSTRAINT `ArtistDocument_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtistDocument`
--

/*!40000 ALTER TABLE `ArtistDocument` DISABLE KEYS */;
/*!40000 ALTER TABLE `ArtistDocument` ENABLE KEYS */;

--
-- Table structure for table `ArtistFollow`
--

DROP TABLE IF EXISTS `ArtistFollow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtistFollow` (
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`userId`,`artistId`),
  KEY `ArtistFollow_artistId_idx` (`artistId`),
  CONSTRAINT `ArtistFollow_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtistFollow_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtistFollow`
--

/*!40000 ALTER TABLE `ArtistFollow` DISABLE KEYS */;
INSERT INTO `ArtistFollow` (`userId`, `artistId`, `createdAt`) VALUES ('cmus4gwda002d7k9o6mkhzgmm','cmus4gwzb00347k9o7jpqfl1i','2026-09-14 13:21:47.181'),('cmus4gwda002d7k9o6mkhzgmm','cmus4h9jq008n7k9okcz2sm88','2026-08-26 19:21:47.188'),('cmus4gwda002d7k9o6mkhzgmm','cmus4hr3d00dt7k9o6wgfdg7o','2026-08-28 23:21:47.195'),('cmus4gwda002d7k9o6mkhzgmm','cmus4i12900id7k9oc65g1ku8','2026-09-27 23:21:47.200'),('cmus4gwda002d7k9o6mkhzgmm','cmus5zslg005s7ky0dymbgs16','2026-10-03 11:42:11.028'),('cmus4gwdt002h7k9oi4jryetb','cmus4gwzb00347k9o7jpqfl1i','2026-09-28 23:21:47.205'),('cmus4gwdt002h7k9oi4jryetb','cmus4h652006v7k9od0w60tg6','2026-08-19 15:21:47.211'),('cmus4gwdt002h7k9oi4jryetb','cmus4hhxu00c37k9ofrmv5glr','2026-08-09 04:21:47.216'),('cmus4gwdt002h7k9oi4jryetb','cmus4hxuj00gx7k9omkclsld2','2026-09-21 02:21:47.222'),('cmus4gwe4002l7k9os8s52e2y','cmus4gwzb00347k9o7jpqfl1i','2026-09-16 13:21:47.228'),('cmus4gwe4002l7k9os8s52e2y','cmus4h1iv00557k9oobpdcfx0','2026-09-28 19:21:47.234'),('cmus4gwe4002l7k9os8s52e2y','cmus4hdoo00ad7k9okljt2ll3','2026-08-20 05:21:47.240'),('cmus4gwe4002l7k9os8s52e2y','cmus4hvaf00fj7k9omlgiu1hu','2026-09-16 19:21:47.246'),('cmus4gwed002p7k9ot2pbzw4b','cmus4gwzb00347k9o7jpqfl1i','2026-08-19 17:21:47.252'),('cmus4gwed002p7k9ot2pbzw4b','cmus4h9jq008n7k9okcz2sm88','2026-09-28 17:21:47.258'),('cmus4gwed002p7k9ot2pbzw4b','cmus4hr3d00dt7k9o6wgfdg7o','2026-08-17 14:21:47.263'),('cmus4gwed002p7k9ot2pbzw4b','cmus4i12900id7k9oc65g1ku8','2026-08-23 01:21:47.268'),('cmus4gweo002t7k9op2gzcjbm','cmus4gwzb00347k9o7jpqfl1i','2026-09-18 00:21:47.273'),('cmus4gweo002t7k9op2gzcjbm','cmus4h652006v7k9od0w60tg6','2026-09-16 04:21:47.279'),('cmus4gweo002t7k9op2gzcjbm','cmus4hhxu00c37k9ofrmv5glr','2026-08-03 12:21:47.286'),('cmus4gweo002t7k9op2gzcjbm','cmus4hxuj00gx7k9omkclsld2','2026-08-30 13:21:47.291'),('cmus4gwex002x7k9oiu07kd0w','cmus4gwzb00347k9o7jpqfl1i','2026-09-19 17:21:47.296'),('cmus4gwex002x7k9oiu07kd0w','cmus4h1iv00557k9oobpdcfx0','2026-09-13 17:21:47.301'),('cmus4gwex002x7k9oiu07kd0w','cmus4hdoo00ad7k9okljt2ll3','2026-08-15 16:21:47.306'),('cmus4gwex002x7k9oiu07kd0w','cmus4hvaf00fj7k9omlgiu1hu','2026-08-31 03:21:47.312');
/*!40000 ALTER TABLE `ArtistFollow` ENABLE KEYS */;

--
-- Table structure for table `ArtistLedger`
--

DROP TABLE IF EXISTS `ArtistLedger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtistLedger` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('SALE_CREDIT','COMMISSION_DEBIT','SETTLEMENT_DEBIT','ADJUSTMENT','REFUND_DEBIT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','AVAILABLE','SETTLED','REVERSED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `amount` decimal(12,2) NOT NULL,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderItemId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settlementId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ArtistLedger_artistId_status_idx` (`artistId`,`status`),
  KEY `ArtistLedger_orderItemId_fkey` (`orderItemId`),
  KEY `ArtistLedger_settlementId_fkey` (`settlementId`),
  CONSTRAINT `ArtistLedger_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ArtistLedger_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ArtistLedger_settlementId_fkey` FOREIGN KEY (`settlementId`) REFERENCES `Settlement` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtistLedger`
--

/*!40000 ALTER TABLE `ArtistLedger` DISABLE KEYS */;
INSERT INTO `ArtistLedger` (`id`, `artistId`, `type`, `status`, `amount`, `description`, `orderItemId`, `settlementId`, `createdAt`) VALUES ('cmus4icnw00kz7k9onj78s268','cmus4h9jq008n7k9okcz2sm88','SALE_CREDIT','AVAILABLE',3300.00,'Sale: Bloom Within (AG-SSWXY4YH)','cmus4icnh00kw7k9on13uv52a',NULL,'2026-09-05 19:21:47.770'),('cmus4icnw00l07k9ofp6wj64h','cmus4h9jq008n7k9okcz2sm88','COMMISSION_DEBIT','AVAILABLE',-330.00,'Platform commission 10% (AG-SSWXY4YH)','cmus4icnh00kw7k9on13uv52a',NULL,'2026-09-05 19:21:47.770'),('cmus4icoy00l57k9o597zwtg4','cmus4h1iv00557k9oobpdcfx0','SALE_CREDIT','SETTLED',20000.00,'Sale: Echoes of Monsoon (AG-SSWXY4YH)','cmus4icok00l27k9ohj18w5lo','cmus4if9n00vo7k9og5sqggdp','2026-09-05 19:21:47.770'),('cmus4icoy00l67k9o75tnb4p7','cmus4h1iv00557k9oobpdcfx0','COMMISSION_DEBIT','SETTLED',-2000.00,'Platform commission 10% (AG-SSWXY4YH)','cmus4icok00l27k9ohj18w5lo','cmus4if9n00vo7k9og5sqggdp','2026-09-05 19:21:47.770'),('cmus4icq500lb7k9o5p3nls5s','cmus4hhxu00c37k9ofrmv5glr','SALE_CREDIT','AVAILABLE',2000.00,'Sale: Harvest Moon Valley (AG-SSWXY4YH)','cmus4icpr00l87k9ozv643xud',NULL,'2026-09-05 19:21:47.770'),('cmus4icq500lc7k9oe9d3a3py','cmus4hhxu00c37k9ofrmv5glr','COMMISSION_DEBIT','AVAILABLE',-200.00,'Platform commission 10% (AG-SSWXY4YH)','cmus4icpr00l87k9ozv643xud',NULL,'2026-09-05 19:21:47.770'),('cmus4ics000lr7k9o9203ux61','cmus4hxuj00gx7k9omkclsld2','SALE_CREDIT','AVAILABLE',2500.00,'Sale: Neon Ragas (AG-VPPAEACU)','cmus4icrm00lo7k9o9swtz8pa',NULL,'2026-08-09 23:21:47.922'),('cmus4ics000ls7k9obej1jr6l','cmus4hxuj00gx7k9omkclsld2','COMMISSION_DEBIT','AVAILABLE',-250.00,'Platform commission 10% (AG-VPPAEACU)','cmus4icrm00lo7k9o9swtz8pa',NULL,'2026-08-09 23:21:47.922'),('cmus4ictm00m37k9otjea3kdi','cmus4hdoo00ad7k9okljt2ll3','SALE_CREDIT','AVAILABLE',4900.00,'Sale: Monsoon Tram (AG-SCTE6CFA)','cmus4icta00m07k9o2a37u55i',NULL,'2026-07-14 18:21:47.983'),('cmus4ictm00m47k9om93rwzio','cmus4hdoo00ad7k9okljt2ll3','COMMISSION_DEBIT','AVAILABLE',-490.00,'Platform commission 10% (AG-SCTE6CFA)','cmus4icta00m07k9o2a37u55i',NULL,'2026-07-14 18:21:47.983'),('cmus4icvv00mf7k9oxn676xw9','cmus4hxuj00gx7k9omkclsld2','SALE_CREDIT','AVAILABLE',2500.00,'Sale: Neon Ragas (AG-2EB5FYFJ)','cmus4icvb00mc7k9ogotlnej7',NULL,'2026-07-27 06:21:48.055'),('cmus4icvv00mg7k9o4024ilqo','cmus4hxuj00gx7k9omkclsld2','COMMISSION_DEBIT','AVAILABLE',-250.00,'Platform commission 10% (AG-2EB5FYFJ)','cmus4icvb00mc7k9ogotlnej7',NULL,'2026-07-27 06:21:48.055'),('cmus4icwy00ml7k9or7vgtnkw','cmus4hr3d00dt7k9o6wgfdg7o','SALE_CREDIT','AVAILABLE',1800.00,'Sale: Pichwai Lotus (AG-2EB5FYFJ)','cmus4icwi00mi7k9oinv3rkr1',NULL,'2026-07-27 06:21:48.055'),('cmus4icwy00mm7k9opa7qn99y','cmus4hr3d00dt7k9o6wgfdg7o','COMMISSION_DEBIT','AVAILABLE',-180.00,'Platform commission 10% (AG-2EB5FYFJ)','cmus4icwi00mi7k9oinv3rkr1',NULL,'2026-07-27 06:21:48.055'),('cmus4icyq00mz7k9of7le3eh5','cmus4h9jq008n7k9okcz2sm88','SALE_CREDIT','AVAILABLE',1600.00,'Sale: Festival Eyes (AG-L9W8H23Y)','cmus4icyb00mw7k9oucd8ca4d',NULL,'2026-08-08 17:21:48.163'),('cmus4icyq00n07k9o94gg9xw1','cmus4h9jq008n7k9okcz2sm88','COMMISSION_DEBIT','AVAILABLE',-160.00,'Platform commission 10% (AG-L9W8H23Y)','cmus4icyb00mw7k9oucd8ca4d',NULL,'2026-08-08 17:21:48.163'),('cmus4iczs00n77k9o3q2inxum','cmus4hvaf00fj7k9omlgiu1hu','SALE_CREDIT','AVAILABLE',88000.00,'Sale: Chai Pop (AG-L9W8H23Y)','cmus4iczd00n47k9oc0zsa37g',NULL,'2026-08-08 17:21:48.163'),('cmus4iczs00n87k9os2q1lg60','cmus4hvaf00fj7k9omlgiu1hu','COMMISSION_DEBIT','AVAILABLE',-8800.00,'Platform commission 10% (AG-L9W8H23Y)','cmus4iczd00n47k9oc0zsa37g',NULL,'2026-08-08 17:21:48.163'),('cmus4id1v00nj7k9oa8x3rjxs','cmus4gwzb00347k9o7jpqfl1i','SALE_CREDIT','AVAILABLE',2400.00,'Sale: Sun Wheel (AG-595P4Y77)','cmus4id1f00ng7k9od54w1wys',NULL,'2026-08-09 20:21:48.275'),('cmus4id1v00nk7k9o35kfek1w','cmus4gwzb00347k9o7jpqfl1i','COMMISSION_DEBIT','AVAILABLE',-240.00,'Platform commission 10% (AG-595P4Y77)','cmus4id1f00ng7k9od54w1wys',NULL,'2026-08-09 20:21:48.275'),('cmus4id3i00nv7k9o1h0jsxpv','cmus4h1iv00557k9oobpdcfx0','SALE_CREDIT','PENDING',2700.00,'Sale: Saffron Pulse (AG-RMJYJW3M)','cmus4id3100ns7k9oda5zdzru',NULL,'2026-07-27 03:21:48.332'),('cmus4id3i00nw7k9om7g8kjn5','cmus4h1iv00557k9oobpdcfx0','COMMISSION_DEBIT','PENDING',-270.00,'Platform commission 10% (AG-RMJYJW3M)','cmus4id3100ns7k9oda5zdzru',NULL,'2026-07-27 03:21:48.332'),('cmus4id4n00o17k9o617tbn4f','cmus4h652006v7k9od0w60tg6','SALE_CREDIT','PENDING',2600.00,'Sale: Terracotta Morning (AG-RMJYJW3M)','cmus4id4800ny7k9ohbxvonyc',NULL,'2026-07-27 03:21:48.332'),('cmus4id4n00o27k9oqqaqi75h','cmus4h652006v7k9od0w60tg6','COMMISSION_DEBIT','PENDING',-260.00,'Platform commission 10% (AG-RMJYJW3M)','cmus4id4800ny7k9ohbxvonyc',NULL,'2026-07-27 03:21:48.332'),('cmus4id6100od7k9ozkmjst5s','cmus4hhxu00c37k9ofrmv5glr','SALE_CREDIT','AVAILABLE',6000.00,'Sale: Roots & Wings (AG-6YQKNUV7)','cmus4id5n00oa7k9ob4uvhfoh',NULL,'2026-07-22 12:21:48.429'),('cmus4id6100oe7k9oi5ybr2f6','cmus4hhxu00c37k9ofrmv5glr','COMMISSION_DEBIT','AVAILABLE',-600.00,'Platform commission 10% (AG-6YQKNUV7)','cmus4id5n00oa7k9ob4uvhfoh',NULL,'2026-07-22 12:21:48.429'),('cmus4id7p00op7k9o9001t59q','cmus4hhxu00c37k9ofrmv5glr','SALE_CREDIT','AVAILABLE',2000.00,'Sale: Harvest Moon Valley (AG-J4RJWQTB)','cmus4id7d00om7k9o930jn7r3',NULL,'2026-08-19 22:21:48.489'),('cmus4id7p00oq7k9owjebgp2h','cmus4hhxu00c37k9ofrmv5glr','COMMISSION_DEBIT','AVAILABLE',-200.00,'Platform commission 10% (AG-J4RJWQTB)','cmus4id7d00om7k9o930jn7r3',NULL,'2026-08-19 22:21:48.489'),('cmus4id8u00ox7k9o7jggjzxb','cmus4hxuj00gx7k9omkclsld2','SALE_CREDIT','AVAILABLE',83300.00,'Sale: Comic Crush (AG-J4RJWQTB)','cmus4id8e00ou7k9olza669em',NULL,'2026-08-19 22:21:48.489'),('cmus4id8u00oy7k9oazya7uax','cmus4hxuj00gx7k9omkclsld2','COMMISSION_DEBIT','AVAILABLE',-8330.00,'Platform commission 10% (AG-J4RJWQTB)','cmus4id8e00ou7k9olza669em',NULL,'2026-08-19 22:21:48.489'),('cmus4idap00p97k9owhnrexc0','cmus4gwzb00347k9o7jpqfl1i','SALE_CREDIT','AVAILABLE',5700.00,'Sale: The Dreamer (AG-GKT8G5VG)','cmus4idab00p67k9oh8phe5dx',NULL,'2026-09-26 04:21:48.596'),('cmus4idap00pa7k9o5937m1kj','cmus4gwzb00347k9o7jpqfl1i','COMMISSION_DEBIT','AVAILABLE',-570.00,'Platform commission 10% (AG-GKT8G5VG)','cmus4idab00p67k9oh8phe5dx',NULL,'2026-09-26 04:21:48.596'),('cmus4idbm00pf7k9orhycfvxj','cmus4hdoo00ad7k9okljt2ll3','SALE_CREDIT','AVAILABLE',3600.00,'Sale: College Street (AG-GKT8G5VG)','cmus4idb900pc7k9ojqkieqdy',NULL,'2026-09-26 04:21:48.596'),('cmus4idbm00pg7k9ocq9wxnky','cmus4hdoo00ad7k9okljt2ll3','COMMISSION_DEBIT','AVAILABLE',-360.00,'Platform commission 10% (AG-GKT8G5VG)','cmus4idb900pc7k9ojqkieqdy',NULL,'2026-09-26 04:21:48.596'),('cmus4idd400pt7k9o96c3rm7j','cmus4hr3d00dt7k9o6wgfdg7o','SALE_CREDIT','AVAILABLE',2300.00,'Sale: Marigold Mandala (AG-BNEELULX)','cmus4idcr00pq7k9o9xkhkcl2',NULL,'2026-09-18 00:21:48.685'),('cmus4idd400pu7k9ow45j71mx','cmus4hr3d00dt7k9o6wgfdg7o','COMMISSION_DEBIT','AVAILABLE',-230.00,'Platform commission 10% (AG-BNEELULX)','cmus4idcr00pq7k9o9xkhkcl2',NULL,'2026-09-18 00:21:48.685'),('cmus4idf500q57k9ocx1inknu','cmus4h652006v7k9od0w60tg6','SALE_CREDIT','AVAILABLE',2600.00,'Sale: Terracotta Morning (AG-GVFDRVH4)','cmus4ider00q27k9oy04xhz1o',NULL,'2026-09-22 03:21:48.755'),('cmus4idf500q67k9o40roa2ka','cmus4h652006v7k9od0w60tg6','COMMISSION_DEBIT','AVAILABLE',-260.00,'Platform commission 10% (AG-GVFDRVH4)','cmus4ider00q27k9oy04xhz1o',NULL,'2026-09-22 03:21:48.755'),('cmus4idgx00qh7k9oli9nz5kp','cmus4hhxu00c37k9ofrmv5glr','SALE_CREDIT','AVAILABLE',2000.00,'Sale: Harvest Moon Valley (AG-BVSRGSGY)','cmus4idgg00qe7k9o1wx5eh32',NULL,'2026-08-24 07:21:48.816'),('cmus4idgx00qi7k9oah9fwqpt','cmus4hhxu00c37k9ofrmv5glr','COMMISSION_DEBIT','AVAILABLE',-200.00,'Platform commission 10% (AG-BVSRGSGY)','cmus4idgg00qe7k9o1wx5eh32',NULL,'2026-08-24 07:21:48.816'),('cmus4idi200qp7k9o7suasx2t','cmus4hvaf00fj7k9omlgiu1hu','SALE_CREDIT','AVAILABLE',67000.00,'Sale: Sakura Daydream (AG-BVSRGSGY)','cmus4idhj00qm7k9orqqsoiir',NULL,'2026-08-24 07:21:48.816'),('cmus4idi200qq7k9o2wgyqhir','cmus4hvaf00fj7k9omlgiu1hu','COMMISSION_DEBIT','AVAILABLE',-6700.00,'Platform commission 10% (AG-BVSRGSGY)','cmus4idhj00qm7k9orqqsoiir',NULL,'2026-08-24 07:21:48.816'),('cmus4idje00qv7k9om36bloqg','cmus4h9jq008n7k9okcz2sm88','SALE_CREDIT','AVAILABLE',1600.00,'Sale: Festival Eyes (AG-BVSRGSGY)','cmus4idj000qs7k9oab00uesn',NULL,'2026-08-24 07:21:48.816'),('cmus4idje00qw7k9o6alxhnvs','cmus4h9jq008n7k9okcz2sm88','COMMISSION_DEBIT','AVAILABLE',-160.00,'Platform commission 10% (AG-BVSRGSGY)','cmus4idj000qs7k9oab00uesn',NULL,'2026-08-24 07:21:48.816'),('cmus4idlb00r97k9ovlhjp3f0','cmus4hdoo00ad7k9okljt2ll3','SALE_CREDIT','PENDING',4900.00,'Sale: Monsoon Tram (AG-Q8MHXHQW)','cmus4idkt00r67k9ohkf95wny',NULL,'2026-07-18 02:21:48.972'),('cmus4idlb00ra7k9omzz0vgrk','cmus4hdoo00ad7k9okljt2ll3','COMMISSION_DEBIT','PENDING',-490.00,'Platform commission 10% (AG-Q8MHXHQW)','cmus4idkt00r67k9ohkf95wny',NULL,'2026-07-18 02:21:48.972'),('cmus4idob00rl7k9o3l7v092s','cmus4hdoo00ad7k9okljt2ll3','SALE_CREDIT','AVAILABLE',3600.00,'Sale: College Street (AG-38E9MC53)','cmus4idnh00ri7k9ov8g4oyrz',NULL,'2026-08-10 18:21:49.058'),('cmus4idob00rm7k9oiqw4ax3e','cmus4hdoo00ad7k9okljt2ll3','COMMISSION_DEBIT','AVAILABLE',-360.00,'Platform commission 10% (AG-38E9MC53)','cmus4idnh00ri7k9ov8g4oyrz',NULL,'2026-08-10 18:21:49.058'),('cmus4idpx00rx7k9oqz8epkif','cmus4hhxu00c37k9ofrmv5glr','SALE_CREDIT','AVAILABLE',2000.00,'Sale: Harvest Moon Valley (AG-2UHY8WJH)','cmus4idpg00ru7k9ou2h5uhu5',NULL,'2026-09-03 05:21:49.141'),('cmus4idpx00ry7k9oc0rrbtp3','cmus4hhxu00c37k9ofrmv5glr','COMMISSION_DEBIT','AVAILABLE',-200.00,'Platform commission 10% (AG-2UHY8WJH)','cmus4idpg00ru7k9ou2h5uhu5',NULL,'2026-09-03 05:21:49.141'),('cmus4idr200s57k9o1bdacoio','cmus4h652006v7k9od0w60tg6','SALE_CREDIT','AVAILABLE',2600.00,'Sale: Terracotta Morning (AG-2UHY8WJH)','cmus4idqj00s27k9o8ilry4cb',NULL,'2026-09-03 05:21:49.141'),('cmus4idr200s67k9ocrhod61l','cmus4h652006v7k9od0w60tg6','COMMISSION_DEBIT','AVAILABLE',-260.00,'Platform commission 10% (AG-2UHY8WJH)','cmus4idqj00s27k9o8ilry4cb',NULL,'2026-09-03 05:21:49.141'),('cmus4idsl00sh7k9o4nwfnkr5','cmus4gwzb00347k9o7jpqfl1i','SALE_CREDIT','AVAILABLE',97000.00,'Sale: Lotus Mandala (AG-4EHEX7ZV)','cmus4ids700se7k9odfp8lkwq',NULL,'2026-09-11 16:21:49.240'),('cmus4idsl00si7k9oqf1naxt6','cmus4gwzb00347k9o7jpqfl1i','COMMISSION_DEBIT','AVAILABLE',-9700.00,'Platform commission 10% (AG-4EHEX7ZV)','cmus4ids700se7k9odfp8lkwq',NULL,'2026-09-11 16:21:49.240'),('cmus4idtt00sn7k9o9ekw333a','cmus4h1iv00557k9oobpdcfx0','SALE_CREDIT','SETTLED',2700.00,'Sale: Saffron Pulse (AG-4EHEX7ZV)','cmus4idtf00sk7k9oh4o7sk62','cmus4if9n00vo7k9og5sqggdp','2026-09-11 16:21:49.240'),('cmus4idtt00so7k9odivn3asy','cmus4h1iv00557k9oobpdcfx0','COMMISSION_DEBIT','SETTLED',-270.00,'Platform commission 10% (AG-4EHEX7ZV)','cmus4idtf00sk7k9oh4o7sk62','cmus4if9n00vo7k9og5sqggdp','2026-09-11 16:21:49.240'),('cmus4idw000t17k9ox1l4xyke','cmus4gwzb00347k9o7jpqfl1i','SALE_CREDIT','PENDING',11400.00,'Sale: The Dreamer (AG-M3TA8M83)','cmus4idvl00sy7k9or8tcjzw3',NULL,'2026-10-01 18:21:49.361'),('cmus4idw000t27k9ogczngpby','cmus4gwzb00347k9o7jpqfl1i','COMMISSION_DEBIT','PENDING',-1140.00,'Platform commission 10% (AG-M3TA8M83)','cmus4idvl00sy7k9or8tcjzw3',NULL,'2026-10-01 18:21:49.361'),('cmus4idxr00td7k9otb6l0u7d','cmus4gwzb00347k9o7jpqfl1i','SALE_CREDIT','AVAILABLE',2400.00,'Sale: Sun Wheel (AG-5G3QTVRZ)','cmus4idxc00ta7k9olaa3xnz0',NULL,'2026-09-26 19:21:49.425'),('cmus4idxr00te7k9onxcd54oc','cmus4gwzb00347k9o7jpqfl1i','COMMISSION_DEBIT','AVAILABLE',-240.00,'Platform commission 10% (AG-5G3QTVRZ)','cmus4idxc00ta7k9olaa3xnz0',NULL,'2026-09-26 19:21:49.425'),('cmus4idzd00tp7k9odm4w9kbs','cmus4gwzb00347k9o7jpqfl1i','SALE_CREDIT','PENDING',5700.00,'Sale: The Dreamer (AG-6JDWKJ5N)','cmus4idyv00tm7k9oz0fy4l47',NULL,'2026-10-02 13:21:49.479'),('cmus4idzd00tq7k9o85exvnnz','cmus4gwzb00347k9o7jpqfl1i','COMMISSION_DEBIT','PENDING',-570.00,'Platform commission 10% (AG-6JDWKJ5N)','cmus4idyv00tm7k9oz0fy4l47',NULL,'2026-10-02 13:21:49.479'),('cmus4ifft00vq7k9oer7j96ic','cmus4h1iv00557k9oobpdcfx0','SETTLEMENT_DEBIT','SETTLED',-20430.00,'Payout cmus4if9n00vo7k9og5sqggdp',NULL,'cmus4if9n00vo7k9og5sqggdp','2026-10-03 08:21:51.401'),('cmus4im4c00z97k9o2kdclppe','cmus4gwzb00347k9o7jpqfl1i','SALE_CREDIT','AVAILABLE',3500.00,'Custom art CA-SVVEMZNA (AG-P3TRVXWV)','cmus4im2b00z67k9o4g02mfhq',NULL,'2026-09-24 21:21:59.964'),('cmus4im4c00za7k9o4vilkf6a','cmus4gwzb00347k9o7jpqfl1i','COMMISSION_DEBIT','AVAILABLE',-525.00,'Platform commission 15% (AG-P3TRVXWV)','cmus4im2b00z67k9o4g02mfhq',NULL,'2026-09-24 21:21:59.964'),('cmus5ecw0001c7ky06tyecsi7','cmus4h1iv00557k9oobpdcfx0','SALE_CREDIT','PENDING',1500.00,'Sale: Chromatic Drift (AG-ARXM3FPW)','cmus5ecvt00197ky0d92uq16f',NULL,'2026-10-03 08:46:41.088'),('cmus5ecw0001d7ky0m8c4z7e5','cmus4h1iv00557k9oobpdcfx0','COMMISSION_DEBIT','PENDING',-150.00,'Platform commission 10% (AG-ARXM3FPW)','cmus5ecvt00197ky0d92uq16f',NULL,'2026-10-03 08:46:41.088'),('cmus5ewpq00407ky0h4hbnune','cmus4gwzb00347k9o7jpqfl1i','SALE_CREDIT','PENDING',4500.00,'Sale: Custom art CA-KVCSJ2WL — Realistic portrait (AG-TVM9MWUF)','cmus5ewph003x7ky0txu2r2vf',NULL,'2026-10-03 08:47:06.783'),('cmus5ewpq00417ky0tudol5k2','cmus4gwzb00347k9o7jpqfl1i','COMMISSION_DEBIT','PENDING',-675.00,'Platform commission 15% (AG-TVM9MWUF)','cmus5ewph003x7ky0txu2r2vf',NULL,'2026-10-03 08:47:06.783'),('cmus5ewu500467ky0pocng6dk','cmus4h1iv00557k9oobpdcfx0','SALE_CREDIT','PENDING',1500.00,'Sale: Chromatic Drift (AG-TVM9MWUF)','cmus5ewu000437ky0x2ckgunx',NULL,'2026-10-03 08:47:06.941'),('cmus5ewu500477ky0r6tpwa0v','cmus4h1iv00557k9oobpdcfx0','COMMISSION_DEBIT','PENDING',-150.00,'Platform commission 10% (AG-TVM9MWUF)','cmus5ewu000437ky0x2ckgunx',NULL,'2026-10-03 08:47:06.941'),('cmus5xmih005a7ky000ex4gsu','cmus4h1iv00557k9oobpdcfx0','SALE_CREDIT','PENDING',139000.00,'Sale: Violet Reverie (AG-X5VYDV5D)','cmus5xmi000577ky00mm1iaa3',NULL,'2026-10-03 09:01:40.025'),('cmus5xmih005b7ky0um6kqmo5','cmus4h1iv00557k9oobpdcfx0','COMMISSION_DEBIT','PENDING',-13900.00,'Platform commission 10% (AG-X5VYDV5D)','cmus5xmi000577ky00mm1iaa3',NULL,'2026-10-03 09:01:40.025');
/*!40000 ALTER TABLE `ArtistLedger` ENABLE KEYS */;

--
-- Table structure for table `ArtistProfile`
--

DROP TABLE IF EXISTS `ArtistProfile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtistProfile` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `artistStatement` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `yearsOfExperience` int DEFAULT NULL,
  `website` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `socialLinks` json DEFAULT NULL,
  `specializations` json DEFAULT NULL,
  `awards` json DEFAULT NULL,
  `primaryCategoryId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtistProfile_artistId_key` (`artistId`),
  KEY `ArtistProfile_primaryCategoryId_fkey` (`primaryCategoryId`),
  CONSTRAINT `ArtistProfile_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtistProfile_primaryCategoryId_fkey` FOREIGN KEY (`primaryCategoryId`) REFERENCES `ArtworkCategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtistProfile`
--

/*!40000 ALTER TABLE `ArtistProfile` DISABLE KEYS */;
INSERT INTO `ArtistProfile` (`id`, `artistId`, `bio`, `description`, `artistStatement`, `yearsOfExperience`, `website`, `socialLinks`, `specializations`, `awards`, `primaryCategoryId`) VALUES ('cmus4gwzb00367k9onny1pohj','cmus4gwzb00347k9o7jpqfl1i','Watercolour portraits and temple-town landscapes rooted in South Indian tradition.','Watercolour portraits and temple-town landscapes rooted in South Indian tradition. Based in Bengaluru, Meera Iyer Studio has been creating for 12 years, with work collected across India and abroad.','I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn.',12,'https://meera-iyer-studio.art','{\"instagram\": \"https://instagram.com/meeraiyerstudio\"}','[\"Custom portraits\", \"Watercolour\", \"Traditional Indian Art\"]','[\"Karnataka Lalit Kala Akademi Award 2022\", \"Featured at India Art Fair 2024\"]','cmus4goze001c7k9op638p2tc'),('cmus4h1iv00577k9omd90kmxv','cmus4h1iv00557k9oobpdcfx0','A Mumbai gallery championing bold abstract expressionism.','A Mumbai gallery championing bold abstract expressionism. Based in Mumbai, Kapoor Contemporary has been creating for 18 years, with work collected across India and abroad.','Colour is a language before it is a picture.',18,'https://kapoor-contemporary.art','{\"instagram\": \"https://instagram.com/kapoorcontemporary\"}','[\"Abstract expressionism\", \"Large canvases\"]','[\"Jehangir Art Gallery solo show 2021\"]','cmus4gp9u001d7k9oh67cz2fu'),('cmus4h652006x7k9ogqbwaeyo','cmus4h652006v7k9od0w60tg6','Minimalist compositions inspired by architecture and botany.','Minimalist compositions inspired by architecture and botany. Based in Berlin, Lena Fischer has been creating for 9 years, with work collected across India and abroad.','I look for calm — a single arch, a single leaf, enough space to breathe.',9,'https://lena-fischer.art','{\"instagram\": \"https://instagram.com/lenafischer\"}','[\"Minimalism\", \"Line art\", \"Scandinavian interiors\"]','[]','cmus4gqy0001m7k9ogsdftyse'),('cmus4h9jr008p7k9o1t86ap1b','cmus4h9jq008n7k9okcz2sm88','Digital and acrylic portraits bursting with colour and emotion.','Digital and acrylic portraits bursting with colour and emotion. Based in Kochi, Kavya Nair Art has been creating for 7 years, with work collected across India and abroad.','Every face holds a garden of colours — I just let them bloom.',7,'https://kavya-nair-art.art','{\"instagram\": \"https://instagram.com/kavyanairart\"}','[\"Digital painting\", \"Emotional portraits\", \"Photo-to-art commissions\"]','[\"Kochi Muziris Biennale — Students’ Biennale 2018\"]','cmus4goze001c7k9op638p2tc'),('cmus4hdoo00af7k9on1zg4rob','cmus4hdoo00ad7k9okljt2ll3','Charcoal and ink studies of old Kolkata — lanes, trams and ghats.','Charcoal and ink studies of old Kolkata — lanes, trams and ghats. Based in Kolkata, Das Ink Works has been creating for 20 years, with work collected across India and abroad.','Charcoal remembers the hand; the city remembers everything else.',20,'https://das-ink-works.art','{\"instagram\": \"https://instagram.com/dasinkworks\"}','[\"Charcoal\", \"Urban sketching\", \"Pencil portraits\"]','[\"Academy of Fine Arts Kolkata Award 2015\"]','cmus4gpqo001g7k9od2qg09ba'),('cmus4hhxu00c57k9o3hjg2t0u','cmus4hhxu00c37k9ofrmv5glr','Atmospheric oil landscapes of coasts, forests and luminous skies.','Atmospheric oil landscapes of coasts, forests and luminous skies. Based in Lisbon, Atelier Sofia has been creating for 15 years, with work collected across India and abroad.','Light changes everything — I chase it across the horizon.',15,'https://atelier-sofia.art','{\"instagram\": \"https://instagram.com/ateliersofia\"}','[\"Oil landscapes\", \"Plein air\"]','[\"Lisbon Art Prize finalist 2023\"]','cmus4gr4e001n7k9o9vw1e07m'),('cmus4hr3d00dv7k9oex5n0859','cmus4hr3d00dt7k9o6wgfdg7o','Heritage mandalas, Pichwai and folk traditions from Rajasthan.','Heritage mandalas, Pichwai and folk traditions from Rajasthan. Based in Jaipur, Rathore Heritage Gallery has been creating for 25 years, with work collected across India and abroad.','We keep centuries-old geometry alive, one petal at a time.',25,'https://rathore-heritage-gallery.art','{\"instagram\": \"https://instagram.com/rathoreheritagegallery\"}','[\"Mandala\", \"Pichwai\", \"Folk art\"]','[\"National Award for Master Craftsmen 2019\"]','cmus4gqdl001j7k9o4afdm58o'),('cmus4hvaf00fl7k9oebkhib5e','cmus4hvaf00fj7k9omlgiu1hu','Anime-inspired portraits and playful pop illustrations.','Anime-inspired portraits and playful pop illustrations. Based in Kyoto, Aiko Tanaka has been creating for 6 years, with work collected across India and abroad.','Joy is a valid artistic statement.',6,'https://aiko-tanaka.art','{\"instagram\": \"https://instagram.com/aikotanaka\"}','[\"Anime portraits\", \"Character art\"]','[]','cmus4goze001c7k9op638p2tc'),('cmus4hxuk00gz7k9oe5vecjxz','cmus4hxuj00gx7k9omkclsld2','A creative studio mixing pop culture, Bollywood and street art.','A creative studio mixing pop culture, Bollywood and street art. Based in Pune, Pixel & Pigment has been creating for 8 years, with work collected across India and abroad.','Art should be loud enough to start a conversation.',8,'https://pixel-pigment.art','{\"instagram\": \"https://instagram.com/pixelpigment\"}','[\"Pop art\", \"Digital prints\"]','[]','cmus4gqir001k7k9o632dl2xr'),('cmus4i12900if7k9opiakb3h7','cmus4i12900id7k9oc65g1ku8','Contemporary acrylics exploring memory, roots and belonging.','Contemporary acrylics exploring memory, roots and belonging. Based in New Delhi, Ananya Sen Fine Art has been creating for 11 years, with work collected across India and abroad.','The tree is my self-portrait: rooted, reaching, changing with seasons.',11,'https://ananya-sen-fine-art.art','{\"instagram\": \"https://instagram.com/ananyasenfineart\"}','[\"Contemporary acrylics\", \"Large wall art\"]','[\"India Habitat Centre Emerging Artist 2020\"]','cmus4gp9u001d7k9oh67cz2fu'),('cmus4ibhr00jt7k9onnu7c1sy','cmus4ibhr00jr7k9oh68g6fvx','Mural studio awaiting approval.','Mural studio awaiting approval. Based in Ahmedabad, Mehta Murals has been creating for 4 years, with work collected across India and abroad.','Walls are canvases for communities.',4,'https://mehta-murals.art','{\"instagram\": \"https://instagram.com/mehtamurals\"}','[\"Murals\"]','[]','cmus4gp9u001d7k9oh67cz2fu'),('cmus5zslh005t7ky0zvcr5zub','cmus5zslg005s7ky0dymbgs16',NULL,NULL,NULL,NULL,NULL,NULL,'[]','[]',NULL);
/*!40000 ALTER TABLE `ArtistProfile` ENABLE KEYS */;

--
-- Table structure for table `ArtistReview`
--

DROP TABLE IF EXISTS `ArtistReview`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtistReview` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` int NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `verifiedPurchase` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('PENDING','APPROVED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'APPROVED',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtistReview_artistId_userId_key` (`artistId`,`userId`),
  KEY `ArtistReview_userId_fkey` (`userId`),
  CONSTRAINT `ArtistReview_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtistReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtistReview`
--

/*!40000 ALTER TABLE `ArtistReview` DISABLE KEYS */;
INSERT INTO `ArtistReview` (`id`, `artistId`, `userId`, `rating`, `body`, `verifiedPurchase`, `status`, `createdAt`) VALUES ('cmus4ie0n00ty7k9olx6vwk5j','cmus4h9jq008n7k9okcz2sm88','cmus4gwdt002h7k9oi4jryetb',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:49.559'),('cmus4ie3600u27k9opd5u0l33','cmus4h1iv00557k9oobpdcfx0','cmus4gwdt002h7k9oi4jryetb',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:49.651'),('cmus4ie5w00u67k9o6tua44m9','cmus4hhxu00c37k9ofrmv5glr','cmus4gwdt002h7k9oi4jryetb',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:49.748'),('cmus4ie9q00ua7k9ozcs48d6o','cmus4hdoo00ad7k9okljt2ll3','cmus4gwed002p7k9ot2pbzw4b',4,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:49.887'),('cmus4iebg00ue7k9oi0rl3g6v','cmus4hxuj00gx7k9omkclsld2','cmus4gweo002t7k9op2gzcjbm',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:49.948'),('cmus4ieca00ui7k9olxxlbxk6','cmus4hr3d00dt7k9o6wgfdg7o','cmus4gweo002t7k9op2gzcjbm',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:49.978'),('cmus4ied200um7k9oo1ke9iha','cmus4hvaf00fj7k9omlgiu1hu','cmus4gwex002x7k9oiu07kd0w',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.006'),('cmus4iedw00uq7k9o41in41xw','cmus4gwzb00347k9o7jpqfl1i','cmus4gwdt002h7k9oi4jryetb',4,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.036'),('cmus4ieff00uu7k9ob6axvz5i','cmus4hhxu00c37k9ofrmv5glr','cmus4gwed002p7k9ot2pbzw4b',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.091'),('cmus4ieh900v07k9omypuvfvo','cmus4gwzb00347k9o7jpqfl1i','cmus4gwex002x7k9oiu07kd0w',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.158'),('cmus4iei200v47k9oorsqikev','cmus4hdoo00ad7k9okljt2ll3','cmus4gwex002x7k9oiu07kd0w',4,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.186'),('cmus4iekq00v87k9oap281whl','cmus4h652006v7k9od0w60tg6','cmus4gwe4002l7k9os8s52e2y',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.282'),('cmus4iem600ve7k9oywd7z9cn','cmus4hvaf00fj7k9omlgiu1hu','cmus4gwed002p7k9ot2pbzw4b',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.335'),('cmus4ien000vi7k9or7oz7wrm','cmus4h652006v7k9od0w60tg6','cmus4gwdt002h7k9oi4jryetb',5,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.365'),('cmus4ienw00vm7k9osckt2t3z','cmus4h1iv00557k9oobpdcfx0','cmus4gwda002d7k9o6mkhzgmm',4,'Wonderful to work with — thoughtful, responsive and incredibly talented.',1,'APPROVED','2026-10-03 08:21:50.397');
/*!40000 ALTER TABLE `ArtistReview` ENABLE KEYS */;

--
-- Table structure for table `Artwork`
--

DROP TABLE IF EXISTS `Artwork`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Artwork` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `type` enum('ORIGINAL_PAINTING','DIGITAL_ART','PRINT','PORTRAIT','ILLUSTRATION','PHOTOGRAPHY','WALL_ART','ABSTRACT','CUSTOM_ART','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `format` enum('ORIGINAL','PRINT','DIGITAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','SUSPENDED','SOLD_OUT','ARCHIVED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `categoryId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `styleId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mediumId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `themeId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `yearCreated` int DEFAULT NULL,
  `widthCm` decimal(8,2) DEFAULT NULL,
  `heightCm` decimal(8,2) DEFAULT NULL,
  `depthCm` decimal(8,2) DEFAULT NULL,
  `orientation` enum('PORTRAIT','LANDSCAPE','SQUARE','PANORAMIC') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dominantColor` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `discountPrice` decimal(12,2) DEFAULT NULL,
  `currency` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `sku` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `isCustomizable` tinyint(1) NOT NULL DEFAULT '0',
  `licenseInfo` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `copyrightInfo` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbnailUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previewUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `digitalFileKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `viewCount` int NOT NULL DEFAULT '0',
  `salesCount` int NOT NULL DEFAULT '0',
  `wishlistCount` int NOT NULL DEFAULT '0',
  `ratingAverage` decimal(3,2) NOT NULL DEFAULT '0.00',
  `ratingCount` int NOT NULL DEFAULT '0',
  `publishedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Artwork_slug_key` (`slug`),
  UNIQUE KEY `Artwork_sku_key` (`sku`),
  KEY `Artwork_status_publishedAt_idx` (`status`,`publishedAt`),
  KEY `Artwork_artistId_status_idx` (`artistId`,`status`),
  KEY `Artwork_categoryId_idx` (`categoryId`),
  KEY `Artwork_styleId_idx` (`styleId`),
  KEY `Artwork_mediumId_idx` (`mediumId`),
  KEY `Artwork_themeId_fkey` (`themeId`),
  FULLTEXT KEY `Artwork_title_description_idx` (`title`,`description`),
  CONSTRAINT `Artwork_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Artwork_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ArtworkCategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Artwork_mediumId_fkey` FOREIGN KEY (`mediumId`) REFERENCES `ArtworkMedium` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Artwork_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `ArtworkStyle` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Artwork_themeId_fkey` FOREIGN KEY (`themeId`) REFERENCES `ArtworkTheme` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Artwork`
--

/*!40000 ALTER TABLE `Artwork` DISABLE KEYS */;
INSERT INTO `Artwork` (`id`, `artistId`, `title`, `slug`, `description`, `type`, `format`, `status`, `categoryId`, `styleId`, `mediumId`, `themeId`, `yearCreated`, `widthCm`, `heightCm`, `depthCm`, `orientation`, `dominantColor`, `price`, `discountPrice`, `currency`, `sku`, `isFeatured`, `isCustomizable`, `licenseInfo`, `copyrightInfo`, `thumbnailUrl`, `previewUrl`, `digitalFileKey`, `viewCount`, `salesCount`, `wishlistCount`, `ratingAverage`, `ratingCount`, `publishedAt`, `createdAt`, `updatedAt`) VALUES ('cmus4gxra003e7k9o5dwrm7cw','cmus4gwzb00347k9o7jpqfl1i','Her Inner Garden','her-inner-garden-ws4izg','Her Inner Garden is an original, signed artwork by Meera Iyer Studio. I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn. Ships ready to hang with a certificate of authenticity.','PORTRAIT','ORIGINAL','APPROVED','cmus4goze001c7k9op638p2tc','cmus4guyq00227k9o6crc34vc','cmus4gohb000r7k9oh2wb4nft','cmus4goka00187k9ocqcefhmx',2023,60.00,75.00,3.00,'PORTRAIT','orange',42000.00,NULL,'INR','AG-00001',1,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"The Red Kerchief, by Claude Monet, Cleveland Museum of Art, 1958.39\" by Claude Monet — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:The_Red_Kerchief,_by_Claude_Monet,_Cleveland_Museum_of_Art,_1958.39.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022198518-gB3WygnDsbD5-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022198518-gB3WygnDsbD5.webp',NULL,1402,0,0,0.00,0,'2026-09-13 20:20:41.713','2026-09-13 20:20:41.713','2026-10-03 10:16:09.312'),('cmus4gyfz003q7k9o4bmryodo','cmus4gwzb00347k9o7jpqfl1i','Lotus Mandala','lotus-mandala-22zjbu','Lotus Mandala is an original, signed artwork by Meera Iyer Studio. I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn. Ships ready to hang with a certificate of authenticity.','WALL_ART','ORIGINAL','APPROVED','cmus4gqdl001j7k9o4afdm58o','cmus4gvsf00287k9oot5tjwnl','cmus4goh5000q7k9obwnez6v1','cmus4gojn00147k9ohso8gbot',2024,90.00,62.00,3.00,'PORTRAIT','purple',97000.00,NULL,'INR','AG-00002',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Painting of Raja Govardhan Chand of Guler, Kangra. He ruled Guler state from 1730–1741\" by Unknown authorUnknown author — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Painting_of_Raja_Govardhan_Chand_of_Guler,_Kangra._He_ruled_Guler_state_from_1730%E2%80%931741.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022183675-NywmrEMKjX_v-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022183675-NywmrEMKjX_v.webp',NULL,1116,1,40,0.00,0,'2026-07-04 05:20:42.717','2026-07-04 05:20:42.717','2026-10-03 13:17:39.448'),('cmus4gyzg003z7k9o9ppb7rsa','cmus4gwzb00347k9o7jpqfl1i','Misty Nilgiris','misty-nilgiris-x9c56r','Misty Nilgiris is an original, signed artwork by Meera Iyer Studio. I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn. Ships ready to hang with a certificate of authenticity.','ORIGINAL_PAINTING','ORIGINAL','APPROVED','cmus4gr4e001n7k9o9vw1e07m','cmus4gu8e001y7k9oz5xq41od','cmus4goh5000q7k9obwnez6v1','cmus4gojd00137k9ow5e4bw9m',2023,50.00,50.00,3.00,'LANDSCAPE','teal',68000.00,57800.00,'INR','AG-00003',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Winslow Homer - Danger\" by Winslow Homer — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Winslow_Homer_-_Danger.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022200182-LmFRLmthhlQi-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022200182-LmFRLmthhlQi.webp',NULL,528,0,0,0.00,0,'2026-09-20 00:20:43.315','2026-09-20 00:20:43.315','2026-10-03 13:13:51.419'),('cmus4gzn3004b7k9o5ut5d75u','cmus4gwzb00347k9o7jpqfl1i','The Dreamer','the-dreamer-2fpmpf','The Dreamer is a limited-edition archival print by Meera Iyer Studio. I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn.','PRINT','PRINT','APPROVED','cmus4goze001c7k9op638p2tc','cmus4gvcn00257k9ozbmxla8t','cmus4gohb000r7k9oh2wb4nft','cmus4gojn00147k9ohso8gbot',2023,30.00,41.00,NULL,'PORTRAIT','orange',5700.00,NULL,'INR','AG-00004',1,1,'Source image licence: CC0. Demo listing for development only.','Image: \"名所江戶百景 両国花火-Fireworks at Ryōgoku Bridge, from the series One Hundred Famous Views of Edo MET DP121524\" by Utagawa Hiroshige — CC0, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:%E5%90%8D%E6%89%80%E6%B1%9F%E6%88%B6%E7%99%BE%E6%99%AF_%E4%B8%A1%E5%9B%BD%E8%8A%B1%E7%81%AB-Fireworks_at_Ry%C5%8Dgoku_Bridge,_from_the_series_One_Hundred_Famous_Views_of_Edo_MET_DP121524.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022191630-P3gb9Cf9UkrH-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022191630-P3gb9Cf9UkrH.webp',NULL,339,4,0,5.00,1,'2026-08-09 20:20:44.269','2026-08-09 20:20:44.269','2026-10-03 13:13:48.989'),('cmus4h0ca004k7k9o4ce280xx','cmus4gwzb00347k9o7jpqfl1i','Sun Wheel','sun-wheel-cj9e38','Sun Wheel is a high-resolution digital artwork by Meera Iyer Studio. I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn.','DIGITAL_ART','DIGITAL','APPROVED','cmus4gpez001e7k9o0e07usez','cmus4gvsf00287k9oot5tjwnl','cmus4goi5000w7k9owkuv8zqy','cmus4gojt00157k9ov7bvzjx8',2025,NULL,NULL,NULL,'PORTRAIT','purple',2400.00,NULL,'INR','AG-00005',0,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Equestrian painting of a Sikh prince, Kangra, ca.1825–50\" by Unknown authorUnknown author — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Equestrian_painting_of_a_Sikh_prince,_Kangra,_ca.1825%E2%80%9350.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022195857-3jQkHK2kRnsn-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022195857-3jQkHK2kRnsn.webp','digital-art/1791022238816-H9N4jq8PNDxd.jpg',374,2,42,5.00,1,'2026-09-05 07:20:45.086','2026-09-05 07:20:45.086','2026-10-03 10:10:38.833'),('cmus4h0u0004u7k9oromd8d7l','cmus4gwzb00347k9o7jpqfl1i','Lakeside Dawn','lakeside-dawn-dttj4a','Lakeside Dawn is an original, signed artwork by Meera Iyer Studio. I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn. Ships ready to hang with a certificate of authenticity.','ORIGINAL_PAINTING','ORIGINAL','APPROVED','cmus4gr4e001n7k9o9vw1e07m','cmus4gu8e001y7k9oz5xq41od','cmus4goh5000q7k9obwnez6v1','cmus4gokh00197k9oe21b1581',2023,60.00,75.00,3.00,'LANDSCAPE','teal',72000.00,NULL,'INR','AG-00006',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Winslow Homer - Watching the Ships, Gloucester\" by Winslow Homer — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Winslow_Homer_-_Watching_the_Ships,_Gloucester.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022187379-BuZAulcKxmqy-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022187379-BuZAulcKxmqy.webp',NULL,401,0,24,0.00,0,'2026-07-30 15:20:45.814','2026-07-30 15:20:45.814','2026-10-03 10:09:47.796'),('cmus4h2ee005f7k9ozvv0cna3','cmus4h1iv00557k9oobpdcfx0','Echoes of Monsoon','echoes-of-monsoon-czxxhy','Echoes of Monsoon is an original, signed artwork by Kapoor Contemporary. Colour is a language before it is a picture. Ships ready to hang with a certificate of authenticity.','ABSTRACT','ORIGINAL','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gtku001t7k9ofpj2dwqe','cmus4goh5000q7k9obwnez6v1','cmus4gok400177k9otg78ncs0',2022,90.00,62.00,3.00,'SQUARE','multicolor',20000.00,NULL,'INR','AG-00007',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Kandinsky - Study for Painting with White Form, 1913\" by Wassily Kandinsky — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Kandinsky_-_Study_for_Painting_with_White_Form,_1913.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022200867-qkngns6FL8R1-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022200867-qkngns6FL8R1.webp',NULL,882,1,0,5.00,1,'2026-09-20 22:20:47.767','2026-09-20 22:20:47.767','2026-10-03 13:17:39.479'),('cmus4h374005r7k9otwxg61kt','cmus4h1iv00557k9oobpdcfx0','Violet Reverie','violet-reverie-c2k2qp','Violet Reverie is an original, signed artwork by Kapoor Contemporary. Colour is a language before it is a picture. Ships ready to hang with a certificate of authenticity.','ABSTRACT','ORIGINAL','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gu00001w7k9odof3qzvo','cmus4goib000x7k9ojt1mur97','cmus4gojz00167k9o7nmfsl6i',2026,50.00,50.00,3.00,'SQUARE','purple',139000.00,NULL,'INR','AG-00008',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Franz Marc - Kleine Pferdestudie I - 14963 - Bavarian State Painting Collections\" by Franz Marc — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Franz_Marc_-_Kleine_Pferdestudie_I_-_14963_-_Bavarian_State_Painting_Collections.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022201793-4p7GFSVAtNao-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022201793-4p7GFSVAtNao.webp',NULL,973,1,58,0.00,0,'2026-09-24 06:20:48.879','2026-09-24 06:20:48.879','2026-10-03 13:17:39.502'),('cmus4h42d00607k9owhfywle8','cmus4h1iv00557k9oobpdcfx0','Kinetic Bloom','kinetic-bloom-qbx4uu','Kinetic Bloom is an original, signed artwork by Kapoor Contemporary. Colour is a language before it is a picture. Ships ready to hang with a certificate of authenticity.','ABSTRACT','ORIGINAL','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gtsh001v7k9ob8d4ynp9','cmus4gogv000p7k9o8h1s6jzn','cmus4gok400177k9otg78ncs0',2022,30.00,41.00,3.00,'PORTRAIT','red',131000.00,111350.00,'INR','AG-00009',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Robert Delaunay - le poète Philippe Soupault\" by Robert Delaunay — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Robert_Delaunay_-_le_po%C3%A8te_Philippe_Soupault.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022197739-88Timv6ZAP8L-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022197739-88Timv6ZAP8L.webp',NULL,557,0,0,0.00,0,'2026-09-13 08:20:49.869','2026-09-13 08:20:49.869','2026-10-03 10:09:58.406'),('cmus4h4rh006a7k9ooidrg0lf','cmus4h1iv00557k9oobpdcfx0','Saffron Pulse','saffron-pulse-vzhkcf','Saffron Pulse is a limited-edition archival print by Kapoor Contemporary. Colour is a language before it is a picture.','PRINT','PRINT','APPROVED','cmus4gqtc001l7k9og99ayxs9','cmus4gtku001t7k9ofpj2dwqe','cmus4goh5000q7k9obwnez6v1','cmus4gojz00167k9o7nmfsl6i',2026,120.00,80.00,NULL,'LANDSCAPE','multicolor',2700.00,NULL,'INR','AG-00010',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Wassily Kandinsky - Impression III (Concert) - Google Art Project\" by Wassily Kandinsky — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Wassily_Kandinsky_-_Impression_III_(Concert)_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0.webp',NULL,363,2,0,5.00,1,'2026-06-02 16:20:50.907','2026-06-02 16:20:50.907','2026-10-03 10:09:23.671'),('cmus4h5qe006j7k9ozq878v35','cmus4h1iv00557k9oobpdcfx0','Chromatic Drift','chromatic-drift-dcffpt','Chromatic Drift is a high-resolution digital artwork by Kapoor Contemporary. Colour is a language before it is a picture.','DIGITAL_ART','DIGITAL','APPROVED','cmus4gpez001e7k9o0e07usez','cmus4gu00001w7k9odof3qzvo','cmus4goi5000w7k9owkuv8zqy','cmus4gok400177k9otg78ncs0',2026,NULL,NULL,NULL,'LANDSCAPE','purple',1500.00,NULL,'INR','AG-00011',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Franz Marc - Pferdeskizze II - 14968 - Bavarian State Painting Collections\" by Franz Marc — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Franz_Marc_-_Pferdeskizze_II_-_14968_-_Bavarian_State_Painting_Collections.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022196502-C6lZ2q_OlRny-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022196502-C6lZ2q_OlRny.webp','digital-art/1791022239159-jZqJ4oTE82Hb.jpg',1166,2,31,0.00,0,'2026-09-06 12:20:52.052','2026-09-06 12:20:52.052','2026-10-03 10:10:39.170'),('cmus4h6kx00757k9oaoiipq1v','cmus4h652006v7k9od0w60tg6','Arches of Calm','arches-of-calm-9ad4us','Arches of Calm is an original, signed artwork by Lena Fischer. I look for calm — a single arch, a single leaf, enough space to breathe. Ships ready to hang with a certificate of authenticity.','ILLUSTRATION','ORIGINAL','APPROVED','cmus4gqy0001m7k9ogsdftyse','cmus4gtoi001u7k9oots34sv5','cmus4goht000u7k9om3hzgnyt','cmus4gojd00137k9ow5e4bw9m',2022,50.00,50.00,3.00,'PORTRAIT','pink',52000.00,NULL,'INR','AG-00012',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Vilhelm Hammershoi - Interieur mit Rueckenansicht einer Frau - 1903-1904 - Randers Kunstmuseum\" by Vilhelm Hammershøi — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Vilhelm_Hammershoi_-_Interieur_mit_Rueckenansicht_einer_Frau_-_1903-1904_-_Randers_Kunstmuseum.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022164064-7SiEu8wXqmg0-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022164064-7SiEu8wXqmg0.webp',NULL,68,0,59,0.00,0,'2026-06-03 02:20:53.169','2026-06-03 02:20:53.169','2026-10-03 10:09:25.992'),('cmus4h7cq007h7k9o8wj0tfx4','cmus4h652006v7k9od0w60tg6','Midnight Carnival','midnight-carnival-zzxekm','Midnight Carnival is an original, signed artwork by Lena Fischer. I look for calm — a single arch, a single leaf, enough space to breathe. Ships ready to hang with a certificate of authenticity.','ABSTRACT','ORIGINAL','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gu00001w7k9odof3qzvo','cmus4goib000x7k9ojt1mur97','cmus4gojz00167k9o7nmfsl6i',2025,30.00,41.00,3.00,'LANDSCAPE','brown',114000.00,NULL,'INR','AG-00013',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Franz Marc - Weidende Pferde I - G 12576 - Lenbachhaus\" by Franz Marc — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Franz_Marc_-_Weidende_Pferde_I_-_G_12576_-_Lenbachhaus.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022172402-iZIHhQK0hEaF-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022172402-iZIHhQK0hEaF.webp',NULL,660,0,3,0.00,0,'2026-06-21 22:20:54.264','2026-06-21 22:20:54.264','2026-10-03 10:09:33.951'),('cmus4h7pz007q7k9odjfgw811','cmus4h652006v7k9od0w60tg6','Quiet Contours','quiet-contours-ks52cj','Quiet Contours is an original, signed artwork by Lena Fischer. I look for calm — a single arch, a single leaf, enough space to breathe. Ships ready to hang with a certificate of authenticity.','ILLUSTRATION','ORIGINAL','APPROVED','cmus4gqy0001m7k9ogsdftyse','cmus4gu3m001x7k9ofmpz6tg5','cmus4goh5000q7k9obwnez6v1','cmus4gojd00137k9ow5e4bw9m',2026,120.00,80.00,3.00,'PORTRAIT','teal',11000.00,9350.00,'INR','AG-00014',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Affiche Salon des Cents 1901\" by Alphonse Mucha — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Affiche_Salon_des_Cents_1901.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022187912-LFrDTbJKpdcv-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022187912-LFrDTbJKpdcv.webp',NULL,695,0,5,0.00,0,'2026-07-30 22:20:54.670','2026-07-30 22:20:54.670','2026-10-03 10:09:48.492'),('cmus4h8j600827k9ozjf54quc','cmus4h652006v7k9od0w60tg6','Ember Song','ember-song-v4zv7h','Ember Song is a limited-edition archival print by Lena Fischer. I look for calm — a single arch, a single leaf, enough space to breathe.','PRINT','PRINT','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gtku001t7k9ofpj2dwqe','cmus4goh5000q7k9obwnez6v1','cmus4gojz00167k9o7nmfsl6i',2024,60.00,75.00,NULL,'SQUARE','pink',3400.00,NULL,'INR','AG-00015',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"W. Kandinsky - Bild mit rotem Fleck\" by Wassily Kandinsky — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:W._Kandinsky_-_Bild_mit_rotem_Fleck.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022174184-10rxLeU9WASu-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022174184-10rxLeU9WASu.webp',NULL,103,0,0,0.00,0,'2026-06-22 22:20:55.792','2026-06-22 22:20:55.792','2026-10-03 10:09:36.754'),('cmus4h8z0008b7k9oc0magitx','cmus4h652006v7k9od0w60tg6','Terracotta Morning','terracotta-morning-55mahe','Terracotta Morning is a high-resolution digital artwork by Lena Fischer. I look for calm — a single arch, a single leaf, enough space to breathe.','DIGITAL_ART','DIGITAL','APPROVED','cmus4gpez001e7k9o0e07usez','cmus4gvg900267k9o2p0w6k5j','cmus4goi5000w7k9owkuv8zqy','cmus4gojd00137k9ow5e4bw9m',2026,NULL,NULL,NULL,'PORTRAIT','brown',2600.00,NULL,'INR','AG-00016',0,0,'Source image licence: CC0. Demo listing for development only.','Image: \"Albrecht Dürer, Saint Jerome in His Study, 1514, NGA 35095\" by Albrecht Dürer — CC0, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer,_Saint_Jerome_in_His_Study,_1514,_NGA_35095.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022179763-jSiHS88dyKgq-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022179763-jSiHS88dyKgq.webp','digital-art/1791022237787-cDKxJAVtfh9n.jpg',1088,3,41,5.00,2,'2026-06-26 06:20:56.292','2026-06-26 06:20:56.292','2026-10-03 10:10:37.806'),('cmus4ha8s008x7k9o1e8wgcdj','cmus4h9jq008n7k9okcz2sm88','Colours Within','colours-within-bmrwtx','Colours Within is an original, signed artwork by Kavya Nair Art. Every face holds a garden of colours — I just let them bloom. Ships ready to hang with a certificate of authenticity.','PORTRAIT','ORIGINAL','APPROVED','cmus4goze001c7k9op638p2tc','cmus4guyq00227k9o6crc34vc','cmus4gohb000r7k9oh2wb4nft','cmus4goka00187k9ocqcefhmx',2024,30.00,41.00,3.00,'LANDSCAPE','purple',117000.00,NULL,'INR','AG-00017',1,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Low Tide at Pourville, by Claude Monet, Cleveland Museum of Art, 1947.196\" by Claude Monet — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Low_Tide_at_Pourville,_by_Claude_Monet,_Cleveland_Museum_of_Art,_1947.196.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022193764-1CV7Fnu0975f-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022193764-1CV7Fnu0975f.webp',NULL,1266,0,21,0.00,0,'2026-08-15 14:20:57.876','2026-08-15 14:20:57.876','2026-10-03 10:09:54.439'),('cmus4hasq00997k9oirpx23io','cmus4h9jq008n7k9okcz2sm88','Silent Strength','silent-strength-rkbahm','Silent Strength is an original, signed artwork by Kavya Nair Art. Every face holds a garden of colours — I just let them bloom. Ships ready to hang with a certificate of authenticity.','PORTRAIT','ORIGINAL','APPROVED','cmus4goze001c7k9op638p2tc','cmus4gu8e001y7k9oz5xq41od','cmus4goh5000q7k9obwnez6v1','cmus4gojn00147k9ohso8gbot',2022,120.00,80.00,3.00,'LANDSCAPE','orange',78000.00,NULL,'INR','AG-00018',0,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Winslow Homer - The Gulf Stream - Metropolitan Museum of Art\" by Winslow Homer — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Winslow_Homer_-_The_Gulf_Stream_-_Metropolitan_Museum_of_Art.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022185384-sa4wfSdet-Mk-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022185384-sa4wfSdet-Mk.webp',NULL,628,0,0,0.00,0,'2026-07-12 06:20:58.728','2026-07-12 06:20:58.728','2026-10-03 10:09:45.954'),('cmus4hbjt009i7k9oz1nlxy39','cmus4h9jq008n7k9okcz2sm88','Spectrum Soul','spectrum-soul-e63nvx','Spectrum Soul is an original, signed artwork by Kavya Nair Art. Every face holds a garden of colours — I just let them bloom. Ships ready to hang with a certificate of authenticity.','PORTRAIT','ORIGINAL','APPROVED','cmus4goze001c7k9op638p2tc','cmus4gu00001w7k9odof3qzvo','cmus4gogv000p7k9o8h1s6jzn','cmus4goka00187k9ocqcefhmx',2025,60.00,75.00,3.00,'PORTRAIT','purple',68000.00,57800.00,'INR','AG-00019',0,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Marc, Franz - Blue Horse I - Google Art Project\" by Franz Marc — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Marc,_Franz_-_Blue_Horse_I_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022129216-aYbTttzaH0r6-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022129216-aYbTttzaH0r6.webp',NULL,721,0,7,0.00,0,'2026-05-01 03:20:59.582','2026-05-01 03:20:59.582','2026-10-03 10:08:50.062'),('cmus4hc8k009s7k9ozp0cb1rf','cmus4h9jq008n7k9okcz2sm88','Bloom Within','bloom-within-nie3zv','Bloom Within is a limited-edition archival print by Kavya Nair Art. Every face holds a garden of colours — I just let them bloom.','PRINT','PRINT','APPROVED','cmus4gsz4001q7k9ofrxhlv8p','cmus4gvcn00257k9ozbmxla8t','cmus4gohb000r7k9oh2wb4nft','cmus4gojn00147k9ohso8gbot',2026,90.00,62.00,NULL,'PORTRAIT','purple',3300.00,NULL,'INR','AG-00020',0,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Hiroshige II - Kishu kumano iwatake tori - Shokoku meisho hyakkei\" by Hiroshige II (1826-1869) — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Hiroshige_II_-_Kishu_kumano_iwatake_tori_-_Shokoku_meisho_hyakkei.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022177215-u7Xe5pB1xs8w-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022177215-u7Xe5pB1xs8w.webp',NULL,1235,1,60,5.00,1,'2026-06-25 02:21:00.595','2026-06-25 02:21:00.595','2026-10-03 10:09:39.376'),('cmus4hd2j00a17k9o1jyc3uhf','cmus4h9jq008n7k9okcz2sm88','Festival Eyes','festival-eyes-7why54','Festival Eyes is a high-resolution digital artwork by Kavya Nair Art. Every face holds a garden of colours — I just let them bloom.','PORTRAIT','DIGITAL','APPROVED','cmus4gpez001e7k9o0e07usez','cmus4guyq00227k9o6crc34vc','cmus4goi5000w7k9owkuv8zqy','cmus4goka00187k9ocqcefhmx',2024,NULL,NULL,NULL,'PORTRAIT','orange',1600.00,NULL,'INR','AG-00021',0,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Claude Monet - Woman with a Parasol - Madame Monet and Her Son - Google Art Project\" by Claude Monet — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022151596-rO_9WMRfgLXK-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022151596-rO_9WMRfgLXK.webp','digital-art/1791022237270-QG0gKwe-X9ty.jpg',665,2,15,0.00,0,'2026-05-23 07:21:01.562','2026-05-23 07:21:01.562','2026-10-03 10:10:37.279'),('cmus4heds00al7k9oktw2hgjb','cmus4hdoo00ad7k9okljt2ll3','Old Kolkata Lanes','old-kolkata-lanes-pk4api','Old Kolkata Lanes is an original, signed artwork by Das Ink Works. Charcoal remembers the hand; the city remembers everything else. Ships ready to hang with a certificate of authenticity.','ILLUSTRATION','ORIGINAL','APPROVED','cmus4gpqo001g7k9od2qg09ba','cmus4gusi00217k9o51xv84gk','cmus4goho000t7k9obtbkvvix','cmus4gojn00147k9ohso8gbot',2025,120.00,80.00,3.00,'LANDSCAPE','black-white',54000.00,NULL,'INR','AG-00022',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Vincent van Gogh - Irises (1889)\" by Vincent van Gogh — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Irises_(1889).jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022190215-SD8ieZkq79Hv-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022190215-SD8ieZkq79Hv.webp',NULL,1199,0,9,0.00,0,'2026-08-02 07:21:03.297','2026-08-02 07:21:03.297','2026-10-03 10:10:24.082'),('cmus4hf3n00ax7k9oijuw97n4','cmus4hdoo00ad7k9okljt2ll3','Charcoal Study I','charcoal-study-i-7u52ps','Charcoal Study I is an original, signed artwork by Das Ink Works. Charcoal remembers the hand; the city remembers everything else. Ships ready to hang with a certificate of authenticity.','ILLUSTRATION','ORIGINAL','APPROVED','cmus4gpqo001g7k9od2qg09ba','cmus4gul200207k9oqku6stis','cmus4gohi000s7k9ohugznf96','cmus4gok400177k9otg78ncs0',2024,60.00,75.00,3.00,'PORTRAIT','black-white',79000.00,NULL,'INR','AG-00023',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Albrecht Dürer, Head of a Bearded Old Man\" by Albrecht Dürer — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer,_Head_of_a_Bearded_Old_Man.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022138923-KP_WOKKrLrPZ-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022138923-KP_WOKKrLrPZ.webp',NULL,68,0,0,0.00,0,'2026-05-13 13:21:04.305','2026-05-13 13:21:04.305','2026-10-03 10:09:01.498'),('cmus4hfwi00b67k9oy06oc8ue','cmus4hdoo00ad7k9okljt2ll3','Ghats at Dusk','ghats-at-dusk-53bf33','Ghats at Dusk is an original, signed artwork by Das Ink Works. Charcoal remembers the hand; the city remembers everything else. Ships ready to hang with a certificate of authenticity.','ILLUSTRATION','ORIGINAL','APPROVED','cmus4gpqo001g7k9od2qg09ba','cmus4gusi00217k9o51xv84gk','cmus4goho000t7k9obtbkvvix','cmus4gokq001a7k9ok6djysxe',2024,90.00,62.00,3.00,'PORTRAIT','black-white',126000.00,107100.00,'INR','AG-00024',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Vincent van Gogh - Sunflowers - VGM F458\" by Vincent van Gogh — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022168697-91nBQ_uyb3ht-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022168697-91nBQ_uyb3ht.webp',NULL,1354,0,0,0.00,0,'2026-06-06 18:21:05.269','2026-06-06 18:21:05.269','2026-10-03 10:09:30.611'),('cmus4hgms00bi7k9ohya2eapy','cmus4hdoo00ad7k9okljt2ll3','Monsoon Tram','monsoon-tram-kzzjcz','Monsoon Tram is a limited-edition archival print by Das Ink Works. Charcoal remembers the hand; the city remembers everything else.','PRINT','PRINT','APPROVED','cmus4gore001b7k9oi5jclr77','cmus4gul200207k9oqku6stis','cmus4gohi000s7k9ohugznf96','cmus4gojn00147k9ohso8gbot',2022,50.00,50.00,NULL,'PORTRAIT','black-white',4900.00,NULL,'INR','AG-00025',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Albrecht Dürer - Praying Hands, 1508 - Google Art Project\" by Albrecht Dürer — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer_-_Praying_Hands,_1508_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv.webp',NULL,374,2,3,5.00,1,'2026-05-04 02:21:06.289','2026-05-04 02:21:06.289','2026-10-03 10:15:57.934'),('cmus4hhfw00br7k9o93y4lbtf','cmus4hdoo00ad7k9okljt2ll3','College Street','college-street-3bqyyj','College Street is a high-resolution digital artwork by Das Ink Works. Charcoal remembers the hand; the city remembers everything else.','DIGITAL_ART','DIGITAL','APPROVED','cmus4gpez001e7k9o0e07usez','cmus4gusi00217k9o51xv84gk','cmus4goi5000w7k9owkuv8zqy','cmus4gok400177k9otg78ncs0',2026,NULL,NULL,NULL,'LANDSCAPE','black-white',3600.00,NULL,'INR','AG-00026',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Vincent van Gogh - The yellow house (\'The street\')\" by Vincent van Gogh — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_The_yellow_house_(%27The_street%27).jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022148601-_fU-boIYI1mH-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022148601-_fU-boIYI1mH.webp','digital-art/1791022236901-Soq8M4-fBED6.jpg',93,2,0,5.00,1,'2026-05-20 07:21:07.206','2026-05-20 07:21:07.206','2026-10-03 10:10:36.919'),('cmus4hikt00cd7k9oq5by8244','cmus4hhxu00c37k9ofrmv5glr','Desert Lanterns','desert-lanterns-f6b5ui','Desert Lanterns is an original, signed artwork by Atelier Sofia. Light changes everything — I chase it across the horizon. Ships ready to hang with a certificate of authenticity.','ORIGINAL_PAINTING','ORIGINAL','APPROVED','cmus4gr4e001n7k9o9vw1e07m','cmus4gucy001z7k9oi3s6qrwm','cmus4gogv000p7k9o8h1s6jzn','cmus4gojd00137k9ow5e4bw9m',2025,60.00,75.00,3.00,'LANDSCAPE','green',113000.00,NULL,'INR','AG-00027',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Albert Bierstadt - Among the Sierra Nevada, California - Google Art Project\" by Albert Bierstadt — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Albert_Bierstadt_-_Among_the_Sierra_Nevada,_California_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022191055-Bt72UijsmhJp-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022191055-Bt72UijsmhJp.webp',NULL,1063,0,32,0.00,0,'2026-08-09 00:21:08.702','2026-08-09 00:21:08.702','2026-10-03 10:09:51.530'),('cmus4hm3l00cp7k9ocan2fb73','cmus4hhxu00c37k9ofrmv5glr','Tree of Life','tree-of-life-jmm478','Tree of Life is an original, signed artwork by Atelier Sofia. Light changes everything — I chase it across the horizon. Ships ready to hang with a certificate of authenticity.','ORIGINAL_PAINTING','ORIGINAL','APPROVED','cmus4gsz4001q7k9ofrxhlv8p','cmus4gtku001t7k9ofpj2dwqe','cmus4gogv000p7k9o8h1s6jzn','cmus4gojt00157k9ov7bvzjx8',2023,90.00,62.00,3.00,'LANDSCAPE','blue',18000.00,NULL,'INR','AG-00028',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Kandinsky Oriental PA291007\" by Wassily Kandinsky — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Kandinsky_Oriental_PA291007.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022194503-q72xTPhliTky-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022194503-q72xTPhliTky.webp',NULL,1035,0,8,0.00,0,'2026-08-23 05:21:13.375','2026-08-23 05:21:13.375','2026-10-03 10:09:55.050'),('cmus4hmp100cy7k9orpyduwko','cmus4hhxu00c37k9ofrmv5glr','Pine Silence','pine-silence-t74igq','Pine Silence is an original, signed artwork by Atelier Sofia. Light changes everything — I chase it across the horizon. Ships ready to hang with a certificate of authenticity.','ORIGINAL_PAINTING','ORIGINAL','APPROVED','cmus4gr4e001n7k9o9vw1e07m','cmus4gu8e001y7k9oz5xq41od','cmus4goh5000q7k9obwnez6v1','cmus4gojd00137k9ow5e4bw9m',2024,50.00,50.00,3.00,'LANDSCAPE','orange',36000.00,30600.00,'INR','AG-00029',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Market Scene Nassau by Winslow Homer 1885\" by Winslow Homer — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Market_Scene_Nassau_by_Winslow_Homer_1885.jpeg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022193176-AnYIp8kMVrdK-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022193176-AnYIp8kMVrdK.webp',NULL,137,0,49,0.00,0,'2026-08-14 03:21:14.037','2026-08-14 03:21:14.037','2026-10-03 10:09:53.688'),('cmus4hpzt00d87k9otb2cytkr','cmus4hhxu00c37k9ofrmv5glr','Roots & Wings','roots-wings-mcjr6y','Roots & Wings is a limited-edition archival print by Atelier Sofia. Light changes everything — I chase it across the horizon.','PRINT','PRINT','APPROVED','cmus4gsz4001q7k9ofrxhlv8p','cmus4gtku001t7k9ofpj2dwqe','cmus4gogv000p7k9o8h1s6jzn','cmus4gojt00157k9ov7bvzjx8',2026,30.00,41.00,NULL,'SQUARE','green',6000.00,NULL,'INR','AG-00030',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Kandinsky - Improvisation Klamm PA291186\" by Wassily Kandinsky — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Kandinsky_-_Improvisation_Klamm_PA291186.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022189220-9z_l-RWdhG7_-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022189220-9z_l-RWdhG7_.webp',NULL,595,1,21,5.00,1,'2026-08-01 06:21:18.423','2026-08-01 06:21:18.423','2026-10-03 10:09:50.130'),('cmus4hqht00dh7k9onmak8cwl','cmus4hhxu00c37k9ofrmv5glr','Harvest Moon Valley','harvest-moon-valley-mppba4','Harvest Moon Valley is a high-resolution digital artwork by Atelier Sofia. Light changes everything — I chase it across the horizon.','DIGITAL_ART','DIGITAL','APPROVED','cmus4gpez001e7k9o0e07usez','cmus4gtc5001s7k9oj0kyz9e7','cmus4goi5000w7k9owkuv8zqy','cmus4gojd00137k9ow5e4bw9m',2022,NULL,NULL,NULL,'LANDSCAPE','blue',2000.00,NULL,'INR','AG-00031',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"View of Delft, by Johannes Vermeer\" by Johannes Vermeer — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:View_of_Delft,_by_Johannes_Vermeer.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU.webp','digital-art/1791022236609-oEhbTIAbah3P.jpg',475,4,8,4.50,2,'2026-05-13 22:21:18.996','2026-05-13 22:21:18.996','2026-10-03 13:29:45.067'),('cmus4hrs300e17k9o033rw8s3','cmus4hr3d00dt7k9o6wgfdg7o','Rangoli Bloom','rangoli-bloom-4mkrm7','Rangoli Bloom is an original, signed artwork by Rathore Heritage Gallery. We keep centuries-old geometry alive, one petal at a time. Ships ready to hang with a certificate of authenticity.','WALL_ART','ORIGINAL','APPROVED','cmus4gqdl001j7k9o4afdm58o','cmus4gvmi00277k9oquh3ad2j','cmus4goht000u7k9om3hzgnyt','cmus4gojt00157k9ov7bvzjx8',2024,90.00,62.00,3.00,'PORTRAIT','red',123000.00,NULL,'INR','AG-00032',1,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Tibetan, Central Tibet, Tsang (Ngor Monastery), Sakya order - Four Mandalas of the Vajravali Series - Google Art Project\" by Tibetan, Central Tibet, Tsang (Ngor Monastery), Sakya order Details on Google Art Project — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Tibetan,_Central_Tibet,_Tsang_(Ngor_Monastery),_Sakya_order_-_Four_Mandalas_of_the_Vajravali_Series_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022128053-HyEktoYMnCRr-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022128053-HyEktoYMnCRr.webp',NULL,754,0,43,0.00,0,'2026-05-01 02:21:20.650','2026-05-01 02:21:20.650','2026-10-03 10:08:49.086'),('cmus4hsf500ed7k9o9ck88moe','cmus4hr3d00dt7k9o6wgfdg7o','Temple Geometry','temple-geometry-awaxbz','Temple Geometry is an original, signed artwork by Rathore Heritage Gallery. We keep centuries-old geometry alive, one petal at a time. Ships ready to hang with a certificate of authenticity.','WALL_ART','ORIGINAL','APPROVED','cmus4gqdl001j7k9o4afdm58o','cmus4gvsf00287k9oot5tjwnl','cmus4goh5000q7k9obwnez6v1','cmus4gojn00147k9ohso8gbot',2025,50.00,50.00,3.00,'LANDSCAPE','orange',147000.00,NULL,'INR','AG-00033',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Kangra painting of a darbar (court) scene with Sansar Chand of Kangra and Jai Singh Kanhaiya, circa 18th or 19th century\" by Attributed to either Bassia, the brother of Purkhu, or Bassia\'s son Shiba — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Kangra_painting_of_a_darbar_(court)_scene_with_Sansar_Chand_of_Kangra_and_Jai_Singh_Kanhaiya,_circa_18th_or_19th_century.webp). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022158027-M0nQmQzx-qKW-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022158027-M0nQmQzx-qKW.webp',NULL,1376,0,10,0.00,0,'2026-05-28 21:21:21.566','2026-05-28 21:21:21.566','2026-10-03 10:09:19.955'),('cmus4ht7100em7k9owzjmcmpd','cmus4hr3d00dt7k9o6wgfdg7o','Cosmic Chakra','cosmic-chakra-kw6uua','Cosmic Chakra is an original, signed artwork by Rathore Heritage Gallery. We keep centuries-old geometry alive, one petal at a time. Ships ready to hang with a certificate of authenticity.','WALL_ART','ORIGINAL','APPROVED','cmus4gqdl001j7k9o4afdm58o','cmus4gvzg00297k9o6kn3c8h0','cmus4goii000y7k9oc3i8bt6e','cmus4gojt00157k9ov7bvzjx8',2023,30.00,41.00,3.00,'LANDSCAPE','purple',98000.00,83300.00,'INR','AG-00034',1,1,'Source image licence: CC0. Demo listing for development only.','Image: \"India, Calcutta, Kalighat painting, 19th century - Kalighat Painting - 2003.124 - Cleveland Museum of Art\" by anonymous — CC0, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:India,_Calcutta,_Kalighat_painting,_19th_century_-_Kalighat_Painting_-_2003.124_-_Cleveland_Museum_of_Art.tif). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022197014-7aoLfvS0tUPb-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022197014-7aoLfvS0tUPb.webp',NULL,288,0,0,0.00,0,'2026-09-07 00:21:22.416','2026-09-07 00:21:22.416','2026-10-03 10:09:57.618'),('cmus4htue00ey7k9oyy97p8es','cmus4hr3d00dt7k9o6wgfdg7o','Marigold Mandala','marigold-mandala-6bghgv','Marigold Mandala is a limited-edition archival print by Rathore Heritage Gallery. We keep centuries-old geometry alive, one petal at a time.','PRINT','PRINT','APPROVED','cmus4gore001b7k9oi5jclr77','cmus4gvmi00277k9oquh3ad2j','cmus4goht000u7k9om3hzgnyt','cmus4gojn00147k9ohso8gbot',2023,120.00,80.00,NULL,'PORTRAIT','red',2300.00,NULL,'INR','AG-00035',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Four Mandala Vajravali Thangka - Google Art Project\" by Unknown artistUnknown artist — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Four_Mandala_Vajravali_Thangka_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022195162-bhgP6alD8i9x-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022195162-bhgP6alD8i9x.webp',NULL,1062,1,37,0.00,0,'2026-09-05 05:21:23.412','2026-09-05 05:21:23.412','2026-10-03 10:15:52.870'),('cmus4huql00f77k9ozf307cff','cmus4hr3d00dt7k9o6wgfdg7o','Pichwai Lotus','pichwai-lotus-8hhq23','Pichwai Lotus is a high-resolution digital artwork by Rathore Heritage Gallery. We keep centuries-old geometry alive, one petal at a time.','DIGITAL_ART','DIGITAL','APPROVED','cmus4gpez001e7k9o0e07usez','cmus4gvsf00287k9oot5tjwnl','cmus4goi5000w7k9owkuv8zqy','cmus4gojt00157k9ov7bvzjx8',2026,NULL,NULL,NULL,'PORTRAIT','orange',1800.00,NULL,'INR','AG-00036',0,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Painting of Ranbir Chand and Pramod Chand, grandsons of Sansar Chand. Kangra, ca.1838\" by Unknown authorUnknown author — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Painting_of_Ranbir_Chand_and_Pramod_Chand,_grandsons_of_Sansar_Chand._Kangra,_ca.1838.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022186819--B2cjP3NIMhH-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022186819--B2cjP3NIMhH.webp','digital-art/1791022238262-SWRAo2zELG6e.jpg',322,1,19,5.00,1,'2026-07-24 07:21:24.417','2026-07-24 07:21:24.417','2026-10-03 10:10:38.273'),('cmus4hw0j00fr7k9onehfa6uz','cmus4hvaf00fj7k9omlgiu1hu','Sakura Daydream','sakura-daydream-9t2b95','Sakura Daydream is an original, signed artwork by Aiko Tanaka. Joy is a valid artistic statement. Ships ready to hang with a certificate of authenticity.','PORTRAIT','ORIGINAL','APPROVED','cmus4goze001c7k9op638p2tc','cmus4gvcn00257k9ozbmxla8t','cmus4gohb000r7k9oh2wb4nft','cmus4goka00187k9ocqcefhmx',2026,50.00,50.00,3.00,'PORTRAIT','pink',67000.00,NULL,'INR','AG-00037',1,1,'Source image licence: CC0. Demo listing for development only.','Image: \"名所江戶百景 大はしあたけの夕立-Sudden Shower over Shin-Ōhashi Bridge and Atake (Ōhashi Atake no yūdachi), from the series One Hundred Famous Views of Edo (Meisho Edo hyakkei) MET DP121526\" by Utagawa Hiroshige — CC0, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:%E5%90%8D%E6%89%80%E6%B1%9F%E6%88%B6%E7%99%BE%E6%99%AF_%E5%A4%A7%E3%81%AF%E3%81%97%E3%81%82%E3%81%9F%E3%81%91%E3%81%AE%E5%A4%95%E7%AB%8B-Sudden_Shower_over_Shin-%C5%8Chashi_Bridge_and_Atake_(%C5%8Chashi_Atake_no_y%C5%ABdachi),_from_the_series_One_Hundred_Famous_Views_of_Edo_(Meisho_Edo_hyakkei)_MET_DP121526.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022199401-pYUM7tU_y19R-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022199401-pYUM7tU_y19R.webp',NULL,337,1,0,5.00,1,'2026-09-15 12:21:26.126','2026-09-15 12:21:26.126','2026-10-03 13:17:39.524'),('cmus4hwee00g37k9oy0r428li','cmus4hvaf00fj7k9omlgiu1hu','Chai Pop','chai-pop-si4kxe','Chai Pop is an original, signed artwork by Aiko Tanaka. Joy is a valid artistic statement. Ships ready to hang with a certificate of authenticity.','WALL_ART','ORIGINAL','APPROVED','cmus4gqir001k7k9o632dl2xr','cmus4gv6g00247k9okpq70t61','cmus4goi5000w7k9owkuv8zqy','cmus4gojz00167k9o7nmfsl6i',2022,30.00,41.00,3.00,'LANDSCAPE','purple',88000.00,NULL,'INR','AG-00038',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"(Albi) Procès Arton, Arton s\'expliquant - 1896 - Henri de Toulouse-Lautrec - Musée Toulouse-Lautrec\" by Didier Descouens — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:(Albi)_Proc%C3%A8s_Arton,_Arton_s%27expliquant_-_1896_-_Henri_de_Toulouse-Lautrec_-_Mus%C3%A9e_Toulouse-Lautrec.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022135526-irIwZeJftBKm-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022135526-irIwZeJftBKm.webp',NULL,402,1,53,5.00,1,'2026-05-12 07:21:26.724','2026-05-12 07:21:26.724','2026-10-03 13:17:39.544'),('cmus4hwyo00gc7k9oni4p9nuf','cmus4hvaf00fj7k9omlgiu1hu','Midnight Muse','midnight-muse-nameaz','Midnight Muse is an original, signed artwork by Aiko Tanaka. Joy is a valid artistic statement. Ships ready to hang with a certificate of authenticity.','PORTRAIT','ORIGINAL','APPROVED','cmus4goze001c7k9op638p2tc','cmus4gvcn00257k9ozbmxla8t','cmus4gogv000p7k9o8h1s6jzn','cmus4goka00187k9ocqcefhmx',2024,120.00,80.00,3.00,'LANDSCAPE','multicolor',63000.00,53550.00,'INR','AG-00039',0,1,'Source image licence: Public domain. Demo listing for development only.','Image: \"Katsushika Hokusai, published by Nishimuraya Yohachi (Eijudō) - Fine Wind, Clear Weather (Gaifū kaisei), also known as Red Fuji, from the series Thirty-six Views o... - Google Art Project - Cropped\" by Katsushika Hokusai, published by Nishimuraya Yohachi (Eijudō) (1760 - 1849) – Artist (Japanese) Details on Google Art Project — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Katsushika_Hokusai,_published_by_Nishimuraya_Yohachi_(Eijud%C5%8D)_-_Fine_Wind,_Clear_Weather_(Gaif%C5%AB_kaisei),_also_known_as_Red_Fuji,_from_the_series_Thirty-six_Views_o..._-_Google_Art_Project_-_Cropped.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022170738-yD2j0nJu7nYR-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022170738-yD2j0nJu7nYR.webp',NULL,1264,0,51,0.00,0,'2026-06-06 23:21:27.379','2026-06-06 23:21:27.379','2026-10-03 10:14:42.058'),('cmus4hxds00gm7k9o8bto2vis','cmus4hvaf00fj7k9omlgiu1hu','Retro Rickshaw','retro-rickshaw-4giyzn','Retro Rickshaw is a limited-edition archival print by Aiko Tanaka. Joy is a valid artistic statement.','PRINT','PRINT','APPROVED','cmus4gqir001k7k9o632dl2xr','cmus4gv6g00247k9okpq70t61','cmus4goi5000w7k9owkuv8zqy','cmus4gojz00167k9o7nmfsl6i',2025,60.00,75.00,NULL,'PORTRAIT','pink',5000.00,NULL,'INR','AG-00040',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"(Albi) Moulin-rouge. La Goulue et Valentin le desossé - Toulouse-Lautrec 1891 - Inv.138\" by Didier Descouens — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:(Albi)_Moulin-rouge._La_Goulue_et_Valentin_le_desoss%C3%A9_-_Toulouse-Lautrec_1891_-_Inv.138.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022130175-VEZo_jNRP25u-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022130175-VEZo_jNRP25u.webp',NULL,436,0,0,0.00,0,'2026-05-02 07:21:27.998','2026-05-02 07:21:27.998','2026-10-03 10:08:53.204'),('cmus4hycx00h57k9oyyywk1fa','cmus4hxuj00gx7k9omkclsld2','Bollywood Neon','bollywood-neon-nhfxta','Bollywood Neon is an original, signed artwork by Pixel & Pigment. Art should be loud enough to start a conversation. Ships ready to hang with a certificate of authenticity.','WALL_ART','ORIGINAL','APPROVED','cmus4gqir001k7k9o632dl2xr','cmus4gv2n00237k9o8n9gd2m9','cmus4goh5000q7k9obwnez6v1','cmus4gok400177k9otg78ncs0',2025,30.00,41.00,3.00,'PORTRAIT','multicolor',63000.00,NULL,'INR','AG-00041',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Alphonse Mucha - Job - Google Art Project\" by Alphonse Mucha — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Alphonse_Mucha_-_Job_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022192437-fchA4cSEPXaH-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022192437-fchA4cSEPXaH.webp',NULL,462,0,0,0.00,0,'2026-08-10 21:21:29.098','2026-08-10 21:21:29.098','2026-10-03 10:09:53.117'),('cmus4hz2j00hh7k9o4t85ppal','cmus4hxuj00gx7k9omkclsld2','Fluid Memory','fluid-memory-znnrmt','Fluid Memory is an original, signed artwork by Pixel & Pigment. Art should be loud enough to start a conversation. Ships ready to hang with a certificate of authenticity.','ABSTRACT','ORIGINAL','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gu00001w7k9odof3qzvo','cmus4goib000x7k9ojt1mur97','cmus4gojz00167k9o7nmfsl6i',2022,120.00,80.00,3.00,'PORTRAIT','orange',85000.00,NULL,'INR','AG-00042',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Gebirge or Steiniger Weg by Franz Marc\" by Franz Marc — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Gebirge_or_Steiniger_Weg_by_Franz_Marc.JPG). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022184752-YNcPMnl1IYIC-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022184752-YNcPMnl1IYIC.webp',NULL,903,0,31,0.00,0,'2026-07-07 19:21:30.179','2026-07-07 19:21:30.179','2026-10-03 10:09:45.316'),('cmus4hzlh00hq7k9oarrzp2md','cmus4hxuj00gx7k9omkclsld2','Comic Crush','comic-crush-5nqyyi','Comic Crush is an original, signed artwork by Pixel & Pigment. Art should be loud enough to start a conversation. Ships ready to hang with a certificate of authenticity.','WALL_ART','ORIGINAL','APPROVED','cmus4gqir001k7k9o632dl2xr','cmus4gv2n00237k9o8n9gd2m9','cmus4goh5000q7k9obwnez6v1','cmus4gok400177k9otg78ncs0',2023,60.00,75.00,3.00,'PORTRAIT','multicolor',98000.00,83300.00,'INR','AG-00043',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Alphonse Mucha - Poster for Victorien Sardou\'s Gismonda starring Sarah Bernhardt - Original\" by Alphonse Mucha — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Alphonse_Mucha_-_Poster_for_Victorien_Sardou%27s_Gismonda_starring_Sarah_Bernhardt_-_Original.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022141751-C4Hs2RBOf7mC-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022141751-C4Hs2RBOf7mC.webp',NULL,1124,1,0,5.00,1,'2026-05-13 16:21:30.716','2026-05-13 16:21:30.716','2026-10-03 13:17:39.564'),('cmus4i0ei00i27k9olvnvpde4','cmus4hxuj00gx7k9omkclsld2','Neon Ragas','neon-ragas-y74gut','Neon Ragas is a limited-edition archival print by Pixel & Pigment. Art should be loud enough to start a conversation.','PRINT','PRINT','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gtku001t7k9ofpj2dwqe','cmus4goh5000q7k9obwnez6v1','cmus4gojz00167k9o7nmfsl6i',2026,90.00,62.00,NULL,'PORTRAIT','orange',2500.00,NULL,'INR','AG-00044',0,0,'Source image licence: CC0. Demo listing for development only.','Image: \"Kandinsky - Yellow Painting, 1938 - 2\" by Xyxyzyz — CC0, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Kandinsky_-_Yellow_Painting,_1938_-_2.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022188574-JPsZdrQnd6cW-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022188574-JPsZdrQnd6cW.webp',NULL,893,2,56,4.00,1,'2026-07-31 04:21:31.906','2026-07-31 04:21:31.906','2026-10-03 10:09:49.130'),('cmus4i1s700il7k9owwmu9gq9','cmus4i12900id7k9oc65g1ku8','Velvet Storm','velvet-storm-tituir','Velvet Storm is an original, signed artwork by Ananya Sen Fine Art. The tree is my self-portrait: rooted, reaching, changing with seasons. Ships ready to hang with a certificate of authenticity.','ABSTRACT','ORIGINAL','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gtku001t7k9ofpj2dwqe','cmus4goh5000q7k9obwnez6v1','cmus4gok400177k9otg78ncs0',2025,120.00,80.00,3.00,'LANDSCAPE','purple',13000.00,NULL,'INR','AG-00045',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Kandinsky Das bunte Leben PA291001\" by Wassily Kandinsky — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Kandinsky_Das_bunte_Leben_PA291001.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022186034-CqcdkW_JBXeR-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022186034-CqcdkW_JBXeR.webp',NULL,1390,0,40,0.00,0,'2026-07-22 21:21:33.619','2026-07-22 21:21:33.619','2026-10-03 10:09:46.739'),('cmus4i5xq00ix7k9olqndn14w','cmus4i12900id7k9oc65g1ku8','Celestial Banyan','celestial-banyan-39hi7m','Celestial Banyan is an original, signed artwork by Ananya Sen Fine Art. The tree is my self-portrait: rooted, reaching, changing with seasons. Ships ready to hang with a certificate of authenticity.','ORIGINAL_PAINTING','ORIGINAL','APPROVED','cmus4gsz4001q7k9ofrxhlv8p','cmus4gtku001t7k9ofpj2dwqe','cmus4gogv000p7k9o8h1s6jzn','cmus4gojt00157k9ov7bvzjx8',2024,60.00,75.00,3.00,'LANDSCAPE','teal',10000.00,NULL,'INR','AG-00046',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Composition VII - Wassily Kandinsky, GAC\" by Wassily Kandinsky — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Composition_VII_-_Wassily_Kandinsky,_GAC.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022155529-hgfUZjBXC2AC-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022155529-hgfUZjBXC2AC.webp',NULL,381,0,17,0.00,0,'2026-05-24 18:21:39.077','2026-05-24 18:21:39.077','2026-10-03 10:09:17.822'),('cmus4i6so00j67k9ogikqr5c1','cmus4i12900id7k9oc65g1ku8','Holi Afterglow','holi-afterglow-gb92n5','Holi Afterglow is an original, signed artwork by Ananya Sen Fine Art. The tree is my self-portrait: rooted, reaching, changing with seasons. Ships ready to hang with a certificate of authenticity.','ABSTRACT','ORIGINAL','APPROVED','cmus4gp9u001d7k9oh67cz2fu','cmus4gtsh001v7k9ob8d4ynp9','cmus4gogv000p7k9o8h1s6jzn','cmus4gok400177k9otg78ncs0',2025,90.00,62.00,3.00,'SQUARE','multicolor',76000.00,64600.00,'INR','AG-00047',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Robert Delaunay - Rythme, Joie de vivre\" by Robert Delaunay — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Robert_Delaunay_-_Rythme,_Joie_de_vivre.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022166141-zsebVtd1fvgx-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022166141-zsebVtd1fvgx.webp',NULL,1172,0,0,0.00,0,'2026-06-06 05:21:40.106','2026-06-06 05:21:40.106','2026-10-03 10:09:28.193'),('cmus4iauj00jg7k9ozca0tvf8','cmus4i12900id7k9oc65g1ku8','Gulmohar Dreams','gulmohar-dreams-uebp5p','Gulmohar Dreams is a limited-edition archival print by Ananya Sen Fine Art. The tree is my self-portrait: rooted, reaching, changing with seasons.','PRINT','PRINT','APPROVED','cmus4gsz4001q7k9ofrxhlv8p','cmus4gtku001t7k9ofpj2dwqe','cmus4gogv000p7k9o8h1s6jzn','cmus4gojt00157k9ov7bvzjx8',2024,50.00,50.00,NULL,'LANDSCAPE','purple',2800.00,NULL,'INR','AG-00048',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Kandinsky - Jaune Rouge Bleu\" by Wassily Kandinsky — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Kandinsky_-_Jaune_Rouge_Bleu.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022160214-u8Fjr6TgKObC-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022160214-u8Fjr6TgKObC.webp',NULL,467,0,13,0.00,0,'2026-06-01 03:21:45.442','2026-06-01 03:21:45.442','2026-10-03 10:09:21.602'),('cmus4ic4j00jy7k9otnqq6950','cmus4gwzb00347k9o7jpqfl1i','Navaratri Mandala','navaratri-mandala-8faa2z','A nine-ring mandala celebrating the nine nights of Navaratri.','WALL_ART','ORIGINAL','APPROVED','cmus4grcw001o7k9odnmgy0i0','cmus4gvmi00277k9oquh3ad2j','cmus4goh5000q7k9obwnez6v1',NULL,NULL,NULL,NULL,NULL,'PORTRAIT','purple',18000.00,NULL,'INR','AG-00049',0,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"Hevajra Mandala - Google Art Project\" by Unknown authorUnknown author — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Hevajra_Mandala_-_Google_Art_Project.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022202460-E0b8rjyXWgSX-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022202460-E0b8rjyXWgSX.webp',NULL,2,0,0,0.00,0,'2026-10-03 13:14:54.029','2026-10-03 08:21:47.108','2026-10-03 13:22:20.070'),('cmus64hbg006l7ky0abc3cdq2','cmus5zslg005s7ky0dymbgs16','test','test-rr47bt',NULL,'ORIGINAL_PAINTING','ORIGINAL','APPROVED','cmus4goze001c7k9op638p2tc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PORTRAIT',NULL,1200.00,NULL,'INR','ART-EF88HA3L',1,0,'Source image licence: Public domain. Demo listing for development only.','Image: \"1665 Girl with a Pearl Earring\" by Johannes Vermeer — Public domain, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:1665_Girl_with_a_Pearl_Earring.jpg). Demo catalogue image.','https://mymoonsgallery.com/media/artworks/1791022203383-NgQgMgpeedNt-thumb.webp','https://mymoonsgallery.com/media/artworks/1791022203383-NgQgMgpeedNt.webp',NULL,11,0,0,0.00,0,'2026-10-03 09:08:54.682','2026-10-03 09:06:59.884','2026-10-03 13:14:00.563');
/*!40000 ALTER TABLE `Artwork` ENABLE KEYS */;

--
-- Table structure for table `ArtworkApproval`
--

DROP TABLE IF EXISTS `ArtworkApproval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkApproval` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `actorId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromStatus` enum('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','SUSPENDED','SOLD_OUT','ARCHIVED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toStatus` enum('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','SUSPENDED','SOLD_OUT','ARCHIVED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ArtworkApproval_artworkId_idx` (`artworkId`),
  CONSTRAINT `ArtworkApproval_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkApproval`
--

/*!40000 ALTER TABLE `ArtworkApproval` DISABLE KEYS */;
INSERT INTO `ArtworkApproval` (`id`, `artworkId`, `actorId`, `fromStatus`, `toStatus`, `reason`, `createdAt`) VALUES ('cmus4gxra003h7k9oyv104mz3','cmus4gxra003e7k9o5dwrm7cw',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:41.830'),('cmus4gxra003i7k9odblcexdn','cmus4gxra003e7k9o5dwrm7cw','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:41.830'),('cmus4gyfz003s7k9osrbs2qmn','cmus4gyfz003q7k9o4bmryodo',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:42.719'),('cmus4gyfz003t7k9ow4sz72ah','cmus4gyfz003q7k9o4bmryodo','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:42.719'),('cmus4gyzg00427k9os53abyfm','cmus4gyzg003z7k9o9ppb7rsa',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:43.420'),('cmus4gyzg00437k9o9matpkmu','cmus4gyzg003z7k9o9ppb7rsa','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:43.420'),('cmus4gzn3004d7k9ojg4p7ei0','cmus4gzn3004b7k9o5ut5d75u',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:44.271'),('cmus4gzn3004e7k9o6413k751','cmus4gzn3004b7k9o5ut5d75u','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:44.271'),('cmus4h0ca004n7k9ogxd03naa','cmus4h0ca004k7k9o4ce280xx',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:45.178'),('cmus4h0ca004o7k9od49lylzj','cmus4h0ca004k7k9o4ce280xx','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:45.178'),('cmus4h0u0004w7k9o31qk5i30','cmus4h0u0004u7k9oromd8d7l',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:45.816'),('cmus4h0u0004x7k9os36hir8u','cmus4h0u0004u7k9oromd8d7l','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:45.816'),('cmus4h2ee005i7k9okkpxmlpn','cmus4h2ee005f7k9ozvv0cna3',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:47.846'),('cmus4h2ee005j7k9odc3baexm','cmus4h2ee005f7k9ozvv0cna3','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:47.846'),('cmus4h375005t7k9ocru61uzl','cmus4h374005r7k9otwxg61kt',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:48.881'),('cmus4h375005u7k9ojnfsxah3','cmus4h374005r7k9otwxg61kt','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:48.881'),('cmus4h42d00637k9oclger1dq','cmus4h42d00607k9owhfywle8',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:50.005'),('cmus4h42d00647k9oml9ax0h6','cmus4h42d00607k9owhfywle8','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:50.005'),('cmus4h4rh006c7k9ok3se13w9','cmus4h4rh006a7k9ooidrg0lf',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:50.909'),('cmus4h4rh006d7k9oaj22kbmz','cmus4h4rh006a7k9ooidrg0lf','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:50.909'),('cmus4h5qe006m7k9ov3kmdnal','cmus4h5qe006j7k9ozq878v35',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:52.166'),('cmus4h5qe006n7k9o9mka25ll','cmus4h5qe006j7k9ozq878v35','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:52.166'),('cmus4h6kx00787k9oxr8cw3j2','cmus4h6kx00757k9oaoiipq1v',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:53.265'),('cmus4h6kx00797k9ocm1ontt7','cmus4h6kx00757k9oaoiipq1v','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:53.265'),('cmus4h7cq007j7k9ogypoca3h','cmus4h7cq007h7k9o8wj0tfx4',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:54.266'),('cmus4h7cq007k7k9oxobnsveq','cmus4h7cq007h7k9o8wj0tfx4','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:54.266'),('cmus4h7pz007t7k9oj3usa50y','cmus4h7pz007q7k9odjfgw811',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:54.744'),('cmus4h7pz007u7k9ohxyephkj','cmus4h7pz007q7k9odjfgw811','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:54.744'),('cmus4h8j700847k9o3zfmng3s','cmus4h8j600827k9ozjf54quc',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:55.794'),('cmus4h8j700857k9otfyuaqg3','cmus4h8j600827k9ozjf54quc','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:55.794'),('cmus4h8z0008e7k9onc3kspzk','cmus4h8z0008b7k9oc0magitx',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:56.364'),('cmus4h8z0008f7k9o8m4jor1s','cmus4h8z0008b7k9oc0magitx','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:56.364'),('cmus4ha8s00907k9ozud3j1kn','cmus4ha8s008x7k9o1e8wgcdj',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:58.013'),('cmus4ha8t00917k9o3ana7q6f','cmus4ha8s008x7k9o1e8wgcdj','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:58.013'),('cmus4hasq009b7k9o9d3b4uux','cmus4hasq00997k9oirpx23io',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:58.730'),('cmus4hasq009c7k9oc9u0ardd','cmus4hasq00997k9oirpx23io','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:58.730'),('cmus4hbjt009l7k9oqbd9uo30','cmus4hbjt009i7k9oz1nlxy39',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:20:59.705'),('cmus4hbjt009m7k9od9a3bn4x','cmus4hbjt009i7k9oz1nlxy39','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:20:59.705'),('cmus4hc8l009u7k9ovizpvxst','cmus4hc8k009s7k9ozp0cb1rf',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:00.597'),('cmus4hc8l009v7k9oo2ahjrdi','cmus4hc8k009s7k9ozp0cb1rf','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:00.597'),('cmus4hd2j00a47k9ok1riw3bj','cmus4hd2j00a17k9o1jyc3uhf',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:01.675'),('cmus4hd2j00a57k9oizvvjsz4','cmus4hd2j00a17k9o1jyc3uhf','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:01.675'),('cmus4heds00ao7k9oe7clx2l4','cmus4heds00al7k9oktw2hgjb',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:03.376'),('cmus4heds00ap7k9oiwzeeeo6','cmus4heds00al7k9oktw2hgjb','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:03.376'),('cmus4hf3n00az7k9o36ykeerh','cmus4hf3n00ax7k9oijuw97n4',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:04.307'),('cmus4hf3n00b07k9on7dzxqgt','cmus4hf3n00ax7k9oijuw97n4','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:04.307'),('cmus4hfwi00b97k9o0fravjb2','cmus4hfwi00b67k9oy06oc8ue',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:05.346'),('cmus4hfwi00ba7k9ozm8pzp0f','cmus4hfwi00b67k9oy06oc8ue','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:05.346'),('cmus4hgms00bk7k9o9puwl55e','cmus4hgms00bi7k9ohya2eapy',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:06.292'),('cmus4hgms00bl7k9o0im5nxz8','cmus4hgms00bi7k9ohya2eapy','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:06.292'),('cmus4hhfw00bu7k9o2f00fl7d','cmus4hhfw00br7k9o93y4lbtf',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:07.340'),('cmus4hhfw00bv7k9ozwusqnqj','cmus4hhfw00br7k9o93y4lbtf','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:07.340'),('cmus4hikt00cg7k9ojlqsaf11','cmus4hikt00cd7k9oq5by8244',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:08.813'),('cmus4hikt00ch7k9o04rdmarr','cmus4hikt00cd7k9oq5by8244','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:08.813'),('cmus4hm3l00cr7k9oxprgbku7','cmus4hm3l00cp7k9ocan2fb73',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:13.377'),('cmus4hm3l00cs7k9o8wah9hl4','cmus4hm3l00cp7k9ocan2fb73','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:13.377'),('cmus4hmp100d17k9owogaojdl','cmus4hmp100cy7k9orpyduwko',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:14.149'),('cmus4hmp100d27k9o962glvah','cmus4hmp100cy7k9orpyduwko','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:14.149'),('cmus4hpzt00da7k9ov93r53pc','cmus4hpzt00d87k9otb2cytkr',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:18.425'),('cmus4hpzt00db7k9ojhbk86fx','cmus4hpzt00d87k9otb2cytkr','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:18.425'),('cmus4hqht00dk7k9ogsiwfd5f','cmus4hqht00dh7k9onmak8cwl',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:19.074'),('cmus4hqht00dl7k9o543p8zvv','cmus4hqht00dh7k9onmak8cwl','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:19.074'),('cmus4hrs300e47k9ovfoilg59','cmus4hrs300e17k9o033rw8s3',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:20.739'),('cmus4hrs300e57k9o0anptjtb','cmus4hrs300e17k9o033rw8s3','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:20.739'),('cmus4hsf500ef7k9o3j5sqe5l','cmus4hsf500ed7k9o9ck88moe',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:21.569'),('cmus4hsf500eg7k9ojtjvijdq','cmus4hsf500ed7k9o9ck88moe','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:21.569'),('cmus4ht7100ep7k9or5p9wfcg','cmus4ht7100em7k9owzjmcmpd',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:22.573'),('cmus4ht7100eq7k9oomw7a679','cmus4ht7100em7k9owzjmcmpd','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:22.573'),('cmus4htue00f07k9ow91ihfue','cmus4htue00ey7k9oyy97p8es',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:23.414'),('cmus4htue00f17k9orbfh7au1','cmus4htue00ey7k9oyy97p8es','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:23.414'),('cmus4huql00fa7k9oxn2gu84h','cmus4huql00f77k9ozf307cff',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:24.573'),('cmus4huql00fb7k9o7cuwktqa','cmus4huql00f77k9ozf307cff','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:24.573'),('cmus4hw0j00fu7k9oxos3eo1i','cmus4hw0j00fr7k9onehfa6uz',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:26.227'),('cmus4hw0j00fv7k9om68bbyl3','cmus4hw0j00fr7k9onehfa6uz','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:26.227'),('cmus4hwee00g57k9oh4qt7pbi','cmus4hwee00g37k9oy0r428li',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:26.726'),('cmus4hwee00g67k9o3tent103','cmus4hwee00g37k9oy0r428li','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:26.726'),('cmus4hwyo00gf7k9odc3jgkmx','cmus4hwyo00gc7k9oni4p9nuf',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:27.456'),('cmus4hwyo00gg7k9o827359c3','cmus4hwyo00gc7k9oni4p9nuf','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:27.456'),('cmus4hxds00go7k9o56x8kdme','cmus4hxds00gm7k9o8bto2vis',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:28.001'),('cmus4hxds00gp7k9o95yojkzo','cmus4hxds00gm7k9o8bto2vis','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:28.001'),('cmus4hycx00h87k9o54sbfv50','cmus4hycx00h57k9oyyywk1fa',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:29.265'),('cmus4hycx00h97k9o6lfcvi6r','cmus4hycx00h57k9oyyywk1fa','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:29.265'),('cmus4hz2j00hj7k9omcpyiope','cmus4hz2j00hh7k9o4t85ppal',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:30.187'),('cmus4hz2j00hk7k9owa2gbzwm','cmus4hz2j00hh7k9o4t85ppal','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:30.187'),('cmus4hzlh00ht7k9o5ua454yw','cmus4hzlh00hq7k9oarrzp2md',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:30.869'),('cmus4hzlh00hu7k9oj00senkq','cmus4hzlh00hq7k9oarrzp2md','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:30.869'),('cmus4i0ei00i47k9ooranr0xj','cmus4i0ei00i27k9olvnvpde4',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:31.914'),('cmus4i0ei00i57k9oxl7q0hqp','cmus4i0ei00i27k9olvnvpde4','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:31.914'),('cmus4i1s700io7k9oqb9m18sg','cmus4i1s700il7k9owwmu9gq9',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:33.701'),('cmus4i1s700ip7k9orxzn0rnm','cmus4i1s700il7k9owwmu9gq9','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:33.701'),('cmus4i5xq00iz7k9oonrfo187','cmus4i5xq00ix7k9olqndn14w',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:39.086'),('cmus4i5xq00j07k9ovurpxn9y','cmus4i5xq00ix7k9olqndn14w','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:39.086'),('cmus4i6so00j97k9ot0ob6slq','cmus4i6so00j67k9ogikqr5c1',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:40.200'),('cmus4i6so00ja7k9o40hipiwm','cmus4i6so00j67k9ogikqr5c1','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:40.200'),('cmus4iauj00ji7k9oaes6gvmt','cmus4iauj00jg7k9ozca0tvf8',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:45.451'),('cmus4iauj00jj7k9ogb762xei','cmus4iauj00jg7k9ozca0tvf8','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 08:21:45.451'),('cmus4ic4j00k07k9osa5qofwq','cmus4ic4j00jy7k9otnqq6950',NULL,NULL,'PENDING_REVIEW','Submitted','2026-10-03 08:21:47.108'),('cmus64hc6006n7ky0p4oq7q03','cmus64hbg006l7ky0abc3cdq2','cmus5zslf005p7ky0dyh0xhr5',NULL,'DRAFT','Created','2026-10-03 09:06:59.910'),('cmus64r8y006v7ky0h2m5y3c7','cmus64hbg006l7ky0abc3cdq2','cmus5zslf005p7ky0dyh0xhr5','DRAFT','PENDING_REVIEW','Submitted for review','2026-10-03 09:07:12.754'),('cmus66xwm00787ky09v34peam','cmus64hbg006l7ky0abc3cdq2','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 09:08:54.694'),('cmusezaai001n7kzg8cc9wgkd','cmus4ic4j00jy7k9otnqq6950','cmus4gw91002c7k9ozx8w96po','PENDING_REVIEW','APPROVED',NULL,'2026-10-03 13:14:54.042'),('cmusf2tx400017k0880fbbk77','cmus4gyfz003q7k9o4bmryodo','cmus4gw91002c7k9ozx8w96po','SOLD_OUT','APPROVED','Restocked (1) and activated by admin','2026-10-03 13:17:39.448'),('cmusf2ty000057k08gwqm71cq','cmus4h2ee005f7k9ozvv0cna3','cmus4gw91002c7k9ozx8w96po','SOLD_OUT','APPROVED','Restocked (1) and activated by admin','2026-10-03 13:17:39.479'),('cmusf2tyo00097k08v78qxfnn','cmus4h374005r7k9otwxg61kt','cmus4gw91002c7k9ozx8w96po','SOLD_OUT','APPROVED','Restocked (1) and activated by admin','2026-10-03 13:17:39.502'),('cmusf2tz9000d7k08u5ixchfo','cmus4hw0j00fr7k9onehfa6uz','cmus4gw91002c7k9ozx8w96po','SOLD_OUT','APPROVED','Restocked (1) and activated by admin','2026-10-03 13:17:39.524'),('cmusf2tzt000h7k08bfz6fzlt','cmus4hwee00g37k9oy0r428li','cmus4gw91002c7k9ozx8w96po','SOLD_OUT','APPROVED','Restocked (1) and activated by admin','2026-10-03 13:17:39.544'),('cmusf2u0e000l7k08nn3qjoc3','cmus4hzlh00hq7k9oarrzp2md','cmus4gw91002c7k9ozx8w96po','SOLD_OUT','APPROVED','Restocked (1) and activated by admin','2026-10-03 13:17:39.564');
/*!40000 ALTER TABLE `ArtworkApproval` ENABLE KEYS */;

--
-- Table structure for table `ArtworkCategory`
--

DROP TABLE IF EXISTS `ArtworkCategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkCategory` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtworkCategory_name_key` (`name`),
  UNIQUE KEY `ArtworkCategory_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkCategory`
--

/*!40000 ALTER TABLE `ArtworkCategory` DISABLE KEYS */;
INSERT INTO `ArtworkCategory` (`id`, `name`, `slug`, `description`, `imageUrl`, `sortOrder`, `isActive`) VALUES ('cmus4gore001b7k9oi5jclr77','Paintings','paintings','Original paintings in oil, acrylic and watercolour, signed by the artist.','https://mymoonsgallery.com/media/artworks/1791022204235-jB8DK1tvJxoJ.webp',0,1),('cmus4goze001c7k9op638p2tc','Portraits','portraits','Expressive portraits that capture character, emotion and story.','https://mymoonsgallery.com/media/artworks/1791022204889-ncXLe47z0vM9.webp',1,1),('cmus4gp9u001d7k9oh67cz2fu','Abstract Art','abstract-art','Colour, gesture and form freed from the literal.','https://mymoonsgallery.com/media/artworks/1791022205390-uj7C76k4j01W.webp',2,1),('cmus4gpez001e7k9o0e07usez','Digital Art','digital-art','Contemporary works created with digital brushes and tools.','https://mymoonsgallery.com/media/artworks/1791022205921-M3GeRqBMxbfh.webp',3,1),('cmus4gpld001f7k9orwu8xs9e','Photography','photography','Fine-art photography and limited edition photographic prints.','https://mymoonsgallery.com/media/artworks/1791022206876-b1U-5BIWU7Op.webp',4,1),('cmus4gpqo001g7k9od2qg09ba','Illustrations','illustrations','Narrative illustration, ink work and editorial art.','https://mymoonsgallery.com/media/artworks/1791022207655-TnMdXN1GvnIT.webp',5,1),('cmus4gq03001h7k9owcb37ugr','Sculptures','sculptures','Three-dimensional works in stone, metal, wood and clay.','https://mymoonsgallery.com/media/artworks/1791022208337-i4hPMH5i22BJ.webp',6,1),('cmus4gq53001i7k9or9lzi73y','Calligraphy','calligraphy','The art of beautiful lettering across scripts and traditions.','https://mymoonsgallery.com/media/artworks/1791022208950-fHyFAzq_t_4Y.webp',7,1),('cmus4gqdl001j7k9o4afdm58o','Traditional Art','traditional-art','Heritage techniques passed down through generations.','https://mymoonsgallery.com/media/artworks/1791022209835-v8KYwNE51oLo.webp',8,1),('cmus4gqir001k7k9o632dl2xr','Modern Art','modern-art','Bold modernist experiments in colour and composition.','https://mymoonsgallery.com/media/artworks/1791022210304-PROo5w2Bkazt.webp',9,1),('cmus4gqtc001l7k9og99ayxs9','Contemporary Art','contemporary-art','Art of our time — ideas, materials and voices of today.','https://mymoonsgallery.com/media/artworks/1791022211233-8h9_bRmNYYH2.webp',10,1),('cmus4gqy0001m7k9ogsdftyse','Minimalist Art','minimalist-art','Quiet compositions where less becomes more.','https://mymoonsgallery.com/media/artworks/1791022211780-godOb8l7uzPO.webp',11,1),('cmus4gr4e001n7k9o9vw1e07m','Landscape Art','landscape-art','Mountains, rivers, skies and cities seen through an artist’s eye.','https://mymoonsgallery.com/media/artworks/1791022212826-ep8FwJXexW4g.webp',12,1),('cmus4grcw001o7k9odnmgy0i0','Religious Art','religious-art','Devotional and spiritual works from many faiths.','https://mymoonsgallery.com/media/artworks/1791022215290-ChTE25huraX5.webp',13,1),('cmus4grme001p7k9obnh3fnjs','Cultural Art','cultural-art','Folk forms, festivals and the stories of communities.','https://mymoonsgallery.com/media/artworks/1791022217936-7Ml7UdbIsjKR.webp',14,1),('cmus4gsz4001q7k9ofrxhlv8p','Wall Art','wall-art','Statement pieces sized and framed for your walls.','https://mymoonsgallery.com/media/artworks/1791022220617-sq7ln2ajTjWZ.webp',15,1),('cmus4gt7c001r7k9o90zvw2im','Custom Art','custom-art','Commission personalised artwork from your own photos.','https://mymoonsgallery.com/media/artworks/1791022224390-gwhRI4yp-m5X.webp',16,1);
/*!40000 ALTER TABLE `ArtworkCategory` ENABLE KEYS */;

--
-- Table structure for table `ArtworkCollection`
--

DROP TABLE IF EXISTS `ArtworkCollection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkCollection` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `coverImageUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `isPublished` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtworkCollection_slug_key` (`slug`),
  KEY `ArtworkCollection_artistId_fkey` (`artistId`),
  CONSTRAINT `ArtworkCollection_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkCollection`
--

/*!40000 ALTER TABLE `ArtworkCollection` DISABLE KEYS */;
INSERT INTO `ArtworkCollection` (`id`, `artistId`, `name`, `slug`, `description`, `coverImageUrl`, `isFeatured`, `isPublished`, `createdAt`, `updatedAt`) VALUES ('cmus4ic4x00k27k9ojpl6wemg',NULL,'Nature Collection','nature-collection','Forests, coasts and skies — art that brings the outdoors in.','https://mymoonsgallery.com/media/artworks/1791022200182-LmFRLmthhlQi.webp',1,1,'2026-10-03 08:21:47.121','2026-10-03 10:10:34.601'),('cmus4ic5700k47k9oefh6xy3u',NULL,'Indian Heritage','indian-heritage','Mandalas, temple towns and old-city sketches celebrating India’s living traditions.','https://mymoonsgallery.com/media/artworks/1791022183675-NywmrEMKjX_v.webp',1,1,'2026-10-03 08:21:47.131','2026-10-03 10:10:34.632'),('cmus4ic5g00k67k9otm7omph6','cmus4h1iv00557k9oobpdcfx0','Modern Abstract','modern-abstract','Bold colour-field and gestural abstraction from Kapoor Contemporary.','https://mymoonsgallery.com/media/artworks/1791022200867-qkngns6FL8R1.webp',1,1,'2026-10-03 08:21:47.141','2026-10-03 10:10:34.651'),('cmus4ic5w00k87k9ofsilww7u',NULL,'Black & White','black-white','Monochrome studies in charcoal, graphite and ink.','https://mymoonsgallery.com/media/artworks/1791022190215-SD8ieZkq79Hv.webp',0,1,'2026-10-03 08:21:47.156','2026-10-03 10:10:34.669'),('cmus4ic6200ka7k9o5f45kvz2','cmus4h9jq008n7k9okcz2sm88','Emotional Portraits','emotional-portraits','Faces full of colour, feeling and story.','https://mymoonsgallery.com/media/artworks/1791022193764-1CV7Fnu0975f.webp',1,1,'2026-10-03 08:21:47.163','2026-10-03 10:10:34.686'),('cmus4ic6g00kc7k9owgd89uuq','cmus4h652006v7k9od0w60tg6','Minimalist Collection','minimalist-collection','Calm arches, soft palettes and generous negative space.','https://mymoonsgallery.com/media/artworks/1791022164064-7SiEu8wXqmg0.webp',0,1,'2026-10-03 08:21:47.176','2026-10-03 10:10:34.703');
/*!40000 ALTER TABLE `ArtworkCollection` ENABLE KEYS */;

--
-- Table structure for table `ArtworkImage`
--

DROP TABLE IF EXISTS `ArtworkImage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkImage` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storageKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `isPrimary` tinyint(1) NOT NULL DEFAULT '0',
  `sortOrder` int NOT NULL DEFAULT '0',
  `altText` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ArtworkImage_artworkId_idx` (`artworkId`),
  CONSTRAINT `ArtworkImage_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkImage`
--

/*!40000 ALTER TABLE `ArtworkImage` DISABLE KEYS */;
INSERT INTO `ArtworkImage` (`id`, `artworkId`, `url`, `thumbUrl`, `storageKey`, `width`, `height`, `isPrimary`, `sortOrder`, `altText`, `createdAt`) VALUES ('cmus8bzcv00017kbwhs896szw','cmus4hrs300e17k9o033rw8s3','https://mymoonsgallery.com/media/artworks/1791022128053-HyEktoYMnCRr.webp','https://mymoonsgallery.com/media/artworks/1791022128053-HyEktoYMnCRr-thumb.webp','artworks/1791022128053-HyEktoYMnCRr.webp',1656,2000,1,0,'Rangoli Bloom','2026-10-03 10:08:49.086'),('cmus8c03z00037kbwt3fyefic','cmus4hbjt009i7k9oz1nlxy39','https://mymoonsgallery.com/media/artworks/1791022129216-aYbTttzaH0r6.webp','https://mymoonsgallery.com/media/artworks/1791022129216-aYbTttzaH0r6-thumb.webp','artworks/1791022129216-aYbTttzaH0r6.webp',1498,2000,1,0,'Spectrum Soul','2026-10-03 10:08:50.062'),('cmus8c2jd00057kbwlo8zyli7','cmus4hxds00gm7k9o8bto2vis','https://mymoonsgallery.com/media/artworks/1791022130175-VEZo_jNRP25u.webp','https://mymoonsgallery.com/media/artworks/1791022130175-VEZo_jNRP25u-thumb.webp','artworks/1791022130175-VEZo_jNRP25u.webp',1419,2000,1,0,'Retro Rickshaw','2026-10-03 10:08:53.204'),('cmus8c47t00077kbwknlpkanp','cmus4hgms00bi7k9ohya2eapy','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv.webp','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv-thumb.webp','artworks/1791022133710-5LAPs5I_JrUv.webp',1374,2000,1,0,'Monsoon Tram','2026-10-03 10:08:55.384'),('cmus8c6ke00097kbwpzs5nobh','cmus4hwee00g37k9oy0r428li','https://mymoonsgallery.com/media/artworks/1791022135526-irIwZeJftBKm.webp','https://mymoonsgallery.com/media/artworks/1791022135526-irIwZeJftBKm-thumb.webp','artworks/1791022135526-irIwZeJftBKm.webp',1920,1407,1,0,'Chai Pop','2026-10-03 10:08:58.428'),('cmus8c8xn000b7kbwpr5qxoth','cmus4hf3n00ax7k9oijuw97n4','https://mymoonsgallery.com/media/artworks/1791022138923-KP_WOKKrLrPZ.webp','https://mymoonsgallery.com/media/artworks/1791022138923-KP_WOKKrLrPZ-thumb.webp','artworks/1791022138923-KP_WOKKrLrPZ.webp',1387,2000,1,0,'Charcoal Study I','2026-10-03 10:09:01.498'),('cmus8cbfk000d7kbwrevopw3h','cmus4hzlh00hq7k9oarrzp2md','https://mymoonsgallery.com/media/artworks/1791022141751-C4Hs2RBOf7mC.webp','https://mymoonsgallery.com/media/artworks/1791022141751-C4Hs2RBOf7mC-thumb.webp','artworks/1791022141751-C4Hs2RBOf7mC.webp',1455,2000,1,0,'Comic Crush','2026-10-03 10:09:04.731'),('cmus8ce6a000f7kbwhpgzquqy','cmus4hqht00dh7k9onmak8cwl','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU.webp','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU-thumb.webp','artworks/1791022145186-8l-CinY0zQvU.webp',1919,1594,1,0,'Harvest Moon Valley','2026-10-03 10:09:08.287'),('cmus8cg9g000h7kbw8tpugjkq','cmus4hhfw00br7k9o93y4lbtf','https://mymoonsgallery.com/media/artworks/1791022148601-_fU-boIYI1mH.webp','https://mymoonsgallery.com/media/artworks/1791022148601-_fU-boIYI1mH-thumb.webp','artworks/1791022148601-_fU-boIYI1mH.webp',1920,1489,1,0,'College Street','2026-10-03 10:09:10.994'),('cmus8cjge000j7kbw51tiulvt','cmus4hd2j00a17k9o1jyc3uhf','https://mymoonsgallery.com/media/artworks/1791022151596-rO_9WMRfgLXK.webp','https://mymoonsgallery.com/media/artworks/1791022151596-rO_9WMRfgLXK-thumb.webp','artworks/1791022151596-rO_9WMRfgLXK.webp',1610,2000,1,0,'Festival Eyes','2026-10-03 10:09:15.128'),('cmus8clj4000l7kbwnn9p9anx','cmus4i5xq00ix7k9olqndn14w','https://mymoonsgallery.com/media/artworks/1791022155529-hgfUZjBXC2AC.webp','https://mymoonsgallery.com/media/artworks/1791022155529-hgfUZjBXC2AC-thumb.webp','artworks/1791022155529-hgfUZjBXC2AC.webp',1920,1276,1,0,'Celestial Banyan','2026-10-03 10:09:17.822'),('cmus8cn6j000n7kbw1d8ok83f','cmus4hsf500ed7k9o9ck88moe','https://mymoonsgallery.com/media/artworks/1791022158027-M0nQmQzx-qKW.webp','https://mymoonsgallery.com/media/artworks/1791022158027-M0nQmQzx-qKW-thumb.webp','artworks/1791022158027-M0nQmQzx-qKW.webp',1600,1132,1,0,'Temple Geometry','2026-10-03 10:09:19.955'),('cmus8cog4000p7kbwcsj6z0x4','cmus4iauj00jg7k9ozca0tvf8','https://mymoonsgallery.com/media/artworks/1791022160214-u8Fjr6TgKObC.webp','https://mymoonsgallery.com/media/artworks/1791022160214-u8Fjr6TgKObC-thumb.webp','artworks/1791022160214-u8Fjr6TgKObC.webp',1920,1235,1,0,'Gulmohar Dreams','2026-10-03 10:09:21.602'),('cmus8cq1p000r7kbwaf1mv5o9','cmus4h4rh006a7k9ooidrg0lf','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0.webp','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0-thumb.webp','artworks/1791022161930-lokhaqH0ZFi0.webp',1920,1497,1,0,'Saffron Pulse','2026-10-03 10:09:23.671'),('cmus8cru1000t7kbw2a8l02h1','cmus4h6kx00757k9oaoiipq1v','https://mymoonsgallery.com/media/artworks/1791022164064-7SiEu8wXqmg0.webp','https://mymoonsgallery.com/media/artworks/1791022164064-7SiEu8wXqmg0-thumb.webp','artworks/1791022164064-7SiEu8wXqmg0.webp',1672,2000,1,0,'Arches of Calm','2026-10-03 10:09:25.992'),('cmus8ctj6000v7kbwo9oz92tq','cmus4i6so00j67k9ogikqr5c1','https://mymoonsgallery.com/media/artworks/1791022166141-zsebVtd1fvgx.webp','https://mymoonsgallery.com/media/artworks/1791022166141-zsebVtd1fvgx-thumb.webp','artworks/1791022166141-zsebVtd1fvgx.webp',1920,1674,1,0,'Holi Afterglow','2026-10-03 10:09:28.193'),('cmus8cvec000x7kbwtezssa41','cmus4hfwi00b67k9oy06oc8ue','https://mymoonsgallery.com/media/artworks/1791022168697-91nBQ_uyb3ht.webp','https://mymoonsgallery.com/media/artworks/1791022168697-91nBQ_uyb3ht-thumb.webp','artworks/1791022168697-91nBQ_uyb3ht.webp',1526,2000,1,0,'Ghats at Dusk','2026-10-03 10:09:30.611'),('cmus8cwkc000z7kbw6lyr789j','cmus4hwyo00gc7k9oni4p9nuf','https://mymoonsgallery.com/media/artworks/1791022170738-yD2j0nJu7nYR.webp','https://mymoonsgallery.com/media/artworks/1791022170738-yD2j0nJu7nYR-thumb.webp','artworks/1791022170738-yD2j0nJu7nYR.webp',1920,1301,1,0,'Midnight Muse','2026-10-03 10:09:32.122'),('cmus8cxz600117kbw70w3o0jl','cmus4h7cq007h7k9o8wj0tfx4','https://mymoonsgallery.com/media/artworks/1791022172402-iZIHhQK0hEaF.webp','https://mymoonsgallery.com/media/artworks/1791022172402-iZIHhQK0hEaF-thumb.webp','artworks/1791022172402-iZIHhQK0hEaF.webp',1920,1300,1,0,'Midnight Carnival','2026-10-03 10:09:33.951'),('cmus8d05200137kbwzkddox4m','cmus4h8j600827k9ozjf54quc','https://mymoonsgallery.com/media/artworks/1791022174184-10rxLeU9WASu.webp','https://mymoonsgallery.com/media/artworks/1791022174184-10rxLeU9WASu-thumb.webp','artworks/1791022174184-10rxLeU9WASu.webp',1920,1920,1,0,'Ember Song','2026-10-03 10:09:36.754'),('cmus8d25v00157kbwtx67osl1','cmus4hc8k009s7k9ozp0cb1rf','https://mymoonsgallery.com/media/artworks/1791022177215-u7Xe5pB1xs8w.webp','https://mymoonsgallery.com/media/artworks/1791022177215-u7Xe5pB1xs8w-thumb.webp','artworks/1791022177215-u7Xe5pB1xs8w.webp',1322,2000,1,0,'Bloom Within','2026-10-03 10:09:39.376'),('cmus8d56t00177kbwdhm1whwg','cmus4h8z0008b7k9oc0magitx','https://mymoonsgallery.com/media/artworks/1791022179763-jSiHS88dyKgq.webp','https://mymoonsgallery.com/media/artworks/1791022179763-jSiHS88dyKgq-thumb.webp','artworks/1791022179763-jSiHS88dyKgq.webp',1529,2000,1,0,'Terracotta Morning','2026-10-03 10:09:43.299'),('cmus8d69000197kbw7revyh1o','cmus4gyfz003q7k9o4bmryodo','https://mymoonsgallery.com/media/artworks/1791022183675-NywmrEMKjX_v.webp','https://mymoonsgallery.com/media/artworks/1791022183675-NywmrEMKjX_v-thumb.webp','artworks/1791022183675-NywmrEMKjX_v.webp',1620,1880,1,0,'Lotus Mandala','2026-10-03 10:09:44.675'),('cmus8d6qt001b7kbw3g1gatg8','cmus4hz2j00hh7k9o4t85ppal','https://mymoonsgallery.com/media/artworks/1791022184752-YNcPMnl1IYIC.webp','https://mymoonsgallery.com/media/artworks/1791022184752-YNcPMnl1IYIC-thumb.webp','artworks/1791022184752-YNcPMnl1IYIC.webp',1619,2000,1,0,'Fluid Memory','2026-10-03 10:09:45.316'),('cmus8d78j001d7kbw0ejmv24b','cmus4hasq00997k9oirpx23io','https://mymoonsgallery.com/media/artworks/1791022185384-sa4wfSdet-Mk.webp','https://mymoonsgallery.com/media/artworks/1791022185384-sa4wfSdet-Mk-thumb.webp','artworks/1791022185384-sa4wfSdet-Mk.webp',1920,1155,1,0,'Silent Strength','2026-10-03 10:09:45.954'),('cmus8d7uc001f7kbw0r8gahxi','cmus4i1s700il7k9owwmu9gq9','https://mymoonsgallery.com/media/artworks/1791022186034-CqcdkW_JBXeR.webp','https://mymoonsgallery.com/media/artworks/1791022186034-CqcdkW_JBXeR-thumb.webp','artworks/1791022186034-CqcdkW_JBXeR.webp',1920,1543,1,0,'Velvet Storm','2026-10-03 10:09:46.739'),('cmus8d8ap001h7kbw0u5a93z8','cmus4huql00f77k9ozf307cff','https://mymoonsgallery.com/media/artworks/1791022186819--B2cjP3NIMhH.webp','https://mymoonsgallery.com/media/artworks/1791022186819--B2cjP3NIMhH-thumb.webp','artworks/1791022186819--B2cjP3NIMhH.webp',1504,2000,1,0,'Pichwai Lotus','2026-10-03 10:09:47.329'),('cmus8d8np001j7kbw5s9ngkxo','cmus4h0u0004u7k9oromd8d7l','https://mymoonsgallery.com/media/artworks/1791022187379-BuZAulcKxmqy.webp','https://mymoonsgallery.com/media/artworks/1791022187379-BuZAulcKxmqy-thumb.webp','artworks/1791022187379-BuZAulcKxmqy.webp',1920,1160,1,0,'Lakeside Dawn','2026-10-03 10:09:47.796'),('cmus8d971001l7kbwn03paq2g','cmus4h7pz007q7k9odjfgw811','https://mymoonsgallery.com/media/artworks/1791022187912-LFrDTbJKpdcv.webp','https://mymoonsgallery.com/media/artworks/1791022187912-LFrDTbJKpdcv-thumb.webp','artworks/1791022187912-LFrDTbJKpdcv.webp',1320,2000,1,0,'Quiet Contours','2026-10-03 10:09:48.492'),('cmus8d9oq001n7kbwnzot4vy9','cmus4i0ei00i27k9olvnvpde4','https://mymoonsgallery.com/media/artworks/1791022188574-JPsZdrQnd6cW.webp','https://mymoonsgallery.com/media/artworks/1791022188574-JPsZdrQnd6cW-thumb.webp','artworks/1791022188574-JPsZdrQnd6cW.webp',1545,2000,1,0,'Neon Ragas','2026-10-03 10:09:49.130'),('cmus8dagj001p7kbwvtikgfwu','cmus4hpzt00d87k9otb2cytkr','https://mymoonsgallery.com/media/artworks/1791022189220-9z_l-RWdhG7_.webp','https://mymoonsgallery.com/media/artworks/1791022189220-9z_l-RWdhG7_-thumb.webp','artworks/1791022189220-9z_l-RWdhG7_.webp',1920,1911,1,0,'Roots & Wings','2026-10-03 10:09:50.130'),('cmus8db4n001r7kbwq5c724l8','cmus4heds00al7k9oktw2hgjb','https://mymoonsgallery.com/media/artworks/1791022190215-SD8ieZkq79Hv.webp','https://mymoonsgallery.com/media/artworks/1791022190215-SD8ieZkq79Hv-thumb.webp','artworks/1791022190215-SD8ieZkq79Hv.webp',1920,1483,1,0,'Old Kolkata Lanes','2026-10-03 10:09:50.998'),('cmus8dbje001t7kbwhthrev78','cmus4hikt00cd7k9oq5by8244','https://mymoonsgallery.com/media/artworks/1791022191055-Bt72UijsmhJp.webp','https://mymoonsgallery.com/media/artworks/1791022191055-Bt72UijsmhJp-thumb.webp','artworks/1791022191055-Bt72UijsmhJp.webp',1920,1148,1,0,'Desert Lanterns','2026-10-03 10:09:51.530'),('cmus8dc51001v7kbwopg39ls5','cmus4gzn3004b7k9o5ut5d75u','https://mymoonsgallery.com/media/artworks/1791022191630-P3gb9Cf9UkrH.webp','https://mymoonsgallery.com/media/artworks/1791022191630-P3gb9Cf9UkrH-thumb.webp','artworks/1791022191630-P3gb9Cf9UkrH.webp',1335,2000,1,0,'The Dreamer','2026-10-03 10:09:52.307'),('cmus8dcrh001x7kbwyevl82mf','cmus4hycx00h57k9oyyywk1fa','https://mymoonsgallery.com/media/artworks/1791022192437-fchA4cSEPXaH.webp','https://mymoonsgallery.com/media/artworks/1791022192437-fchA4cSEPXaH-thumb.webp','artworks/1791022192437-fchA4cSEPXaH.webp',1323,2000,1,0,'Bollywood Neon','2026-10-03 10:09:53.117'),('cmus8dd7d001z7kbwmpb9ow8w','cmus4hmp100cy7k9orpyduwko','https://mymoonsgallery.com/media/artworks/1791022193176-AnYIp8kMVrdK.webp','https://mymoonsgallery.com/media/artworks/1791022193176-AnYIp8kMVrdK-thumb.webp','artworks/1791022193176-AnYIp8kMVrdK.webp',1920,1321,1,0,'Pine Silence','2026-10-03 10:09:53.688'),('cmus8dds800217kbwlkt1jfnr','cmus4ha8s008x7k9o1e8wgcdj','https://mymoonsgallery.com/media/artworks/1791022193764-1CV7Fnu0975f.webp','https://mymoonsgallery.com/media/artworks/1791022193764-1CV7Fnu0975f-thumb.webp','artworks/1791022193764-1CV7Fnu0975f.webp',1920,1417,1,0,'Colours Within','2026-10-03 10:09:54.439'),('cmus8de9700237kbwkn0qduus','cmus4hm3l00cp7k9ocan2fb73','https://mymoonsgallery.com/media/artworks/1791022194503-q72xTPhliTky.webp','https://mymoonsgallery.com/media/artworks/1791022194503-q72xTPhliTky-thumb.webp','artworks/1791022194503-q72xTPhliTky.webp',1920,1348,1,0,'Tree of Life','2026-10-03 10:09:55.050'),('cmus8desz00257kbwwe8rxnll','cmus4htue00ey7k9oyy97p8es','https://mymoonsgallery.com/media/artworks/1791022195162-bhgP6alD8i9x.webp','https://mymoonsgallery.com/media/artworks/1791022195162-bhgP6alD8i9x-thumb.webp','artworks/1791022195162-bhgP6alD8i9x.webp',1205,2000,1,0,'Marigold Mandala','2026-10-03 10:09:55.762'),('cmus8dfc400277kbwd55xbr6e','cmus4h0ca004k7k9o4ce280xx','https://mymoonsgallery.com/media/artworks/1791022195857-3jQkHK2kRnsn.webp','https://mymoonsgallery.com/media/artworks/1791022195857-3jQkHK2kRnsn-thumb.webp','artworks/1791022195857-3jQkHK2kRnsn.webp',1347,1822,1,0,'Sun Wheel','2026-10-03 10:09:56.451'),('cmus8dfpq00297kbwejk1mmj8','cmus4h5qe006j7k9ozq878v35','https://mymoonsgallery.com/media/artworks/1791022196502-C6lZ2q_OlRny.webp','https://mymoonsgallery.com/media/artworks/1791022196502-C6lZ2q_OlRny-thumb.webp','artworks/1791022196502-C6lZ2q_OlRny.webp',1920,1237,1,0,'Chromatic Drift','2026-10-03 10:09:56.941'),('cmus8dg8j002b7kbw1mqt8btr','cmus4ht7100em7k9owzjmcmpd','https://mymoonsgallery.com/media/artworks/1791022197014-7aoLfvS0tUPb.webp','https://mymoonsgallery.com/media/artworks/1791022197014-7aoLfvS0tUPb-thumb.webp','artworks/1791022197014-7aoLfvS0tUPb.webp',1920,1654,1,0,'Cosmic Chakra','2026-10-03 10:09:57.618'),('cmus8dguf002d7kbw2insvyle','cmus4h42d00607k9owhfywle8','https://mymoonsgallery.com/media/artworks/1791022197739-88Timv6ZAP8L.webp','https://mymoonsgallery.com/media/artworks/1791022197739-88Timv6ZAP8L-thumb.webp','artworks/1791022197739-88Timv6ZAP8L.webp',1294,2000,1,0,'Kinetic Bloom','2026-10-03 10:09:58.406'),('cmus8dhiy002f7kbw9tk7b62v','cmus4gxra003e7k9o5dwrm7cw','https://mymoonsgallery.com/media/artworks/1791022198518-gB3WygnDsbD5.webp','https://mymoonsgallery.com/media/artworks/1791022198518-gB3WygnDsbD5-thumb.webp','artworks/1791022198518-gB3WygnDsbD5.webp',1607,2000,1,0,'Her Inner Garden','2026-10-03 10:09:59.289'),('cmus8di5l002h7kbw6i7p4ihw','cmus4hw0j00fr7k9onehfa6uz','https://mymoonsgallery.com/media/artworks/1791022199401-pYUM7tU_y19R.webp','https://mymoonsgallery.com/media/artworks/1791022199401-pYUM7tU_y19R-thumb.webp','artworks/1791022199401-pYUM7tU_y19R.webp',1346,2000,1,0,'Sakura Daydream','2026-10-03 10:10:00.104'),('cmus8dio5002j7kbwf05qi4k2','cmus4gyzg003z7k9o9ppb7rsa','https://mymoonsgallery.com/media/artworks/1791022200182-LmFRLmthhlQi.webp','https://mymoonsgallery.com/media/artworks/1791022200182-LmFRLmthhlQi-thumb.webp','artworks/1791022200182-LmFRLmthhlQi.webp',1920,1360,1,0,'Misty Nilgiris','2026-10-03 10:10:00.772'),('cmus8dje3002l7kbw4yyo4snf','cmus4h2ee005f7k9ozvv0cna3','https://mymoonsgallery.com/media/artworks/1791022200867-qkngns6FL8R1.webp','https://mymoonsgallery.com/media/artworks/1791022200867-qkngns6FL8R1-thumb.webp','artworks/1791022200867-qkngns6FL8R1.webp',1765,2000,1,0,'Echoes of Monsoon','2026-10-03 10:10:01.706'),('cmus8djwh002n7kbwwz0zdo58','cmus4h374005r7k9otwxg61kt','https://mymoonsgallery.com/media/artworks/1791022201793-4p7GFSVAtNao.webp','https://mymoonsgallery.com/media/artworks/1791022201793-4p7GFSVAtNao-thumb.webp','artworks/1791022201793-4p7GFSVAtNao.webp',1905,1894,1,0,'Violet Reverie','2026-10-03 10:10:02.368'),('cmus8dklm002p7kbww56ck5hi','cmus4ic4j00jy7k9otnqq6950','https://mymoonsgallery.com/media/artworks/1791022202460-E0b8rjyXWgSX.webp','https://mymoonsgallery.com/media/artworks/1791022202460-E0b8rjyXWgSX-thumb.webp','artworks/1791022202460-E0b8rjyXWgSX.webp',1649,2000,1,0,'Navaratri Mandala','2026-10-03 10:10:03.274'),('cmus8dlao002r7kbwyekum1gq','cmus64hbg006l7ky0abc3cdq2','https://mymoonsgallery.com/media/artworks/1791022203383-NgQgMgpeedNt.webp','https://mymoonsgallery.com/media/artworks/1791022203383-NgQgMgpeedNt-thumb.webp','artworks/1791022203383-NgQgMgpeedNt.webp',1689,2000,1,0,'test','2026-10-03 10:10:04.175');
/*!40000 ALTER TABLE `ArtworkImage` ENABLE KEYS */;

--
-- Table structure for table `ArtworkInventory`
--

DROP TABLE IF EXISTS `ArtworkInventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkInventory` (
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `reserved` int NOT NULL DEFAULT '0',
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`artworkId`),
  CONSTRAINT `ArtworkInventory_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkInventory`
--

/*!40000 ALTER TABLE `ArtworkInventory` DISABLE KEYS */;
INSERT INTO `ArtworkInventory` (`artworkId`, `quantity`, `reserved`, `updatedAt`) VALUES ('cmus4gxra003e7k9o5dwrm7cw',1,0,'2026-10-03 08:20:41.830'),('cmus4gyfz003q7k9o4bmryodo',1,0,'2026-10-03 13:17:39.448'),('cmus4gyzg003z7k9o9ppb7rsa',1,0,'2026-10-03 08:20:43.420'),('cmus4gzn3004b7k9o5ut5d75u',21,0,'2026-10-03 08:21:49.520'),('cmus4h0ca004k7k9o4ce280xx',0,0,'2026-10-03 08:20:45.178'),('cmus4h0u0004u7k9oromd8d7l',1,0,'2026-10-03 08:20:45.816'),('cmus4h2ee005f7k9ozvv0cna3',1,0,'2026-10-03 13:17:39.479'),('cmus4h374005r7k9otwxg61kt',1,0,'2026-10-03 13:17:39.502'),('cmus4h42d00607k9owhfywle8',1,0,'2026-10-03 08:20:50.005'),('cmus4h4rh006a7k9ooidrg0lf',34,0,'2026-10-03 08:21:49.323'),('cmus4h5qe006j7k9ozq878v35',0,0,'2026-10-03 08:20:52.166'),('cmus4h6kx00757k9oaoiipq1v',1,0,'2026-10-03 08:20:53.265'),('cmus4h7cq007h7k9o8wj0tfx4',1,0,'2026-10-03 08:20:54.266'),('cmus4h7pz007q7k9odjfgw811',1,0,'2026-10-03 08:20:54.744'),('cmus4h8j600827k9ozjf54quc',10,0,'2026-10-03 08:20:55.794'),('cmus4h8z0008b7k9oc0magitx',0,0,'2026-10-03 08:20:56.364'),('cmus4ha8s008x7k9o1e8wgcdj',1,0,'2026-10-03 08:20:58.013'),('cmus4hasq00997k9oirpx23io',1,0,'2026-10-03 08:20:58.730'),('cmus4hbjt009i7k9oz1nlxy39',1,0,'2026-10-03 08:20:59.705'),('cmus4hc8k009s7k9ozp0cb1rf',38,0,'2026-10-03 08:21:47.812'),('cmus4hd2j00a17k9o1jyc3uhf',0,0,'2026-10-03 08:21:01.675'),('cmus4heds00al7k9oktw2hgjb',1,0,'2026-10-03 08:21:03.376'),('cmus4hf3n00ax7k9oijuw97n4',1,0,'2026-10-03 08:21:04.307'),('cmus4hfwi00b67k9oy06oc8ue',1,0,'2026-10-03 08:21:05.346'),('cmus4hgms00bi7k9ohya2eapy',35,0,'2026-10-03 08:21:49.017'),('cmus4hhfw00br7k9o93y4lbtf',0,0,'2026-10-03 08:21:07.340'),('cmus4hikt00cd7k9oq5by8244',1,0,'2026-10-03 08:21:08.813'),('cmus4hm3l00cp7k9ocan2fb73',1,0,'2026-10-03 08:21:13.377'),('cmus4hmp100cy7k9orpyduwko',1,0,'2026-10-03 08:21:14.149'),('cmus4hpzt00d87k9otb2cytkr',9,0,'2026-10-03 08:21:48.464'),('cmus4hqht00dh7k9onmak8cwl',0,0,'2026-10-03 08:21:19.074'),('cmus4hrs300e17k9o033rw8s3',1,0,'2026-10-03 08:21:20.739'),('cmus4hsf500ed7k9o9ck88moe',1,0,'2026-10-03 08:21:21.569'),('cmus4ht7100em7k9owzjmcmpd',1,0,'2026-10-03 08:21:22.573'),('cmus4htue00ey7k9oyy97p8es',35,0,'2026-10-03 08:21:48.719'),('cmus4huql00f77k9ozf307cff',0,0,'2026-10-03 08:21:24.573'),('cmus4hw0j00fr7k9onehfa6uz',1,0,'2026-10-03 13:17:39.524'),('cmus4hwee00g37k9oy0r428li',1,0,'2026-10-03 13:17:39.544'),('cmus4hwyo00gc7k9oni4p9nuf',1,0,'2026-10-03 08:21:27.456'),('cmus4hxds00gm7k9o8bto2vis',40,0,'2026-10-03 08:21:28.001'),('cmus4hycx00h57k9oyyywk1fa',1,0,'2026-10-03 08:21:29.265'),('cmus4hz2j00hh7k9o4t85ppal',1,0,'2026-10-03 08:21:30.187'),('cmus4hzlh00hq7k9oarrzp2md',1,0,'2026-10-03 13:17:39.564'),('cmus4i0ei00i27k9olvnvpde4',15,0,'2026-10-03 08:21:48.098'),('cmus4i1s700il7k9owwmu9gq9',1,0,'2026-10-03 08:21:33.701'),('cmus4i5xq00ix7k9olqndn14w',1,0,'2026-10-03 08:21:39.086'),('cmus4i6so00j67k9ogikqr5c1',1,0,'2026-10-03 08:21:40.200'),('cmus4iauj00jg7k9ozca0tvf8',12,0,'2026-10-03 08:21:45.451'),('cmus4ic4j00jy7k9otnqq6950',1,0,'2026-10-03 08:21:47.108'),('cmus64hbg006l7ky0abc3cdq2',1,0,'2026-10-03 09:06:59.884');
/*!40000 ALTER TABLE `ArtworkInventory` ENABLE KEYS */;

--
-- Table structure for table `ArtworkMedium`
--

DROP TABLE IF EXISTS `ArtworkMedium`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkMedium` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtworkMedium_name_key` (`name`),
  UNIQUE KEY `ArtworkMedium_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkMedium`
--

/*!40000 ALTER TABLE `ArtworkMedium` DISABLE KEYS */;
INSERT INTO `ArtworkMedium` (`id`, `name`, `slug`, `isActive`, `sortOrder`) VALUES ('cmus4gogv000p7k9o8h1s6jzn','Oil','oil',1,0),('cmus4goh5000q7k9obwnez6v1','Acrylic','acrylic',1,1),('cmus4gohb000r7k9oh2wb4nft','Watercolor','watercolor',1,2),('cmus4gohi000s7k9ohugznf96','Pencil','pencil',1,3),('cmus4goho000t7k9obtbkvvix','Charcoal','charcoal',1,4),('cmus4goht000u7k9om3hzgnyt','Ink','ink',1,5),('cmus4gohz000v7k9ovhqplx43','Canvas','canvas',1,6),('cmus4goi5000w7k9owkuv8zqy','Digital','digital',1,7),('cmus4goib000x7k9ojt1mur97','Mixed Media','mixed-media',1,8),('cmus4goii000y7k9oc3i8bt6e','Pastel','pastel',1,9),('cmus4goin000z7k9oiutmcwbf','Wood','wood',1,10),('cmus4goiu00107k9o702pifv0','Paper','paper',1,11),('cmus4goj000117k9oq10v3wn2','Metal','metal',1,12),('cmus4goj700127k9of4ow6ow8','Other','other',1,13);
/*!40000 ALTER TABLE `ArtworkMedium` ENABLE KEYS */;

--
-- Table structure for table `ArtworkReview`
--

DROP TABLE IF EXISTS `ArtworkReview`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkReview` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderItemId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `verifiedPurchase` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('PENDING','APPROVED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'APPROVED',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtworkReview_artworkId_userId_key` (`artworkId`,`userId`),
  KEY `ArtworkReview_userId_fkey` (`userId`),
  KEY `ArtworkReview_orderItemId_fkey` (`orderItemId`),
  CONSTRAINT `ArtworkReview_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtworkReview_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ArtworkReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkReview`
--

/*!40000 ALTER TABLE `ArtworkReview` DISABLE KEYS */;
INSERT INTO `ArtworkReview` (`id`, `artworkId`, `userId`, `orderItemId`, `rating`, `title`, `body`, `verifiedPurchase`, `status`, `createdAt`) VALUES ('cmus4ie0f00tw7k9os25fc6b3','cmus4hc8k009s7k9ozp0cb1rf','cmus4gwdt002h7k9oi4jryetb','cmus4icnh00kw7k9on13uv52a',5,'Even more beautiful in person','The colours glow in morning light. Packaging was museum-grade and it arrived perfectly.',1,'APPROVED','2026-09-21 23:21:49.543'),('cmus4ie2r00u07k9otof2uua5','cmus4h2ee005f7k9ozvv0cna3','cmus4gwdt002h7k9oi4jryetb','cmus4icok00l27k9ohj18w5lo',5,'Our living room has a soul now','Guests ask about it every time. The artist even sent a handwritten note!',1,'APPROVED','2026-09-24 22:21:49.627'),('cmus4ie4k00u47k9o30bb0d63','cmus4hqht00dh7k9onmak8cwl','cmus4gwdt002h7k9oi4jryetb','cmus4icpr00l87k9ozv643xud',5,'Stunning detail','You can see every brushstroke. Worth every rupee.',1,'APPROVED','2026-09-24 02:21:49.692'),('cmus4ie7r00u87k9oc0wapw5t','cmus4hgms00bi7k9ohya2eapy','cmus4gwed002p7k9ot2pbzw4b','cmus4icta00m07k9o2a37u55i',5,'Exactly as described','Accurate colours and dimensions, quick shipping and great communication.',1,'APPROVED','2026-09-21 02:21:49.806'),('cmus4ieb200uc7k9ory5y558d','cmus4i0ei00i27k9olvnvpde4','cmus4gweo002t7k9op2gzcjbm','cmus4icvb00mc7k9ogotlnej7',4,'Calming and elegant','It fits beautifully above our bed — peaceful every single day.',1,'APPROVED','2026-09-23 22:21:49.926'),('cmus4iebv00ug7k9o67vv00pq','cmus4huql00f77k9ozf307cff','cmus4gweo002t7k9op2gzcjbm','cmus4icwi00mi7k9oinv3rkr1',5,'A conversation starter','Bold, joyful and full of energy. Love it.',1,'APPROVED','2026-09-30 07:21:49.955'),('cmus4iecn00uk7k9o91xf5hiy','cmus4hwee00g37k9oy0r428li','cmus4gwex002x7k9oiu07kd0w','cmus4iczd00n47k9oc0zsa37g',5,'Even more beautiful in person','The colours glow in morning light. Packaging was museum-grade and it arrived perfectly.',1,'APPROVED','2026-09-21 04:21:49.984'),('cmus4iedh00uo7k9oke75djtl','cmus4h0ca004k7k9o4ce280xx','cmus4gwdt002h7k9oi4jryetb','cmus4id1f00ng7k9od54w1wys',5,'Our living room has a soul now','Guests ask about it every time. The artist even sent a handwritten note!',1,'APPROVED','2026-10-02 01:21:50.013'),('cmus4ieeo00us7k9ogvpiqshy','cmus4hpzt00d87k9otb2cytkr','cmus4gwed002p7k9ot2pbzw4b','cmus4id5n00oa7k9ob4uvhfoh',5,'Stunning detail','You can see every brushstroke. Worth every rupee.',1,'APPROVED','2026-10-01 18:21:50.056'),('cmus4ieg700uw7k9osrx9197d','cmus4hzlh00hq7k9oarrzp2md','cmus4gweo002t7k9op2gzcjbm','cmus4id8e00ou7k9olza669em',5,'Exactly as described','Accurate colours and dimensions, quick shipping and great communication.',1,'APPROVED','2026-09-28 01:21:50.111'),('cmus4iegv00uy7k9ow04voowc','cmus4gzn3004b7k9o5ut5d75u','cmus4gwex002x7k9oiu07kd0w','cmus4idab00p67k9oh8phe5dx',5,'Calming and elegant','It fits beautifully above our bed — peaceful every single day.',1,'APPROVED','2026-09-24 01:21:50.135'),('cmus4iehn00v27k9ous6dnxbj','cmus4hhfw00br7k9o93y4lbtf','cmus4gwex002x7k9oiu07kd0w','cmus4idb900pc7k9ojqkieqdy',5,'A conversation starter','Bold, joyful and full of energy. Love it.',1,'APPROVED','2026-10-02 06:21:50.163'),('cmus4iej400v67k9oazmk9ixr','cmus4h8z0008b7k9oc0magitx','cmus4gwe4002l7k9os8s52e2y','cmus4ider00q27k9oy04xhz1o',5,'Even more beautiful in person','The colours glow in morning light. Packaging was museum-grade and it arrived perfectly.',1,'APPROVED','2026-09-20 22:21:50.216'),('cmus4iele00va7k9ogy1lgfpe','cmus4hqht00dh7k9onmak8cwl','cmus4gwed002p7k9ot2pbzw4b','cmus4idgg00qe7k9o1wx5eh32',4,'Our living room has a soul now','Guests ask about it every time. The artist even sent a handwritten note!',1,'APPROVED','2026-10-01 19:21:50.298'),('cmus4iels00vc7k9o4aw66lwy','cmus4hw0j00fr7k9onehfa6uz','cmus4gwed002p7k9ot2pbzw4b','cmus4idhj00qm7k9orqqsoiir',5,'Stunning detail','You can see every brushstroke. Worth every rupee.',1,'APPROVED','2026-10-02 16:21:50.313'),('cmus4iemm00vg7k9ozoe81nv0','cmus4h8z0008b7k9oc0magitx','cmus4gwdt002h7k9oi4jryetb','cmus4idqj00s27k9o8ilry4cb',5,'A conversation starter','Bold, joyful and full of energy. Love it.',1,'APPROVED','2026-09-23 13:21:50.342'),('cmus4ienh00vk7k9otjd1awx9','cmus4h4rh006a7k9ooidrg0lf','cmus4gwda002d7k9o6mkhzgmm','cmus4idtf00sk7k9oh4o7sk62',5,'Even more beautiful in person','The colours glow in morning light. Packaging was museum-grade and it arrived perfectly.',1,'APPROVED','2026-10-02 14:21:50.373');
/*!40000 ALTER TABLE `ArtworkReview` ENABLE KEYS */;

--
-- Table structure for table `ArtworkStyle`
--

DROP TABLE IF EXISTS `ArtworkStyle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkStyle` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `availableForCustomArt` tinyint(1) NOT NULL DEFAULT '1',
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtworkStyle_name_key` (`name`),
  UNIQUE KEY `ArtworkStyle_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkStyle`
--

/*!40000 ALTER TABLE `ArtworkStyle` DISABLE KEYS */;
INSERT INTO `ArtworkStyle` (`id`, `name`, `slug`, `description`, `imageUrl`, `isActive`, `availableForCustomArt`, `sortOrder`) VALUES ('cmus4gtc5001s7k9oj0kyz9e7','Realistic','realistic','True-to-life rendering with careful light and detail.','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU.webp',1,1,0),('cmus4gtku001t7k9ofpj2dwqe','Abstract','abstract','Non-representational colour and form.','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0.webp',1,1,1),('cmus4gtoi001u7k9oots34sv5','Minimalist','minimalist','Pared-back shapes and calm negative space.','https://mymoonsgallery.com/media/artworks/1791022164064-7SiEu8wXqmg0.webp',1,1,2),('cmus4gtsh001v7k9ob8d4ynp9','Modern','modern','Clean, bold, twentieth-century inspired.','https://mymoonsgallery.com/media/artworks/1791022197739-88Timv6ZAP8L.webp',1,1,3),('cmus4gu00001w7k9odof3qzvo','Contemporary','contemporary','Fresh, current and experimental.','https://mymoonsgallery.com/media/artworks/1791022196502-C6lZ2q_OlRny.webp',1,1,4),('cmus4gu3m001x7k9ofmpz6tg5','Vintage','vintage','Nostalgic palettes and aged textures.','https://mymoonsgallery.com/media/artworks/1791022187912-LFrDTbJKpdcv.webp',1,1,5),('cmus4gu8e001y7k9oz5xq41od','Watercolor','watercolor','Luminous washes and soft blooms of colour.','https://mymoonsgallery.com/media/artworks/1791022185384-sa4wfSdet-Mk.webp',1,1,6),('cmus4gucy001z7k9oi3s6qrwm','Oil Painting','oil-painting','Rich, layered, painterly texture.','https://mymoonsgallery.com/media/artworks/1791022191055-Bt72UijsmhJp.webp',1,1,7),('cmus4gul200207k9oqku6stis','Pencil Sketch','pencil-sketch','Graphite line and delicate shading.','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv.webp',1,1,8),('cmus4gusi00217k9o51xv84gk','Charcoal','charcoal','Dramatic smudged darks and lights.','https://mymoonsgallery.com/media/artworks/1791022148601-_fU-boIYI1mH.webp',1,1,9),('cmus4guyq00227k9o6crc34vc','Digital Painting','digital-painting','Painterly works made on screen.','https://mymoonsgallery.com/media/artworks/1791022151596-rO_9WMRfgLXK.webp',1,1,10),('cmus4gv2n00237k9o8n9gd2m9','Pop Art','pop-art','Punchy colour, halftones and outlines.','https://mymoonsgallery.com/media/artworks/1791022141751-C4Hs2RBOf7mC.webp',1,1,11),('cmus4gv6g00247k9okpq70t61','Cartoon','cartoon','Playful, simplified, character-driven.','https://mymoonsgallery.com/media/artworks/1791022135526-irIwZeJftBKm.webp',1,1,12),('cmus4gvcn00257k9ozbmxla8t','Anime','anime','Japanese animation inspired portraits.','https://mymoonsgallery.com/media/artworks/1791022191630-P3gb9Cf9UkrH.webp',1,1,13),('cmus4gvg900267k9o2p0w6k5j','Line Art','line-art','Expressive single-weight line drawing.','https://mymoonsgallery.com/media/artworks/1791022179763-jSiHS88dyKgq.webp',1,1,14),('cmus4gvmi00277k9oquh3ad2j','Mandala','mandala','Radial sacred geometry.','https://mymoonsgallery.com/media/artworks/1791022195162-bhgP6alD8i9x.webp',1,1,15),('cmus4gvsf00287k9oot5tjwnl','Traditional Indian Art','traditional-indian-art','Madhubani, Tanjore, Pichwai and other Indian traditions.','https://mymoonsgallery.com/media/artworks/1791022195857-3jQkHK2kRnsn.webp',1,1,16),('cmus4gvzg00297k9o6kn3c8h0','Folk Art','folk-art','Community art forms and storytelling motifs.','https://mymoonsgallery.com/media/artworks/1791022197014-7aoLfvS0tUPb.webp',1,1,17);
/*!40000 ALTER TABLE `ArtworkStyle` ENABLE KEYS */;

--
-- Table structure for table `ArtworkTag`
--

DROP TABLE IF EXISTS `ArtworkTag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkTag` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtworkTag_name_key` (`name`),
  UNIQUE KEY `ArtworkTag_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkTag`
--

/*!40000 ALTER TABLE `ArtworkTag` DISABLE KEYS */;
INSERT INTO `ArtworkTag` (`id`, `name`, `slug`) VALUES ('cmus4gxra003j7k9og13k8rh9','portrait','portrait'),('cmus4gxra003k7k9o53jk36g7','orange','orange'),('cmus4gxra003l7k9oowzvm2tv','love family','love-family'),('cmus4gxra003m7k9o6anoykwj','original','original'),('cmus4gyfz003u7k9otw4itfty','mandala','mandala'),('cmus4gyfz003v7k9ozlios0bw','purple','purple'),('cmus4gyfz003w7k9ofnif0m4f','spiritual','spiritual'),('cmus4gyzg00447k9o5ph89xip','landscape','landscape'),('cmus4gyzg00457k9o68ys75ae','teal','teal'),('cmus4gyzg00467k9o6w6i7oqc','nature','nature'),('cmus4gzn3004i7k9ogs8c7k5c','print','print'),('cmus4h0ca004s7k9o1f75ly95','digital','digital'),('cmus4h2ee005k7k9on2blmc4x','abstract','abstract'),('cmus4h2ee005l7k9ovmcwqxlk','multicolor','multicolor'),('cmus4h2ee005m7k9o5ceo1l03','urban','urban'),('cmus4h42d00667k9orndugu4o','red','red'),('cmus4h6kx007a7k9obfcenx4h','lineart','lineart'),('cmus4h6kx007b7k9ol9ppdp9p','pink','pink'),('cmus4h7cq007m7k9o6pwqjqrb','brown','brown'),('cmus4heds00aq7k9odw9sbu2a','sketch','sketch'),('cmus4heds00ar7k9obnwxm007','black and white','black-and-white'),('cmus4heds00as7k9oudcgfk9c','heritage','heritage'),('cmus4hikt00cj7k9oc7tdb0my','green','green'),('cmus4hm3l00ct7k9ogp7vwfc9','tree','tree'),('cmus4hm3l00cu7k9orzdo5oez','blue','blue'),('cmus4hwee00g77k9od4ktvssj','pop','pop');
/*!40000 ALTER TABLE `ArtworkTag` ENABLE KEYS */;

--
-- Table structure for table `ArtworkTagOnArtwork`
--

DROP TABLE IF EXISTS `ArtworkTagOnArtwork`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkTagOnArtwork` (
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`artworkId`,`tagId`),
  KEY `ArtworkTagOnArtwork_tagId_fkey` (`tagId`),
  CONSTRAINT `ArtworkTagOnArtwork_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtworkTagOnArtwork_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `ArtworkTag` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkTagOnArtwork`
--

/*!40000 ALTER TABLE `ArtworkTagOnArtwork` DISABLE KEYS */;
INSERT INTO `ArtworkTagOnArtwork` (`artworkId`, `tagId`) VALUES ('cmus4gxra003e7k9o5dwrm7cw','cmus4gxra003j7k9og13k8rh9'),('cmus4gzn3004b7k9o5ut5d75u','cmus4gxra003j7k9og13k8rh9'),('cmus4ha8s008x7k9o1e8wgcdj','cmus4gxra003j7k9og13k8rh9'),('cmus4hasq00997k9oirpx23io','cmus4gxra003j7k9og13k8rh9'),('cmus4hbjt009i7k9oz1nlxy39','cmus4gxra003j7k9og13k8rh9'),('cmus4hc8k009s7k9ozp0cb1rf','cmus4gxra003j7k9og13k8rh9'),('cmus4hd2j00a17k9o1jyc3uhf','cmus4gxra003j7k9og13k8rh9'),('cmus4hw0j00fr7k9onehfa6uz','cmus4gxra003j7k9og13k8rh9'),('cmus4hwyo00gc7k9oni4p9nuf','cmus4gxra003j7k9og13k8rh9'),('cmus4gxra003e7k9o5dwrm7cw','cmus4gxra003k7k9o53jk36g7'),('cmus4gzn3004b7k9o5ut5d75u','cmus4gxra003k7k9o53jk36g7'),('cmus4hasq00997k9oirpx23io','cmus4gxra003k7k9o53jk36g7'),('cmus4hd2j00a17k9o1jyc3uhf','cmus4gxra003k7k9o53jk36g7'),('cmus4hmp100cy7k9orpyduwko','cmus4gxra003k7k9o53jk36g7'),('cmus4hsf500ed7k9o9ck88moe','cmus4gxra003k7k9o53jk36g7'),('cmus4huql00f77k9ozf307cff','cmus4gxra003k7k9o53jk36g7'),('cmus4hz2j00hh7k9o4t85ppal','cmus4gxra003k7k9o53jk36g7'),('cmus4i0ei00i27k9olvnvpde4','cmus4gxra003k7k9o53jk36g7'),('cmus4gxra003e7k9o5dwrm7cw','cmus4gxra003l7k9oowzvm2tv'),('cmus4gzn3004b7k9o5ut5d75u','cmus4gxra003l7k9oowzvm2tv'),('cmus4ha8s008x7k9o1e8wgcdj','cmus4gxra003l7k9oowzvm2tv'),('cmus4hasq00997k9oirpx23io','cmus4gxra003l7k9oowzvm2tv'),('cmus4hbjt009i7k9oz1nlxy39','cmus4gxra003l7k9oowzvm2tv'),('cmus4hc8k009s7k9ozp0cb1rf','cmus4gxra003l7k9oowzvm2tv'),('cmus4hd2j00a17k9o1jyc3uhf','cmus4gxra003l7k9oowzvm2tv'),('cmus4hw0j00fr7k9onehfa6uz','cmus4gxra003l7k9oowzvm2tv'),('cmus4hwyo00gc7k9oni4p9nuf','cmus4gxra003l7k9oowzvm2tv'),('cmus4gxra003e7k9o5dwrm7cw','cmus4gxra003m7k9o6anoykwj'),('cmus4gyfz003q7k9o4bmryodo','cmus4gxra003m7k9o6anoykwj'),('cmus4gyzg003z7k9o9ppb7rsa','cmus4gxra003m7k9o6anoykwj'),('cmus4h0u0004u7k9oromd8d7l','cmus4gxra003m7k9o6anoykwj'),('cmus4h2ee005f7k9ozvv0cna3','cmus4gxra003m7k9o6anoykwj'),('cmus4h374005r7k9otwxg61kt','cmus4gxra003m7k9o6anoykwj'),('cmus4h42d00607k9owhfywle8','cmus4gxra003m7k9o6anoykwj'),('cmus4h6kx00757k9oaoiipq1v','cmus4gxra003m7k9o6anoykwj'),('cmus4h7cq007h7k9o8wj0tfx4','cmus4gxra003m7k9o6anoykwj'),('cmus4h7pz007q7k9odjfgw811','cmus4gxra003m7k9o6anoykwj'),('cmus4ha8s008x7k9o1e8wgcdj','cmus4gxra003m7k9o6anoykwj'),('cmus4hasq00997k9oirpx23io','cmus4gxra003m7k9o6anoykwj'),('cmus4hbjt009i7k9oz1nlxy39','cmus4gxra003m7k9o6anoykwj'),('cmus4heds00al7k9oktw2hgjb','cmus4gxra003m7k9o6anoykwj'),('cmus4hf3n00ax7k9oijuw97n4','cmus4gxra003m7k9o6anoykwj'),('cmus4hfwi00b67k9oy06oc8ue','cmus4gxra003m7k9o6anoykwj'),('cmus4hikt00cd7k9oq5by8244','cmus4gxra003m7k9o6anoykwj'),('cmus4hm3l00cp7k9ocan2fb73','cmus4gxra003m7k9o6anoykwj'),('cmus4hmp100cy7k9orpyduwko','cmus4gxra003m7k9o6anoykwj'),('cmus4hrs300e17k9o033rw8s3','cmus4gxra003m7k9o6anoykwj'),('cmus4hsf500ed7k9o9ck88moe','cmus4gxra003m7k9o6anoykwj'),('cmus4ht7100em7k9owzjmcmpd','cmus4gxra003m7k9o6anoykwj'),('cmus4hw0j00fr7k9onehfa6uz','cmus4gxra003m7k9o6anoykwj'),('cmus4hwee00g37k9oy0r428li','cmus4gxra003m7k9o6anoykwj'),('cmus4hwyo00gc7k9oni4p9nuf','cmus4gxra003m7k9o6anoykwj'),('cmus4hycx00h57k9oyyywk1fa','cmus4gxra003m7k9o6anoykwj'),('cmus4hz2j00hh7k9o4t85ppal','cmus4gxra003m7k9o6anoykwj'),('cmus4hzlh00hq7k9oarrzp2md','cmus4gxra003m7k9o6anoykwj'),('cmus4i1s700il7k9owwmu9gq9','cmus4gxra003m7k9o6anoykwj'),('cmus4i5xq00ix7k9olqndn14w','cmus4gxra003m7k9o6anoykwj'),('cmus4i6so00j67k9ogikqr5c1','cmus4gxra003m7k9o6anoykwj'),('cmus4gyfz003q7k9o4bmryodo','cmus4gyfz003u7k9otw4itfty'),('cmus4h0ca004k7k9o4ce280xx','cmus4gyfz003u7k9otw4itfty'),('cmus4hrs300e17k9o033rw8s3','cmus4gyfz003u7k9otw4itfty'),('cmus4hsf500ed7k9o9ck88moe','cmus4gyfz003u7k9otw4itfty'),('cmus4ht7100em7k9owzjmcmpd','cmus4gyfz003u7k9otw4itfty'),('cmus4htue00ey7k9oyy97p8es','cmus4gyfz003u7k9otw4itfty'),('cmus4huql00f77k9ozf307cff','cmus4gyfz003u7k9otw4itfty'),('cmus4gyfz003q7k9o4bmryodo','cmus4gyfz003v7k9ozlios0bw'),('cmus4h0ca004k7k9o4ce280xx','cmus4gyfz003v7k9ozlios0bw'),('cmus4h374005r7k9otwxg61kt','cmus4gyfz003v7k9ozlios0bw'),('cmus4h5qe006j7k9ozq878v35','cmus4gyfz003v7k9ozlios0bw'),('cmus4ha8s008x7k9o1e8wgcdj','cmus4gyfz003v7k9ozlios0bw'),('cmus4hbjt009i7k9oz1nlxy39','cmus4gyfz003v7k9ozlios0bw'),('cmus4hc8k009s7k9ozp0cb1rf','cmus4gyfz003v7k9ozlios0bw'),('cmus4ht7100em7k9owzjmcmpd','cmus4gyfz003v7k9ozlios0bw'),('cmus4hwee00g37k9oy0r428li','cmus4gyfz003v7k9ozlios0bw'),('cmus4i1s700il7k9owwmu9gq9','cmus4gyfz003v7k9ozlios0bw'),('cmus4iauj00jg7k9ozca0tvf8','cmus4gyfz003v7k9ozlios0bw'),('cmus4gyfz003q7k9o4bmryodo','cmus4gyfz003w7k9ofnif0m4f'),('cmus4h0ca004k7k9o4ce280xx','cmus4gyfz003w7k9ofnif0m4f'),('cmus4hrs300e17k9o033rw8s3','cmus4gyfz003w7k9ofnif0m4f'),('cmus4hsf500ed7k9o9ck88moe','cmus4gyfz003w7k9ofnif0m4f'),('cmus4ht7100em7k9owzjmcmpd','cmus4gyfz003w7k9ofnif0m4f'),('cmus4htue00ey7k9oyy97p8es','cmus4gyfz003w7k9ofnif0m4f'),('cmus4huql00f77k9ozf307cff','cmus4gyfz003w7k9ofnif0m4f'),('cmus4gyzg003z7k9o9ppb7rsa','cmus4gyzg00447k9o5ph89xip'),('cmus4h0u0004u7k9oromd8d7l','cmus4gyzg00447k9o5ph89xip'),('cmus4hikt00cd7k9oq5by8244','cmus4gyzg00447k9o5ph89xip'),('cmus4hmp100cy7k9orpyduwko','cmus4gyzg00447k9o5ph89xip'),('cmus4hqht00dh7k9onmak8cwl','cmus4gyzg00447k9o5ph89xip'),('cmus4gyzg003z7k9o9ppb7rsa','cmus4gyzg00457k9o68ys75ae'),('cmus4h0u0004u7k9oromd8d7l','cmus4gyzg00457k9o68ys75ae'),('cmus4h7pz007q7k9odjfgw811','cmus4gyzg00457k9o68ys75ae'),('cmus4i5xq00ix7k9olqndn14w','cmus4gyzg00457k9o68ys75ae'),('cmus4gyzg003z7k9o9ppb7rsa','cmus4gyzg00467k9o6w6i7oqc'),('cmus4h0u0004u7k9oromd8d7l','cmus4gyzg00467k9o6w6i7oqc'),('cmus4h6kx00757k9oaoiipq1v','cmus4gyzg00467k9o6w6i7oqc'),('cmus4h7pz007q7k9odjfgw811','cmus4gyzg00467k9o6w6i7oqc'),('cmus4h8z0008b7k9oc0magitx','cmus4gyzg00467k9o6w6i7oqc'),('cmus4hikt00cd7k9oq5by8244','cmus4gyzg00467k9o6w6i7oqc'),('cmus4hm3l00cp7k9ocan2fb73','cmus4gyzg00467k9o6w6i7oqc'),('cmus4hmp100cy7k9orpyduwko','cmus4gyzg00467k9o6w6i7oqc'),('cmus4hpzt00d87k9otb2cytkr','cmus4gyzg00467k9o6w6i7oqc'),('cmus4hqht00dh7k9onmak8cwl','cmus4gyzg00467k9o6w6i7oqc'),('cmus4i5xq00ix7k9olqndn14w','cmus4gyzg00467k9o6w6i7oqc'),('cmus4iauj00jg7k9ozca0tvf8','cmus4gyzg00467k9o6w6i7oqc'),('cmus4gzn3004b7k9o5ut5d75u','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4h4rh006a7k9ooidrg0lf','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4h8j600827k9ozjf54quc','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4hc8k009s7k9ozp0cb1rf','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4hgms00bi7k9ohya2eapy','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4hpzt00d87k9otb2cytkr','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4htue00ey7k9oyy97p8es','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4hxds00gm7k9o8bto2vis','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4i0ei00i27k9olvnvpde4','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4iauj00jg7k9ozca0tvf8','cmus4gzn3004i7k9ogs8c7k5c'),('cmus4h0ca004k7k9o4ce280xx','cmus4h0ca004s7k9o1f75ly95'),('cmus4h5qe006j7k9ozq878v35','cmus4h0ca004s7k9o1f75ly95'),('cmus4h8z0008b7k9oc0magitx','cmus4h0ca004s7k9o1f75ly95'),('cmus4hd2j00a17k9o1jyc3uhf','cmus4h0ca004s7k9o1f75ly95'),('cmus4hhfw00br7k9o93y4lbtf','cmus4h0ca004s7k9o1f75ly95'),('cmus4hqht00dh7k9onmak8cwl','cmus4h0ca004s7k9o1f75ly95'),('cmus4huql00f77k9ozf307cff','cmus4h0ca004s7k9o1f75ly95'),('cmus4h2ee005f7k9ozvv0cna3','cmus4h2ee005k7k9on2blmc4x'),('cmus4h374005r7k9otwxg61kt','cmus4h2ee005k7k9on2blmc4x'),('cmus4h42d00607k9owhfywle8','cmus4h2ee005k7k9on2blmc4x'),('cmus4h4rh006a7k9ooidrg0lf','cmus4h2ee005k7k9on2blmc4x'),('cmus4h5qe006j7k9ozq878v35','cmus4h2ee005k7k9on2blmc4x'),('cmus4h7cq007h7k9o8wj0tfx4','cmus4h2ee005k7k9on2blmc4x'),('cmus4h8j600827k9ozjf54quc','cmus4h2ee005k7k9on2blmc4x'),('cmus4hz2j00hh7k9o4t85ppal','cmus4h2ee005k7k9on2blmc4x'),('cmus4i0ei00i27k9olvnvpde4','cmus4h2ee005k7k9on2blmc4x'),('cmus4i1s700il7k9owwmu9gq9','cmus4h2ee005k7k9on2blmc4x'),('cmus4i6so00j67k9ogikqr5c1','cmus4h2ee005k7k9on2blmc4x'),('cmus4h2ee005f7k9ozvv0cna3','cmus4h2ee005l7k9ovmcwqxlk'),('cmus4h4rh006a7k9ooidrg0lf','cmus4h2ee005l7k9ovmcwqxlk'),('cmus4hwyo00gc7k9oni4p9nuf','cmus4h2ee005l7k9ovmcwqxlk'),('cmus4hycx00h57k9oyyywk1fa','cmus4h2ee005l7k9ovmcwqxlk'),('cmus4hzlh00hq7k9oarrzp2md','cmus4h2ee005l7k9ovmcwqxlk'),('cmus4i6so00j67k9ogikqr5c1','cmus4h2ee005l7k9ovmcwqxlk'),('cmus4h2ee005f7k9ozvv0cna3','cmus4h2ee005m7k9o5ceo1l03'),('cmus4h374005r7k9otwxg61kt','cmus4h2ee005m7k9o5ceo1l03'),('cmus4h42d00607k9owhfywle8','cmus4h2ee005m7k9o5ceo1l03'),('cmus4h4rh006a7k9ooidrg0lf','cmus4h2ee005m7k9o5ceo1l03'),('cmus4h5qe006j7k9ozq878v35','cmus4h2ee005m7k9o5ceo1l03'),('cmus4h7cq007h7k9o8wj0tfx4','cmus4h2ee005m7k9o5ceo1l03'),('cmus4h8j600827k9ozjf54quc','cmus4h2ee005m7k9o5ceo1l03'),('cmus4hwee00g37k9oy0r428li','cmus4h2ee005m7k9o5ceo1l03'),('cmus4hxds00gm7k9o8bto2vis','cmus4h2ee005m7k9o5ceo1l03'),('cmus4hycx00h57k9oyyywk1fa','cmus4h2ee005m7k9o5ceo1l03'),('cmus4hz2j00hh7k9o4t85ppal','cmus4h2ee005m7k9o5ceo1l03'),('cmus4hzlh00hq7k9oarrzp2md','cmus4h2ee005m7k9o5ceo1l03'),('cmus4i0ei00i27k9olvnvpde4','cmus4h2ee005m7k9o5ceo1l03'),('cmus4i1s700il7k9owwmu9gq9','cmus4h2ee005m7k9o5ceo1l03'),('cmus4i6so00j67k9ogikqr5c1','cmus4h2ee005m7k9o5ceo1l03'),('cmus4h42d00607k9owhfywle8','cmus4h42d00667k9orndugu4o'),('cmus4hrs300e17k9o033rw8s3','cmus4h42d00667k9orndugu4o'),('cmus4htue00ey7k9oyy97p8es','cmus4h42d00667k9orndugu4o'),('cmus4h6kx00757k9oaoiipq1v','cmus4h6kx007a7k9obfcenx4h'),('cmus4h7pz007q7k9odjfgw811','cmus4h6kx007a7k9obfcenx4h'),('cmus4h8z0008b7k9oc0magitx','cmus4h6kx007a7k9obfcenx4h'),('cmus4h6kx00757k9oaoiipq1v','cmus4h6kx007b7k9ol9ppdp9p'),('cmus4h8j600827k9ozjf54quc','cmus4h6kx007b7k9ol9ppdp9p'),('cmus4hw0j00fr7k9onehfa6uz','cmus4h6kx007b7k9ol9ppdp9p'),('cmus4hxds00gm7k9o8bto2vis','cmus4h6kx007b7k9ol9ppdp9p'),('cmus4h7cq007h7k9o8wj0tfx4','cmus4h7cq007m7k9o6pwqjqrb'),('cmus4h8z0008b7k9oc0magitx','cmus4h7cq007m7k9o6pwqjqrb'),('cmus4heds00al7k9oktw2hgjb','cmus4heds00aq7k9odw9sbu2a'),('cmus4hf3n00ax7k9oijuw97n4','cmus4heds00aq7k9odw9sbu2a'),('cmus4hfwi00b67k9oy06oc8ue','cmus4heds00aq7k9odw9sbu2a'),('cmus4hgms00bi7k9ohya2eapy','cmus4heds00aq7k9odw9sbu2a'),('cmus4hhfw00br7k9o93y4lbtf','cmus4heds00aq7k9odw9sbu2a'),('cmus4heds00al7k9oktw2hgjb','cmus4heds00ar7k9obnwxm007'),('cmus4hf3n00ax7k9oijuw97n4','cmus4heds00ar7k9obnwxm007'),('cmus4hfwi00b67k9oy06oc8ue','cmus4heds00ar7k9obnwxm007'),('cmus4hgms00bi7k9ohya2eapy','cmus4heds00ar7k9obnwxm007'),('cmus4hhfw00br7k9o93y4lbtf','cmus4heds00ar7k9obnwxm007'),('cmus4heds00al7k9oktw2hgjb','cmus4heds00as7k9oudcgfk9c'),('cmus4hf3n00ax7k9oijuw97n4','cmus4heds00as7k9oudcgfk9c'),('cmus4hfwi00b67k9oy06oc8ue','cmus4heds00as7k9oudcgfk9c'),('cmus4hgms00bi7k9ohya2eapy','cmus4heds00as7k9oudcgfk9c'),('cmus4hhfw00br7k9o93y4lbtf','cmus4heds00as7k9oudcgfk9c'),('cmus4hikt00cd7k9oq5by8244','cmus4hikt00cj7k9oc7tdb0my'),('cmus4hpzt00d87k9otb2cytkr','cmus4hikt00cj7k9oc7tdb0my'),('cmus4hm3l00cp7k9ocan2fb73','cmus4hm3l00ct7k9ogp7vwfc9'),('cmus4hpzt00d87k9otb2cytkr','cmus4hm3l00ct7k9ogp7vwfc9'),('cmus4i5xq00ix7k9olqndn14w','cmus4hm3l00ct7k9ogp7vwfc9'),('cmus4iauj00jg7k9ozca0tvf8','cmus4hm3l00ct7k9ogp7vwfc9'),('cmus4hm3l00cp7k9ocan2fb73','cmus4hm3l00cu7k9orzdo5oez'),('cmus4hqht00dh7k9onmak8cwl','cmus4hm3l00cu7k9orzdo5oez'),('cmus4hwee00g37k9oy0r428li','cmus4hwee00g77k9od4ktvssj'),('cmus4hxds00gm7k9o8bto2vis','cmus4hwee00g77k9od4ktvssj'),('cmus4hycx00h57k9oyyywk1fa','cmus4hwee00g77k9od4ktvssj'),('cmus4hzlh00hq7k9oarrzp2md','cmus4hwee00g77k9od4ktvssj');
/*!40000 ALTER TABLE `ArtworkTagOnArtwork` ENABLE KEYS */;

--
-- Table structure for table `ArtworkTheme`
--

DROP TABLE IF EXISTS `ArtworkTheme`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtworkTheme` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtworkTheme_name_key` (`name`),
  UNIQUE KEY `ArtworkTheme_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtworkTheme`
--

/*!40000 ALTER TABLE `ArtworkTheme` DISABLE KEYS */;
INSERT INTO `ArtworkTheme` (`id`, `name`, `slug`, `isActive`, `sortOrder`) VALUES ('cmus4gojd00137k9ow5e4bw9m','Nature','nature',1,0),('cmus4gojn00147k9ohso8gbot','Heritage','heritage',1,1),('cmus4gojt00157k9ov7bvzjx8','Spiritual','spiritual',1,2),('cmus4gojz00167k9o7nmfsl6i','Festival','festival',1,3),('cmus4gok400177k9otg78ncs0','Urban','urban',1,4),('cmus4goka00187k9ocqcefhmx','Love & Family','love-family',1,5),('cmus4gokh00197k9oe21b1581','Wildlife','wildlife',1,6),('cmus4gokq001a7k9ok6djysxe','Monochrome','monochrome',1,7);
/*!40000 ALTER TABLE `ArtworkTheme` ENABLE KEYS */;

--
-- Table structure for table `AuditLog`
--

DROP TABLE IF EXISTS `AuditLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AuditLog` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `actorId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actorRole` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ipAddress` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_entityType_entityId_idx` (`entityType`,`entityId`),
  KEY `AuditLog_actorId_idx` (`actorId`),
  KEY `AuditLog_createdAt_idx` (`createdAt`),
  CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AuditLog`
--

/*!40000 ALTER TABLE `AuditLog` DISABLE KEYS */;
/*!40000 ALTER TABLE `AuditLog` ENABLE KEYS */;

--
-- Table structure for table `Banner`
--

DROP TABLE IF EXISTS `Banner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Banner` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `linkUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `placement` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOME_HERO',
  `sortOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `startsAt` datetime(3) DEFAULT NULL,
  `endsAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Banner`
--

/*!40000 ALTER TABLE `Banner` DISABLE KEYS */;
INSERT INTO `Banner` (`id`, `title`, `subtitle`, `imageUrl`, `linkUrl`, `placement`, `sortOrder`, `isActive`, `startsAt`, `endsAt`, `createdAt`) VALUES ('cmus4iv6u00zp7k9ox36xj4j5','Art That Tells Your Story','Discover original artworks or transform your favorite memories into beautiful art.','https://mymoonsgallery.com/media/site/1791022939985-hero-0.webp','/gallery','HOME_HERO',0,1,NULL,NULL,'2026-10-03 08:22:11.815'),('cmus4iw0100zq7k9o4khv3z9t','Turn Your Photo Into Art','Upload a photo, choose a style and a real artist paints it for you.','https://mymoonsgallery.com/media/site/1791022941501-hero-1.webp','/create-your-art','HOME_HERO',1,1,NULL,NULL,'2026-10-03 08:22:12.865'),('cmus4iwsf00zr7k9okeoc0mbs','Indian Heritage Collection','Mandalas, temple towns and living traditions.','https://mymoonsgallery.com/media/site/1791022943100-hero-2.webp','/collections/indian-heritage','HOME_HERO',2,1,NULL,NULL,'2026-10-03 08:22:13.887');
/*!40000 ALTER TABLE `Banner` ENABLE KEYS */;

--
-- Table structure for table `Cart`
--

DROP TABLE IF EXISTS `Cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Cart` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Cart_userId_key` (`userId`),
  CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Cart`
--

/*!40000 ALTER TABLE `Cart` DISABLE KEYS */;
INSERT INTO `Cart` (`id`, `userId`, `updatedAt`) VALUES ('cmus4yraz00037kjg9gp3oa2r','cmus4gwda002d7k9o6mkhzgmm','2026-10-03 08:34:33.276'),('cmus5n7n9004n7ky0pg4k8gjh','cmus4gw91002c7k9ozx8w96po','2026-10-03 08:53:34.197'),('cmus63f6t006j7ky0zropqykn','cmus5zslf005p7ky0dyh0xhr5','2026-10-03 09:06:10.470');
/*!40000 ALTER TABLE `Cart` ENABLE KEYS */;

--
-- Table structure for table `CartItem`
--

DROP TABLE IF EXISTS `CartItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CartItem` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cartId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customArtRequestId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CartItem_cartId_artworkId_key` (`cartId`,`artworkId`),
  UNIQUE KEY `CartItem_cartId_customArtRequestId_key` (`cartId`,`customArtRequestId`),
  KEY `CartItem_artworkId_fkey` (`artworkId`),
  KEY `CartItem_customArtRequestId_fkey` (`customArtRequestId`),
  CONSTRAINT `CartItem_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CartItem_customArtRequestId_fkey` FOREIGN KEY (`customArtRequestId`) REFERENCES `CustomArtRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CartItem`
--

/*!40000 ALTER TABLE `CartItem` DISABLE KEYS */;
/*!40000 ALTER TABLE `CartItem` ENABLE KEYS */;

--
-- Table structure for table `CollectionItem`
--

DROP TABLE IF EXISTS `CollectionItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CollectionItem` (
  `collectionId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `addedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`collectionId`,`artworkId`),
  KEY `CollectionItem_artworkId_fkey` (`artworkId`),
  CONSTRAINT `CollectionItem_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CollectionItem_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `ArtworkCollection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CollectionItem`
--

/*!40000 ALTER TABLE `CollectionItem` DISABLE KEYS */;
INSERT INTO `CollectionItem` (`collectionId`, `artworkId`, `sortOrder`, `addedAt`) VALUES ('cmus4ic4x00k27k9ojpl6wemg','cmus4gyzg003z7k9o9ppb7rsa',0,'2026-10-03 08:21:47.121'),('cmus4ic4x00k27k9ojpl6wemg','cmus4h0u0004u7k9oromd8d7l',1,'2026-10-03 08:21:47.121'),('cmus4ic4x00k27k9ojpl6wemg','cmus4hikt00cd7k9oq5by8244',2,'2026-10-03 08:21:47.121'),('cmus4ic4x00k27k9ojpl6wemg','cmus4hm3l00cp7k9ocan2fb73',3,'2026-10-03 08:21:47.121'),('cmus4ic4x00k27k9ojpl6wemg','cmus4hmp100cy7k9orpyduwko',4,'2026-10-03 08:21:47.121'),('cmus4ic4x00k27k9ojpl6wemg','cmus4hpzt00d87k9otb2cytkr',5,'2026-10-03 08:21:47.121'),('cmus4ic4x00k27k9ojpl6wemg','cmus4hqht00dh7k9onmak8cwl',6,'2026-10-03 08:21:47.121'),('cmus4ic4x00k27k9ojpl6wemg','cmus4i5xq00ix7k9olqndn14w',7,'2026-10-03 08:21:47.121'),('cmus4ic4x00k27k9ojpl6wemg','cmus4iauj00jg7k9ozca0tvf8',8,'2026-10-03 08:21:47.121'),('cmus4ic5700k47k9oefh6xy3u','cmus4gyfz003q7k9o4bmryodo',0,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4h0ca004k7k9o4ce280xx',1,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4heds00al7k9oktw2hgjb',7,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4hf3n00ax7k9oijuw97n4',8,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4hfwi00b67k9oy06oc8ue',9,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4hrs300e17k9o033rw8s3',2,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4hsf500ed7k9o9ck88moe',3,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4ht7100em7k9owzjmcmpd',4,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4htue00ey7k9oyy97p8es',5,'2026-10-03 08:21:47.131'),('cmus4ic5700k47k9oefh6xy3u','cmus4huql00f77k9ozf307cff',6,'2026-10-03 08:21:47.131'),('cmus4ic5g00k67k9otm7omph6','cmus4h2ee005f7k9ozvv0cna3',0,'2026-10-03 08:21:47.141'),('cmus4ic5g00k67k9otm7omph6','cmus4h374005r7k9otwxg61kt',1,'2026-10-03 08:21:47.141'),('cmus4ic5g00k67k9otm7omph6','cmus4h42d00607k9owhfywle8',2,'2026-10-03 08:21:47.141'),('cmus4ic5g00k67k9otm7omph6','cmus4h4rh006a7k9ooidrg0lf',3,'2026-10-03 08:21:47.141'),('cmus4ic5g00k67k9otm7omph6','cmus4h5qe006j7k9ozq878v35',4,'2026-10-03 08:21:47.141'),('cmus4ic5w00k87k9ofsilww7u','cmus4heds00al7k9oktw2hgjb',0,'2026-10-03 08:21:47.156'),('cmus4ic5w00k87k9ofsilww7u','cmus4hf3n00ax7k9oijuw97n4',1,'2026-10-03 08:21:47.156'),('cmus4ic5w00k87k9ofsilww7u','cmus4hfwi00b67k9oy06oc8ue',2,'2026-10-03 08:21:47.156'),('cmus4ic5w00k87k9ofsilww7u','cmus4hgms00bi7k9ohya2eapy',3,'2026-10-03 08:21:47.156'),('cmus4ic5w00k87k9ofsilww7u','cmus4hhfw00br7k9o93y4lbtf',4,'2026-10-03 08:21:47.156'),('cmus4ic6200ka7k9o5f45kvz2','cmus4ha8s008x7k9o1e8wgcdj',0,'2026-10-03 08:21:47.163'),('cmus4ic6200ka7k9o5f45kvz2','cmus4hasq00997k9oirpx23io',1,'2026-10-03 08:21:47.163'),('cmus4ic6200ka7k9o5f45kvz2','cmus4hbjt009i7k9oz1nlxy39',2,'2026-10-03 08:21:47.163'),('cmus4ic6200ka7k9o5f45kvz2','cmus4hc8k009s7k9ozp0cb1rf',3,'2026-10-03 08:21:47.163'),('cmus4ic6200ka7k9o5f45kvz2','cmus4hd2j00a17k9o1jyc3uhf',4,'2026-10-03 08:21:47.163'),('cmus4ic6g00kc7k9owgd89uuq','cmus4h6kx00757k9oaoiipq1v',0,'2026-10-03 08:21:47.176'),('cmus4ic6g00kc7k9owgd89uuq','cmus4h7cq007h7k9o8wj0tfx4',1,'2026-10-03 08:21:47.176'),('cmus4ic6g00kc7k9owgd89uuq','cmus4h7pz007q7k9odjfgw811',2,'2026-10-03 08:21:47.176'),('cmus4ic6g00kc7k9owgd89uuq','cmus4h8j600827k9ozjf54quc',3,'2026-10-03 08:21:47.176'),('cmus4ic6g00kc7k9owgd89uuq','cmus4h8z0008b7k9oc0magitx',4,'2026-10-03 08:21:47.176');
/*!40000 ALTER TABLE `CollectionItem` ENABLE KEYS */;

--
-- Table structure for table `Commission`
--

DROP TABLE IF EXISTS `Commission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Commission` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderItemId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruleScope` enum('GLOBAL','ARTIST','CATEGORY','ARTWORK','CUSTOM_ART') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruleId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `grossAmount` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `artistAmount` decimal(12,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Commission_orderItemId_key` (`orderItemId`),
  CONSTRAINT `Commission_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Commission`
--

/*!40000 ALTER TABLE `Commission` DISABLE KEYS */;
INSERT INTO `Commission` (`id`, `orderItemId`, `ruleScope`, `ruleId`, `percentage`, `grossAmount`, `amount`, `artistAmount`, `createdAt`) VALUES ('cmus4icnp00ky7k9o2s6ue9nk','cmus4icnh00kw7k9on13uv52a','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,3300.00,330.00,2970.00,'2026-09-05 19:21:47.770'),('cmus4icor00l47k9ow1sutiag','cmus4icok00l27k9ohj18w5lo','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,20000.00,2000.00,18000.00,'2026-09-05 19:21:47.770'),('cmus4icpy00la7k9ofbz8gbwf','cmus4icpr00l87k9ozv643xud','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2000.00,200.00,1800.00,'2026-09-05 19:21:47.770'),('cmus4icrt00lq7k9o6ig56uu6','cmus4icrm00lo7k9o9swtz8pa','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2500.00,250.00,2250.00,'2026-08-09 23:21:47.922'),('cmus4ictg00m27k9och67rb6s','cmus4icta00m07k9o2a37u55i','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,4900.00,490.00,4410.00,'2026-07-14 18:21:47.983'),('cmus4icvk00me7k9ognhvoeou','cmus4icvb00mc7k9ogotlnej7','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2500.00,250.00,2250.00,'2026-07-27 06:21:48.055'),('cmus4icwq00mk7k9otc5q0282','cmus4icwi00mi7k9oinv3rkr1','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,1800.00,180.00,1620.00,'2026-07-27 06:21:48.055'),('cmus4icyj00my7k9o0eyhf324','cmus4icyb00mw7k9oucd8ca4d','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,1600.00,160.00,1440.00,'2026-08-08 17:21:48.163'),('cmus4iczk00n67k9omvcehxcu','cmus4iczd00n47k9oc0zsa37g','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,88000.00,8800.00,79200.00,'2026-08-08 17:21:48.163'),('cmus4id1n00ni7k9o5afxe6m7','cmus4id1f00ng7k9od54w1wys','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2400.00,240.00,2160.00,'2026-08-09 20:21:48.275'),('cmus4id3b00nu7k9orvon2hv4','cmus4id3100ns7k9oda5zdzru','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2700.00,270.00,2430.00,'2026-07-27 03:21:48.332'),('cmus4id4g00o07k9ovwq6cuut','cmus4id4800ny7k9ohbxvonyc','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2600.00,260.00,2340.00,'2026-07-27 03:21:48.332'),('cmus4id5t00oc7k9ocnd33aaf','cmus4id5n00oa7k9ob4uvhfoh','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,6000.00,600.00,5400.00,'2026-07-22 12:21:48.429'),('cmus4id7j00oo7k9ovtsxn5da','cmus4id7d00om7k9o930jn7r3','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2000.00,200.00,1800.00,'2026-08-19 22:21:48.489'),('cmus4id8n00ow7k9ogfncv413','cmus4id8e00ou7k9olza669em','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,83300.00,8330.00,74970.00,'2026-08-19 22:21:48.489'),('cmus4idaj00p87k9oy0mkv5un','cmus4idab00p67k9oh8phe5dx','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,5700.00,570.00,5130.00,'2026-09-26 04:21:48.596'),('cmus4idbg00pe7k9o6ooelr2g','cmus4idb900pc7k9ojqkieqdy','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,3600.00,360.00,3240.00,'2026-09-26 04:21:48.596'),('cmus4idcx00ps7k9oaqo1kjkz','cmus4idcr00pq7k9o9xkhkcl2','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2300.00,230.00,2070.00,'2026-09-18 00:21:48.685'),('cmus4idez00q47k9okokcpmxx','cmus4ider00q27k9oy04xhz1o','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2600.00,260.00,2340.00,'2026-09-22 03:21:48.755'),('cmus4idgp00qg7k9obdcy2yjw','cmus4idgg00qe7k9o1wx5eh32','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2000.00,200.00,1800.00,'2026-08-24 07:21:48.816'),('cmus4idhv00qo7k9o9p3zxlrs','cmus4idhj00qm7k9orqqsoiir','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,67000.00,6700.00,60300.00,'2026-08-24 07:21:48.816'),('cmus4idj700qu7k9otjgap3ry','cmus4idj000qs7k9oab00uesn','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,1600.00,160.00,1440.00,'2026-08-24 07:21:48.816'),('cmus4idl100r87k9omxgut1ak','cmus4idkt00r67k9ohkf95wny','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,4900.00,490.00,4410.00,'2026-07-18 02:21:48.972'),('cmus4ido000rk7k9ok46yudth','cmus4idnh00ri7k9ov8g4oyrz','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,3600.00,360.00,3240.00,'2026-08-10 18:21:49.058'),('cmus4idpp00rw7k9oxnm18cty','cmus4idpg00ru7k9ou2h5uhu5','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2000.00,200.00,1800.00,'2026-09-03 05:21:49.141'),('cmus4idqt00s47k9ou4evqorf','cmus4idqj00s27k9o8ilry4cb','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2600.00,260.00,2340.00,'2026-09-03 05:21:49.141'),('cmus4idse00sg7k9omrznig6r','cmus4ids700se7k9odfp8lkwq','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,97000.00,9700.00,87300.00,'2026-09-11 16:21:49.240'),('cmus4idtm00sm7k9o6g015c4h','cmus4idtf00sk7k9oh4o7sk62','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2700.00,270.00,2430.00,'2026-09-11 16:21:49.240'),('cmus4idvs00t07k9o34bxutxp','cmus4idvl00sy7k9or8tcjzw3','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,11400.00,1140.00,10260.00,'2026-10-01 18:21:49.361'),('cmus4idxk00tc7k9onr25dhnt','cmus4idxc00ta7k9olaa3xnz0','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,2400.00,240.00,2160.00,'2026-09-26 19:21:49.425'),('cmus4idz300to7k9o9aymovu0','cmus4idyv00tm7k9oz0fy4l47','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,5700.00,570.00,5130.00,'2026-10-02 13:21:49.479'),('cmus4im3w00z87k9ovj67w59r','cmus4im2b00z67k9o4g02mfhq','CUSTOM_ART','cmus4gw25002b7k9obz83utgv',15.00,3500.00,525.00,2975.00,'2026-10-03 08:22:00.044'),('cmus5ecvw001b7ky0wycjhwn9','cmus5ecvt00197ky0d92uq16f','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,1500.00,150.00,1350.00,'2026-10-03 08:46:41.085'),('cmus5ewpl003z7ky0f7jja22c','cmus5ewph003x7ky0txu2r2vf','CUSTOM_ART','cmus4gw25002b7k9obz83utgv',15.00,4500.00,675.00,3825.00,'2026-10-03 08:47:06.778'),('cmus5ewu200457ky0qw1tp0ec','cmus5ewu000437ky0x2ckgunx','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,1500.00,150.00,1350.00,'2026-10-03 08:47:06.939'),('cmus5xmi900597ky0iqs5c56b','cmus5xmi000577ky00mm1iaa3','GLOBAL','cmus4gw1x002a7k9o2e35nxk2',10.00,139000.00,13900.00,125100.00,'2026-10-03 09:01:40.017');
/*!40000 ALTER TABLE `Commission` ENABLE KEYS */;

--
-- Table structure for table `CommissionRule`
--

DROP TABLE IF EXISTS `CommissionRule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CommissionRule` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` enum('GLOBAL','ARTIST','CATEGORY','ARTWORK','CUSTOM_ART') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CommissionRule_scope_targetId_key` (`scope`,`targetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommissionRule`
--

/*!40000 ALTER TABLE `CommissionRule` DISABLE KEYS */;
INSERT INTO `CommissionRule` (`id`, `scope`, `targetId`, `percentage`, `isActive`, `createdAt`, `updatedAt`) VALUES ('cmus4gw1x002a7k9o2e35nxk2','GLOBAL',NULL,10.00,1,'2026-10-03 08:20:39.622','2026-10-03 08:20:39.622'),('cmus4gw25002b7k9obz83utgv','CUSTOM_ART',NULL,15.00,1,'2026-10-03 08:20:39.629','2026-10-03 08:20:39.629');
/*!40000 ALTER TABLE `CommissionRule` ENABLE KEYS */;

--
-- Table structure for table `CustomArtImage`
--

DROP TABLE IF EXISTS `CustomArtImage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CustomArtImage` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('SOURCE','REFERENCE','PREVIEW','FINAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `storageKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mimeType` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `sizeBytes` int NOT NULL,
  `isAiGenerated` tinyint(1) NOT NULL DEFAULT '0',
  `uploadedById` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CustomArtImage_requestId_kind_idx` (`requestId`,`kind`),
  CONSTRAINT `CustomArtImage_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `CustomArtRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CustomArtImage`
--

/*!40000 ALTER TABLE `CustomArtImage` DISABLE KEYS */;
INSERT INTO `CustomArtImage` (`id`, `requestId`, `kind`, `storageKey`, `mimeType`, `width`, `height`, `sizeBytes`, `isAiGenerated`, `uploadedById`, `createdAt`) VALUES ('cmus4ig2p00vw7k9o0t5rdibd','cmus4ifnp00vu7k9om5ke8jbj','SOURCE','custom-art/source/1791022239753-JQMCJbku9zAy.webp','image/webp',1600,1088,730600,0,'cmus4gwda002d7k9o6mkhzgmm','2026-09-02 19:21:51.676'),('cmus4ignt00w27k9oeocvfybr','cmus4igal00w07k9oy8xdl3fe','SOURCE','custom-art/source/1791022241176-Rv041_oleXV6.webp','image/webp',1287,1600,624276,0,'cmus4gwda002d7k9o6mkhzgmm','2026-09-06 05:21:52.501'),('cmus4ih5200wc7k9oo72u4qha','cmus4igsb00wa7k9oii72ku8s','SOURCE','custom-art/source/1791022244222-wsckeNWd5f63.webp','image/webp',1294,1600,805110,0,'cmus4gwda002d7k9o6mkhzgmm','2026-09-09 07:21:53.138'),('cmus4ihjo00wo7k9oqybcatn6','cmus4ih7l00wm7k9oxblqpc0l','SOURCE','custom-art/source/1791022246553-KGx-j2EhKUZo.webp','image/webp',1320,1600,791496,0,'cmus4gwda002d7k9o6mkhzgmm','2026-09-12 06:21:53.689'),('cmus4ii5400x47k9ob7t2doh8','cmus4ih7l00wm7k9oxblqpc0l','PREVIEW','custom-art/preview/1791022248211-1nDP1t8nH7xj.webp','image/webp',1200,1520,477402,0,'cmus4gwzb00317k9oa3ttabyd','2026-10-03 08:21:54.904'),('cmus4iigt00x87k9o43uhx6rm','cmus4ii5v00x67k9o57es6tef','SOURCE','custom-art/source/1791022250107-5T-LKmuyNsZQ.webp','image/webp',1600,1122,679522,0,'cmus4gwda002d7k9o6mkhzgmm','2026-09-14 23:21:54.923'),('cmus4ij1200xm7k9ooplvizs8','cmus4ii5v00x67k9o57es6tef','PREVIEW','custom-art/preview/1791022252030-wA6OhVw50sFG.webp','image/webp',1098,1600,525128,0,'cmus4hvaf00fg7k9o56ax8t3n','2026-10-03 08:21:56.055'),('cmus4ijgx00xs7k9oyjoqo2en','cmus4ij4s00xq7k9o0n7yad21','SOURCE','custom-art/source/1791022254050-lU8RAs_9iNuE.webp','image/webp',1343,1600,640456,0,'cmus4gwed002p7k9ot2pbzw4b','2026-09-17 15:21:56.181'),('cmus4ijzz00ya7k9o4dkppcvi','cmus4ij4s00xq7k9o0n7yad21','PREVIEW','custom-art/preview/1791022255726-FyJzZrRB4CrP.webp','image/webp',1600,926,361378,0,'cmus4gwzb00317k9oa3ttabyd','2026-10-03 08:21:57.312'),('cmus4ikdk00ye7k9opnfgu6zb','cmus4ik1200yc7k9ooq87yftf','SOURCE','custom-art/source/1791022257561-7Za1g6kh7ba2.webp','image/webp',1179,1600,281368,0,'cmus4gwe4002l7k9os8s52e2y','2026-09-21 05:21:57.342'),('cmus4ikv400z07k9on1scvs35','cmus4ik1200yc7k9ooq87yftf','PREVIEW','custom-art/preview/1791022258629-X0RbOpamHQJr.webp','image/webp',1016,1600,258748,0,'cmus4gwzb00317k9oa3ttabyd','2026-10-03 08:21:58.432'),('cmus4im1100z27k9oas6j4mtn','cmus4ik1200yc7k9ooq87yftf','FINAL','custom-art/final/1791022259549-Fl-MbfelX9zu.jpg','image/jpeg',1920,3025,1495416,0,'cmus4gwzb00317k9oa3ttabyd','2026-10-03 08:21:59.941'),('cmus4imjm00zi7k9ou13x8gh9','cmus4im8u00zg7k9o91rfon5g','SOURCE','custom-art/source/1791022260082-lizr5TDcRX4L.webp','image/webp',1273,1600,559986,0,'cmus4gwdt002h7k9oi4jryetb','2026-09-23 16:22:00.214'),('cmus5e58s000g7ky0hse2rpni','cmus5e58s000f7ky0fw7ereug','SOURCE','custom-art/source/1791022261982-HR8ZwwefOn_z.webp','image/webp',1600,1097,480164,0,'cmus4gwda002d7k9o6mkhzgmm','2026-10-03 08:46:31.180'),('cmus5ep2e001w7ky0h9y7wguf','cmus5ep2e001v7ky0qc06hna0','SOURCE','custom-art/source/1791022263546-6Olmb1f8aZw-.webp','image/webp',1600,1121,452908,0,'cmus4gwda002d7k9o6mkhzgmm','2026-10-03 08:46:56.871'),('cmus5eqfn002e7ky0kvtr3hho','cmus5ep2e001v7ky0qc06hna0','PREVIEW','custom-art/preview/1791022264915-fb2Rr2UAZXNF.webp','image/webp',1415,1600,520912,0,'cmus4gwzb00317k9oa3ttabyd','2026-10-03 08:46:58.643'),('cmus5es4b002t7ky0jwtm5c01','cmus5ep2e001v7ky0qc06hna0','PREVIEW','custom-art/preview/1791022266112-W2Ftbx-hMqmx.webp','image/webp',1415,1600,520912,0,'cmus4gwzb00317k9oa3ttabyd','2026-10-03 08:47:00.828');
/*!40000 ALTER TABLE `CustomArtImage` ENABLE KEYS */;

--
-- Table structure for table `CustomArtRequest`
--

DROP TABLE IF EXISTS `CustomArtRequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CustomArtRequest` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestNumber` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `selectedStyleId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selectedArtworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` json DEFAULT NULL,
  `requestedDimensions` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requestedFormat` enum('ORIGINAL','PRINT','DIGITAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DIGITAL',
  `budget` decimal(12,2) DEFAULT NULL,
  `quotedPrice` decimal(12,2) DEFAULT NULL,
  `currency` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `status` enum('REQUESTED','ARTIST_REVIEWING','ACCEPTED','REJECTED','IN_PROGRESS','PREVIEW_READY','REVISION_REQUESTED','CUSTOMER_APPROVED','FINALIZING','COMPLETED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REQUESTED',
  `artistMessage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `customerMessage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `revisionCount` int NOT NULL DEFAULT '0',
  `maxRevisions` int NOT NULL DEFAULT '2',
  `dueDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CustomArtRequest_requestNumber_key` (`requestNumber`),
  KEY `CustomArtRequest_customerId_status_idx` (`customerId`,`status`),
  KEY `CustomArtRequest_artistId_status_idx` (`artistId`,`status`),
  KEY `CustomArtRequest_selectedStyleId_fkey` (`selectedStyleId`),
  KEY `CustomArtRequest_selectedArtworkId_fkey` (`selectedArtworkId`),
  CONSTRAINT `CustomArtRequest_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CustomArtRequest_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CustomArtRequest_selectedArtworkId_fkey` FOREIGN KEY (`selectedArtworkId`) REFERENCES `Artwork` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `CustomArtRequest_selectedStyleId_fkey` FOREIGN KEY (`selectedStyleId`) REFERENCES `ArtworkStyle` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CustomArtRequest`
--

/*!40000 ALTER TABLE `CustomArtRequest` DISABLE KEYS */;
INSERT INTO `CustomArtRequest` (`id`, `requestNumber`, `customerId`, `artistId`, `selectedStyleId`, `selectedArtworkId`, `title`, `instructions`, `options`, `requestedDimensions`, `requestedFormat`, `budget`, `quotedPrice`, `currency`, `status`, `artistMessage`, `customerMessage`, `revisionCount`, `maxRevisions`, `dueDate`, `createdAt`, `updatedAt`) VALUES ('cmus4ifnp00vu7k9om5ke8jbj','CA-93FK9QWX','cmus4gwda002d7k9o6mkhzgmm','cmus4gwzb00347k9o7jpqfl1i','cmus4gu8e001y7k9oz5xq41od',NULL,'Family at the temple','Convert this family photo into a traditional Indian watercolor painting with a temple background.','{\"colors\": \"Warm\", \"background\": \"As described\"}','45 x 60 cm','ORIGINAL',6000.00,NULL,'INR','REQUESTED',NULL,NULL,0,2,NULL,'2026-09-02 19:21:51.676','2026-10-03 08:21:51.685'),('cmus4igal00w07k9oy8xdl3fe','CA-5GNCCJ8N','cmus4gwda002d7k9o6mkhzgmm','cmus4gwzb00347k9o7jpqfl1i','cmus4gul200207k9oqku6stis',NULL,'Grandparents portrait','A soft pencil sketch of my grandparents for their 50th anniversary. Please keep the background plain.','{\"colors\": \"Warm\", \"background\": \"As described\"}','45 x 60 cm','PRINT',3000.00,4500.00,'INR','ACCEPTED','Thank you! I would love to create this for you.',NULL,0,2,NULL,'2026-09-06 05:21:52.501','2026-10-03 08:21:52.510'),('cmus4igsb00wa7k9oii72ku8s','CA-CEAMXF3R','cmus4gwda002d7k9o6mkhzgmm','cmus4h9jq008n7k9okcz2sm88','cmus4guyq00227k9o6crc34vc',NULL,'My dog Bruno','Colourful digital painting of my dog with a sunset background and his name in the corner.','{\"colors\": \"Warm\", \"background\": \"As described\"}','4000 x 5000 px','DIGITAL',2500.00,2800.00,'INR','IN_PROGRESS','Thank you! I would love to create this for you.',NULL,0,2,NULL,'2026-09-09 07:21:53.138','2026-10-03 08:21:53.147'),('cmus4ih7l00wm7k9oxblqpc0l','CA-AUDTE2UA','cmus4gwda002d7k9o6mkhzgmm','cmus4gwzb00347k9o7jpqfl1i','cmus4gvsf00287k9oot5tjwnl',NULL,'Wedding couple, Tanjore style','Our wedding photo in a Tanjore-inspired style with gold accents and traditional jewellery.','{\"colors\": \"Warm\", \"background\": \"Artist’s choice\"}','45 x 60 cm','ORIGINAL',12000.00,14000.00,'INR','PREVIEW_READY','Thank you! I would love to create this for you.',NULL,0,2,NULL,'2026-09-12 06:21:53.689','2026-10-03 08:21:53.697'),('cmus4ii5v00x67k9o57es6tef','CA-9798YC38','cmus4gwda002d7k9o6mkhzgmm','cmus4hvaf00fj7k9omlgiu1hu','cmus4gvcn00257k9ozbmxla8t',NULL,'Anime friends','Turn this photo of me and my best friend into an anime scene under cherry blossoms.','{\"colors\": \"Warm\", \"background\": \"Artist’s choice\"}','4000 x 5000 px','DIGITAL',3000.00,3200.00,'INR','REVISION_REQUESTED','Thank you! I would love to create this for you.',NULL,1,2,NULL,'2026-09-14 23:21:54.923','2026-10-03 08:21:54.932'),('cmus4ij4s00xq7k9o0n7yad21','CA-5WSXNCN9','cmus4gwed002p7k9ot2pbzw4b','cmus4gwzb00347k9o7jpqfl1i','cmus4gucy001z7k9oi3s6qrwm',NULL,'Kerala backwaters memory','Oil painting from our houseboat holiday photo — warm evening light please.','{\"colors\": \"Warm\", \"background\": \"Artist’s choice\"}','45 x 60 cm','ORIGINAL',9000.00,8000.00,'INR','CUSTOMER_APPROVED','Thank you! I would love to create this for you.',NULL,0,2,NULL,'2026-09-17 15:21:56.181','2026-10-03 08:21:56.189'),('cmus4ik1200yc7k9ooq87yftf','CA-SVVEMZNA','cmus4gwe4002l7k9os8s52e2y','cmus4gwzb00347k9o7jpqfl1i','cmus4gu8e001y7k9oz5xq41od',NULL,'Baby’s first Diwali','Watercolor of my daughter holding a diya. Soft pastel tones.','{\"colors\": \"Warm\", \"background\": \"Artist’s choice\"}','4000 x 5000 px','DIGITAL',3500.00,3500.00,'INR','COMPLETED','Thank you! I would love to create this for you.',NULL,0,2,NULL,'2026-09-21 05:21:57.342','2026-10-03 08:21:57.350'),('cmus4im8u00zg7k9o91rfon5g','CA-YW7W5P4A','cmus4gwdt002h7k9oi4jryetb','cmus4hdoo00ad7k9okljt2ll3','cmus4gusi00217k9o51xv84gk',NULL,'Bike portrait','Charcoal drawing of my motorbike in front of Howrah bridge.','{\"colors\": \"Warm\", \"background\": \"Artist’s choice\"}','45 x 60 cm','ORIGINAL',1500.00,NULL,'INR','REJECTED','Sorry — I am fully booked this month.',NULL,0,2,NULL,'2026-09-23 16:22:00.214','2026-10-03 08:22:00.222'),('cmus5e58s000f7ky0fw7ereug','CA-7SXX5JKB','cmus4gwda002d7k9o6mkhzgmm','cmus4gwzb00347k9o7jpqfl1i','cmus4gtc5001s7k9oj0kyz9e7',NULL,'Realistic portrait','E2E: watercolor family portrait with a temple background, warm colours.','{}',NULL,'DIGITAL',NULL,NULL,'INR','REQUESTED',NULL,NULL,0,2,NULL,'2026-10-03 08:46:31.180','2026-10-03 08:46:31.180'),('cmus5ep2e001v7ky0qc06hna0','CA-KVCSJ2WL','cmus4gwda002d7k9o6mkhzgmm','cmus4gwzb00347k9o7jpqfl1i','cmus4gtc5001s7k9oj0kyz9e7',NULL,'Realistic portrait','E2E: watercolor family portrait with a temple background, warm colours.','{}',NULL,'DIGITAL',NULL,4500.00,'INR','CUSTOMER_APPROVED','First pass','Please make the sky a little brighter.',1,2,NULL,'2026-10-03 08:46:56.871','2026-10-03 08:47:01.379');
/*!40000 ALTER TABLE `CustomArtRequest` ENABLE KEYS */;

--
-- Table structure for table `CustomArtRevision`
--

DROP TABLE IF EXISTS `CustomArtRevision`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CustomArtRevision` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revisionNumber` int NOT NULL,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CustomArtRevision_requestId_idx` (`requestId`),
  CONSTRAINT `CustomArtRevision_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `CustomArtRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CustomArtRevision`
--

/*!40000 ALTER TABLE `CustomArtRevision` DISABLE KEYS */;
INSERT INTO `CustomArtRevision` (`id`, `requestId`, `revisionNumber`, `feedback`, `createdAt`) VALUES ('cmus4ij1x00xo7k9ogzx5q9kk','cmus4ii5v00x67k9o57es6tef',1,'Could you make the background lighter and add more cherry blossoms?','2026-10-03 08:21:56.085'),('cmus5erzt002o7ky0y4niwvpg','cmus5ep2e001v7ky0qc06hna0',1,'Please make the sky a little brighter.','2026-10-03 08:47:00.665');
/*!40000 ALTER TABLE `CustomArtRevision` ENABLE KEYS */;

--
-- Table structure for table `CustomArtStatusHistory`
--

DROP TABLE IF EXISTS `CustomArtStatusHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CustomArtStatusHistory` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fromStatus` enum('REQUESTED','ARTIST_REVIEWING','ACCEPTED','REJECTED','IN_PROGRESS','PREVIEW_READY','REVISION_REQUESTED','CUSTOMER_APPROVED','FINALIZING','COMPLETED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toStatus` enum('REQUESTED','ARTIST_REVIEWING','ACCEPTED','REJECTED','IN_PROGRESS','PREVIEW_READY','REVISION_REQUESTED','CUSTOMER_APPROVED','FINALIZING','COMPLETED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `actorId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `actorRole` enum('ADMIN','ARTIST','CUSTOMER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CustomArtStatusHistory_requestId_idx` (`requestId`),
  CONSTRAINT `CustomArtStatusHistory_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `CustomArtRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CustomArtStatusHistory`
--

/*!40000 ALTER TABLE `CustomArtStatusHistory` DISABLE KEYS */;
INSERT INTO `CustomArtStatusHistory` (`id`, `requestId`, `fromStatus`, `toStatus`, `actorId`, `actorRole`, `note`, `createdAt`) VALUES ('cmus4ig6h00vy7k9o1ogi9tb5','cmus4ifnp00vu7k9om5ke8jbj',NULL,'REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER',NULL,'2026-09-02 19:21:51.676'),('cmus4igof00w47k9o2mqdt18j','cmus4igal00w07k9oy8xdl3fe',NULL,'REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER',NULL,'2026-09-06 05:21:52.501'),('cmus4igpu00w67k9ovnjk228y','cmus4igal00w07k9oy8xdl3fe','REQUESTED','ARTIST_REVIEWING','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-06 07:21:52.501'),('cmus4igre00w87k9o6o6nq5j8','cmus4igal00w07k9oy8xdl3fe','ARTIST_REVIEWING','ACCEPTED','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-06 09:21:52.501'),('cmus4ih5x00we7k9ogcjad24k','cmus4igsb00wa7k9oii72ku8s',NULL,'REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER',NULL,'2026-09-09 07:21:53.138'),('cmus4ih6c00wg7k9opk520eud','cmus4igsb00wa7k9oii72ku8s','REQUESTED','ARTIST_REVIEWING','cmus4h9jq008k7k9o8nyp4k95','ARTIST',NULL,'2026-09-09 09:21:53.138'),('cmus4ih6p00wi7k9oukutnxto','cmus4igsb00wa7k9oii72ku8s','ARTIST_REVIEWING','ACCEPTED','cmus4h9jq008k7k9o8nyp4k95','ARTIST',NULL,'2026-09-09 11:21:53.138'),('cmus4ih7400wk7k9o1878vh0y','cmus4igsb00wa7k9oii72ku8s','ACCEPTED','IN_PROGRESS','cmus4h9jq008k7k9o8nyp4k95','ARTIST',NULL,'2026-09-09 13:21:53.138'),('cmus4ihk900wq7k9org6h0nyg','cmus4ih7l00wm7k9oxblqpc0l',NULL,'REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER',NULL,'2026-09-12 06:21:53.689'),('cmus4ihkw00ws7k9oxtn6eiwt','cmus4ih7l00wm7k9oxblqpc0l','REQUESTED','ARTIST_REVIEWING','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-12 08:21:53.689'),('cmus4ihla00wu7k9oki7ndvln','cmus4ih7l00wm7k9oxblqpc0l','ARTIST_REVIEWING','ACCEPTED','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-12 10:21:53.689'),('cmus4ihm000ww7k9o1mq1lruh','cmus4ih7l00wm7k9oxblqpc0l','ACCEPTED','IN_PROGRESS','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-12 12:21:53.689'),('cmus4ihmx00wy7k9oh23dev7n','cmus4ih7l00wm7k9oxblqpc0l','IN_PROGRESS','PREVIEW_READY','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-12 14:21:53.689'),('cmus4ihno00x07k9o2c5mdvuf','cmus4ih7l00wm7k9oxblqpc0l','PREVIEW_READY','REVISION_REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER','Could you make the background lighter?','2026-09-12 16:21:53.689'),('cmus4ihoz00x27k9ojn6n4t9s','cmus4ih7l00wm7k9oxblqpc0l','REVISION_REQUESTED','PREVIEW_READY','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-12 18:21:53.689'),('cmus4iihn00xa7k9orhgtcbci','cmus4ii5v00x67k9o57es6tef',NULL,'REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER',NULL,'2026-09-14 23:21:54.923'),('cmus4iihz00xc7k9ofi7krwtb','cmus4ii5v00x67k9o57es6tef','REQUESTED','ARTIST_REVIEWING','cmus4hvaf00fg7k9o56ax8t3n','ARTIST',NULL,'2026-09-15 01:21:54.923'),('cmus4iij900xe7k9o2xvhpsa9','cmus4ii5v00x67k9o57es6tef','ARTIST_REVIEWING','ACCEPTED','cmus4hvaf00fg7k9o56ax8t3n','ARTIST',NULL,'2026-09-15 03:21:54.923'),('cmus4iijl00xg7k9ooc3eq73c','cmus4ii5v00x67k9o57es6tef','ACCEPTED','IN_PROGRESS','cmus4hvaf00fg7k9o56ax8t3n','ARTIST',NULL,'2026-09-15 05:21:54.923'),('cmus4iik000xi7k9oygq5kta7','cmus4ii5v00x67k9o57es6tef','IN_PROGRESS','PREVIEW_READY','cmus4hvaf00fg7k9o56ax8t3n','ARTIST',NULL,'2026-09-15 07:21:54.923'),('cmus4iikn00xk7k9ov882gdp0','cmus4ii5v00x67k9o57es6tef','PREVIEW_READY','REVISION_REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER','Could you make the background lighter?','2026-09-15 09:21:54.923'),('cmus4ijh300xu7k9o6jcncafh','cmus4ij4s00xq7k9o0n7yad21',NULL,'REQUESTED','cmus4gwed002p7k9ot2pbzw4b','CUSTOMER',NULL,'2026-09-17 15:21:56.181'),('cmus4ijhi00xw7k9oqrvh464d','cmus4ij4s00xq7k9o0n7yad21','REQUESTED','ARTIST_REVIEWING','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-17 17:21:56.181'),('cmus4ijhw00xy7k9o5asacnqr','cmus4ij4s00xq7k9o0n7yad21','ARTIST_REVIEWING','ACCEPTED','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-17 19:21:56.181'),('cmus4ijia00y07k9o4ucu0q31','cmus4ij4s00xq7k9o0n7yad21','ACCEPTED','IN_PROGRESS','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-17 21:21:56.181'),('cmus4ijin00y27k9orp7bw34h','cmus4ij4s00xq7k9o0n7yad21','IN_PROGRESS','PREVIEW_READY','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-17 23:21:56.181'),('cmus4ijj400y47k9oa5qwdlzs','cmus4ij4s00xq7k9o0n7yad21','PREVIEW_READY','REVISION_REQUESTED','cmus4gwed002p7k9ot2pbzw4b','CUSTOMER','Could you make the background lighter?','2026-09-18 01:21:56.181'),('cmus4ijjk00y67k9ow2wsswfa','cmus4ij4s00xq7k9o0n7yad21','REVISION_REQUESTED','PREVIEW_READY','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-18 03:21:56.181'),('cmus4ijkl00y87k9od5z7kw84','cmus4ij4s00xq7k9o0n7yad21','PREVIEW_READY','CUSTOMER_APPROVED','cmus4gwed002p7k9ot2pbzw4b','CUSTOMER',NULL,'2026-09-18 05:21:56.181'),('cmus4ikdv00yg7k9o4xqor2qu','cmus4ik1200yc7k9ooq87yftf',NULL,'REQUESTED','cmus4gwe4002l7k9os8s52e2y','CUSTOMER',NULL,'2026-09-21 05:21:57.342'),('cmus4ike300yi7k9oinwis3jv','cmus4ik1200yc7k9ooq87yftf','REQUESTED','ARTIST_REVIEWING','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-21 07:21:57.342'),('cmus4iked00yk7k9ozyy874sw','cmus4ik1200yc7k9ooq87yftf','ARTIST_REVIEWING','ACCEPTED','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-21 09:21:57.342'),('cmus4ikel00ym7k9okdi5e13l','cmus4ik1200yc7k9ooq87yftf','ACCEPTED','IN_PROGRESS','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-21 11:21:57.342'),('cmus4ikeu00yo7k9oeukd54ws','cmus4ik1200yc7k9ooq87yftf','IN_PROGRESS','PREVIEW_READY','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-21 13:21:57.342'),('cmus4ikf100yq7k9oh8f9w0v8','cmus4ik1200yc7k9ooq87yftf','PREVIEW_READY','REVISION_REQUESTED','cmus4gwe4002l7k9os8s52e2y','CUSTOMER','Could you make the background lighter?','2026-09-21 15:21:57.342'),('cmus4ikf800ys7k9oiovlnwz8','cmus4ik1200yc7k9ooq87yftf','REVISION_REQUESTED','PREVIEW_READY','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-21 17:21:57.342'),('cmus4ikff00yu7k9oc90zrotu','cmus4ik1200yc7k9ooq87yftf','PREVIEW_READY','CUSTOMER_APPROVED','cmus4gwe4002l7k9os8s52e2y','CUSTOMER',NULL,'2026-09-21 19:21:57.342'),('cmus4ikfn00yw7k9o9fx1n6u5','cmus4ik1200yc7k9ooq87yftf','CUSTOMER_APPROVED','FINALIZING','cmus4gwzb00317k9oa3ttabyd','ARTIST',NULL,'2026-09-21 21:21:57.342'),('cmus4ikfu00yy7k9oexi41p2v','cmus4ik1200yc7k9ooq87yftf','FINALIZING','COMPLETED','cmus4gwe4002l7k9os8s52e2y','CUSTOMER',NULL,'2026-09-21 23:21:57.342'),('cmus4imk600zk7k9o2yqvc73p','cmus4im8u00zg7k9o91rfon5g',NULL,'REQUESTED','cmus4gwdt002h7k9oi4jryetb','CUSTOMER',NULL,'2026-09-23 16:22:00.214'),('cmus4imkk00zm7k9ob6q7zx0p','cmus4im8u00zg7k9o91rfon5g','REQUESTED','ARTIST_REVIEWING','cmus4hdoo00aa7k9o06tq6x27','ARTIST',NULL,'2026-09-23 18:22:00.214'),('cmus4imkz00zo7k9o6814gtq7','cmus4im8u00zg7k9o91rfon5g','ARTIST_REVIEWING','REJECTED','cmus4hdoo00aa7k9o06tq6x27','ARTIST',NULL,'2026-09-23 20:22:00.214'),('cmus5e58s000h7ky0775m6zhk','cmus5e58s000f7ky0fw7ereug',NULL,'REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER','Request submitted','2026-10-03 08:46:31.180'),('cmus5ep2e001x7ky0xpf1eg06','cmus5ep2e001v7ky0qc06hna0',NULL,'REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER','Request submitted','2026-10-03 08:46:56.871'),('cmus5eq6k00257ky0ypagnaez','cmus5ep2e001v7ky0qc06hna0','REQUESTED','ACCEPTED','cmus4gwzb00317k9oa3ttabyd','ARTIST','Lovely photo!','2026-10-03 08:46:58.316'),('cmus5eqbk00297ky04x4b19bu','cmus5ep2e001v7ky0qc06hna0','ACCEPTED','IN_PROGRESS','cmus4gwzb00317k9oa3ttabyd','ARTIST','Work in progress','2026-10-03 08:46:58.497'),('cmus5eqfj002d7ky0r4xupsc6','cmus5ep2e001v7ky0qc06hna0','IN_PROGRESS','PREVIEW_READY','cmus4gwzb00317k9oa3ttabyd','ARTIST','First pass','2026-10-03 08:46:58.640'),('cmus5erzn002m7ky0mlm10us7','cmus5ep2e001v7ky0qc06hna0','PREVIEW_READY','REVISION_REQUESTED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER','Please make the sky a little brighter.','2026-10-03 08:47:00.660'),('cmus5es48002s7ky0r1m2s7an','cmus5ep2e001v7ky0qc06hna0','REVISION_REQUESTED','PREVIEW_READY','cmus4gwzb00317k9oa3ttabyd','ARTIST','First pass','2026-10-03 08:47:00.824'),('cmus5esjr00317ky094mwj1jc','cmus5ep2e001v7ky0qc06hna0','PREVIEW_READY','CUSTOMER_APPROVED','cmus4gwda002d7k9o6mkhzgmm','CUSTOMER','Customer approved the preview','2026-10-03 08:47:01.383');
/*!40000 ALTER TABLE `CustomArtStatusHistory` ENABLE KEYS */;

--
-- Table structure for table `CustomerAddress`
--

DROP TABLE IF EXISTS `CustomerAddress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CustomerAddress` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fullName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `line1` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `line2` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN',
  `postalCode` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `CustomerAddress_userId_idx` (`userId`),
  CONSTRAINT `CustomerAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CustomerAddress`
--

/*!40000 ALTER TABLE `CustomerAddress` DISABLE KEYS */;
INSERT INTO `CustomerAddress` (`id`, `userId`, `label`, `fullName`, `phone`, `line1`, `line2`, `city`, `state`, `country`, `postalCode`, `isDefault`) VALUES ('cmus4gwdb002g7k9ookhyutfb','cmus4gwda002d7k9o6mkhzgmm','Home','Priya Sharma','9811122233','143 Lake View Lane',NULL,'Bengaluru','Karnataka','IN','468283',1),('cmus4gwdt002k7k9oyac6ohfq','cmus4gwdt002h7k9oi4jryetb','Home','Rahul Gupta','9822233344','152 MG Road',NULL,'Mumbai','Maharashtra','IN','284158',1),('cmus4gwe4002o7k9oejwhqz2w','cmus4gwe4002l7k9os8s52e2y','Home','Sneha Patel','9833344455','129 Lake View Lane',NULL,'Ahmedabad','Gujarat','IN','254813',1),('cmus4gwee002s7k9o71igtycq','cmus4gwed002p7k9ot2pbzw4b','Home','David Thomas','9844455566','111 Lake View Lane',NULL,'Chennai','Tamil Nadu','IN','164756',1),('cmus4gweo002w7k9o4y33zlob','cmus4gweo002t7k9op2gzcjbm','Home','Fatima Khan','9855566677','12 Park Street',NULL,'Hyderabad','Telangana','IN','215181',1),('cmus4gwex00307k9ox1iggk70','cmus4gwex002x7k9oiu07kd0w','Home','Karan Malhotra','9866677788','188 Park Street',NULL,'New Delhi','Delhi','IN','129404',1);
/*!40000 ALTER TABLE `CustomerAddress` ENABLE KEYS */;

--
-- Table structure for table `CustomerProfile`
--

DROP TABLE IF EXISTS `CustomerProfile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CustomerProfile` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateOfBirth` datetime(3) DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CustomerProfile_userId_key` (`userId`),
  CONSTRAINT `CustomerProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CustomerProfile`
--

/*!40000 ALTER TABLE `CustomerProfile` DISABLE KEYS */;
INSERT INTO `CustomerProfile` (`id`, `userId`, `dateOfBirth`, `preferences`) VALUES ('cmus3hxns00027km8yylxi889','cmus3hxni00017km8borr3wyw',NULL,NULL),('cmus4gwda002e7k9oflg5unkz','cmus4gwda002d7k9o6mkhzgmm',NULL,NULL),('cmus4gwdt002i7k9oxxr13a0c','cmus4gwdt002h7k9oi4jryetb',NULL,NULL),('cmus4gwe4002m7k9okl7yry6y','cmus4gwe4002l7k9os8s52e2y',NULL,NULL),('cmus4gwed002q7k9ogkqbvlc3','cmus4gwed002p7k9ot2pbzw4b',NULL,NULL),('cmus4gweo002u7k9obhjacvz6','cmus4gweo002t7k9op2gzcjbm',NULL,NULL),('cmus4gwex002y7k9orksczztc','cmus4gwex002x7k9oiu07kd0w',NULL,NULL),('cmus4gwzb00327k9o0ycl0klu','cmus4gwzb00317k9oa3ttabyd',NULL,NULL),('cmus4h1iv00537k9o0sk2doi4','cmus4h1iv00527k9ojjjarwip',NULL,NULL),('cmus4h652006t7k9o9hgbhkb1','cmus4h652006s7k9oja5jhlje',NULL,NULL),('cmus4h9jq008l7k9o9biynphl','cmus4h9jq008k7k9o8nyp4k95',NULL,NULL),('cmus4hdoo00ab7k9oa8xnwmvo','cmus4hdoo00aa7k9o06tq6x27',NULL,NULL),('cmus4hhxt00c17k9olspu9cn0','cmus4hhxt00c07k9obd1cpsxz',NULL,NULL),('cmus4hr3d00dr7k9ofwavsw0c','cmus4hr3d00dq7k9ojf1e19dk',NULL,NULL),('cmus4hvaf00fh7k9oaw9s5h24','cmus4hvaf00fg7k9o56ax8t3n',NULL,NULL),('cmus4hxuj00gv7k9o896l5fdz','cmus4hxuj00gu7k9o9zblhchi',NULL,NULL),('cmus4i12900ib7k9oc413z7aa','cmus4i12900ia7k9ohvw78scc',NULL,NULL),('cmus4ibhq00jp7k9o1dm3owux','cmus4ibhq00jo7k9ow91upb79',NULL,NULL),('cmus5zslf005q7ky081k4l2kk','cmus5zslf005p7ky0dyh0xhr5',NULL,NULL);
/*!40000 ALTER TABLE `CustomerProfile` ENABLE KEYS */;

--
-- Table structure for table `DownloadAccess`
--

DROP TABLE IF EXISTS `DownloadAccess`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DownloadAccess` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderItemId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storageKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `maxDownloads` int NOT NULL DEFAULT '5',
  `downloadCount` int NOT NULL DEFAULT '0',
  `expiresAt` datetime(3) DEFAULT NULL,
  `revokedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DownloadAccess_userId_idx` (`userId`),
  KEY `DownloadAccess_orderItemId_fkey` (`orderItemId`),
  KEY `DownloadAccess_artworkId_fkey` (`artworkId`),
  CONSTRAINT `DownloadAccess_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DownloadAccess_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DownloadAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DownloadAccess`
--

/*!40000 ALTER TABLE `DownloadAccess` DISABLE KEYS */;
INSERT INTO `DownloadAccess` (`id`, `orderItemId`, `userId`, `artworkId`, `storageKey`, `maxDownloads`, `downloadCount`, `expiresAt`, `revokedAt`, `createdAt`) VALUES ('cmus4icqk00le7k9ov2cw3grd','cmus4icpr00l87k9ozv643xud','cmus4gwdt002h7k9oi4jryetb','cmus4hqht00dh7k9onmak8cwl','digital-art/1791022236609-oEhbTIAbah3P.jpg',5,0,'2026-11-02 08:21:47.892',NULL,'2026-10-03 08:21:47.900'),('cmus4icxf00mo7k9o61rvrn7i','cmus4icwi00mi7k9oinv3rkr1','cmus4gweo002t7k9op2gzcjbm','cmus4huql00f77k9ozf307cff','digital-art/1791022238262-SWRAo2zELG6e.jpg',5,0,'2026-11-02 08:21:48.139',NULL,'2026-10-03 08:21:48.147'),('cmus4icz500n27k9o3gsmypq6','cmus4icyb00mw7k9oucd8ca4d','cmus4gwex002x7k9oiu07kd0w','cmus4hd2j00a17k9o1jyc3uhf','digital-art/1791022237270-QG0gKwe-X9ty.jpg',5,0,'2026-11-02 08:21:48.201',NULL,'2026-10-03 08:21:48.209'),('cmus4id2e00nm7k9onu0ihf11','cmus4id1f00ng7k9od54w1wys','cmus4gwdt002h7k9oi4jryetb','cmus4h0ca004k7k9o4ce280xx','digital-art/1791022238816-H9N4jq8PNDxd.jpg',5,0,'2026-11-02 08:21:48.318',NULL,'2026-10-03 08:21:48.326'),('cmus4id8600os7k9offlpcdcq','cmus4id7d00om7k9o930jn7r3','cmus4gweo002t7k9op2gzcjbm','cmus4hqht00dh7k9onmak8cwl','digital-art/1791022236609-oEhbTIAbah3P.jpg',5,0,'2026-11-02 08:21:48.526',NULL,'2026-10-03 08:21:48.534'),('cmus4idc000pi7k9octtwd2rr','cmus4idb900pc7k9ojqkieqdy','cmus4gwex002x7k9oiu07kd0w','cmus4hhfw00br7k9o93y4lbtf','digital-art/1791022236901-Soq8M4-fBED6.jpg',5,0,'2026-11-02 08:21:48.664',NULL,'2026-10-03 08:21:48.673'),('cmus4idfn00q87k9ow28xqial','cmus4ider00q27k9oy04xhz1o','cmus4gwe4002l7k9os8s52e2y','cmus4h8z0008b7k9oc0magitx','digital-art/1791022237787-cDKxJAVtfh9n.jpg',5,0,'2026-11-02 08:21:48.795',NULL,'2026-10-03 08:21:48.804'),('cmus4idhc00qk7k9ohz9lorx4','cmus4idgg00qe7k9o1wx5eh32','cmus4gwed002p7k9ot2pbzw4b','cmus4hqht00dh7k9onmak8cwl','digital-art/1791022236609-oEhbTIAbah3P.jpg',5,0,'2026-11-02 08:21:48.856',NULL,'2026-10-03 08:21:48.864'),('cmus4idjt00qy7k9o9syhc353','cmus4idj000qs7k9oab00uesn','cmus4gwed002p7k9ot2pbzw4b','cmus4hd2j00a17k9o1jyc3uhf','digital-art/1791022237270-QG0gKwe-X9ty.jpg',5,0,'2026-11-02 08:21:48.946',NULL,'2026-10-03 08:21:48.954'),('cmus4idor00ro7k9oxsrbdtfm','cmus4idnh00ri7k9ov8g4oyrz','cmus4gwex002x7k9oiu07kd0w','cmus4hhfw00br7k9o93y4lbtf','digital-art/1791022236901-Soq8M4-fBED6.jpg',5,0,'2026-11-02 08:21:49.123',NULL,'2026-10-03 08:21:49.131'),('cmus4idqc00s07k9ojl7ixn14','cmus4idpg00ru7k9ou2h5uhu5','cmus4gwdt002h7k9oi4jryetb','cmus4hqht00dh7k9onmak8cwl','digital-art/1791022236609-oEhbTIAbah3P.jpg',5,0,'2026-11-02 08:21:49.180',NULL,'2026-10-03 08:21:49.188'),('cmus4idri00s87k9ou6mxh6sb','cmus4idqj00s27k9o8ilry4cb','cmus4gwdt002h7k9oi4jryetb','cmus4h8z0008b7k9oc0magitx','digital-art/1791022237787-cDKxJAVtfh9n.jpg',5,0,'2026-11-02 08:21:49.222',NULL,'2026-10-03 08:21:49.230'),('cmus4idy700tg7k9oaer0fn4r','cmus4idxc00ta7k9olaa3xnz0','cmus4gwda002d7k9o6mkhzgmm','cmus4h0ca004k7k9o4ce280xx','digital-art/1791022238816-H9N4jq8PNDxd.jpg',5,2,'2026-11-02 08:21:49.463',NULL,'2026-10-03 08:21:49.472'),('cmus4im7800ze7k9orvv60eg4','cmus4im2b00z67k9o4g02mfhq','cmus4gwe4002l7k9os8s52e2y',NULL,'custom-art/final/1791022259549-Fl-MbfelX9zu.jpg',5,0,'2026-11-02 08:22:00.156',NULL,'2026-10-03 08:22:00.164');
/*!40000 ALTER TABLE `DownloadAccess` ENABLE KEYS */;

--
-- Table structure for table `DownloadLog`
--

DROP TABLE IF EXISTS `DownloadLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DownloadLog` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `downloadAccessId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ipAddress` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DownloadLog_downloadAccessId_fkey` (`downloadAccessId`),
  CONSTRAINT `DownloadLog_downloadAccessId_fkey` FOREIGN KEY (`downloadAccessId`) REFERENCES `DownloadAccess` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DownloadLog`
--

/*!40000 ALTER TABLE `DownloadLog` DISABLE KEYS */;
/*!40000 ALTER TABLE `DownloadLog` ENABLE KEYS */;

--
-- Table structure for table `FeaturedArtist`
--

DROP TABLE IF EXISTS `FeaturedArtist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FeaturedArtist` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `placement` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOME',
  `sortOrder` int NOT NULL DEFAULT '0',
  `startsAt` datetime(3) DEFAULT NULL,
  `endsAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `FeaturedArtist_artistId_placement_key` (`artistId`,`placement`),
  CONSTRAINT `FeaturedArtist_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FeaturedArtist`
--

/*!40000 ALTER TABLE `FeaturedArtist` DISABLE KEYS */;
INSERT INTO `FeaturedArtist` (`id`, `artistId`, `placement`, `sortOrder`, `startsAt`, `endsAt`) VALUES ('cmus4gx04003c7k9or7x2xje3','cmus4gwzb00347k9o7jpqfl1i','HOME',0,NULL,NULL),('cmus4h1j9005d7k9o7gdkccvx','cmus4h1iv00557k9oobpdcfx0','HOME',1,NULL,NULL),('cmus4h65g00737k9o7rr2mmdh','cmus4h652006v7k9od0w60tg6','HOME',2,NULL,NULL),('cmus4h9k6008v7k9o4sgxbhwi','cmus4h9jq008n7k9okcz2sm88','HOME',3,NULL,NULL),('cmus4hhyf00cb7k9oi4nwed8l','cmus4hhxu00c37k9ofrmv5glr','HOME',5,NULL,NULL);
/*!40000 ALTER TABLE `FeaturedArtist` ENABLE KEYS */;

--
-- Table structure for table `FeaturedArtwork`
--

DROP TABLE IF EXISTS `FeaturedArtwork`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FeaturedArtwork` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `placement` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOME',
  `sortOrder` int NOT NULL DEFAULT '0',
  `startsAt` datetime(3) DEFAULT NULL,
  `endsAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `FeaturedArtwork_artworkId_placement_key` (`artworkId`,`placement`),
  CONSTRAINT `FeaturedArtwork_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FeaturedArtwork`
--

/*!40000 ALTER TABLE `FeaturedArtwork` DISABLE KEYS */;
INSERT INTO `FeaturedArtwork` (`id`, `artworkId`, `placement`, `sortOrder`, `startsAt`, `endsAt`) VALUES ('cmus4gxry003o7k9oinu3fe6e','cmus4gxra003e7k9o5dwrm7cw','HOME',1,NULL,NULL),('cmus4h2ey005p7k9ogesgexqd','cmus4h2ee005f7k9ozvv0cna3','HOME',7,NULL,NULL),('cmus4h6ld007f7k9oyjb1qm88','cmus4h6kx00757k9oaoiipq1v','HOME',12,NULL,NULL),('cmus4h7qe00807k9oziapw6w5','cmus4h7pz007q7k9odjfgw811','HOME',14,NULL,NULL),('cmus4ha9800977k9omwiau4fm','cmus4ha8s008x7k9o1e8wgcdj','HOME',17,NULL,NULL),('cmus4hee600av7k9omuf7bva1','cmus4heds00al7k9oktw2hgjb','HOME',22,NULL,NULL),('cmus4hfww00bg7k9o5trknpf1','cmus4hfwi00b67k9oy06oc8ue','HOME',24,NULL,NULL),('cmus4hil700cn7k9oaqdrp0df','cmus4hikt00cd7k9oq5by8244','HOME',27,NULL,NULL),('cmus4hrsi00eb7k9okuxkx0ki','cmus4hrs300e17k9o033rw8s3','HOME',32,NULL,NULL),('cmus4ht7i00ew7k9o8cyvaqxp','cmus4ht7100em7k9owzjmcmpd','HOME',34,NULL,NULL),('cmus4hw0x00g17k9oqr91uv32','cmus4hw0j00fr7k9onehfa6uz','HOME',37,NULL,NULL),('cmus4hydd00hf7k9oagxpczac','cmus4hycx00h57k9oyyywk1fa','HOME',41,NULL,NULL),('cmus4hzlu00i07k9oswpdk579','cmus4hzlh00hq7k9oarrzp2md','HOME',43,NULL,NULL),('cmus4i1sm00iv7k9o3q0bh51i','cmus4i1s700il7k9owwmu9gq9','HOME',45,NULL,NULL),('cmusexw3q000x7kzgnldu5pg6','cmus4gzn3004b7k9o5ut5d75u','HOME',0,NULL,NULL),('cmusexyrc00157kzgaf2rvpbf','cmus64hbg006l7ky0abc3cdq2','HOME',0,NULL,NULL);
/*!40000 ALTER TABLE `FeaturedArtwork` ENABLE KEYS */;

--
-- Table structure for table `Gallery`
--

DROP TABLE IF EXISTS `Gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Gallery` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagline` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `coverImageUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Gallery_artistId_key` (`artistId`),
  UNIQUE KEY `Gallery_slug_key` (`slug`),
  CONSTRAINT `Gallery_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Gallery`
--

/*!40000 ALTER TABLE `Gallery` DISABLE KEYS */;
INSERT INTO `Gallery` (`id`, `artistId`, `name`, `slug`, `tagline`, `description`, `coverImageUrl`, `isFeatured`, `createdAt`, `updatedAt`) VALUES ('cmus4gwzb003a7k9o9wkkt3ho','cmus4gwzb00347k9o7jpqfl1i','Meera Iyer Studio','meera-iyer-studio-gallery','Watercolour portraits and temple-town landscapes rooted in South Indian tradition.','I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn.','https://mymoonsgallery.com/media/artworks/1791022183675-NywmrEMKjX_v.webp',1,'2026-10-03 08:20:40.823','2026-10-03 10:10:34.737'),('cmus4h1iv005b7k9oda1iga9x','cmus4h1iv00557k9oobpdcfx0','Kapoor Contemporary','kapoor-contemporary-gallery','A Mumbai gallery championing bold abstract expressionism.','Colour is a language before it is a picture.','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0.webp',1,'2026-10-03 08:20:46.711','2026-10-03 10:10:34.801'),('cmus4h65200717k9o7s0fm3n6','cmus4h652006v7k9od0w60tg6','Lena Fischer','lena-fischer-gallery','Minimalist compositions inspired by architecture and botany.','I look for calm — a single arch, a single leaf, enough space to breathe.','https://mymoonsgallery.com/media/artworks/1791022164064-7SiEu8wXqmg0.webp',1,'2026-10-03 08:20:52.694','2026-10-03 10:10:34.866'),('cmus4h9jr008t7k9of4c8h58n','cmus4h9jq008n7k9okcz2sm88','Kavya Nair Art','kavya-nair-art-gallery','Digital and acrylic portraits bursting with colour and emotion.','Every face holds a garden of colours — I just let them bloom.','https://mymoonsgallery.com/media/artworks/1791022129216-aYbTttzaH0r6.webp',1,'2026-10-03 08:20:57.111','2026-10-03 10:10:34.928'),('cmus4hdop00aj7k9o21at5dtn','cmus4hdoo00ad7k9okljt2ll3','Das Ink Works','das-ink-works-gallery','Charcoal and ink studies of old Kolkata — lanes, trams and ghats.','Charcoal remembers the hand; the city remembers everything else.','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv.webp',0,'2026-10-03 08:21:02.473','2026-10-03 10:10:34.983'),('cmus4hhxu00c97k9oms1xf28e','cmus4hhxu00c37k9ofrmv5glr','Atelier Sofia','atelier-sofia-gallery','Atmospheric oil landscapes of coasts, forests and luminous skies.','Light changes everything — I chase it across the horizon.','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU.webp',1,'2026-10-03 08:21:07.986','2026-10-03 10:10:35.024'),('cmus4hr3d00dz7k9o44fupuw5','cmus4hr3d00dt7k9o6wgfdg7o','Rathore Heritage Gallery','rathore-heritage-gallery-gallery','Heritage mandalas, Pichwai and folk traditions from Rajasthan.','We keep centuries-old geometry alive, one petal at a time.','https://mymoonsgallery.com/media/artworks/1791022128053-HyEktoYMnCRr.webp',0,'2026-10-03 08:21:19.849','2026-10-03 10:10:35.065'),('cmus4hvag00fp7k9oj0ggo931','cmus4hvaf00fj7k9omlgiu1hu','Aiko Tanaka','aiko-tanaka-gallery','Anime-inspired portraits and playful pop illustrations.','Joy is a valid artistic statement.','https://mymoonsgallery.com/media/artworks/1791022130175-VEZo_jNRP25u.webp',0,'2026-10-03 08:21:25.287','2026-10-03 10:10:35.118'),('cmus4hxuk00h37k9ot56u4a5g','cmus4hxuj00gx7k9omkclsld2','Pixel & Pigment','pixel-pigment-gallery','A creative studio mixing pop culture, Bollywood and street art.','Art should be loud enough to start a conversation.','https://mymoonsgallery.com/media/artworks/1791022141751-C4Hs2RBOf7mC.webp',0,'2026-10-03 08:21:28.603','2026-10-03 10:10:35.180'),('cmus4i12900ij7k9oemv9i668','cmus4i12900id7k9oc65g1ku8','Ananya Sen Fine Art','ananya-sen-fine-art-gallery','Contemporary acrylics exploring memory, roots and belonging.','The tree is my self-portrait: rooted, reaching, changing with seasons.','https://mymoonsgallery.com/media/artworks/1791022155529-hgfUZjBXC2AC.webp',0,'2026-10-03 08:21:32.769','2026-10-03 10:10:35.235'),('cmus4ibhr00jw7k9oiepnxd6a','cmus4ibhr00jr7k9oh68g6fvx','Mehta Murals','mehta-murals-gallery','Mural studio awaiting approval.','Walls are canvases for communities.','https://mymoonsgallery.com/media/galleries/1791015705676-1104.webp',0,'2026-10-03 08:21:46.287','2026-10-03 08:21:46.287'),('cmus5zslh005w7ky0o5i73pbp','cmus5zslg005s7ky0dymbgs16','test','test-p6tu84',NULL,NULL,'https://mymoonsgallery.com/media/artworks/1791022203383-NgQgMgpeedNt.webp',0,'2026-10-03 09:03:21.219','2026-10-03 10:10:35.302');
/*!40000 ALTER TABLE `Gallery` ENABLE KEYS */;

--
-- Table structure for table `GalleryCollection`
--

DROP TABLE IF EXISTS `GalleryCollection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `GalleryCollection` (
  `galleryId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `collectionId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`galleryId`,`collectionId`),
  KEY `GalleryCollection_collectionId_fkey` (`collectionId`),
  CONSTRAINT `GalleryCollection_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `ArtworkCollection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `GalleryCollection_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GalleryCollection`
--

/*!40000 ALTER TABLE `GalleryCollection` DISABLE KEYS */;
INSERT INTO `GalleryCollection` (`galleryId`, `collectionId`, `sortOrder`) VALUES ('cmus4h1iv005b7k9oda1iga9x','cmus4ic5g00k67k9otm7omph6',0),('cmus4h65200717k9o7s0fm3n6','cmus4ic6g00kc7k9owgd89uuq',0),('cmus4h9jr008t7k9of4c8h58n','cmus4ic6200ka7k9o5f45kvz2',0);
/*!40000 ALTER TABLE `GalleryCollection` ENABLE KEYS */;

--
-- Table structure for table `GalleryImage`
--

DROP TABLE IF EXISTS `GalleryImage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `GalleryImage` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `galleryId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `storageKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `GalleryImage_galleryId_idx` (`galleryId`),
  CONSTRAINT `GalleryImage_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GalleryImage`
--

/*!40000 ALTER TABLE `GalleryImage` DISABLE KEYS */;
/*!40000 ALTER TABLE `GalleryImage` ENABLE KEYS */;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `readAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notification_userId_readAt_idx` (`userId`,`readAt`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
INSERT INTO `Notification` (`id`, `userId`, `type`, `title`, `body`, `link`, `readAt`, `createdAt`) VALUES ('cmus4iwsp00zs7k9o61jff07d','cmus4gwda002d7k9o6mkhzgmm','WELCOME','Welcome to Art Gallery','Explore original art or create your own from a photo.','/create-your-art',NULL,'2026-10-03 08:22:13.898'),('cmus4iwsp00zt7k9o9tv1bsv0','cmus4gwzb00317k9oa3ttabyd','NEW_ORDER','New order received','A collector ordered 2 prints of your artwork.','/seller/orders',NULL,'2026-10-03 08:22:13.898'),('cmus4iwsp00zu7k9oq8c53vxf','cmus4gwzb00317k9oa3ttabyd','CUSTOM_ART_NEW','New custom art request','Priya Sharma requested a watercolor painting.','/seller/custom-art',NULL,'2026-10-03 08:22:13.898'),('cmus4iwsp00zv7k9oj7see96j','cmus4gw91002c7k9ozx8w96po','ARTIST_PENDING','New artist awaiting approval','Mehta Murals registered as an artist.','/admin/artists','2026-10-03 09:00:29.015','2026-10-03 08:22:13.898'),('cmus5e59a000j7ky0fkgj0m6l','cmus4gwzb00317k9oa3ttabyd','CUSTOM_ART_NEW','New custom art request','Priya Sharma requested a Realistic artwork.','/seller/custom-art/cmus5e58s000f7ky0fw7ereug',NULL,'2026-10-03 08:46:31.199'),('cmus5ecwi001h7ky0kkke8rst','cmus4h1iv00527k9ojjjarwip','NEW_ORDER','New order received','Order AG-ARXM3FPW includes your artwork.','/seller/orders',NULL,'2026-10-03 08:46:41.106'),('cmus5ecwm001j7ky0x72y81n9','cmus4gwda002d7k9o6mkhzgmm','ORDER_PLACED','Order placed','Your order AG-ARXM3FPW has been placed.','/account/orders/cmus5ecvi00177ky0priem7yw',NULL,'2026-10-03 08:46:41.110'),('cmus5ep30001z7ky0zm0djmdb','cmus4gwzb00317k9oa3ttabyd','CUSTOM_ART_NEW','New custom art request','Priya Sharma requested a Realistic artwork.','/seller/custom-art/cmus5ep2e001v7ky0qc06hna0',NULL,'2026-10-03 08:46:56.893'),('cmus5eq9c00277ky0ydf63lje','cmus4gwda002d7k9o6mkhzgmm','CUSTOM_ART_UPDATE','Request CA-KVCSJ2WL: accepted','Lovely photo!','/custom-art/requests/cmus5ep2e001v7ky0qc06hna0',NULL,'2026-10-03 08:46:58.416'),('cmus5eqbm002b7ky0ldpuhfkw','cmus4gwda002d7k9o6mkhzgmm','CUSTOM_ART_UPDATE','Request CA-KVCSJ2WL: in progress','Work in progress','/custom-art/requests/cmus5ep2e001v7ky0qc06hna0',NULL,'2026-10-03 08:46:58.499'),('cmus5eqfp002g7ky040njspad','cmus4gwda002d7k9o6mkhzgmm','CUSTOM_ART_UPDATE','Request CA-KVCSJ2WL: preview ready','First pass','/custom-art/requests/cmus5ep2e001v7ky0qc06hna0',NULL,'2026-10-03 08:46:58.645'),('cmus5erzx002q7ky07gn6rcq0','cmus4gwzb00317k9oa3ttabyd','CUSTOM_ART_UPDATE','Request CA-KVCSJ2WL: revision requested','Please make the sky a little brighter.','/custom-art/requests/cmus5ep2e001v7ky0qc06hna0',NULL,'2026-10-03 08:47:00.670'),('cmus5es4e002v7ky070tybw17','cmus4gwda002d7k9o6mkhzgmm','CUSTOM_ART_UPDATE','Request CA-KVCSJ2WL: preview ready','First pass','/custom-art/requests/cmus5ep2e001v7ky0qc06hna0',NULL,'2026-10-03 08:47:00.831'),('cmus5esjv00337ky0boyma3r4','cmus4gwzb00317k9oa3ttabyd','CUSTOM_ART_UPDATE','Request CA-KVCSJ2WL: customer approved','Customer approved the preview','/custom-art/requests/cmus5ep2e001v7ky0qc06hna0',NULL,'2026-10-03 08:47:01.388'),('cmus5ex2b004b7ky06ivsegeu','cmus4gwzb00317k9oa3ttabyd','NEW_ORDER','New order received','Order AG-TVM9MWUF includes your artwork.','/seller/orders',NULL,'2026-10-03 08:47:07.235'),('cmus5ex54004d7ky0qa8qqpiu','cmus4h1iv00527k9ojjjarwip','NEW_ORDER','New order received','Order AG-TVM9MWUF includes your artwork.','/seller/orders',NULL,'2026-10-03 08:47:07.337'),('cmus5ex58004f7ky0kic8u3c6','cmus4gwda002d7k9o6mkhzgmm','ORDER_PLACED','Order placed','Your order AG-TVM9MWUF has been placed.','/account/orders/cmus5ewpd003v7ky0q2eeiast',NULL,'2026-10-03 08:47:07.341'),('cmus5xmjf005g7ky0h768ujw3','cmus4h1iv00527k9ojjjarwip','NEW_ORDER','New order received','Order AG-X5VYDV5D includes your artwork.','/seller/orders',NULL,'2026-10-03 09:01:40.060'),('cmus5xmjm005i7ky0dacy10lz','cmus4gw91002c7k9ozx8w96po','ORDER_PLACED','Order placed','Your order AG-X5VYDV5D has been placed.','/account/orders/cmus5xmgy00557ky0muhillg3',NULL,'2026-10-03 09:01:40.066'),('cmus5zsp6005z7ky026zk702g','cmus4gw91002c7k9ozx8w96po','ARTIST_PENDING','New artist awaiting approval','test registered as an artist.','/admin/artists',NULL,'2026-10-03 09:03:21.355'),('cmus61qsv006b7ky0pe2hlp5q','cmus5zslf005p7ky0dyh0xhr5','ARTIST_STATUS','Artist account approved','Your artist account has been approved. You can now publish artwork!','/seller','2026-10-03 09:07:53.960','2026-10-03 09:04:52.208'),('cmus64r9c006w7ky08yj2ybop','cmus4gw91002c7k9ozx8w96po','ARTWORK_PENDING','Artwork awaiting review','\"test\" was submitted for review.','/admin/artworks',NULL,'2026-10-03 09:07:12.768'),('cmus66xwr007a7ky0j586d0ku','cmus5zslf005p7ky0dyh0xhr5','ARTWORK_MODERATED','\"test\" approved',NULL,'/seller/artworks','2026-10-03 10:14:04.734','2026-10-03 09:08:54.700'),('cmusbo1uy001j7kg8vpe40bse','cmus5zslf005p7ky0dyh0xhr5','NEW_FOLLOWER','You have a new follower','Priya Sharma started following you.',NULL,NULL,'2026-10-03 11:42:11.050'),('cmusexqz1000l7kzgdmajhqde','cmus5zslf005p7ky0dyh0xhr5','ARTWORK_FEATURED','\"test\" is now featured','Your artwork is featured on the homepage.','/artworks/test-rr47bt',NULL,'2026-10-03 13:13:42.349'),('cmusexs27000r7kzglblgxcus','cmus4gwzb00317k9oa3ttabyd','ARTWORK_FEATURED','\"Misty Nilgiris\" is now featured','Your artwork is featured on the homepage.','/artworks/misty-nilgiris-x9c56r',NULL,'2026-10-03 13:13:43.759'),('cmusexw3x000z7kzghbhaqule','cmus4gwzb00317k9oa3ttabyd','ARTWORK_FEATURED','\"The Dreamer\" is now featured','Your artwork is featured on the homepage.','/artworks/the-dreamer-2fpmpf',NULL,'2026-10-03 13:13:49.005'),('cmusexyrl00177kzg99kxbrdv','cmus5zslf005p7ky0dyh0xhr5','ARTWORK_FEATURED','\"test\" is now featured','Your artwork is featured on the homepage.','/artworks/test-rr47bt',NULL,'2026-10-03 13:13:52.450'),('cmusezaap001p7kzg1gwudxsy','cmus4gwzb00317k9oa3ttabyd','ARTWORK_MODERATED','\"Navaratri Mandala\" approved',NULL,'/seller/artworks',NULL,'2026-10-03 13:14:54.049'),('cmusezab1001q7kzgdxzuk0dn','cmus4gwda002d7k9o6mkhzgmm','NEW_ARTWORK','New artwork by Meera Iyer Studio','Navaratri Mandala','/artworks/navaratri-mandala-8faa2z',NULL,'2026-10-03 13:14:54.061'),('cmusezab1001r7kzgue9tueod','cmus4gwdt002h7k9oi4jryetb','NEW_ARTWORK','New artwork by Meera Iyer Studio','Navaratri Mandala','/artworks/navaratri-mandala-8faa2z',NULL,'2026-10-03 13:14:54.061'),('cmusezab1001s7kzgj8s8t6p2','cmus4gwe4002l7k9os8s52e2y','NEW_ARTWORK','New artwork by Meera Iyer Studio','Navaratri Mandala','/artworks/navaratri-mandala-8faa2z',NULL,'2026-10-03 13:14:54.061'),('cmusezab1001t7kzgkskfy6ii','cmus4gwed002p7k9ot2pbzw4b','NEW_ARTWORK','New artwork by Meera Iyer Studio','Navaratri Mandala','/artworks/navaratri-mandala-8faa2z',NULL,'2026-10-03 13:14:54.061'),('cmusezab1001u7kzgo4sad4z2','cmus4gweo002t7k9op2gzcjbm','NEW_ARTWORK','New artwork by Meera Iyer Studio','Navaratri Mandala','/artworks/navaratri-mandala-8faa2z',NULL,'2026-10-03 13:14:54.061'),('cmusezab1001v7kzgqre838ap','cmus4gwex002x7k9oiu07kd0w','NEW_ARTWORK','New artwork by Meera Iyer Studio','Navaratri Mandala','/artworks/navaratri-mandala-8faa2z',NULL,'2026-10-03 13:14:54.061'),('cmusf2tw6002z7kzg6zelj1kp','cmus4ibhq00jo7k9ow91upb79','ARTIST_STATUS','Artist account approved','Your artist account has been approved. You can now publish artwork!','/seller',NULL,'2026-10-03 13:17:39.414');
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;

--
-- Table structure for table `NotificationTemplate`
--

DROP TABLE IF EXISTS `NotificationTemplate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NotificationTemplate` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_APP',
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `NotificationTemplate_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `NotificationTemplate`
--

/*!40000 ALTER TABLE `NotificationTemplate` DISABLE KEYS */;
/*!40000 ALTER TABLE `NotificationTemplate` ENABLE KEYS */;

--
-- Table structure for table `Order`
--

DROP TABLE IF EXISTS `Order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Order` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderNumber` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','CONFIRMED','PROCESSING','PARTIALLY_FULFILLED','FULFILLED','COMPLETED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paymentStatus` enum('PENDING','AWAITING_CONFIRMATION','PAID','FAILED','REFUNDED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paymentMethod` enum('COD','MANUAL','RAZORPAY','STRIPE','PAYU') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `shippingFee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discountTotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `currency` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `shippingAddress` json DEFAULT NULL,
  `notes` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `placedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_orderNumber_key` (`orderNumber`),
  KEY `Order_customerId_placedAt_idx` (`customerId`,`placedAt`),
  KEY `Order_status_idx` (`status`),
  CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Order`
--

/*!40000 ALTER TABLE `Order` DISABLE KEYS */;
INSERT INTO `Order` (`id`, `orderNumber`, `customerId`, `status`, `paymentStatus`, `paymentMethod`, `subtotal`, `shippingFee`, `discountTotal`, `total`, `currency`, `shippingAddress`, `notes`, `placedAt`, `updatedAt`) VALUES ('cmus4icn600ku7k9o0kr7qp8v','AG-SSWXY4YH','cmus4gwdt002h7k9oi4jryetb','COMPLETED','PAID','MANUAL',25300.00,0.00,0.00,25300.00,'INR','{\"city\": \"Mumbai\", \"line1\": \"152 MG Road\", \"phone\": \"9822233344\", \"state\": \"Maharashtra\", \"country\": \"IN\", \"fullName\": \"Rahul Gupta\", \"postalCode\": \"284158\"}',NULL,'2026-09-05 19:21:47.770','2026-10-03 08:21:47.779'),('cmus4icre00lm7k9o27m60wmw','AG-VPPAEACU','cmus4gwe4002l7k9os8s52e2y','FULFILLED','PAID','MANUAL',2500.00,0.00,0.00,2500.00,'INR','{\"city\": \"Ahmedabad\", \"line1\": \"129 Lake View Lane\", \"phone\": \"9833344455\", \"state\": \"Gujarat\", \"country\": \"IN\", \"fullName\": \"Sneha Patel\", \"postalCode\": \"254813\"}',NULL,'2026-08-09 23:21:47.922','2026-10-03 08:21:47.931'),('cmus4ict300ly7k9o42c7jhxj','AG-SCTE6CFA','cmus4gwed002p7k9ot2pbzw4b','COMPLETED','PAID','COD',4900.00,0.00,0.00,4900.00,'INR','{\"city\": \"Chennai\", \"line1\": \"111 Lake View Lane\", \"phone\": \"9844455566\", \"state\": \"Tamil Nadu\", \"country\": \"IN\", \"fullName\": \"David Thomas\", \"postalCode\": \"164756\"}',NULL,'2026-07-14 18:21:47.983','2026-10-03 08:21:47.991'),('cmus4icv300ma7k9omj7y6ap8','AG-2EB5FYFJ','cmus4gweo002t7k9op2gzcjbm','FULFILLED','PAID','MANUAL',4300.00,0.00,0.00,4300.00,'INR','{\"city\": \"Hyderabad\", \"line1\": \"12 Park Street\", \"phone\": \"9855566677\", \"state\": \"Telangana\", \"country\": \"IN\", \"fullName\": \"Fatima Khan\", \"postalCode\": \"215181\"}',NULL,'2026-07-27 06:21:48.055','2026-10-03 08:21:48.064'),('cmus4icy300mu7k9ozi81klgp','AG-L9W8H23Y','cmus4gwex002x7k9oiu07kd0w','COMPLETED','PAID','MANUAL',89600.00,0.00,0.00,89600.00,'INR','{\"city\": \"New Delhi\", \"line1\": \"188 Park Street\", \"phone\": \"9866677788\", \"state\": \"Delhi\", \"country\": \"IN\", \"fullName\": \"Karan Malhotra\", \"postalCode\": \"129404\"}',NULL,'2026-08-08 17:21:48.163','2026-10-03 08:21:48.171'),('cmus4id1600ne7k9opf2v3rkk','AG-595P4Y77','cmus4gwdt002h7k9oi4jryetb','FULFILLED','PAID','MANUAL',2400.00,0.00,0.00,2400.00,'INR',NULL,NULL,'2026-08-09 20:21:48.275','2026-10-03 08:21:48.283'),('cmus4id2s00nq7k9ohn3491wc','AG-RMJYJW3M','cmus4gwe4002l7k9os8s52e2y','PENDING','AWAITING_CONFIRMATION','MANUAL',5300.00,0.00,0.00,5300.00,'INR','{\"city\": \"Ahmedabad\", \"line1\": \"129 Lake View Lane\", \"phone\": \"9833344455\", \"state\": \"Gujarat\", \"country\": \"IN\", \"fullName\": \"Sneha Patel\", \"postalCode\": \"254813\"}',NULL,'2026-07-27 03:21:48.332','2026-10-03 08:21:48.340'),('cmus4id5h00o87k9oytcjkwkm','AG-6YQKNUV7','cmus4gwed002p7k9ot2pbzw4b','FULFILLED','PAID','COD',6000.00,0.00,0.00,6000.00,'INR','{\"city\": \"Chennai\", \"line1\": \"111 Lake View Lane\", \"phone\": \"9844455566\", \"state\": \"Tamil Nadu\", \"country\": \"IN\", \"fullName\": \"David Thomas\", \"postalCode\": \"164756\"}',NULL,'2026-07-22 12:21:48.429','2026-10-03 08:21:48.437'),('cmus4id7500ok7k9oks3nj4w7','AG-J4RJWQTB','cmus4gweo002t7k9op2gzcjbm','COMPLETED','PAID','MANUAL',85300.00,0.00,0.00,85300.00,'INR','{\"city\": \"Hyderabad\", \"line1\": \"12 Park Street\", \"phone\": \"9855566677\", \"state\": \"Telangana\", \"country\": \"IN\", \"fullName\": \"Fatima Khan\", \"postalCode\": \"215181\"}',NULL,'2026-08-19 22:21:48.489','2026-10-03 08:21:48.497'),('cmus4ida400p47k9ooullgcic','AG-GKT8G5VG','cmus4gwex002x7k9oiu07kd0w','FULFILLED','PAID','MANUAL',9300.00,0.00,0.00,9300.00,'INR','{\"city\": \"New Delhi\", \"line1\": \"188 Park Street\", \"phone\": \"9866677788\", \"state\": \"Delhi\", \"country\": \"IN\", \"fullName\": \"Karan Malhotra\", \"postalCode\": \"129404\"}',NULL,'2026-09-26 04:21:48.596','2026-10-03 08:21:48.604'),('cmus4idcl00po7k9ojpbjg59c','AG-BNEELULX','cmus4gwdt002h7k9oi4jryetb','COMPLETED','PAID','COD',2300.00,0.00,0.00,2300.00,'INR','{\"city\": \"Mumbai\", \"line1\": \"152 MG Road\", \"phone\": \"9822233344\", \"state\": \"Maharashtra\", \"country\": \"IN\", \"fullName\": \"Rahul Gupta\", \"postalCode\": \"284158\"}',NULL,'2026-09-18 00:21:48.685','2026-10-03 08:21:48.693'),('cmus4idej00q07k9op56w2yt4','AG-GVFDRVH4','cmus4gwe4002l7k9os8s52e2y','FULFILLED','PAID','MANUAL',2600.00,0.00,0.00,2600.00,'INR',NULL,NULL,'2026-09-22 03:21:48.755','2026-10-03 08:21:48.763'),('cmus4idg800qc7k9ont516gxo','AG-BVSRGSGY','cmus4gwed002p7k9ot2pbzw4b','COMPLETED','PAID','MANUAL',70600.00,0.00,0.00,70600.00,'INR','{\"city\": \"Chennai\", \"line1\": \"111 Lake View Lane\", \"phone\": \"9844455566\", \"state\": \"Tamil Nadu\", \"country\": \"IN\", \"fullName\": \"David Thomas\", \"postalCode\": \"164756\"}',NULL,'2026-08-24 07:21:48.816','2026-10-03 08:21:48.824'),('cmus4idkk00r47k9o5sip5ple','AG-Q8MHXHQW','cmus4gweo002t7k9op2gzcjbm','PENDING','PENDING','COD',4900.00,0.00,0.00,4900.00,'INR','{\"city\": \"Hyderabad\", \"line1\": \"12 Park Street\", \"phone\": \"9855566677\", \"state\": \"Telangana\", \"country\": \"IN\", \"fullName\": \"Fatima Khan\", \"postalCode\": \"215181\"}',NULL,'2026-07-18 02:21:48.972','2026-10-03 08:21:48.980'),('cmus4idmy00rg7k9o1io6zo9g','AG-38E9MC53','cmus4gwex002x7k9oiu07kd0w','COMPLETED','PAID','MANUAL',3600.00,0.00,0.00,3600.00,'INR',NULL,NULL,'2026-08-10 18:21:49.058','2026-10-03 08:21:49.066'),('cmus4idp900rs7k9oy9osapma','AG-2UHY8WJH','cmus4gwdt002h7k9oi4jryetb','FULFILLED','PAID','MANUAL',4600.00,0.00,0.00,4600.00,'INR',NULL,NULL,'2026-09-03 05:21:49.141','2026-10-03 08:21:49.149'),('cmus4ids000sc7k9of9qkoq7o','AG-4EHEX7ZV','cmus4gwda002d7k9o6mkhzgmm','COMPLETED','PAID','MANUAL',99700.00,0.00,0.00,99700.00,'INR','{\"city\": \"Bengaluru\", \"line1\": \"143 Lake View Lane\", \"phone\": \"9811122233\", \"state\": \"Karnataka\", \"country\": \"IN\", \"fullName\": \"Priya Sharma\", \"postalCode\": \"468283\"}',NULL,'2026-09-11 16:21:49.240','2026-10-03 08:21:49.248'),('cmus4idvd00sw7k9of3pg78ir','AG-M3TA8M83','cmus4gwda002d7k9o6mkhzgmm','PENDING','PENDING','COD',11400.00,0.00,0.00,11400.00,'INR','{\"city\": \"Bengaluru\", \"line1\": \"143 Lake View Lane\", \"phone\": \"9811122233\", \"state\": \"Karnataka\", \"country\": \"IN\", \"fullName\": \"Priya Sharma\", \"postalCode\": \"468283\"}',NULL,'2026-10-01 18:21:49.361','2026-10-03 08:21:49.370'),('cmus4idx500t87k9oy2ukfghi','AG-5G3QTVRZ','cmus4gwda002d7k9o6mkhzgmm','CONFIRMED','PAID','MANUAL',2400.00,0.00,0.00,2400.00,'INR',NULL,NULL,'2026-09-26 19:21:49.425','2026-10-03 08:21:49.433'),('cmus4idyn00tk7k9oi0ujf0jr','AG-6JDWKJ5N','cmus4gwe4002l7k9os8s52e2y','PENDING','AWAITING_CONFIRMATION','MANUAL',5700.00,0.00,0.00,5700.00,'INR','{\"city\": \"Ahmedabad\", \"line1\": \"129 Lake View Lane\", \"phone\": \"9833344455\", \"state\": \"Gujarat\", \"country\": \"IN\", \"fullName\": \"Sneha Patel\", \"postalCode\": \"254813\"}',NULL,'2026-10-02 13:21:49.479','2026-10-03 08:21:49.487'),('cmus4im1w00z47k9olwenqc9b','AG-P3TRVXWV','cmus4gwe4002l7k9os8s52e2y','COMPLETED','PAID','MANUAL',3500.00,0.00,0.00,3500.00,'INR',NULL,NULL,'2026-09-24 21:21:59.964','2026-10-03 08:21:59.972'),('cmus5ecvi00177ky0priem7yw','AG-ARXM3FPW','cmus4gwda002d7k9o6mkhzgmm','PENDING','AWAITING_CONFIRMATION','MANUAL',1500.00,0.00,0.00,1500.00,'INR',NULL,NULL,'2026-10-03 08:46:41.070','2026-10-03 08:46:41.097'),('cmus5ewpd003v7ky0q2eeiast','AG-TVM9MWUF','cmus4gwda002d7k9o6mkhzgmm','PENDING','AWAITING_CONFIRMATION','MANUAL',6000.00,0.00,0.00,6000.00,'INR',NULL,NULL,'2026-10-03 08:47:06.769','2026-10-03 08:47:07.036'),('cmus5xmgy00557ky0muhillg3','AG-X5VYDV5D','cmus4gw91002c7k9ozx8w96po','PENDING','PENDING','COD',139000.00,0.00,0.00,139000.00,'INR','{\"city\": \"Manapparai\", \"line1\": \"2/108, v.poosaripatty,manapparai(Tk), Trichy (Dt)\", \"line2\": \"sdf\", \"phone\": \"+918220347695\", \"state\": \"Tamilnadu\", \"country\": \"IN\", \"fullName\": \"SUDHAKAR S\", \"postalCode\": \"621307\"}',NULL,'2026-10-03 09:01:39.971','2026-10-03 09:01:40.041');
/*!40000 ALTER TABLE `Order` ENABLE KEYS */;

--
-- Table structure for table `OrderItem`
--

DROP TABLE IF EXISTS `OrderItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `OrderItem` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customArtRequestId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titleSnapshot` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `imageSnapshot` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `format` enum('ORIGINAL','PRINT','DIGITAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fulfillmentType` enum('PHYSICAL','DIGITAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fulfillmentStatus` enum('PENDING','PROCESSING','PACKED','SHIPPED','DELIVERED','DIGITAL_AVAILABLE','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `unitPrice` decimal(12,2) NOT NULL,
  `quantity` int NOT NULL,
  `lineTotal` decimal(12,2) NOT NULL,
  `commissionRate` decimal(5,2) NOT NULL,
  `commissionAmount` decimal(12,2) NOT NULL,
  `artistAmount` decimal(12,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `OrderItem_artistId_createdAt_idx` (`artistId`,`createdAt`),
  KEY `OrderItem_orderId_idx` (`orderId`),
  KEY `OrderItem_artworkId_fkey` (`artworkId`),
  KEY `OrderItem_customArtRequestId_fkey` (`customArtRequestId`),
  CONSTRAINT `OrderItem_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_customArtRequestId_fkey` FOREIGN KEY (`customArtRequestId`) REFERENCES `CustomArtRequest` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `OrderItem`
--

/*!40000 ALTER TABLE `OrderItem` DISABLE KEYS */;
INSERT INTO `OrderItem` (`id`, `orderId`, `artistId`, `artworkId`, `customArtRequestId`, `titleSnapshot`, `imageSnapshot`, `format`, `fulfillmentType`, `fulfillmentStatus`, `unitPrice`, `quantity`, `lineTotal`, `commissionRate`, `commissionAmount`, `artistAmount`, `createdAt`) VALUES ('cmus4icnh00kw7k9on13uv52a','cmus4icn600ku7k9o0kr7qp8v','cmus4h9jq008n7k9okcz2sm88','cmus4hc8k009s7k9ozp0cb1rf',NULL,'Bloom Within','https://mymoonsgallery.com/media/artworks/1791022177215-u7Xe5pB1xs8w-thumb.webp','PRINT','PHYSICAL','DELIVERED',3300.00,1,3300.00,10.00,330.00,2970.00,'2026-09-05 19:21:47.770'),('cmus4icok00l27k9ohj18w5lo','cmus4icn600ku7k9o0kr7qp8v','cmus4h1iv00557k9oobpdcfx0','cmus4h2ee005f7k9ozvv0cna3',NULL,'Echoes of Monsoon','https://mymoonsgallery.com/media/artworks/1791022200867-qkngns6FL8R1-thumb.webp','ORIGINAL','PHYSICAL','DELIVERED',20000.00,1,20000.00,10.00,2000.00,18000.00,'2026-09-05 19:21:47.770'),('cmus4icpr00l87k9ozv643xud','cmus4icn600ku7k9o0kr7qp8v','cmus4hhxu00c37k9ofrmv5glr','cmus4hqht00dh7k9onmak8cwl',NULL,'Harvest Moon Valley','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',2000.00,1,2000.00,10.00,200.00,1800.00,'2026-09-05 19:21:47.770'),('cmus4icrm00lo7k9o9swtz8pa','cmus4icre00lm7k9o27m60wmw','cmus4hxuj00gx7k9omkclsld2','cmus4i0ei00i27k9olvnvpde4',NULL,'Neon Ragas','https://mymoonsgallery.com/media/artworks/1791022188574-JPsZdrQnd6cW-thumb.webp','PRINT','PHYSICAL','DELIVERED',2500.00,1,2500.00,10.00,250.00,2250.00,'2026-08-09 23:21:47.922'),('cmus4icta00m07k9o2a37u55i','cmus4ict300ly7k9o42c7jhxj','cmus4hdoo00ad7k9okljt2ll3','cmus4hgms00bi7k9ohya2eapy',NULL,'Monsoon Tram','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv-thumb.webp','PRINT','PHYSICAL','DELIVERED',4900.00,1,4900.00,10.00,490.00,4410.00,'2026-07-14 18:21:47.983'),('cmus4icvb00mc7k9ogotlnej7','cmus4icv300ma7k9omj7y6ap8','cmus4hxuj00gx7k9omkclsld2','cmus4i0ei00i27k9olvnvpde4',NULL,'Neon Ragas','https://mymoonsgallery.com/media/artworks/1791022188574-JPsZdrQnd6cW-thumb.webp','PRINT','PHYSICAL','DELIVERED',2500.00,1,2500.00,10.00,250.00,2250.00,'2026-07-27 06:21:48.055'),('cmus4icwi00mi7k9oinv3rkr1','cmus4icv300ma7k9omj7y6ap8','cmus4hr3d00dt7k9o6wgfdg7o','cmus4huql00f77k9ozf307cff',NULL,'Pichwai Lotus','https://mymoonsgallery.com/media/artworks/1791022186819--B2cjP3NIMhH-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',1800.00,1,1800.00,10.00,180.00,1620.00,'2026-07-27 06:21:48.055'),('cmus4icyb00mw7k9oucd8ca4d','cmus4icy300mu7k9ozi81klgp','cmus4h9jq008n7k9okcz2sm88','cmus4hd2j00a17k9o1jyc3uhf',NULL,'Festival Eyes','https://mymoonsgallery.com/media/artworks/1791022151596-rO_9WMRfgLXK-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',1600.00,1,1600.00,10.00,160.00,1440.00,'2026-08-08 17:21:48.163'),('cmus4iczd00n47k9oc0zsa37g','cmus4icy300mu7k9ozi81klgp','cmus4hvaf00fj7k9omlgiu1hu','cmus4hwee00g37k9oy0r428li',NULL,'Chai Pop','https://mymoonsgallery.com/media/artworks/1791022135526-irIwZeJftBKm-thumb.webp','ORIGINAL','PHYSICAL','DELIVERED',88000.00,1,88000.00,10.00,8800.00,79200.00,'2026-08-08 17:21:48.163'),('cmus4id1f00ng7k9od54w1wys','cmus4id1600ne7k9opf2v3rkk','cmus4gwzb00347k9o7jpqfl1i','cmus4h0ca004k7k9o4ce280xx',NULL,'Sun Wheel','https://mymoonsgallery.com/media/artworks/1791022195857-3jQkHK2kRnsn-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',2400.00,1,2400.00,10.00,240.00,2160.00,'2026-08-09 20:21:48.275'),('cmus4id3100ns7k9oda5zdzru','cmus4id2s00nq7k9ohn3491wc','cmus4h1iv00557k9oobpdcfx0','cmus4h4rh006a7k9ooidrg0lf',NULL,'Saffron Pulse','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0-thumb.webp','PRINT','PHYSICAL','PENDING',2700.00,1,2700.00,10.00,270.00,2430.00,'2026-07-27 03:21:48.332'),('cmus4id4800ny7k9ohbxvonyc','cmus4id2s00nq7k9ohn3491wc','cmus4h652006v7k9od0w60tg6','cmus4h8z0008b7k9oc0magitx',NULL,'Terracotta Morning','https://mymoonsgallery.com/media/artworks/1791022179763-jSiHS88dyKgq-thumb.webp','DIGITAL','DIGITAL','PENDING',2600.00,1,2600.00,10.00,260.00,2340.00,'2026-07-27 03:21:48.332'),('cmus4id5n00oa7k9ob4uvhfoh','cmus4id5h00o87k9oytcjkwkm','cmus4hhxu00c37k9ofrmv5glr','cmus4hpzt00d87k9otb2cytkr',NULL,'Roots & Wings','https://mymoonsgallery.com/media/artworks/1791022189220-9z_l-RWdhG7_-thumb.webp','PRINT','PHYSICAL','DELIVERED',6000.00,1,6000.00,10.00,600.00,5400.00,'2026-07-22 12:21:48.429'),('cmus4id7d00om7k9o930jn7r3','cmus4id7500ok7k9oks3nj4w7','cmus4hhxu00c37k9ofrmv5glr','cmus4hqht00dh7k9onmak8cwl',NULL,'Harvest Moon Valley','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',2000.00,1,2000.00,10.00,200.00,1800.00,'2026-08-19 22:21:48.489'),('cmus4id8e00ou7k9olza669em','cmus4id7500ok7k9oks3nj4w7','cmus4hxuj00gx7k9omkclsld2','cmus4hzlh00hq7k9oarrzp2md',NULL,'Comic Crush','https://mymoonsgallery.com/media/artworks/1791022141751-C4Hs2RBOf7mC-thumb.webp','ORIGINAL','PHYSICAL','DELIVERED',83300.00,1,83300.00,10.00,8330.00,74970.00,'2026-08-19 22:21:48.489'),('cmus4idab00p67k9oh8phe5dx','cmus4ida400p47k9ooullgcic','cmus4gwzb00347k9o7jpqfl1i','cmus4gzn3004b7k9o5ut5d75u',NULL,'The Dreamer','https://mymoonsgallery.com/media/artworks/1791022191630-P3gb9Cf9UkrH-thumb.webp','PRINT','PHYSICAL','DELIVERED',5700.00,1,5700.00,10.00,570.00,5130.00,'2026-09-26 04:21:48.596'),('cmus4idb900pc7k9ojqkieqdy','cmus4ida400p47k9ooullgcic','cmus4hdoo00ad7k9okljt2ll3','cmus4hhfw00br7k9o93y4lbtf',NULL,'College Street','https://mymoonsgallery.com/media/artworks/1791022148601-_fU-boIYI1mH-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',3600.00,1,3600.00,10.00,360.00,3240.00,'2026-09-26 04:21:48.596'),('cmus4idcr00pq7k9o9xkhkcl2','cmus4idcl00po7k9ojpbjg59c','cmus4hr3d00dt7k9o6wgfdg7o','cmus4htue00ey7k9oyy97p8es',NULL,'Marigold Mandala','https://mymoonsgallery.com/media/artworks/1791022195162-bhgP6alD8i9x-thumb.webp','PRINT','PHYSICAL','DELIVERED',2300.00,1,2300.00,10.00,230.00,2070.00,'2026-09-18 00:21:48.685'),('cmus4ider00q27k9oy04xhz1o','cmus4idej00q07k9op56w2yt4','cmus4h652006v7k9od0w60tg6','cmus4h8z0008b7k9oc0magitx',NULL,'Terracotta Morning','https://mymoonsgallery.com/media/artworks/1791022179763-jSiHS88dyKgq-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',2600.00,1,2600.00,10.00,260.00,2340.00,'2026-09-22 03:21:48.755'),('cmus4idgg00qe7k9o1wx5eh32','cmus4idg800qc7k9ont516gxo','cmus4hhxu00c37k9ofrmv5glr','cmus4hqht00dh7k9onmak8cwl',NULL,'Harvest Moon Valley','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',2000.00,1,2000.00,10.00,200.00,1800.00,'2026-08-24 07:21:48.816'),('cmus4idhj00qm7k9orqqsoiir','cmus4idg800qc7k9ont516gxo','cmus4hvaf00fj7k9omlgiu1hu','cmus4hw0j00fr7k9onehfa6uz',NULL,'Sakura Daydream','https://mymoonsgallery.com/media/artworks/1791022199401-pYUM7tU_y19R-thumb.webp','ORIGINAL','PHYSICAL','DELIVERED',67000.00,1,67000.00,10.00,6700.00,60300.00,'2026-08-24 07:21:48.816'),('cmus4idj000qs7k9oab00uesn','cmus4idg800qc7k9ont516gxo','cmus4h9jq008n7k9okcz2sm88','cmus4hd2j00a17k9o1jyc3uhf',NULL,'Festival Eyes','https://mymoonsgallery.com/media/artworks/1791022151596-rO_9WMRfgLXK-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',1600.00,1,1600.00,10.00,160.00,1440.00,'2026-08-24 07:21:48.816'),('cmus4idkt00r67k9ohkf95wny','cmus4idkk00r47k9o5sip5ple','cmus4hdoo00ad7k9okljt2ll3','cmus4hgms00bi7k9ohya2eapy',NULL,'Monsoon Tram','https://mymoonsgallery.com/media/artworks/1791022133710-5LAPs5I_JrUv-thumb.webp','PRINT','PHYSICAL','PENDING',4900.00,1,4900.00,10.00,490.00,4410.00,'2026-07-18 02:21:48.972'),('cmus4idnh00ri7k9ov8g4oyrz','cmus4idmy00rg7k9o1io6zo9g','cmus4hdoo00ad7k9okljt2ll3','cmus4hhfw00br7k9o93y4lbtf',NULL,'College Street','https://mymoonsgallery.com/media/artworks/1791022148601-_fU-boIYI1mH-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',3600.00,1,3600.00,10.00,360.00,3240.00,'2026-08-10 18:21:49.058'),('cmus4idpg00ru7k9ou2h5uhu5','cmus4idp900rs7k9oy9osapma','cmus4hhxu00c37k9ofrmv5glr','cmus4hqht00dh7k9onmak8cwl',NULL,'Harvest Moon Valley','https://mymoonsgallery.com/media/artworks/1791022145186-8l-CinY0zQvU-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',2000.00,1,2000.00,10.00,200.00,1800.00,'2026-09-03 05:21:49.141'),('cmus4idqj00s27k9o8ilry4cb','cmus4idp900rs7k9oy9osapma','cmus4h652006v7k9od0w60tg6','cmus4h8z0008b7k9oc0magitx',NULL,'Terracotta Morning','https://mymoonsgallery.com/media/artworks/1791022179763-jSiHS88dyKgq-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',2600.00,1,2600.00,10.00,260.00,2340.00,'2026-09-03 05:21:49.141'),('cmus4ids700se7k9odfp8lkwq','cmus4ids000sc7k9of9qkoq7o','cmus4gwzb00347k9o7jpqfl1i','cmus4gyfz003q7k9o4bmryodo',NULL,'Lotus Mandala','https://mymoonsgallery.com/media/artworks/1791022183675-NywmrEMKjX_v-thumb.webp','ORIGINAL','PHYSICAL','DELIVERED',97000.00,1,97000.00,10.00,9700.00,87300.00,'2026-09-11 16:21:49.240'),('cmus4idtf00sk7k9oh4o7sk62','cmus4ids000sc7k9of9qkoq7o','cmus4h1iv00557k9oobpdcfx0','cmus4h4rh006a7k9ooidrg0lf',NULL,'Saffron Pulse','https://mymoonsgallery.com/media/artworks/1791022161930-lokhaqH0ZFi0-thumb.webp','PRINT','PHYSICAL','DELIVERED',2700.00,1,2700.00,10.00,270.00,2430.00,'2026-09-11 16:21:49.240'),('cmus4idvl00sy7k9or8tcjzw3','cmus4idvd00sw7k9of3pg78ir','cmus4gwzb00347k9o7jpqfl1i','cmus4gzn3004b7k9o5ut5d75u',NULL,'The Dreamer','https://mymoonsgallery.com/media/artworks/1791022191630-P3gb9Cf9UkrH-thumb.webp','PRINT','PHYSICAL','PENDING',5700.00,2,11400.00,10.00,1140.00,10260.00,'2026-10-01 18:21:49.361'),('cmus4idxc00ta7k9olaa3xnz0','cmus4idx500t87k9oy2ukfghi','cmus4gwzb00347k9o7jpqfl1i','cmus4h0ca004k7k9o4ce280xx',NULL,'Sun Wheel','https://mymoonsgallery.com/media/artworks/1791022195857-3jQkHK2kRnsn-thumb.webp','DIGITAL','DIGITAL','DIGITAL_AVAILABLE',2400.00,1,2400.00,10.00,240.00,2160.00,'2026-09-26 19:21:49.425'),('cmus4idyv00tm7k9oz0fy4l47','cmus4idyn00tk7k9oi0ujf0jr','cmus4gwzb00347k9o7jpqfl1i','cmus4gzn3004b7k9o5ut5d75u',NULL,'The Dreamer','https://mymoonsgallery.com/media/artworks/1791022191630-P3gb9Cf9UkrH-thumb.webp','PRINT','PHYSICAL','PENDING',5700.00,1,5700.00,10.00,570.00,5130.00,'2026-10-02 13:21:49.479'),('cmus4im2b00z67k9o4g02mfhq','cmus4im1w00z47k9olwenqc9b','cmus4gwzb00347k9o7jpqfl1i',NULL,'cmus4ik1200yc7k9ooq87yftf','Custom art CA-SVVEMZNA — Baby’s first Diwali',NULL,'DIGITAL','DIGITAL','DIGITAL_AVAILABLE',3500.00,1,3500.00,15.00,525.00,2975.00,'2026-09-24 21:21:59.964'),('cmus5ecvt00197ky0d92uq16f','cmus5ecvi00177ky0priem7yw','cmus4h1iv00557k9oobpdcfx0','cmus4h5qe006j7k9ozq878v35',NULL,'Chromatic Drift','https://mymoonsgallery.com/media/artworks/1791022196502-C6lZ2q_OlRny-thumb.webp','DIGITAL','DIGITAL','PENDING',1500.00,1,1500.00,10.00,150.00,1350.00,'2026-10-03 08:46:41.081'),('cmus5ewph003x7ky0txu2r2vf','cmus5ewpd003v7ky0q2eeiast','cmus4gwzb00347k9o7jpqfl1i',NULL,'cmus5ep2e001v7ky0qc06hna0','Custom art CA-KVCSJ2WL — Realistic portrait',NULL,'DIGITAL','DIGITAL','PENDING',4500.00,1,4500.00,15.00,675.00,3825.00,'2026-10-03 08:47:06.773'),('cmus5ewu000437ky0x2ckgunx','cmus5ewpd003v7ky0q2eeiast','cmus4h1iv00557k9oobpdcfx0','cmus4h5qe006j7k9ozq878v35',NULL,'Chromatic Drift','https://mymoonsgallery.com/media/artworks/1791022196502-C6lZ2q_OlRny-thumb.webp','DIGITAL','DIGITAL','PENDING',1500.00,1,1500.00,10.00,150.00,1350.00,'2026-10-03 08:47:06.936'),('cmus5xmi000577ky00mm1iaa3','cmus5xmgy00557ky0muhillg3','cmus4h1iv00557k9oobpdcfx0','cmus4h374005r7k9otwxg61kt',NULL,'Violet Reverie','https://mymoonsgallery.com/media/artworks/1791022201793-4p7GFSVAtNao-thumb.webp','ORIGINAL','PHYSICAL','PENDING',139000.00,1,139000.00,10.00,13900.00,125100.00,'2026-10-03 09:01:40.008');
/*!40000 ALTER TABLE `OrderItem` ENABLE KEYS */;

--
-- Table structure for table `Payment`
--

DROP TABLE IF EXISTS `Payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Payment` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` enum('COD','MANUAL','RAZORPAY','STRIPE','PAYU') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','AWAITING_CONFIRMATION','PAID','FAILED','REFUNDED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `providerRef` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmedById` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmedAt` datetime(3) DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Payment_orderId_idx` (`orderId`),
  CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Payment`
--

/*!40000 ALTER TABLE `Payment` DISABLE KEYS */;
INSERT INTO `Payment` (`id`, `orderId`, `provider`, `method`, `status`, `amount`, `currency`, `providerRef`, `confirmedById`, `confirmedAt`, `meta`, `createdAt`, `updatedAt`) VALUES ('cmus4icr600lk7k9ojpeiojvd','cmus4icn600ku7k9o0kr7qp8v','manual','MANUAL','PAID',25300.00,'INR','UTR899726','cmus4gw91002c7k9ozx8w96po','2026-09-06 19:21:47.770','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-09-05 19:21:47.770','2026-10-03 08:21:47.923'),('cmus4icsv00lw7k9oujluli9m','cmus4icre00lm7k9o27m60wmw','manual','MANUAL','PAID',2500.00,'INR','UTR761513','cmus4gw91002c7k9ozx8w96po','2026-08-10 23:21:47.922','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-08-09 23:21:47.922','2026-10-03 08:21:47.983'),('cmus4icuu00m87k9o3iakz4bp','cmus4ict300ly7k9o42c7jhxj','cod','COD','PAID',4900.00,'INR','UTR102084','cmus4gw91002c7k9ozx8w96po','2026-07-15 18:21:47.983','{\"instructions\": \"Pay in cash when your artwork is delivered.\"}','2026-07-14 18:21:47.983','2026-10-03 08:21:48.054'),('cmus4icxv00ms7k9oo6q7ra1y','cmus4icv300ma7k9omj7y6ap8','manual','MANUAL','PAID',4300.00,'INR','UTR147332','cmus4gw91002c7k9ozx8w96po','2026-07-28 06:21:48.055','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-07-27 06:21:48.055','2026-10-03 08:21:48.163'),('cmus4id0z00nc7k9o0kclcwls','cmus4icy300mu7k9ozi81klgp','manual','MANUAL','PAID',89600.00,'INR','UTR639537','cmus4gw91002c7k9ozx8w96po','2026-08-09 17:21:48.163','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-08-08 17:21:48.163','2026-10-03 08:21:48.275'),('cmus4id2l00no7k9o3fu92pix','cmus4id1600ne7k9opf2v3rkk','manual','MANUAL','PAID',2400.00,'INR','UTR165466','cmus4gw91002c7k9ozx8w96po','2026-08-10 20:21:48.275','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-08-09 20:21:48.275','2026-10-03 08:21:48.334'),('cmus4id5900o67k9ol0miqhvf','cmus4id2s00nq7k9ohn3491wc','manual','MANUAL','AWAITING_CONFIRMATION',5300.00,'INR',NULL,NULL,NULL,'{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-07-27 03:21:48.332','2026-10-03 08:21:48.429'),('cmus4id6x00oi7k9oh5ws5q8d','cmus4id5h00o87k9oytcjkwkm','cod','COD','PAID',6000.00,'INR','UTR578547','cmus4gw91002c7k9ozx8w96po','2026-07-23 12:21:48.429','{\"instructions\": \"Pay in cash when your artwork is delivered.\"}','2026-07-22 12:21:48.429','2026-10-03 08:21:48.489'),('cmus4id9y00p27k9othuxy435','cmus4id7500ok7k9oks3nj4w7','manual','MANUAL','PAID',85300.00,'INR','UTR225487','cmus4gw91002c7k9ozx8w96po','2026-08-20 22:21:48.489','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-08-19 22:21:48.489','2026-10-03 08:21:48.598'),('cmus4idce00pm7k9otz4xd880','cmus4ida400p47k9ooullgcic','manual','MANUAL','PAID',9300.00,'INR','UTR381626','cmus4gw91002c7k9ozx8w96po','2026-09-27 04:21:48.596','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-09-26 04:21:48.596','2026-10-03 08:21:48.686'),('cmus4ideb00py7k9ok1s0a8hj','cmus4idcl00po7k9ojpbjg59c','cod','COD','PAID',2300.00,'INR','UTR171773','cmus4gw91002c7k9ozx8w96po','2026-09-19 00:21:48.685','{\"instructions\": \"Pay in cash when your artwork is delivered.\"}','2026-09-18 00:21:48.685','2026-10-03 08:21:48.755'),('cmus4idfx00qa7k9ovtoubxrj','cmus4idej00q07k9op56w2yt4','manual','MANUAL','PAID',2600.00,'INR','UTR639949','cmus4gw91002c7k9ozx8w96po','2026-09-23 03:21:48.755','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-09-22 03:21:48.755','2026-10-03 08:21:48.814'),('cmus4idkb00r27k9oywgvlfdu','cmus4idg800qc7k9ont516gxo','manual','MANUAL','PAID',70600.00,'INR','UTR984785','cmus4gw91002c7k9ozx8w96po','2026-08-25 07:21:48.816','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-08-24 07:21:48.816','2026-10-03 08:21:48.971'),('cmus4idmk00re7k9oeodi4lvc','cmus4idkk00r47k9o5sip5ple','cod','COD','PENDING',4900.00,'INR',NULL,NULL,NULL,'{\"instructions\": \"Pay in cash when your artwork is delivered.\"}','2026-07-18 02:21:48.972','2026-10-03 08:21:49.053'),('cmus4idp100rq7k9of98c1si6','cmus4idmy00rg7k9o1io6zo9g','manual','MANUAL','PAID',3600.00,'INR','UTR704029','cmus4gw91002c7k9ozx8w96po','2026-08-11 18:21:49.058','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-08-10 18:21:49.058','2026-10-03 08:21:49.141'),('cmus4idrr00sa7k9omkvngdp4','cmus4idp900rs7k9oy9osapma','manual','MANUAL','PAID',4600.00,'INR','UTR116464','cmus4gw91002c7k9ozx8w96po','2026-09-04 05:21:49.141','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-09-03 05:21:49.141','2026-10-03 08:21:49.239'),('cmus4idv500su7k9o7jjzbqpv','cmus4ids000sc7k9of9qkoq7o','manual','MANUAL','PAID',99700.00,'INR','UTR364546','cmus4gw91002c7k9ozx8w96po','2026-09-12 16:21:49.240','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-09-11 16:21:49.240','2026-10-03 08:21:49.361'),('cmus4idww00t67k9og69vf2q2','cmus4idvd00sw7k9of3pg78ir','cod','COD','PENDING',11400.00,'INR',NULL,NULL,NULL,'{\"instructions\": \"Pay in cash when your artwork is delivered.\"}','2026-10-01 18:21:49.361','2026-10-03 08:21:49.424'),('cmus4idye00ti7k9onpemhf14','cmus4idx500t87k9oy2ukfghi','manual','MANUAL','PAID',2400.00,'INR','UTR402367','cmus4gw91002c7k9ozx8w96po','2026-09-27 19:21:49.425','{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-09-26 19:21:49.425','2026-10-03 08:21:49.479'),('cmus4ie0800tu7k9o9aqtb9ls','cmus4idyn00tk7k9oi0ujf0jr','manual','MANUAL','AWAITING_CONFIRMATION',5700.00,'INR',NULL,NULL,NULL,'{\"instructions\": \"Bank transfer / UPI — confirmed manually.\"}','2026-10-02 13:21:49.479','2026-10-03 08:21:49.544'),('cmus4im4r00zc7k9o3ye5qzr9','cmus4im1w00z47k9olwenqc9b','manual','MANUAL','PAID',3500.00,'INR','UTR723819','cmus4gw91002c7k9ozx8w96po','2026-09-24 21:21:59.964',NULL,'2026-10-03 08:22:00.075','2026-10-03 08:22:00.075'),('cmus5ecw5001f7ky0ugr929eh','cmus5ecvi00177ky0priem7yw','manual','MANUAL','AWAITING_CONFIRMATION',1500.00,'INR',NULL,NULL,NULL,'{\"instructions\": \"Transfer INR 1500.00 via bank transfer / UPI quoting AG-ARXM3FPW. Our team confirms the payment manually.\"}','2026-10-03 08:46:41.093','2026-10-03 08:46:41.093'),('cmus5ewu600497ky0ikhbd3o1','cmus5ewpd003v7ky0q2eeiast','manual','MANUAL','AWAITING_CONFIRMATION',6000.00,'INR',NULL,NULL,NULL,'{\"instructions\": \"Transfer INR 6000.00 via bank transfer / UPI quoting AG-TVM9MWUF. Our team confirms the payment manually.\"}','2026-10-03 08:47:06.943','2026-10-03 08:47:06.943'),('cmus5xmir005e7ky02ljx7h0d','cmus5xmgy00557ky0muhillg3','cod','COD','PENDING',139000.00,'INR',NULL,NULL,NULL,'{\"instructions\": \"Pay in cash when your artwork is delivered.\"}','2026-10-03 09:01:40.035','2026-10-03 09:01:40.035');
/*!40000 ALTER TABLE `Payment` ENABLE KEYS */;

--
-- Table structure for table `Permission`
--

DROP TABLE IF EXISTS `Permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Permission` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Permission_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Permission`
--

/*!40000 ALTER TABLE `Permission` DISABLE KEYS */;
INSERT INTO `Permission` (`id`, `key`, `description`) VALUES ('cmus4go8k00037k9osxj7peu5','platform:manage',NULL),('cmus4go9300047k9oa538kuhl','users:manage',NULL),('cmus4go9k00057k9ogko472cb','artists:approve',NULL),('cmus4go9w00067k9obk4snve2','artworks:moderate',NULL),('cmus4goa900077k9odeej8ifq','taxonomy:manage',NULL),('cmus4goap00087k9owcatzhlg','orders:manage',NULL),('cmus4gob100097k9onfhdk6wh','payments:confirm',NULL),('cmus4gobd000a7k9o6t7ako89','commissions:manage',NULL),('cmus4gobt000b7k9ounpg6wlu','settlements:manage',NULL),('cmus4goc6000c7k9oylxeop73','analytics:view',NULL),('cmus4goci000d7k9oy4i87p7b','audit:view',NULL),('cmus4gocu000e7k9ohkgho1ku','artworks:create',NULL),('cmus4god7000f7k9oa4htc9ex','artworks:update:own',NULL),('cmus4godk000g7k9oce31vskt','collections:manage:own',NULL),('cmus4goe3000h7k9ohhu64moi','orders:fulfil:own',NULL),('cmus4goef000i7k9ofnox8otb','custom-art:respond',NULL),('cmus4goeq000j7k9ohd20ip7z','earnings:view:own',NULL),('cmus4gof1000k7k9oririm0ww','cart:use',NULL),('cmus4gofe000l7k9obo9jepvc','orders:place',NULL),('cmus4gofp000m7k9obgf7ooi0','custom-art:request',NULL),('cmus4gog4000n7k9oet5i7ntb','reviews:write',NULL),('cmus4gogj000o7k9o1czpk9w0','wishlist:use',NULL);
/*!40000 ALTER TABLE `Permission` ENABLE KEYS */;

--
-- Table structure for table `Promotion`
--

DROP TABLE IF EXISTS `Promotion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Promotion` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percentOff` decimal(5,2) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `startsAt` datetime(3) DEFAULT NULL,
  `endsAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Promotion_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Promotion`
--

/*!40000 ALTER TABLE `Promotion` DISABLE KEYS */;
/*!40000 ALTER TABLE `Promotion` ENABLE KEYS */;

--
-- Table structure for table `RecentlyViewedArtwork`
--

DROP TABLE IF EXISTS `RecentlyViewedArtwork`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RecentlyViewedArtwork` (
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `viewedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`userId`,`artworkId`),
  KEY `RecentlyViewedArtwork_userId_viewedAt_idx` (`userId`,`viewedAt`),
  KEY `RecentlyViewedArtwork_artworkId_fkey` (`artworkId`),
  CONSTRAINT `RecentlyViewedArtwork_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RecentlyViewedArtwork_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RecentlyViewedArtwork`
--

/*!40000 ALTER TABLE `RecentlyViewedArtwork` DISABLE KEYS */;
INSERT INTO `RecentlyViewedArtwork` (`userId`, `artworkId`, `viewedAt`) VALUES ('cmus4gw91002c7k9ozx8w96po','cmus4h374005r7k9otwxg61kt','2026-10-03 09:01:19.855'),('cmus4gw91002c7k9ozx8w96po','cmus64hbg006l7ky0abc3cdq2','2026-10-03 10:49:31.265'),('cmus4gw91002c7k9ozx8w96po','cmus4ic4j00jy7k9otnqq6950','2026-10-03 13:22:20.087'),('cmus4gw91002c7k9ozx8w96po','cmus4hqht00dh7k9onmak8cwl','2026-10-03 13:29:45.089'),('cmus4gwda002d7k9o6mkhzgmm','cmus4hwee00g37k9oy0r428li','2026-10-03 03:21:47.762'),('cmus4gwda002d7k9o6mkhzgmm','cmus4hqht00dh7k9onmak8cwl','2026-10-03 04:21:47.755'),('cmus4gwda002d7k9o6mkhzgmm','cmus4hfwi00b67k9oy06oc8ue','2026-10-03 05:21:47.749'),('cmus4gwda002d7k9o6mkhzgmm','cmus4ha8s008x7k9o1e8wgcdj','2026-10-03 06:21:47.744'),('cmus4gwda002d7k9o6mkhzgmm','cmus4h4rh006a7k9ooidrg0lf','2026-10-03 07:21:47.738'),('cmus4gwda002d7k9o6mkhzgmm','cmus4gyzg003z7k9o9ppb7rsa','2026-10-03 08:21:47.730'),('cmus4gwda002d7k9o6mkhzgmm','cmus4h5qe006j7k9ozq878v35','2026-10-03 08:47:04.656'),('cmus4gwda002d7k9o6mkhzgmm','cmus64hbg006l7ky0abc3cdq2','2026-10-03 11:41:46.508'),('cmus5zslf005p7ky0dyh0xhr5','cmus4heds00al7k9oktw2hgjb','2026-10-03 10:10:24.102'),('cmus5zslf005p7ky0dyh0xhr5','cmus4hw0j00fr7k9onehfa6uz','2026-10-03 10:14:35.618'),('cmus5zslf005p7ky0dyh0xhr5','cmus4hwyo00gc7k9oni4p9nuf','2026-10-03 10:14:42.078'),('cmus5zslf005p7ky0dyh0xhr5','cmus4htue00ey7k9oyy97p8es','2026-10-03 10:15:52.892'),('cmus5zslf005p7ky0dyh0xhr5','cmus4hgms00bi7k9ohya2eapy','2026-10-03 10:15:57.958'),('cmus5zslf005p7ky0dyh0xhr5','cmus4gxra003e7k9o5dwrm7cw','2026-10-03 10:16:09.330'),('cmus5zslf005p7ky0dyh0xhr5','cmus4gzn3004b7k9o5ut5d75u','2026-10-03 10:16:12.750'),('cmus5zslf005p7ky0dyh0xhr5','cmus64hbg006l7ky0abc3cdq2','2026-10-03 11:44:02.723');
/*!40000 ALTER TABLE `RecentlyViewedArtwork` ENABLE KEYS */;

--
-- Table structure for table `Report`
--

DROP TABLE IF EXISTS `Report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Report` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reporterId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetType` enum('ARTWORK','USER','ARTIST','REVIEW') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` enum('INAPPROPRIATE','COPYRIGHT','SPAM','FRAUD','SELLER_VIOLATION','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('OPEN','REVIEWING','RESOLVED','DISMISSED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `resolution` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolvedById` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Report_status_idx` (`status`),
  KEY `Report_targetType_targetId_idx` (`targetType`,`targetId`),
  KEY `Report_reporterId_fkey` (`reporterId`),
  CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Report`
--

/*!40000 ALTER TABLE `Report` DISABLE KEYS */;
INSERT INTO `Report` (`id`, `reporterId`, `targetType`, `targetId`, `reason`, `details`, `status`, `resolution`, `resolvedById`, `createdAt`, `updatedAt`) VALUES ('cmus4iwuy00zx7k9o9y2edh9k','cmus4gweo002t7k9op2gzcjbm','ARTWORK','cmus4h374005r7k9otwxg61kt','COPYRIGHT','This looks similar to a piece I saw elsewhere — please verify.','OPEN',NULL,NULL,'2026-10-03 08:22:13.978','2026-10-03 08:22:13.978');
/*!40000 ALTER TABLE `Report` ENABLE KEYS */;

--
-- Table structure for table `ReviewImage`
--

DROP TABLE IF EXISTS `ReviewImage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ReviewImage` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `storageKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ReviewImage_reviewId_fkey` (`reviewId`),
  CONSTRAINT `ReviewImage_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `ArtworkReview` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ReviewImage`
--

/*!40000 ALTER TABLE `ReviewImage` DISABLE KEYS */;
/*!40000 ALTER TABLE `ReviewImage` ENABLE KEYS */;

--
-- Table structure for table `Role`
--

DROP TABLE IF EXISTS `Role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Role` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` enum('ADMIN','ARTIST','CUSTOMER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Role_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Role`
--

/*!40000 ALTER TABLE `Role` DISABLE KEYS */;
INSERT INTO `Role` (`id`, `name`, `description`) VALUES ('cmus3hxmu00007km8bmglljn5','CUSTOMER',NULL),('cmus4go7x00007k9ow2mr5cbk','ADMIN','admin role'),('cmus4go8800017k9ootzkxb4d','ARTIST','artist role');
/*!40000 ALTER TABLE `Role` ENABLE KEYS */;

--
-- Table structure for table `RolePermission`
--

DROP TABLE IF EXISTS `RolePermission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RolePermission` (
  `roleId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissionId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`roleId`,`permissionId`),
  KEY `RolePermission_permissionId_fkey` (`permissionId`),
  CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RolePermission`
--

/*!40000 ALTER TABLE `RolePermission` DISABLE KEYS */;
INSERT INTO `RolePermission` (`roleId`, `permissionId`) VALUES ('cmus4go7x00007k9ow2mr5cbk','cmus4go8k00037k9osxj7peu5'),('cmus4go7x00007k9ow2mr5cbk','cmus4go9300047k9oa538kuhl'),('cmus4go7x00007k9ow2mr5cbk','cmus4go9k00057k9ogko472cb'),('cmus4go7x00007k9ow2mr5cbk','cmus4go9w00067k9obk4snve2'),('cmus4go7x00007k9ow2mr5cbk','cmus4goa900077k9odeej8ifq'),('cmus4go7x00007k9ow2mr5cbk','cmus4goap00087k9owcatzhlg'),('cmus4go7x00007k9ow2mr5cbk','cmus4gob100097k9onfhdk6wh'),('cmus4go7x00007k9ow2mr5cbk','cmus4gobd000a7k9o6t7ako89'),('cmus4go7x00007k9ow2mr5cbk','cmus4gobt000b7k9ounpg6wlu'),('cmus4go7x00007k9ow2mr5cbk','cmus4goc6000c7k9oylxeop73'),('cmus4go7x00007k9ow2mr5cbk','cmus4goci000d7k9oy4i87p7b'),('cmus4go8800017k9ootzkxb4d','cmus4gocu000e7k9ohkgho1ku'),('cmus4go8800017k9ootzkxb4d','cmus4god7000f7k9oa4htc9ex'),('cmus4go7x00007k9ow2mr5cbk','cmus4godk000g7k9oce31vskt'),('cmus4go8800017k9ootzkxb4d','cmus4godk000g7k9oce31vskt'),('cmus4go8800017k9ootzkxb4d','cmus4goe3000h7k9ohhu64moi'),('cmus4go8800017k9ootzkxb4d','cmus4goef000i7k9ofnox8otb'),('cmus4go8800017k9ootzkxb4d','cmus4goeq000j7k9ohd20ip7z'),('cmus3hxmu00007km8bmglljn5','cmus4gof1000k7k9oririm0ww'),('cmus3hxmu00007km8bmglljn5','cmus4gofe000l7k9obo9jepvc'),('cmus3hxmu00007km8bmglljn5','cmus4gofp000m7k9obgf7ooi0'),('cmus3hxmu00007km8bmglljn5','cmus4gog4000n7k9oet5i7ntb'),('cmus3hxmu00007km8bmglljn5','cmus4gogj000o7k9o1czpk9w0');
/*!40000 ALTER TABLE `RolePermission` ENABLE KEYS */;

--
-- Table structure for table `Session`
--

DROP TABLE IF EXISTS `Session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Session` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `refreshTokenHash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userAgent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipAddress` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `revokedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Session_refreshTokenHash_key` (`refreshTokenHash`),
  KEY `Session_userId_idx` (`userId`),
  CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Session`
--

/*!40000 ALTER TABLE `Session` DISABLE KEYS */;
/*!40000 ALTER TABLE `Session` ENABLE KEYS */;

--
-- Table structure for table `Settlement`
--

DROP TABLE IF EXISTS `Settlement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Settlement` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('PENDING','PROCESSING','COMPLETED','FAILED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reference` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processedById` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Settlement_artistId_fkey` (`artistId`),
  CONSTRAINT `Settlement_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Settlement`
--

/*!40000 ALTER TABLE `Settlement` DISABLE KEYS */;
INSERT INTO `Settlement` (`id`, `artistId`, `amount`, `status`, `reference`, `note`, `processedById`, `createdAt`, `completedAt`) VALUES ('cmus4if9n00vo7k9og5sqggdp','cmus4h1iv00557k9oobpdcfx0',20430.00,'COMPLETED','UTR206227','[BANK_TRANSFER] Monthly payout','cmus4gw91002c7k9ozx8w96po','2026-10-03 08:21:51.180','2026-09-29 13:21:51.171');
/*!40000 ALTER TABLE `Settlement` ENABLE KEYS */;

--
-- Table structure for table `SettlementTransaction`
--

DROP TABLE IF EXISTS `SettlementTransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SettlementTransaction` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `settlementId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `method` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `SettlementTransaction_settlementId_fkey` (`settlementId`),
  CONSTRAINT `SettlementTransaction_settlementId_fkey` FOREIGN KEY (`settlementId`) REFERENCES `Settlement` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SettlementTransaction`
--

/*!40000 ALTER TABLE `SettlementTransaction` DISABLE KEYS */;
INSERT INTO `SettlementTransaction` (`id`, `settlementId`, `amount`, `method`, `reference`, `createdAt`) VALUES ('cmus4ifjp00vs7k9ofexyoam4','cmus4if9n00vo7k9og5sqggdp',20430.00,'BANK_TRANSFER','UTR206227','2026-10-03 08:21:51.541');
/*!40000 ALTER TABLE `SettlementTransaction` ENABLE KEYS */;

--
-- Table structure for table `Shipment`
--

DROP TABLE IF EXISTS `Shipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Shipment` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `carrier` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trackingNumber` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `packagingInfo` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','PACKED','SHIPPED','IN_TRANSIT','DELIVERED','RETURNED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `shippedAt` datetime(3) DEFAULT NULL,
  `deliveredAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Shipment_orderId_artistId_key` (`orderId`,`artistId`),
  KEY `Shipment_artistId_fkey` (`artistId`),
  CONSTRAINT `Shipment_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Shipment`
--

/*!40000 ALTER TABLE `Shipment` DISABLE KEYS */;
INSERT INTO `Shipment` (`id`, `orderId`, `artistId`, `carrier`, `method`, `trackingNumber`, `packagingInfo`, `status`, `shippedAt`, `deliveredAt`, `createdAt`, `updatedAt`) VALUES ('cmus4icqs00lg7k9o4gbfov9z','cmus4icn600ku7k9o0kr7qp8v','cmus4h9jq008n7k9okcz2sm88','DTDC',NULL,'TRK92993106','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-09-07 19:21:47.770','2026-09-10 19:21:47.770','2026-10-03 08:21:47.908','2026-10-03 08:21:47.908'),('cmus4icqz00li7k9okiogp1eb','cmus4icn600ku7k9o0kr7qp8v','cmus4h1iv00557k9oobpdcfx0','Delhivery',NULL,'TRK77951788','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-09-07 19:21:47.770','2026-09-10 19:21:47.770','2026-10-03 08:21:47.916','2026-10-03 08:21:47.916'),('cmus4icsn00lu7k9o5jv4szyh','cmus4icre00lm7k9o27m60wmw','cmus4hxuj00gx7k9omkclsld2','BlueDart',NULL,'TRK17398059','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-08-11 23:21:47.922','2026-08-14 23:21:47.922','2026-10-03 08:21:47.976','2026-10-03 08:21:47.976'),('cmus4icui00m67k9oik5i61hl','cmus4ict300ly7k9o42c7jhxj','cmus4hdoo00ad7k9okljt2ll3','DTDC',NULL,'TRK16000121','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-07-16 18:21:47.983','2026-07-19 18:21:47.983','2026-10-03 08:21:48.043','2026-10-03 08:21:48.043'),('cmus4icxo00mq7k9os5tjr98g','cmus4icv300ma7k9omj7y6ap8','cmus4hxuj00gx7k9omkclsld2','Delhivery',NULL,'TRK94395128','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-07-29 06:21:48.055','2026-08-01 06:21:48.055','2026-10-03 08:21:48.156','2026-10-03 08:21:48.156'),('cmus4id0r00na7k9onmz16hsk','cmus4icy300mu7k9ozi81klgp','cmus4hvaf00fj7k9omlgiu1hu','DTDC',NULL,'TRK62150836','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-08-10 17:21:48.163','2026-08-13 17:21:48.163','2026-10-03 08:21:48.267','2026-10-03 08:21:48.267'),('cmus4id5200o47k9or1d3cwqq','cmus4id2s00nq7k9ohn3491wc','cmus4h1iv00557k9oobpdcfx0',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'2026-10-03 08:21:48.422','2026-10-03 08:21:48.422'),('cmus4id6p00og7k9o4hqwcde4','cmus4id5h00o87k9oytcjkwkm','cmus4hhxu00c37k9ofrmv5glr','Delhivery',NULL,'TRK65390210','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-07-24 12:21:48.429','2026-07-27 12:21:48.429','2026-10-03 08:21:48.482','2026-10-03 08:21:48.482'),('cmus4id9q00p07k9orwo6xu88','cmus4id7500ok7k9oks3nj4w7','cmus4hxuj00gx7k9omkclsld2','Delhivery',NULL,'TRK64815680','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-08-21 22:21:48.489','2026-08-24 22:21:48.489','2026-10-03 08:21:48.591','2026-10-03 08:21:48.591'),('cmus4idc700pk7k9o6j5co9bq','cmus4ida400p47k9ooullgcic','cmus4gwzb00347k9o7jpqfl1i','BlueDart',NULL,'TRK16215154','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-09-28 04:21:48.596','2026-10-01 04:21:48.596','2026-10-03 08:21:48.679','2026-10-03 08:21:48.679'),('cmus4iddw00pw7k9ogb693gtt','cmus4idcl00po7k9ojpbjg59c','cmus4hr3d00dt7k9o6wgfdg7o','DTDC',NULL,'TRK31440606','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-09-20 00:21:48.685','2026-09-23 00:21:48.685','2026-10-03 08:21:48.740','2026-10-03 08:21:48.740'),('cmus4idk200r07k9o7gsaz1ui','cmus4idg800qc7k9ont516gxo','cmus4hvaf00fj7k9omlgiu1hu','DTDC',NULL,'TRK22083468','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-08-26 07:21:48.816','2026-08-29 07:21:48.816','2026-10-03 08:21:48.962','2026-10-03 08:21:48.962'),('cmus4idm500rc7k9owc1wqzg7','cmus4idkk00r47k9o5sip5ple','cmus4hdoo00ad7k9okljt2ll3',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'2026-10-03 08:21:49.038','2026-10-03 08:21:49.038'),('cmus4iduo00sq7k9o0nm51bkk','cmus4ids000sc7k9of9qkoq7o','cmus4gwzb00347k9o7jpqfl1i','Delhivery',NULL,'TRK52520956','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-09-13 16:21:49.240','2026-09-16 16:21:49.240','2026-10-03 08:21:49.344','2026-10-03 08:21:49.344'),('cmus4idux00ss7k9o8qkvc3xw','cmus4ids000sc7k9of9qkoq7o','cmus4h1iv00557k9oobpdcfx0','BlueDart',NULL,'TRK54933086','Bubble wrap, corner protectors, rigid art box','DELIVERED','2026-09-13 16:21:49.240','2026-09-16 16:21:49.240','2026-10-03 08:21:49.354','2026-10-03 08:21:49.354'),('cmus4idwn00t47k9odry09f78','cmus4idvd00sw7k9of3pg78ir','cmus4gwzb00347k9o7jpqfl1i',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'2026-10-03 08:21:49.416','2026-10-03 08:21:49.416'),('cmus4ie0000ts7k9o6zslg3nw','cmus4idyn00tk7k9oi0ujf0jr','cmus4gwzb00347k9o7jpqfl1i',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'2026-10-03 08:21:49.537','2026-10-03 08:21:49.537'),('cmus5xmim005c7ky0f3ny4yo5','cmus5xmgy00557ky0muhillg3','cmus4h1iv00557k9oobpdcfx0',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'2026-10-03 09:01:40.030','2026-10-03 09:01:40.030');
/*!40000 ALTER TABLE `Shipment` ENABLE KEYS */;

--
-- Table structure for table `SystemSetting`
--

DROP TABLE IF EXISTS `SystemSetting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SystemSetting` (
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` json NOT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SystemSetting`
--

/*!40000 ALTER TABLE `SystemSetting` DISABLE KEYS */;
INSERT INTO `SystemSetting` (`key`, `value`, `updatedAt`) VALUES ('customArt.maxRevisions','2','2026-10-03 08:20:39.579'),('digital.downloadExpiryDays','30','2026-10-03 08:20:39.599'),('digital.downloadLimit','5','2026-10-03 08:20:39.592'),('payments.codEnabled','true','2026-10-03 08:20:39.605'),('payments.manualInstructions','\"Transfer via UPI/bank and share the reference; our team confirms within 24 hours.\"','2026-10-03 08:20:39.611'),('shipping.flatFee','0','2026-10-03 08:20:39.585'),('site.config','{\"hero\": {\"effect\": \"kenburns\", \"height\": \"full\", \"enabled\": true, \"eyebrow\": \"Original art · Custom portraits\", \"autoplay\": true, \"headline\": \"Art That Tells Your Story\", \"showSearch\": true, \"subheadline\": \"Discover original artworks or transform your favorite memories into beautiful art.\", \"showParticles\": true, \"useBannerText\": false, \"overlayOpacity\": 45, \"primaryCtaHref\": \"/gallery\", \"intervalSeconds\": 7, \"primaryCtaLabel\": \"Explore Gallery\", \"secondaryCtaHref\": \"/create-your-art\", \"secondaryCtaLabel\": \"Create Your Art\"}, \"theme\": {\"ink\": \"#0b0a12\", \"accent\": \"#ff4fa3\", \"preset\": \"royal-purple\", \"radius\": \"round\", \"accent2\": \"#ff8a3d\", \"accent3\": \"#18c3c9\", \"primary\": \"#8b2bd9\", \"scriptFont\": \"Great Vibes\", \"headingFont\": \"Montserrat\", \"primaryDark\": \"#7a1fc7\"}, \"footer\": {\"about\": \"MyMoons Gallery is an online home for independent artists and galleries. Discover original paintings, prints and digital art — or commission an artist to turn your favourite photo into a one-of-a-kind artwork.\", \"copyright\": \"All artworks remain the copyright of their artists.\", \"showChatWidget\": true, \"newsletterEnabled\": true}, \"social\": {\"twitter\": \"\", \"youtube\": \"\", \"facebook\": \"\", \"whatsapp\": \"\", \"instagram\": \"\", \"pinterest\": \"\"}, \"contact\": {\"email\": \"hello@mymoonsgallery.com\", \"hours\": \"Mon–Sat, 10am–7pm IST\", \"phone\": \"\", \"address\": \"India\"}, \"branding\": {\"tagline\": \"Original art & custom portraits\", \"siteName\": \"MyMoons Gallery\", \"scriptLogo\": true}, \"animations\": {\"enabled\": true, \"intensity\": \"normal\", \"pageTransitions\": true}, \"announcement\": {\"href\": \"\", \"text\": \"Free shipping on original paintings this month\", \"tone\": \"brand\", \"enabled\": false}, \"homeSections\": [{\"id\": \"filterCard\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"categories\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"featured\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"perfectArt\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"styles\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"photoToArt\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"trending\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"recommended\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"collections\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"artists\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"newArrivals\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"newArtists\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"recentlyViewed\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}, {\"id\": \"testimonials\", \"title\": \"\", \"enabled\": true, \"subtitle\": \"\"}]}','2026-10-03 12:45:52.549'),('site.contactEmail','\"hello@mymoonsgallery.com\"','2026-10-03 08:20:39.562'),('site.name','\"Art Gallery\"','2026-10-03 08:20:39.544'),('site.tagline','\"Art That Tells Your Story\"','2026-10-03 08:20:39.554');
/*!40000 ALTER TABLE `SystemSetting` ENABLE KEYS */;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatarUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','SUSPENDED','DELETED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `failedLogins` int NOT NULL DEFAULT '0',
  `lockedUntil` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` (`id`, `email`, `passwordHash`, `fullName`, `phone`, `avatarUrl`, `status`, `lastLoginAt`, `failedLogins`, `lockedUntil`, `createdAt`, `updatedAt`) VALUES ('cmus3hxni00017km8borr3wyw','t1@x.com','$2b$12$pAuOnMItR.uPwN0mGlfaauiKGn0fIY86sdFVVNNVBZFR0id..GLU6','Test User',NULL,NULL,'ACTIVE',NULL,0,NULL,'2026-10-03 07:53:28.735','2026-10-03 13:41:31.530'),('cmus4gw91002c7k9ozx8w96po','admin@mymoonsgallery.com','$2b$12$xx6oMlJE6RuLlaNb9KUa0.qGGf34ipwGtzy4CyuIRDZ8pq5t/1sGa','Platform Admin',NULL,NULL,'ACTIVE','2026-10-03 13:17:38.819',0,NULL,'2026-10-03 08:20:39.878','2026-10-03 13:41:25.496'),('cmus4gwda002d7k9o6mkhzgmm','customer@artgallery.local','$2b$12$3xYsAB2QdpIP.yz2RIp14uWS8DQzCh7P9Eb7x86Xk7qDsaWoneBm.','Priya Sharma','9811122233',NULL,'ACTIVE','2026-10-03 10:51:07.653',0,NULL,'2026-04-13 19:20:40.028','2026-10-03 13:41:27.185'),('cmus4gwdt002h7k9oi4jryetb','rahul.gupta@artgallery.local','$2b$12$IiSjgyHOFufs3/uFimTB2OPzL7Wd.wiA0NIfaVI5cQmtEE02cLm0i','Rahul Gupta','9822233344',NULL,'ACTIVE',NULL,0,NULL,'2026-08-02 19:20:40.047','2026-10-03 13:41:29.503'),('cmus4gwe4002l7k9os8s52e2y','sneha@artgallery.local','$2b$12$lM06WPuoZZWupRgtmlXg1.McDGJIf5VXCgfvucNDcAly/52fHSS7y','Sneha Patel','9833344455',NULL,'ACTIVE',NULL,0,NULL,'2026-03-19 13:20:40.059','2026-10-03 13:41:30.494'),('cmus4gwed002p7k9ot2pbzw4b','david@artgallery.local','$2b$12$sEi7RtSa7O5gd.tRZJRqpe9tK5Z0iBQET20RKSLW4s5KAsQYFkagC','David Thomas','9844455566',NULL,'ACTIVE',NULL,0,NULL,'2026-08-16 21:20:40.068','2026-10-03 13:41:27.519'),('cmus4gweo002t7k9op2gzcjbm','fatima@artgallery.local','$2b$12$etWC33xzbvuAgcNigvsRg.qpyZQBnUpbK7.HodwADoR9xHS32sGpm','Fatima Khan','9855566677',NULL,'ACTIVE',NULL,0,NULL,'2026-07-06 05:20:40.079','2026-10-03 13:41:27.848'),('cmus4gwex002x7k9oiu07kd0w','karan@artgallery.local','$2b$12$u5ePoOnk6rNNFnBD7tM/OO4iUZT5d76NLUwnYGVK/ga.EM1wrvudO','Karan Malhotra','9866677788',NULL,'ACTIVE',NULL,0,NULL,'2026-03-21 14:20:40.088','2026-10-03 13:41:28.174'),('cmus4gwzb00317k9oa3ttabyd','artist@artgallery.local','$2b$12$DFQekvc3rA3dWeagY.iZZe3O2SILMwCRqGdxckYgkzcEHjjaV9sai','Meera Iyer','9871983655','https://mymoonsgallery.com/media/artists/1791015640098-1035.webp','ACTIVE','2026-10-03 13:17:47.340',0,NULL,'2026-04-17 19:20:40.821','2026-10-03 13:41:26.858'),('cmus4h1iv00527k9ojjjarwip','arjun@artgallery.local','$2b$12$/UBN7Bhff8Atg4XfR9AjfuTnrhvUNbEIs6GeX4hiugK1lDfthbv6.','Arjun Kapoor','9841062277','https://mymoonsgallery.com/media/artists/1791015645831-1043.webp','ACTIVE',NULL,0,NULL,'2025-12-10 08:20:46.709','2026-10-03 13:41:26.520'),('cmus4h652006s7k9oja5jhlje','lena@artgallery.local','$2b$12$1KBuaW7L6Ui.zNem/4dUuewt2sBAuwH6kEEup0uXxFHx9zd38HnZO','Lena Fischer','9887608575','https://mymoonsgallery.com/media/artists/1791015652181-1050.webp','ACTIVE',NULL,0,NULL,'2025-10-26 03:20:52.692','2026-10-03 13:41:28.841'),('cmus4h9jq008k7k9o8nyp4k95','kavya@artgallery.local','$2b$12$gQBpamtf.MVyOG3YzH5mX.z.AlvA8JHIHHWKx9euk6oxhG9KOISX6','Kavya Nair','9823998863','https://mymoonsgallery.com/media/artists/1791015656375-1057.webp','ACTIVE',NULL,0,NULL,'2025-09-23 21:20:57.108','2026-10-03 13:41:28.512'),('cmus4hdoo00aa7k9o06tq6x27','rohan@artgallery.local','$2b$12$6NzKIQMwhax98fJhgJ0YEe7UKKlAkbdkziV8u9oh9Z65gVjEqTPfa','Rohan Das','9818732038','https://mymoonsgallery.com/media/artists/1791015661693-1064.webp','ACTIVE',NULL,0,NULL,'2025-10-13 21:21:02.470','2026-10-03 13:41:30.163'),('cmus4hhxt00c07k9obd1cpsxz','sofia@artgallery.local','$2b$12$pbQjiqg/O/3Ub86IUgVVnONzfbh/PDv2I6YMMj8rdwOjVCd6cpJtq','Sofia Marques','9894258492','https://mymoonsgallery.com/media/artists/1791015667355-1071.webp','ACTIVE',NULL,0,NULL,'2026-02-16 01:21:07.984','2026-10-03 13:41:30.825'),('cmus4hr3d00dq7k9ojf1e19dk','vikram@artgallery.local','$2b$12$QQAt3DLTLqcGBTEdUmAKl.ISP77e7MtSPkWyCH0amyQZMXDgdcPja','Vikram Rathore','9822945532','https://mymoonsgallery.com/media/artists/1791015679084-1078.webp','ACTIVE',NULL,0,NULL,'2026-05-26 13:21:19.847','2026-10-03 13:41:31.891'),('cmus4hvaf00fg7k9o56ax8t3n','aiko@artgallery.local','$2b$12$j3v1FFBOsYsntHKo7l3TfOSAgEnFmL9wT2gUnMFOpTEg/RIllWtsa','Aiko Tanaka','9842548750','https://mymoonsgallery.com/media/artists/1791015684591-1085.webp','ACTIVE',NULL,0,NULL,'2026-03-10 04:21:25.285','2026-10-03 13:41:25.857'),('cmus4hxuj00gu7k9o9zblhchi','nikhil@artgallery.local','$2b$12$uKH6VCJtA7oYOZCCE/9I7e4WBbFsnRAchRjtSISDsQ0KLfDhT6beS','Nikhil Verma','9861458405','https://mymoonsgallery.com/media/artists/1791015688013-1091.webp','ACTIVE',NULL,0,NULL,'2025-11-17 22:21:28.601','2026-10-03 13:41:29.167'),('cmus4i12900ia7k9ohvw78scc','ananya@artgallery.local','$2b$12$7EYgo8UUoMlpcoxkvTQEXuTsGZNVNvE0g1UHhAQS.x/yDy942FSuK','Ananya Sen','9837693698','https://mymoonsgallery.com/media/artists/1791015691919-1097.webp','ACTIVE',NULL,0,NULL,'2025-11-24 07:21:32.761','2026-10-03 13:41:26.185'),('cmus4ibhq00jo7k9ow91upb79','rahul.mehta@artgallery.local','$2b$12$hyMUKp57sUADmRT1HL7vhua9kNp/tpkhAujdnNbDQfl45k4SjIDqW','Rahul Mehta','9844379925','https://mymoonsgallery.com/media/artists/1791015705462-1103.webp','ACTIVE',NULL,0,NULL,'2025-12-06 07:21:46.278','2026-10-03 13:41:29.838'),('cmus5zslf005p7ky0dyh0xhr5','ssudhakar4799@gmail.com','$2b$12$J3fnb048qB/2X8s6fn1jpui0VN/VJFf6JH/hogD0lC6FzUWbcRT.y','SUDHAKAR S','08220347695',NULL,'ACTIVE','2026-10-03 11:42:43.425',0,NULL,'2026-10-03 09:03:21.219','2026-10-03 13:41:31.190');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;

--
-- Table structure for table `UserRole`
--

DROP TABLE IF EXISTS `UserRole`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserRole` (
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `roleId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`userId`,`roleId`),
  KEY `UserRole_roleId_fkey` (`roleId`),
  CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserRole`
--

/*!40000 ALTER TABLE `UserRole` DISABLE KEYS */;
INSERT INTO `UserRole` (`userId`, `roleId`, `createdAt`) VALUES ('cmus3hxni00017km8borr3wyw','cmus3hxmu00007km8bmglljn5','2026-10-03 07:53:28.735'),('cmus4gw91002c7k9ozx8w96po','cmus4go7x00007k9ow2mr5cbk','2026-10-03 08:20:39.878'),('cmus4gwda002d7k9o6mkhzgmm','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:40.031'),('cmus4gwdt002h7k9oi4jryetb','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:40.049'),('cmus4gwe4002l7k9os8s52e2y','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:40.061'),('cmus4gwed002p7k9ot2pbzw4b','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:40.070'),('cmus4gweo002t7k9op2gzcjbm','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:40.081'),('cmus4gwex002x7k9oiu07kd0w','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:40.090'),('cmus4gwzb00317k9oa3ttabyd','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:40.823'),('cmus4gwzb00317k9oa3ttabyd','cmus4go8800017k9ootzkxb4d','2026-10-03 08:20:40.823'),('cmus4h1iv00527k9ojjjarwip','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:46.711'),('cmus4h1iv00527k9ojjjarwip','cmus4go8800017k9ootzkxb4d','2026-10-03 08:20:46.711'),('cmus4h652006s7k9oja5jhlje','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:52.694'),('cmus4h652006s7k9oja5jhlje','cmus4go8800017k9ootzkxb4d','2026-10-03 08:20:52.694'),('cmus4h9jq008k7k9o8nyp4k95','cmus3hxmu00007km8bmglljn5','2026-10-03 08:20:57.111'),('cmus4h9jq008k7k9o8nyp4k95','cmus4go8800017k9ootzkxb4d','2026-10-03 08:20:57.111'),('cmus4hdoo00aa7k9o06tq6x27','cmus3hxmu00007km8bmglljn5','2026-10-03 08:21:02.473'),('cmus4hdoo00aa7k9o06tq6x27','cmus4go8800017k9ootzkxb4d','2026-10-03 08:21:02.473'),('cmus4hhxt00c07k9obd1cpsxz','cmus3hxmu00007km8bmglljn5','2026-10-03 08:21:07.986'),('cmus4hhxt00c07k9obd1cpsxz','cmus4go8800017k9ootzkxb4d','2026-10-03 08:21:07.986'),('cmus4hr3d00dq7k9ojf1e19dk','cmus3hxmu00007km8bmglljn5','2026-10-03 08:21:19.849'),('cmus4hr3d00dq7k9ojf1e19dk','cmus4go8800017k9ootzkxb4d','2026-10-03 08:21:19.849'),('cmus4hvaf00fg7k9o56ax8t3n','cmus3hxmu00007km8bmglljn5','2026-10-03 08:21:25.287'),('cmus4hvaf00fg7k9o56ax8t3n','cmus4go8800017k9ootzkxb4d','2026-10-03 08:21:25.287'),('cmus4hxuj00gu7k9o9zblhchi','cmus3hxmu00007km8bmglljn5','2026-10-03 08:21:28.603'),('cmus4hxuj00gu7k9o9zblhchi','cmus4go8800017k9ootzkxb4d','2026-10-03 08:21:28.603'),('cmus4i12900ia7k9ohvw78scc','cmus3hxmu00007km8bmglljn5','2026-10-03 08:21:32.769'),('cmus4i12900ia7k9ohvw78scc','cmus4go8800017k9ootzkxb4d','2026-10-03 08:21:32.769'),('cmus4ibhq00jo7k9ow91upb79','cmus3hxmu00007km8bmglljn5','2026-10-03 08:21:46.287'),('cmus4ibhq00jo7k9ow91upb79','cmus4go8800017k9ootzkxb4d','2026-10-03 08:21:46.287'),('cmus5zslf005p7ky0dyh0xhr5','cmus3hxmu00007km8bmglljn5','2026-10-03 09:03:21.219'),('cmus5zslf005p7ky0dyh0xhr5','cmus4go8800017k9ootzkxb4d','2026-10-03 09:03:21.219');
/*!40000 ALTER TABLE `UserRole` ENABLE KEYS */;

--
-- Table structure for table `Wishlist`
--

DROP TABLE IF EXISTS `Wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Wishlist` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'My Wishlist',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Wishlist_userId_idx` (`userId`),
  CONSTRAINT `Wishlist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Wishlist`
--

/*!40000 ALTER TABLE `Wishlist` DISABLE KEYS */;
INSERT INTO `Wishlist` (`id`, `userId`, `name`, `createdAt`) VALUES ('cmus3hxns00037km8ew0kmy9b','cmus3hxni00017km8borr3wyw','My Wishlist','2026-10-03 07:53:28.735'),('cmus4gwdb002f7k9o3ha7i0kk','cmus4gwda002d7k9o6mkhzgmm','My Wishlist','2026-10-03 08:20:40.031'),('cmus4gwdt002j7k9of1vpud9n','cmus4gwdt002h7k9oi4jryetb','My Wishlist','2026-10-03 08:20:40.049'),('cmus4gwe4002n7k9opq2dwe3j','cmus4gwe4002l7k9os8s52e2y','My Wishlist','2026-10-03 08:20:40.061'),('cmus4gwee002r7k9o54obtzec','cmus4gwed002p7k9ot2pbzw4b','My Wishlist','2026-10-03 08:20:40.070'),('cmus4gweo002v7k9o88hb5q7g','cmus4gweo002t7k9op2gzcjbm','My Wishlist','2026-10-03 08:20:40.081'),('cmus4gwex002z7k9ondjugkjk','cmus4gwex002x7k9oiu07kd0w','My Wishlist','2026-10-03 08:20:40.090'),('cmus4gwzb00337k9owczciogn','cmus4gwzb00317k9oa3ttabyd','My Wishlist','2026-10-03 08:20:40.823'),('cmus4h1iv00547k9ohwtaz7ms','cmus4h1iv00527k9ojjjarwip','My Wishlist','2026-10-03 08:20:46.711'),('cmus4h652006u7k9ooekyy0t7','cmus4h652006s7k9oja5jhlje','My Wishlist','2026-10-03 08:20:52.694'),('cmus4h9jq008m7k9oekzxk14e','cmus4h9jq008k7k9o8nyp4k95','My Wishlist','2026-10-03 08:20:57.111'),('cmus4hdoo00ac7k9ohe7tthde','cmus4hdoo00aa7k9o06tq6x27','My Wishlist','2026-10-03 08:21:02.473'),('cmus4hhxu00c27k9obx7yrxvd','cmus4hhxt00c07k9obd1cpsxz','My Wishlist','2026-10-03 08:21:07.986'),('cmus4hr3d00ds7k9o6fpr0ygb','cmus4hr3d00dq7k9ojf1e19dk','My Wishlist','2026-10-03 08:21:19.849'),('cmus4hvaf00fi7k9om9rx74ly','cmus4hvaf00fg7k9o56ax8t3n','My Wishlist','2026-10-03 08:21:25.287'),('cmus4hxuj00gw7k9o744dtel3','cmus4hxuj00gu7k9o9zblhchi','My Wishlist','2026-10-03 08:21:28.603'),('cmus4i12900ic7k9oe85k9dci','cmus4i12900ia7k9ohvw78scc','My Wishlist','2026-10-03 08:21:32.769'),('cmus4ibhq00jq7k9om8b135fe','cmus4ibhq00jo7k9ow91upb79','My Wishlist','2026-10-03 08:21:46.287'),('cmus5zslg005r7ky0pmptqsap','cmus5zslf005p7ky0dyh0xhr5','My Wishlist','2026-10-03 09:03:21.219');
/*!40000 ALTER TABLE `Wishlist` ENABLE KEYS */;

--
-- Table structure for table `WishlistItem`
--

DROP TABLE IF EXISTS `WishlistItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WishlistItem` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wishlistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemType` enum('ARTWORK','ARTIST','GALLERY','COLLECTION') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artworkId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `artistId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `galleryId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collectionId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `WishlistItem_wishlistId_itemType_targetId_key` (`wishlistId`,`itemType`,`targetId`),
  KEY `WishlistItem_artworkId_fkey` (`artworkId`),
  KEY `WishlistItem_collectionId_fkey` (`collectionId`),
  CONSTRAINT `WishlistItem_artworkId_fkey` FOREIGN KEY (`artworkId`) REFERENCES `Artwork` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WishlistItem_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `ArtworkCollection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WishlistItem_wishlistId_fkey` FOREIGN KEY (`wishlistId`) REFERENCES `Wishlist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WishlistItem`
--

/*!40000 ALTER TABLE `WishlistItem` DISABLE KEYS */;
INSERT INTO `WishlistItem` (`id`, `wishlistId`, `itemType`, `targetId`, `artworkId`, `artistId`, `galleryId`, `collectionId`, `createdAt`) VALUES ('cmus4iccs00ke7k9oh1bn51ta','cmus4gwdb002f7k9o3ha7i0kk','ARTWORK','cmus4gyfz003q7k9o4bmryodo','cmus4gyfz003q7k9o4bmryodo',NULL,NULL,NULL,'2026-10-03 08:21:47.405'),('cmus4icd000kg7k9o46uai1cf','cmus4gwdb002f7k9o3ha7i0kk','ARTWORK','cmus4h5qe006j7k9ozq878v35','cmus4h5qe006j7k9ozq878v35',NULL,NULL,NULL,'2026-10-03 08:21:47.412'),('cmus4icd800ki7k9ozqhv14i5','cmus4gwdb002f7k9o3ha7i0kk','ARTWORK','cmus4hc8k009s7k9ozp0cb1rf','cmus4hc8k009s7k9ozp0cb1rf',NULL,NULL,NULL,'2026-10-03 08:21:47.420'),('cmus4icde00kk7k9oacorrfus','cmus4gwdb002f7k9o3ha7i0kk','ARTWORK','cmus4hmp100cy7k9orpyduwko','cmus4hmp100cy7k9orpyduwko',NULL,NULL,NULL,'2026-10-03 08:21:47.426'),('cmus4icdk00km7k9oolsy47po','cmus4gwdb002f7k9o3ha7i0kk','ARTWORK','cmus4hwee00g37k9oy0r428li','cmus4hwee00g37k9oy0r428li',NULL,NULL,NULL,'2026-10-03 08:21:47.432'),('cmus4icdp00ko7k9o8xtov76i','cmus4gwdb002f7k9o3ha7i0kk','ARTIST','cmus4h1iv00557k9oobpdcfx0',NULL,'cmus4h1iv00557k9oobpdcfx0',NULL,NULL,'2026-10-03 08:21:47.438'),('cmus4icdu00kq7k9ocyduovly','cmus4gwdb002f7k9o3ha7i0kk','ARTIST','cmus4h652006v7k9od0w60tg6',NULL,'cmus4h652006v7k9od0w60tg6',NULL,NULL,'2026-10-03 08:21:47.443'),('cmus4ice000ks7k9oq9q6xpd1','cmus4gwdb002f7k9o3ha7i0kk','COLLECTION','cmus4ic4x00k27k9ojpl6wemg',NULL,NULL,NULL,'cmus4ic4x00k27k9ojpl6wemg','2026-10-03 08:21:47.449'),('cmusbo69q001l7kg8390j0pc0','cmus4gwdb002f7k9o3ha7i0kk','ARTIST','cmus5zslg005s7ky0dymbgs16',NULL,'cmus5zslg005s7ky0dymbgs16',NULL,NULL,'2026-10-03 11:42:16.766');
/*!40000 ALTER TABLE `WishlistItem` ENABLE KEYS */;

--
-- Table structure for table `_ArtistMediums`
--

DROP TABLE IF EXISTS `_ArtistMediums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_ArtistMediums` (
  `A` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `B` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  UNIQUE KEY `_ArtistMediums_AB_unique` (`A`,`B`),
  KEY `_ArtistMediums_B_index` (`B`),
  CONSTRAINT `_ArtistMediums_A_fkey` FOREIGN KEY (`A`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ArtistMediums_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArtworkMedium` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_ArtistMediums`
--

/*!40000 ALTER TABLE `_ArtistMediums` DISABLE KEYS */;
INSERT INTO `_ArtistMediums` (`A`, `B`) VALUES ('cmus4gwzb00347k9o7jpqfl1i','cmus4gogv000p7k9o8h1s6jzn'),('cmus4h1iv00557k9oobpdcfx0','cmus4gogv000p7k9o8h1s6jzn'),('cmus4h652006v7k9od0w60tg6','cmus4gogv000p7k9o8h1s6jzn'),('cmus4h9jq008n7k9okcz2sm88','cmus4gogv000p7k9o8h1s6jzn'),('cmus4hhxu00c37k9ofrmv5glr','cmus4gogv000p7k9o8h1s6jzn'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4gogv000p7k9o8h1s6jzn'),('cmus4hxuj00gx7k9omkclsld2','cmus4gogv000p7k9o8h1s6jzn'),('cmus4i12900id7k9oc65g1ku8','cmus4gogv000p7k9o8h1s6jzn'),('cmus4ibhr00jr7k9oh68g6fvx','cmus4gogv000p7k9o8h1s6jzn'),('cmus4gwzb00347k9o7jpqfl1i','cmus4goh5000q7k9obwnez6v1'),('cmus4h1iv00557k9oobpdcfx0','cmus4goh5000q7k9obwnez6v1'),('cmus4h652006v7k9od0w60tg6','cmus4goh5000q7k9obwnez6v1'),('cmus4h9jq008n7k9okcz2sm88','cmus4goh5000q7k9obwnez6v1'),('cmus4hhxu00c37k9ofrmv5glr','cmus4goh5000q7k9obwnez6v1'),('cmus4hr3d00dt7k9o6wgfdg7o','cmus4goh5000q7k9obwnez6v1'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4goh5000q7k9obwnez6v1'),('cmus4hxuj00gx7k9omkclsld2','cmus4goh5000q7k9obwnez6v1'),('cmus4i12900id7k9oc65g1ku8','cmus4goh5000q7k9obwnez6v1'),('cmus4ibhr00jr7k9oh68g6fvx','cmus4goh5000q7k9obwnez6v1'),('cmus4gwzb00347k9o7jpqfl1i','cmus4gohb000r7k9oh2wb4nft'),('cmus4h9jq008n7k9okcz2sm88','cmus4gohb000r7k9oh2wb4nft'),('cmus4hhxu00c37k9ofrmv5glr','cmus4gohb000r7k9oh2wb4nft'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4gohb000r7k9oh2wb4nft'),('cmus4hdoo00ad7k9okljt2ll3','cmus4gohi000s7k9ohugznf96'),('cmus4hdoo00ad7k9okljt2ll3','cmus4goho000t7k9obtbkvvix'),('cmus4gwzb00347k9o7jpqfl1i','cmus4goht000u7k9om3hzgnyt'),('cmus4h652006v7k9od0w60tg6','cmus4goht000u7k9om3hzgnyt'),('cmus4hr3d00dt7k9o6wgfdg7o','cmus4goht000u7k9om3hzgnyt'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4goi5000w7k9owkuv8zqy'),('cmus4hxuj00gx7k9omkclsld2','cmus4goi5000w7k9owkuv8zqy'),('cmus4h1iv00557k9oobpdcfx0','cmus4goib000x7k9ojt1mur97'),('cmus4h652006v7k9od0w60tg6','cmus4goib000x7k9ojt1mur97'),('cmus4hxuj00gx7k9omkclsld2','cmus4goib000x7k9ojt1mur97'),('cmus4i12900id7k9oc65g1ku8','cmus4goib000x7k9ojt1mur97'),('cmus4ibhr00jr7k9oh68g6fvx','cmus4goib000x7k9ojt1mur97'),('cmus4gwzb00347k9o7jpqfl1i','cmus4goii000y7k9oc3i8bt6e'),('cmus4hr3d00dt7k9o6wgfdg7o','cmus4goii000y7k9oc3i8bt6e'),('cmus4h652006v7k9od0w60tg6','cmus4goiu00107k9o702pifv0');
/*!40000 ALTER TABLE `_ArtistMediums` ENABLE KEYS */;

--
-- Table structure for table `_ArtistStyles`
--

DROP TABLE IF EXISTS `_ArtistStyles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_ArtistStyles` (
  `A` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `B` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  UNIQUE KEY `_ArtistStyles_AB_unique` (`A`,`B`),
  KEY `_ArtistStyles_B_index` (`B`),
  CONSTRAINT `_ArtistStyles_A_fkey` FOREIGN KEY (`A`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ArtistStyles_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArtworkStyle` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_ArtistStyles`
--

/*!40000 ALTER TABLE `_ArtistStyles` DISABLE KEYS */;
INSERT INTO `_ArtistStyles` (`A`, `B`) VALUES ('cmus4gwzb00347k9o7jpqfl1i','cmus4gtc5001s7k9oj0kyz9e7'),('cmus4hhxu00c37k9ofrmv5glr','cmus4gtc5001s7k9oj0kyz9e7'),('cmus4h1iv00557k9oobpdcfx0','cmus4gtku001t7k9ofpj2dwqe'),('cmus4h652006v7k9od0w60tg6','cmus4gtku001t7k9ofpj2dwqe'),('cmus4hhxu00c37k9ofrmv5glr','cmus4gtku001t7k9ofpj2dwqe'),('cmus4hxuj00gx7k9omkclsld2','cmus4gtku001t7k9ofpj2dwqe'),('cmus4i12900id7k9oc65g1ku8','cmus4gtku001t7k9ofpj2dwqe'),('cmus4ibhr00jr7k9oh68g6fvx','cmus4gtku001t7k9ofpj2dwqe'),('cmus4h652006v7k9od0w60tg6','cmus4gtoi001u7k9oots34sv5'),('cmus4h1iv00557k9oobpdcfx0','cmus4gtsh001v7k9ob8d4ynp9'),('cmus4h652006v7k9od0w60tg6','cmus4gtsh001v7k9ob8d4ynp9'),('cmus4hxuj00gx7k9omkclsld2','cmus4gtsh001v7k9ob8d4ynp9'),('cmus4i12900id7k9oc65g1ku8','cmus4gtsh001v7k9ob8d4ynp9'),('cmus4ibhr00jr7k9oh68g6fvx','cmus4gtsh001v7k9ob8d4ynp9'),('cmus4gwzb00347k9o7jpqfl1i','cmus4gu00001w7k9odof3qzvo'),('cmus4h1iv00557k9oobpdcfx0','cmus4gu00001w7k9odof3qzvo'),('cmus4h652006v7k9od0w60tg6','cmus4gu00001w7k9odof3qzvo'),('cmus4h9jq008n7k9okcz2sm88','cmus4gu00001w7k9odof3qzvo'),('cmus4hhxu00c37k9ofrmv5glr','cmus4gu00001w7k9odof3qzvo'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4gu00001w7k9odof3qzvo'),('cmus4hxuj00gx7k9omkclsld2','cmus4gu00001w7k9odof3qzvo'),('cmus4i12900id7k9oc65g1ku8','cmus4gu00001w7k9odof3qzvo'),('cmus4ibhr00jr7k9oh68g6fvx','cmus4gu00001w7k9odof3qzvo'),('cmus4h652006v7k9od0w60tg6','cmus4gu3m001x7k9ofmpz6tg5'),('cmus4gwzb00347k9o7jpqfl1i','cmus4gu8e001y7k9oz5xq41od'),('cmus4h9jq008n7k9okcz2sm88','cmus4gu8e001y7k9oz5xq41od'),('cmus4hhxu00c37k9ofrmv5glr','cmus4gu8e001y7k9oz5xq41od'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4gu8e001y7k9oz5xq41od'),('cmus4gwzb00347k9o7jpqfl1i','cmus4gucy001z7k9oi3s6qrwm'),('cmus4hhxu00c37k9ofrmv5glr','cmus4gucy001z7k9oi3s6qrwm'),('cmus4hdoo00ad7k9okljt2ll3','cmus4gul200207k9oqku6stis'),('cmus4hdoo00ad7k9okljt2ll3','cmus4gusi00217k9o51xv84gk'),('cmus4gwzb00347k9o7jpqfl1i','cmus4guyq00227k9o6crc34vc'),('cmus4h9jq008n7k9okcz2sm88','cmus4guyq00227k9o6crc34vc'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4guyq00227k9o6crc34vc'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4gv2n00237k9o8n9gd2m9'),('cmus4hxuj00gx7k9omkclsld2','cmus4gv2n00237k9o8n9gd2m9'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4gv6g00247k9okpq70t61'),('cmus4hxuj00gx7k9omkclsld2','cmus4gv6g00247k9okpq70t61'),('cmus4gwzb00347k9o7jpqfl1i','cmus4gvcn00257k9ozbmxla8t'),('cmus4h9jq008n7k9okcz2sm88','cmus4gvcn00257k9ozbmxla8t'),('cmus4hvaf00fj7k9omlgiu1hu','cmus4gvcn00257k9ozbmxla8t'),('cmus4h652006v7k9od0w60tg6','cmus4gvg900267k9o2p0w6k5j'),('cmus4gwzb00347k9o7jpqfl1i','cmus4gvmi00277k9oquh3ad2j'),('cmus4hr3d00dt7k9o6wgfdg7o','cmus4gvmi00277k9oquh3ad2j'),('cmus4gwzb00347k9o7jpqfl1i','cmus4gvsf00287k9oot5tjwnl'),('cmus4hr3d00dt7k9o6wgfdg7o','cmus4gvsf00287k9oot5tjwnl'),('cmus4gwzb00347k9o7jpqfl1i','cmus4gvzg00297k9o6kn3c8h0'),('cmus4hr3d00dt7k9o6wgfdg7o','cmus4gvzg00297k9o6kn3c8h0');
/*!40000 ALTER TABLE `_ArtistStyles` ENABLE KEYS */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES ('c47c2375-71d5-4a3f-8572-6aaf3682ac02','39b3045e46baab29df303c398a6ff5b31e57edceff7e9b5e615e48a51ec2b702','2026-10-03 07:52:41.873','20261003075232_init',NULL,NULL,'2026-10-03 07:52:32.175',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;



SET FOREIGN_KEY_CHECKS = 1;
