-- Point every stored image URL at the API host that serves /media.
-- Run once in phpMyAdmin (select your database → SQL tab → paste → Go). Safe to run again.
-- Old: https://mymoonsgallery.com, http://localhost:4000
-- New: https://artgalleryapi.mymoonsgallery.com

SET NAMES utf8mb4;

UPDATE `Artist` SET `avatarUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`avatarUrl`, 27)) WHERE `avatarUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `Artist` SET `coverImageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`coverImageUrl`, 27)) WHERE `coverImageUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `Artwork` SET `previewUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`previewUrl`, 27)) WHERE `previewUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `Artwork` SET `thumbnailUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`thumbnailUrl`, 27)) WHERE `thumbnailUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `ArtworkCategory` SET `imageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`imageUrl`, 27)) WHERE `imageUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `ArtworkCollection` SET `coverImageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`coverImageUrl`, 27)) WHERE `coverImageUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `ArtworkImage` SET `thumbUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`thumbUrl`, 27)) WHERE `thumbUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `ArtworkImage` SET `url` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`url`, 27)) WHERE `url` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `ArtworkStyle` SET `imageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`imageUrl`, 27)) WHERE `imageUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `Banner` SET `imageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`imageUrl`, 27)) WHERE `imageUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `Gallery` SET `coverImageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`coverImageUrl`, 27)) WHERE `coverImageUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `GalleryImage` SET `url` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`url`, 27)) WHERE `url` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `OrderItem` SET `imageSnapshot` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`imageSnapshot`, 27)) WHERE `imageSnapshot` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `ReviewImage` SET `url` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`url`, 27)) WHERE `url` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `User` SET `avatarUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`avatarUrl`, 27)) WHERE `avatarUrl` LIKE 'https://mymoonsgallery.com/media/%';
UPDATE `Artist` SET `avatarUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`avatarUrl`, 22)) WHERE `avatarUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `Artist` SET `coverImageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`coverImageUrl`, 22)) WHERE `coverImageUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `Artwork` SET `previewUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`previewUrl`, 22)) WHERE `previewUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `Artwork` SET `thumbnailUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`thumbnailUrl`, 22)) WHERE `thumbnailUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `ArtworkCategory` SET `imageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`imageUrl`, 22)) WHERE `imageUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `ArtworkCollection` SET `coverImageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`coverImageUrl`, 22)) WHERE `coverImageUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `ArtworkImage` SET `thumbUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`thumbUrl`, 22)) WHERE `thumbUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `ArtworkImage` SET `url` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`url`, 22)) WHERE `url` LIKE 'http://localhost:4000/media/%';
UPDATE `ArtworkStyle` SET `imageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`imageUrl`, 22)) WHERE `imageUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `Banner` SET `imageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`imageUrl`, 22)) WHERE `imageUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `Gallery` SET `coverImageUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`coverImageUrl`, 22)) WHERE `coverImageUrl` LIKE 'http://localhost:4000/media/%';
UPDATE `GalleryImage` SET `url` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`url`, 22)) WHERE `url` LIKE 'http://localhost:4000/media/%';
UPDATE `OrderItem` SET `imageSnapshot` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`imageSnapshot`, 22)) WHERE `imageSnapshot` LIKE 'http://localhost:4000/media/%';
UPDATE `ReviewImage` SET `url` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`url`, 22)) WHERE `url` LIKE 'http://localhost:4000/media/%';
UPDATE `User` SET `avatarUrl` = CONCAT('https://artgalleryapi.mymoonsgallery.com', SUBSTRING(`avatarUrl`, 22)) WHERE `avatarUrl` LIKE 'http://localhost:4000/media/%';

-- Check: should return 0
SELECT COUNT(*) AS old_links_left FROM `ArtworkImage` WHERE `url` NOT LIKE 'https://artgalleryapi.mymoonsgallery.com/media/%';
