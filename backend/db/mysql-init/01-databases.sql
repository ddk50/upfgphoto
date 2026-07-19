-- ローカル用の各環境DBを初回起動時に作成
CREATE DATABASE IF NOT EXISTS uprun_development CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS uprun_test CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS uprun_staging CHARACTER SET utf8mb4;
GRANT ALL ON uprun_development.* TO 'uprun'@'%';
GRANT ALL ON uprun_test.* TO 'uprun'@'%';
GRANT ALL ON uprun_staging.* TO 'uprun'@'%';
FLUSH PRIVILEGES;
