import { createCn } from "cn/config"

export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["page-title", "hero-number", "metric", "wordmark", "card-title", "form-title", "nav", "body", "label", "field-label", "caption"] }],
    },
  },
})
