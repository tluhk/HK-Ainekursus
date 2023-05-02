#!/bin/bash

set -x
set -e

# Load environment variables for setup-docker.sh from .env file
export $(grep -v '^#' .env | grep -E 'MYSQL_ROOT_PASSWORD' | xargs)

# Remove containers
echo "Stop and remove haapsalu-app container. Keep haapsalu-mariadb container if it already exists..." 2>&1
docker rm -f haapsalu-app

# Delete Docker image
echo "Deleting Docker image..." 2>&1
docker image rm -f haapsalu || (echo "Image haapsalu didn't exist so not removed."; exit 0)

# Build the Docker image
echo "Building Docker image..." 2>&1
docker build -t haapsalu .

# Wait for the image to be built
echo "Waiting for Docker image to be built..." 2>&1
while [ -z "$(docker images -q haapsalu)" ]
do
    sleep 1
done

# Build and start the Docker containers in detached mode
echo "Starting Docker containers..." 2>&1
docker compose up -d

# Wait for containers to start
while ! docker ps | grep -qE 'haapsalu-app|haapsalu-mariadb'; do
  sleep 1
done
echo "Containers have started!" 2>&1

# Wait for 10 seconds before starting containers again
echo "Waiting for containers to initialize..."
echo "Logging haapsalu-mariadb..."
docker logs haapsalu-mariadb
sleep 60

# Create database inside the haapsalu mariadb- container's mysql server
echo "Create database in haapsalu-mariadb container..."

docker exec haapsalu-mariadb mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -h haapsalu-mariadb -P 3306 -e "CREATE DATABASE IF NOT EXISTS \`course_management\`; USE \`course_management\`; CREATE TABLE IF NOT EXISTS \`users\` ( \`id\` INT NOT NULL AUTO_INCREMENT, \`githubID\` CHAR(12) NOT NULL DEFAULT '' UNIQUE, \`username\` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '', \`displayName\` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci, \`email\` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci, PRIMARY KEY (\`id\`) ); CREATE TABLE IF NOT EXISTS \`users_progress\` (\`githubID\` CHAR(12) NOT NULL DEFAULT '',\`courseCode\` CHAR(12) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',\`markedAsDoneComponents\` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '{}');"

# Wait for 30 seconds before starting containers again
echo "Waiting for database to initialize..."
sleep 40

# Start the Docker containers again
echo "Starting Docker containers again..." 2>&1
docker compose up

sleep 20

echo "Script completed successfully." 2>&1
