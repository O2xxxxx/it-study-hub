-- ============================================================
--  IT 学习天地 · 数据库结构（MySQL 8.0）
--  用法：mysql -h127.0.0.1 -P3307 -uroot -p < db/schema.sql
--  脚本可重复执行：会重建库与全部表，请勿在有正式数据的环境直接运行
-- ============================================================
DROP DATABASE IF EXISTS itstudy;
CREATE DATABASE itstudy DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE itstudy;

-- ------------------------------------------------------------
-- 会员
-- ------------------------------------------------------------
CREATE TABLE app_user (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(32)     NOT NULL COMMENT '登录名，唯一',
  password_hash VARCHAR(100)    NOT NULL COMMENT 'BCrypt 散列，绝不存明文',
  nickname      VARCHAR(32)     NOT NULL COMMENT '展示昵称',
  avatar_hue    SMALLINT        NOT NULL DEFAULT 210 COMMENT '头像色相，前端生成渐变色块',
  points        INT             NOT NULL DEFAULT 0 COMMENT '当前积分余额',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_username (username),
  CONSTRAINT ck_user_points_nonneg CHECK (points >= 0)
) ENGINE=InnoDB COMMENT='会员账号与积分余额';

-- ------------------------------------------------------------
-- 技术版块
-- ------------------------------------------------------------
CREATE TABLE section (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(32)     NOT NULL COMMENT '英文标识，用于 URL：java / database / frontend',
  name        VARCHAR(32)     NOT NULL,
  tagline     VARCHAR(120)    NOT NULL COMMENT '一句话定位',
  description VARCHAR(500)    NOT NULL,
  icon        VARCHAR(32)     NOT NULL COMMENT '前端 Lucide 图标名',
  accent      VARCHAR(16)     NOT NULL COMMENT '版块强调色 token',
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_section_code (code)
) ENGINE=InnoDB COMMENT='按专业方向划分的技术版块';

-- ------------------------------------------------------------
-- 文章
-- ------------------------------------------------------------
CREATE TABLE article (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id     BIGINT UNSIGNED NOT NULL,
  author_id      BIGINT UNSIGNED NOT NULL,
  title          VARCHAR(120)    NOT NULL,
  summary        VARCHAR(300)    NOT NULL DEFAULT '' COMMENT '列表摘要，取正文首段',
  content_md     MEDIUMTEXT      NOT NULL COMMENT 'Markdown 原文',
  reward_granted TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否已发放首次发布奖励',
  view_count     INT             NOT NULL DEFAULT 0,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_article_section (section_id, created_at),
  KEY idx_article_author (author_id, created_at),
  CONSTRAINT fk_article_section FOREIGN KEY (section_id) REFERENCES section (id),
  CONSTRAINT fk_article_author  FOREIGN KEY (author_id)  REFERENCES app_user (id)
) ENGINE=InnoDB COMMENT='技术文章';

-- ------------------------------------------------------------
-- 问答
-- ------------------------------------------------------------
CREATE TABLE question (
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
) ENGINE=InnoDB COMMENT='提问，采纳状态独立于回答奖励';

CREATE TABLE answer (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  author_id   BIGINT UNSIGNED NOT NULL,
  content_md  TEXT            NOT NULL,
  is_accepted TINYINT(1)      NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- 同一会员对同一问题只能有一条有效回答：奖励只可能发一次
  UNIQUE KEY uk_answer_question_author (question_id, author_id),
  KEY idx_answer_question (question_id),
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES question (id),
  CONSTRAINT fk_answer_author   FOREIGN KEY (author_id)   REFERENCES app_user (id)
) ENGINE=InnoDB COMMENT='回答，问题+答主唯一';

-- ------------------------------------------------------------
-- 资源（技术资料）
-- ------------------------------------------------------------
CREATE TABLE resource (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id    BIGINT UNSIGNED NOT NULL,
  uploader_id   BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(120)    NOT NULL,
  description   VARCHAR(600)    NOT NULL,
  file_name     VARCHAR(160)    NOT NULL COMMENT '受控目录内的文件名',
  file_type     VARCHAR(16)     NOT NULL COMMENT 'MD / TXT / ZIP',
  file_size     BIGINT          NOT NULL DEFAULT 0 COMMENT '字节',
  points        INT             NOT NULL DEFAULT 5 COMMENT '兑换所需积分',
  download_count INT            NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_resource_section (section_id, created_at),
  CONSTRAINT fk_resource_section  FOREIGN KEY (section_id)  REFERENCES section (id),
  CONSTRAINT fk_resource_uploader FOREIGN KEY (uploader_id) REFERENCES app_user (id),
  CONSTRAINT ck_resource_points CHECK (points > 0)
) ENGINE=InnoDB COMMENT='可兑换的技术资料，文件本身保存在受控目录';

CREATE TABLE resource_exchange (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  resource_id BIGINT UNSIGNED NOT NULL,
  points_cost INT             NOT NULL COMMENT '当时扣减的积分快照',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- 同一个人对同一资源最多一条兑换记录：重复兑换在数据库层面就不可能
  UNIQUE KEY uk_exchange_user_resource (user_id, resource_id),
  KEY idx_exchange_user (user_id, created_at),
  CONSTRAINT fk_exchange_user     FOREIGN KEY (user_id)     REFERENCES app_user (id),
  CONSTRAINT fk_exchange_resource FOREIGN KEY (resource_id) REFERENCES resource (id)
) ENGINE=InnoDB COMMENT='兑换记录：唯一键保证不重复扣分';

-- ------------------------------------------------------------
-- 积分流水
-- ------------------------------------------------------------
CREATE TABLE point_log (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  change_amount INT             NOT NULL COMMENT '正为增加，负为扣减',
  balance_after INT             NOT NULL COMMENT '本次变动后的余额快照',
  reason_type   VARCHAR(32)     NOT NULL COMMENT 'ARTICLE_PUBLISH / ANSWER_REWARD / RESOURCE_EXCHANGE',
  reason_desc   VARCHAR(200)    NOT NULL,
  ref_type      VARCHAR(32)     NULL COMMENT 'article / answer / resource',
  ref_id        BIGINT UNSIGNED NULL COMMENT '关联业务主键，用于跳转',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_point_log_user (user_id, id),
  -- 同一笔业务对同一人只能产生一条流水：重复提交不会重复加分/扣分
  UNIQUE KEY uk_point_log_business (user_id, reason_type, ref_id),
  CONSTRAINT fk_point_log_user FOREIGN KEY (user_id) REFERENCES app_user (id),
  CONSTRAINT ck_point_log_nonzero CHECK (change_amount <> 0)
) ENGINE=InnoDB COMMENT='积分流水，与业务同事务写入';

-- ------------------------------------------------------------
-- 收藏
-- ------------------------------------------------------------
CREATE TABLE favorite (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(16)     NOT NULL COMMENT 'ARTICLE / QUESTION / RESOURCE',
  target_id   BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_favorite_target (user_id, target_type, target_id),
  KEY idx_favorite_user (user_id, target_type),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES app_user (id)
) ENGINE=InnoDB COMMENT='文章/问题/资源收藏';

-- ------------------------------------------------------------
-- 草稿（写作台自动保存）
-- ------------------------------------------------------------
CREATE TABLE draft (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  draft_type VARCHAR(16)     NOT NULL COMMENT 'ARTICLE / QUESTION',
  draft_key  VARCHAR(24)     NOT NULL COMMENT 'new 或编辑对象 id：按账号+编辑对象隔离',
  title      VARCHAR(160)    NOT NULL DEFAULT '',
  section_id BIGINT UNSIGNED NULL,
  content_md MEDIUMTEXT      NOT NULL,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_draft_slot (user_id, draft_type, draft_key),
  CONSTRAINT fk_draft_user FOREIGN KEY (user_id) REFERENCES app_user (id)
) ENGINE=InnoDB COMMENT='按账号与编辑对象隔离的草稿';
