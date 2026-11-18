package com.itstudy;

import com.itstudy.entity.AppUser;
import com.itstudy.entity.Section;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.SectionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 集成测试基类：连独立的 itstudy_test 库，固定 test profile。
 * 需要回滚的用例自行加 @Transactional（并发用例不能加，否则线程看不到未提交数据）。
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:mysql://127.0.0.1:3307/itstudy_test?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false",
        "spring.datasource.username=itstudy",
        "spring.datasource.password=itstudy123",
        "spring.sql.init.mode=always",
        "spring.sql.init.encoding=UTF-8",
        "spring.sql.init.schema-locations=classpath:schema-test.sql"
})
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    protected AppUserMapper appUserMapper;
    @Autowired
    protected SectionMapper sectionMapper;
    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected AppUser createUser(int points) {
        AppUser user = new AppUser();
        String suffix = uniqueSuffix();
        user.setUsername("u" + suffix);
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setNickname("测试" + SEQ.incrementAndGet());
        user.setAvatarHue(210);
        user.setPoints(points);
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        appUserMapper.insert(user);
        return user;
    }

    protected Section createSection() {
        Section section = new Section();
        String suffix = uniqueSuffix();
        section.setCode("s" + suffix);
        section.setName("测试版块" + SEQ.incrementAndGet());
        section.setTagline("测试版块定位");
        section.setDescription("集成测试使用的版块");
        section.setIcon("Code2");
        section.setAccent("sky");
        section.setSortOrder(0);
        sectionMapper.insert(section);
        return section;
    }

    private String uniqueSuffix() {
        return System.nanoTime() + "" + SEQ.incrementAndGet();
    }
}
