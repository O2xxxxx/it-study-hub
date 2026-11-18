-- 测试库建表脚本：仅补齐缺失的表，不删库、不删数据。
-- 测试基类使用 @Transactional，每个用例结束后回滚，因此这里不做任何清空。
CREATE TABLE IF NOT EXISTS app_user (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(32)     NOT NULL,
  password_hash VARCHAR(100)    NOT NULL,
  nickname      VARCHAR(32)     NOT NULL,
  avatar_hue    SMALLINT        NOT NULL DEFAULT 210,
  points        INT             NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_username (username),
  CONSTRAINT ck_user_points_nonneg CHECK (points >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS section (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(32)     NOT NULL,
  name        VARCHAR(32)     NOT NULL,
  tagline     VARCHAR(120)    NOT NULL,
  description VARCHAR(500)    NOT NULL,
  icon        VARCHAR(32)     NOT NULL,
  accent      VARCHAR(16)     NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_section_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS article (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id     BIGINT UNSIGNED NOT NULL,
  author_id      BIGINT UNSIGNED NOT NULL,
  title          VARCHAR(120)    NOT NULL,
  summary        VARCHAR(300)    NOT NULL DEFAULT '',
  content_md     MEDIUMTEXT      NOT NULL,
  reward_granted TINYINT(1)      NOT NULL DEFAULT 0,
  view_count     INT             NOT NULL DEFAULT 0,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_article_section (section_id, created_at),
  KEY idx_article_author (author_id, created_at),
  CONSTRAINT fk_article_section FOREIGN KEY (section_id) REFERENCES section (id),
  CONSTRAINT fk_article_author  FOREIGN KEY (author_id)  REFERENCES app_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS question (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id         BIGINT UNSIGNED NOT NULL,
  author_id          BIGINT UNSIGNED NOT NULL,
  title              VARCHAR(160)    NOT NULL,
  content_md         TEXT            NOT NULL,
  answer_count       INT             NOT NULL DEFAULT 0,
  accepted_answer_id BIGINT UNSIGNED NULL,
  solved             TINYINT(1)      NOT NULL DEFAULT 0,
  view_count         INT             NOT NULL DEFAULT 0,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_question_section (section_id, created_at),
  KEY idx_question_solved (solved, created_at),
  CONSTRAINT fk_question_section FOREIGN KEY (section_id) REFERENCES section (id),
  CONSTRAINT fk_question_author  FOREIGN KEY (author_id)  REFERENCES app_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS answer (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  author_id   BIGINT UNSIGNED NOT NULL,
  content_md  TEXT            NOT NULL,
  is_accepted TINYINT(1)      NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_answer_question_author (question_id, author_id),
  KEY idx_answer_question (question_id),
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES question (id),
  CONSTRAINT fk_answer_author   FOREIGN KEY (author_id)   REFERENCES app_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resource (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id     BIGINT UNSIGNED NOT NULL,
  uploader_id    BIGINT UNSIGNED NOT NULL,
  title          VARCHAR(120)    NOT NULL,
  description    VARCHAR(600)    NOT NULL,
  file_name      VARCHAR(160)    NOT NULL,
  file_type      VARCHAR(16)     NOT NULL,
  file_size      BIGINT          NOT NULL DEFAULT 0,
  points         INT             NOT NULL DEFAULT 5,
  download_count INT             NOT NULL DEFAULT 0,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_resource_section (section_id, created_at),
  CONSTRAINT fk_resource_section  FOREIGN KEY (section_id)  REFERENCES section (id),
  CONSTRAINT fk_resource_uploader FOREIGN KEY (uploader_id) REFERENCES app_user (id),
  CONSTRAINT ck_resource_points CHECK (points > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resource_exchange (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  resource_id BIGINT UNSIGNED NOT NULL,
  points_cost INT             NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_exchange_user_resource (user_id, resource_id),
  KEY idx_exchange_user (user_id, created_at),
  CONSTRAINT fk_exchange_user     FOREIGN KEY (user_id)     REFERENCES app_user (id),
  CONSTRAINT fk_exchange_resource FOREIGN KEY (resource_id) REFERENCES resource (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS point_log (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  change_amount INT             NOT NULL,
  balance_after INT             NOT NULL,
  reason_type   VARCHAR(32)     NOT NULL,
  reason_desc   VARCHAR(200)    NOT NULL,
  ref_type      VARCHAR(16)     NULL,
  ref_id        BIGINT UNSIGNED NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_point_log_user (user_id, id),
  UNIQUE KEY uk_point_log_business (user_id, reason_type, ref_id),
  CONSTRAINT fk_point_log_user FOREIGN KEY (user_id) REFERENCES app_user (id),
  CONSTRAINT ck_point_log_nonzero CHECK (change_amount <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favorite (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(16)     NOT NULL,
  target_id   BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_favorite_target (user_id, target_type, target_id),
  KEY idx_favorite_user (user_id, target_type),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES app_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS draft (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  draft_type VARCHAR(16)     NOT NULL,
  draft_key  VARCHAR(24)     NOT NULL,
  title      VARCHAR(160)    NOT NULL DEFAULT '',
  section_id BIGINT UNSIGNED NULL,
  content_md MEDIUMTEXT      NOT NULL,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_draft_slot (user_id, draft_type, draft_key),
  CONSTRAINT fk_draft_user FOREIGN KEY (user_id) REFERENCES app_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
