package com.itstudy.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** Favorite page groups, aligned with frontend card arrays. */
@Data
public class FavoriteGroups {

    private List<ArticleCard> article = new ArrayList<>();
    private List<QuestionCard> question = new ArrayList<>();
    private List<ResourceCard> resource = new ArrayList<>();
}
