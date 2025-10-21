import { graphql } from "gql.tada"

export const JFPAppCacheBuilder_Android_MediaDataQuery = graphql(`
  query JFPAppCacheBuilder_Android_MediaDataQuery($offset: Int, $limit: Int) {
    videos(offset: $offset, limit: $limit) {
      id
      primaryMediaLanguageId: primaryLanguageId
      subType: label
      variant {
        lengthInMilliseconds
        isDownloadable: downloadable
        downloads {
          quality
          size
        }
      }
      languageCount: variantLanguagesCount
      containsCount: childrenCount
      bibleCitations {
        chapterStart
        chapterEnd
        osisBibleBook: osisId
        verseEnd
        verseStart
      }
      imageUrls: images {
        mobileCinematicHigh
        mobileCinematicLow
        mobileCinematicVeryLow
        thumbnail
        videoStill
      }
      children {
        id
      }
      parents {
        id
      }
    }
  }
`)
