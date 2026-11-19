-- 先选择要迁移的数据库。MySQL 8.0.29 通过信息模式判断列是否存在。
-- 在暂停应用写入的窗口运行。重复执行会按明细校准计数。
SET @social_ddl = IF(
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'app_user' AND column_name = 'follower_count'),
  'DO 0',
  'ALTER TABLE app_user ADD COLUMN follower_count INT UNSIGNED NOT NULL DEFAULT 0'
);
PREPARE social_column FROM @social_ddl;
EXECUTE social_column;
DEALLOCATE PREPARE social_column;

SET @social_ddl = IF(
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'app_user' AND column_name = 'following_count'),
  'DO 0',
  'ALTER TABLE app_user ADD COLUMN following_count INT UNSIGNED NOT NULL DEFAULT 0'
);
PREPARE social_column FROM @social_ddl;
EXECUTE social_column;
DEALLOCATE PREPARE social_column;

SET @social_ddl = IF(
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'article' AND column_name = 'like_count'),
  'DO 0',
  'ALTER TABLE article ADD COLUMN like_count INT UNSIGNED NOT NULL DEFAULT 0'
);
PREPARE social_column FROM @social_ddl;
EXECUTE social_column;
DEALLOCATE PREPARE social_column;

SET @social_ddl = IF(
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'question' AND column_name = 'like_count'),
  'DO 0',
  'ALTER TABLE question ADD COLUMN like_count INT UNSIGNED NOT NULL DEFAULT 0'
);
PREPARE social_column FROM @social_ddl;
EXECUTE social_column;
DEALLOCATE PREPARE social_column;

-- 点赞目标由业务事务验证和清理。
CREATE TABLE IF NOT EXISTS post_like (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(16)     NOT NULL,
  target_id   BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_like_target (user_id, target_type, target_id),
  KEY idx_like_post (target_type, target_id),
  CONSTRAINT ck_like_type CHECK (target_type IN ('article', 'question'))
) ENGINE=InnoDB;

-- 保留历史关注。列表用 LEFT JOIN 显示已经注销的账号。
CREATE TABLE IF NOT EXISTS user_follow (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  follower_id BIGINT UNSIGNED NOT NULL,
  followee_id BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_follow_pair (follower_id, followee_id),
  KEY idx_followee (followee_id, id),
  KEY idx_follower (follower_id, id),
  CONSTRAINT ck_follow_distinct CHECK (follower_id <> followee_id)
) ENGINE=InnoDB;

START TRANSACTION;
UPDATE article a SET like_count = (SELECT COUNT(*) FROM post_like l WHERE l.target_type = 'article' AND l.target_id = a.id);
UPDATE question q SET like_count = (SELECT COUNT(*) FROM post_like l WHERE l.target_type = 'question' AND l.target_id = q.id);
UPDATE app_user u
SET follower_count = (SELECT COUNT(*) FROM user_follow f WHERE f.followee_id = u.id),
    following_count = (SELECT COUNT(*) FROM user_follow f WHERE f.follower_id = u.id);
COMMIT;
