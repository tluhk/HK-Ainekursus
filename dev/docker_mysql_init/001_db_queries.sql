CREATE USER root@localhost IDENTIFIED BY 'password';
grant all privileges on *.* to root@localhost with grant option;

CREATE DATABASE IF NOT EXISTS course_management;

USE course_management;

CREATE TABLE IF NOT EXISTS `users` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`githubID` CHAR(12) NOT NULL DEFAULT '' UNIQUE,
	`username` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
	`displayName` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci,
	`email` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci,
	PRIMARY KEY (`id`)
);

INSERT INTO users (githubID, username, displayName, email) VALUES (1234, 'seppkh', NULL, NULL);