package com.itstudy.dto;

import lombok.Data;

@Data
public class FavoriteToggleResult {

    private Boolean favorited;
    private Integer count;

    public static FavoriteToggleResult of(boolean favorited, int count) {
        FavoriteToggleResult result = new FavoriteToggleResult();
        result.setFavorited(favorited);
        result.setCount(count);
        return result;
    }
}
