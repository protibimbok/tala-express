CREATE TABLE IF NOT EXISTS `tala` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `token` varchar(100) NOT NULL,
  `saved` boolean NOT NULL DEFAULT 0,
  `expires` datetime DEFAULT NULL,
  `browser` TEXT NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE `User Token` (`user_id`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;