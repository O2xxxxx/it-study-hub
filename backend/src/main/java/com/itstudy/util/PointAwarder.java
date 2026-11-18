package com.itstudy.util;

import com.itstudy.entity.PointLog;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.PointLogMapper;
import org.springframework.dao.DuplicateKeyException;

import java.time.LocalDateTime;

/**
 * 积分发放：先查业务流水幂等，再写流水（唯一约束兜底），最后条件加积分。
 */
public final class PointAwarder {

    private PointAwarder() {
    }

    /**
     * @return 实际发放的积分（已发放过则返回 0）
     */
    public static int award(PointLogMapper pointLogMapper,
                            AppUserMapper appUserMapper,
                            Long userId,
                            String reasonType,
                            String reasonDesc,
                            String refType,
                            Long refId,
                            int amount) {
        if (pointLogMapper.countBusiness(userId, reasonType, refId) > 0) {
            return 0;
        }
        Integer currentBalance = appUserMapper.selectBalance(userId);
        int base = currentBalance == null ? 0 : currentBalance;
        PointLog log = new PointLog();
        log.setUserId(userId);
        log.setChangeAmount(amount);
        log.setBalanceAfter(base + amount);
        log.setReasonType(reasonType);
        log.setReasonDesc(reasonDesc);
        log.setRefType(refType);
        log.setRefId(refId);
        log.setCreatedAt(LocalDateTime.now());
        try {
            pointLogMapper.insert(log);
        } catch (DuplicateKeyException ex) {
            return 0;
        }
        appUserMapper.addPoints(userId, amount);
        return amount;
    }

    /** 记录一条扣减流水（兑换场景，扣减已由条件 UPDATE 完成）。 */
    public static void recordSpend(PointLogMapper pointLogMapper,
                                   Long userId,
                                   int amount,
                                   String reasonDesc,
                                   String refType,
                                   Long refId,
                                   int balanceAfter) {
        PointLog log = new PointLog();
        log.setUserId(userId);
        log.setChangeAmount(-Math.abs(amount));
        log.setBalanceAfter(balanceAfter);
        log.setReasonType("RESOURCE_EXCHANGE");
        log.setReasonDesc(reasonDesc);
        log.setRefType(refType);
        log.setRefId(refId);
        log.setCreatedAt(LocalDateTime.now());
        pointLogMapper.insert(log);
    }
}
